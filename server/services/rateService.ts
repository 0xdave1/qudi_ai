import { Currency, ExchangeQuote, QuoteStatus } from '../types/bot';
import { getPrisma } from '../db/prisma';

export interface RateConfig {
  xofToNgnRate: number; // 1 XOF = x NGN (e.g. 2.55)
  ngnToXofRate: number; // 1 NGN = x XOF (e.g. 0.39215)
  feePercentage: number; // e.g. 0.008 (0.8%)
  minNgn: number;
  maxNgn: number;
  minXof: number;
  maxXof: number;
  lastUpdated: string;
}

class RateService {
  private config: RateConfig = {
    xofToNgnRate: 2.55,
    ngnToXofRate: 0.39215,
    feePercentage: 0.008, // 0.8%
    minNgn: 5000,
    maxNgn: 5000000,
    minXof: 2000,
    maxXof: 2000000,
    lastUpdated: new Date().toISOString(),
  };

  private quotes: Map<string, ExchangeQuote> = new Map();

  constructor() {
    this.loadRatesFromDb().catch(() => {});
  }

  public async loadRatesFromDb(): Promise<void> {
    const prisma = getPrisma();
    if (!prisma) return;

    try {
      const activeRates = await prisma.exchangeRate.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      const xofNgn = activeRates.find((r) => r.sourceCurrency === 'XOF' && r.targetCurrency === 'NGN');
      const ngnXof = activeRates.find((r) => r.sourceCurrency === 'NGN' && r.targetCurrency === 'XOF');

      if (xofNgn) this.config.xofToNgnRate = xofNgn.rate;
      if (ngnXof) this.config.ngnToXofRate = ngnXof.rate;
      this.config.lastUpdated = new Date().toISOString();
    } catch (err: any) {
      console.warn('[RateService Prisma Load Error]:', err.message);
    }
  }

  public getRates(): RateConfig {
    return { ...this.config };
  }

  public updateRates(partial: Partial<RateConfig>): RateConfig {
    this.config = {
      ...this.config,
      ...partial,
      lastUpdated: new Date().toISOString(),
    };

    // Asynchronously record into Neon PostgreSQL
    const prisma = getPrisma();
    if (prisma) {
      (async () => {
        try {
          if (partial.xofToNgnRate) {
            await prisma.exchangeRate.create({
              data: {
                sourceCurrency: 'XOF',
                targetCurrency: 'NGN',
                rate: partial.xofToNgnRate,
                rateSource: 'ADMIN_OVERRIDE',
                isActive: true,
              },
            });
          }
          if (partial.ngnToXofRate) {
            await prisma.exchangeRate.create({
              data: {
                sourceCurrency: 'NGN',
                targetCurrency: 'XOF',
                rate: partial.ngnToXofRate,
                rateSource: 'ADMIN_OVERRIDE',
                isActive: true,
              },
            });
          }
        } catch (err: any) {
          console.warn('[RateService Prisma Save Error]:', err.message);
        }
      })();
    }

    return this.getRates();
  }

  public calculateQuote(params: {
    userPhone: string;
    fromCurrency: Currency;
    toCurrency: Currency;
    amount: number;
  }): {
    success: boolean;
    quote?: ExchangeQuote;
    error?: string;
    errorFr?: string;
  } {
    const { userPhone, fromCurrency, toCurrency, amount } = params;

    if (fromCurrency === toCurrency) {
      return {
        success: false,
        error: 'Source and destination currencies must be different (NGN ⇄ XOF).',
        errorFr: 'Les devises source et destination doivent être différentes (NGN ⇄ XOF).',
      };
    }

    // Limit check
    if (fromCurrency === 'NGN') {
      if (amount < this.config.minNgn) {
        return {
          success: false,
          error: `Minimum exchange amount is ₦${this.config.minNgn.toLocaleString()} NGN.`,
          errorFr: `Le montant minimum est de ₦${this.config.minNgn.toLocaleString()} NGN.`,
        };
      }
      if (amount > this.config.maxNgn) {
        return {
          success: false,
          error: `Maximum exchange amount per transaction is ₦${this.config.maxNgn.toLocaleString()} NGN.`,
          errorFr: `Le montant maximum par transaction est de ₦${this.config.maxNgn.toLocaleString()} NGN.`,
        };
      }
    } else {
      if (amount < this.config.minXof) {
        return {
          success: false,
          error: `Minimum exchange amount is ${this.config.minXof.toLocaleString()} XOF.`,
          errorFr: `Le montant minimum est de ${this.config.minXof.toLocaleString()} FCFA.`,
        };
      }
      if (amount > this.config.maxXof) {
        return {
          success: false,
          error: `Maximum exchange amount per transaction is ${this.config.maxXof.toLocaleString()} XOF.`,
          errorFr: `Le montant maximum par transaction est de ${this.config.maxXof.toLocaleString()} FCFA.`,
        };
      }
    }

    const rate = fromCurrency === 'XOF' ? this.config.xofToNgnRate : this.config.ngnToXofRate;
    const fee = Math.round(amount * this.config.feePercentage);
    const netSource = amount - fee;
    const toAmount = Math.round(netSource * rate);

    const quoteId = `QT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes lock

    const quote: ExchangeQuote = {
      id: quoteId,
      userPhone,
      fromCurrency,
      toCurrency,
      fromAmount: amount,
      toAmount,
      rate,
      fee,
      expiresAt,
      status: 'PENDING',
      createdAt: now.toISOString(),
    };

    this.quotes.set(quoteId, quote);

    // Persist to Neon PostgreSQL
    const prisma = getPrisma();
    if (prisma) {
      (async () => {
        try {
          // Find user id for relation if exists, or auto-create if missing
          let user = await prisma.user.findUnique({ where: { whatsappPhone: userPhone } });
          if (!user) {
            try {
              user = await prisma.user.create({
                data: {
                  whatsappPhone: userPhone,
                  fullName: '',
                  country: userPhone.startsWith('229') ? 'BJ' : 'NG',
                  preferredLanguage: userPhone.startsWith('229') ? 'fr' : 'en',
                },
              });
            } catch {
              user = await prisma.user.findUnique({ where: { whatsappPhone: userPhone } });
            }
          }
          if (user) {
            await prisma.exchangeQuote.upsert({
              where: { quoteReference: quote.id },
              update: {
                status: quote.status || 'PENDING',
              },
              create: {
                quoteReference: quote.id,
                userId: user.id,
                userPhone,
                sourceCurrency: quote.fromCurrency,
                targetCurrency: quote.toCurrency,
                sourceAmount: quote.fromAmount,
                targetAmount: quote.toAmount,
                exchangeRate: quote.rate,
                feeAmount: quote.fee,
                totalPayable: quote.fromAmount,
                expiresAt: new Date(quote.expiresAt),
                status: quote.status || 'PENDING',
              },
            });
          }
        } catch (err: any) {
          console.warn('[RateService Prisma Quote Save Notice]:', err.message);
        }
      })();
    }

    return {
      success: true,
      quote,
    };
  }

  public isQuoteExpired(quote: ExchangeQuote): boolean {
    return quote.status === 'EXPIRED' || new Date() > new Date(quote.expiresAt);
  }

  public getQuoteById(quoteId: string): ExchangeQuote | undefined {
    const q = this.quotes.get(quoteId);
    if (!q) return undefined;

    // Check expiration
    if (this.isQuoteExpired(q) && q.status === 'PENDING') {
      q.status = 'EXPIRED';
    }
    return q;
  }

  public getLatestActiveQuoteForUser(userPhone: string): ExchangeQuote | undefined {
    const userQuotes = Array.from(this.quotes.values())
      .filter((q) => q.userPhone === userPhone)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    for (const q of userQuotes) {
      if (q.status === 'PENDING') {
        if (new Date() > new Date(q.expiresAt)) {
          q.status = 'EXPIRED';
        } else {
          return q;
        }
      }
    }
    return undefined;
  }

  public updateQuoteStatus(quoteId: string, status: QuoteStatus): boolean {
    const q = this.quotes.get(quoteId);
    if (q) {
      q.status = status;

      const prisma = getPrisma();
      if (prisma) {
        prisma.exchangeQuote.updateMany({
          where: { quoteReference: quoteId },
          data: { status },
        }).catch(() => {});
      }

      return true;
    }
    return false;
  }

  public getAllQuotes(): ExchangeQuote[] {
    return Array.from(this.quotes.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export const rateService = new RateService();

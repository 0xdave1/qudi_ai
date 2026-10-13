import { Currency, ExchangeQuote, QuoteStatus } from '../types/bot';

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

  public getRates(): RateConfig {
    return { ...this.config };
  }

  public updateRates(partial: Partial<RateConfig>): RateConfig {
    this.config = {
      ...this.config,
      ...partial,
      lastUpdated: new Date().toISOString(),
    };
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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

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
      createdAt: new Date().toISOString(),
    };

    this.quotes.set(quoteId, quote);

    return { success: true, quote };
  }

  public getQuote(quoteId: string): ExchangeQuote | undefined {
    const q = this.quotes.get(quoteId);
    if (!q) return undefined;
    // Check expiry
    if (q.status === 'PENDING' && new Date(q.expiresAt).getTime() < Date.now()) {
      q.status = 'EXPIRED';
      this.quotes.set(quoteId, q);
    }
    return q;
  }

  public getLatestActiveQuoteForUser(userPhone: string): ExchangeQuote | undefined {
    const userQuotes = Array.from(this.quotes.values())
      .filter((q) => q.userPhone === userPhone && q.status === 'PENDING')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (userQuotes.length === 0) return undefined;
    const latest = userQuotes[0];
    if (new Date(latest.expiresAt).getTime() < Date.now()) {
      latest.status = 'EXPIRED';
      this.quotes.set(latest.id, latest);
      return undefined;
    }
    return latest;
  }

  public updateQuoteStatus(quoteId: string, status: QuoteStatus): void {
    const q = this.quotes.get(quoteId);
    if (q) {
      q.status = status;
      this.quotes.set(quoteId, q);
    }
  }

  public getAllQuotes(): ExchangeQuote[] {
    return Array.from(this.quotes.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export const rateService = new RateService();

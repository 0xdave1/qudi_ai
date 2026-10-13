import { Currency, Transaction, TransactionStatus } from '../types/bot';
import { getPrisma } from '../db/prisma';
import { walletService } from './walletService';
import { auditService } from './auditService';

class TransactionService {
  private transactions: Map<string, Transaction> = new Map();

  constructor() {
    this.seedFallbackTransactions();
    this.loadTransactionsFromDb().catch(() => {});
  }

  private seedFallbackTransactions(): void {
    const now = new Date();
    const t1Date = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
    const t2Date = new Date(now.getTime() - 26 * 3600 * 1000).toISOString();

    this.transactions.set('QX-2610-8492', {
      id: 'tx_1',
      reference: 'QX-2610-8492',
      userPhone: '2348031234567',
      quoteId: 'QT-849201',
      fromCurrency: 'NGN',
      toCurrency: 'XOF',
      fromAmount: 50000,
      toAmount: 19411,
      rate: 0.39215,
      fee: 400,
      recipientAccount: '22997458812',
      recipientName: 'David Dossou',
      recipientRail: 'MTN_MOMO',
      status: 'COMPLETED',
      paymentInstructions: {
        bankOrProvider: 'Zenith Bank PLC',
        accountOrMerchantCode: '9012384910',
        accountName: 'Qudi Liquidity Pool NG',
        paymentReference: 'QX-2610-8492',
        note: 'Pay exact amount via NIP transfer',
      },
      verifiedAt: t1Date,
      completedAt: t1Date,
      createdAt: t1Date,
      updatedAt: t1Date,
    });

    this.transactions.set('QX-2609-3129', {
      id: 'tx_2',
      reference: 'QX-2609-3129',
      userPhone: '22997458812',
      quoteId: 'QT-312940',
      fromCurrency: 'XOF',
      toCurrency: 'NGN',
      fromAmount: 100000,
      toAmount: 252960,
      rate: 2.55,
      fee: 800,
      recipientAccount: '0129481923',
      recipientName: 'Amina Bello',
      recipientRail: 'NIBSS_NIP',
      status: 'COMPLETED',
      paymentInstructions: {
        bankOrProvider: 'Bank of Africa Bénin',
        accountOrMerchantCode: 'BJ-BOA-8492019',
        accountName: 'Qudi West Africa SAS',
        paymentReference: 'QX-2609-3129',
        note: 'Envoyez via Moov/MTN Money ou virement BOA',
      },
      verifiedAt: t2Date,
      completedAt: t2Date,
      createdAt: t2Date,
      updatedAt: t2Date,
    });
  }

  public async loadTransactionsFromDb(): Promise<void> {
    const prisma = getPrisma();
    if (!prisma) return;

    try {
      const records = await prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      for (const r of records) {
        const tx: Transaction = {
          id: r.id,
          reference: r.reference,
          userPhone: r.userPhone,
          quoteId: r.quoteId || '',
          fromCurrency: r.sourceCurrency as Currency,
          toCurrency: r.targetCurrency as Currency,
          fromAmount: r.sourceAmount,
          toAmount: r.targetAmount,
          rate: r.exchangeRate,
          fee: r.fee,
          recipientAccount: r.recipientAccount || '',
          recipientName: r.recipientName || '',
          recipientRail: (r.recipientRail as any) || 'BANK_TRANSFER',
          status: r.status as TransactionStatus,
          paymentInstructions: (r.paymentInstructions as any) || {
            bankOrProvider: 'Qudi Settlement Vault',
            accountOrMerchantCode: 'Vault',
            accountName: 'Qudi',
            paymentReference: r.reference,
            note: 'Settlement Account',
          },
          paymentProofSubmittedAt: r.proofSubmittedAt?.toISOString(),
          paymentProofNote: r.proofNote || undefined,
          verifiedAt: r.verifiedAt?.toISOString(),
          completedAt: r.completedAt?.toISOString(),
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        };
        this.transactions.set(tx.reference, tx);
      }
    } catch (err: any) {
      console.warn('[TransactionService Prisma Load Error]:', err.message);
    }
  }

  public createTransaction(params: {
    userPhone: string;
    quoteId: string;
    fromCurrency: Currency;
    toCurrency: Currency;
    fromAmount: number;
    toAmount: number;
    rate: number;
    fee: number;
    recipientAccount: string;
    recipientName: string;
    recipientBank?: string;
    recipientRail?: 'NIBSS_NIP' | 'MTN_MOMO' | 'MOOV_MONEY' | 'BANK_TRANSFER';
  }): Transaction {
    const yearMonth = new Date().toISOString().slice(2, 7).replace('-', '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const reference = `QX-${yearMonth}-${randomSuffix}`;
    const now = new Date().toISOString();
    const rail = params.recipientRail || 'BANK_TRANSFER';

    const paymentInstructions =
      params.fromCurrency === 'NGN'
        ? {
            bankOrProvider: 'Zenith Bank PLC',
            accountOrMerchantCode: '9012384910',
            accountName: 'Qudi Liquidity Pool NG',
            paymentReference: reference,
            note: 'Pay exact amount via NIP transfer or Bank USSD',
          }
        : {
            bankOrProvider: 'Bank of Africa Bénin / MTN MoMo',
            accountOrMerchantCode: 'BJ-BOA-8492019',
            accountName: 'Qudi West Africa SAS',
            paymentReference: reference,
            note: 'Envoyez via Moov/MTN Money ou virement BOA',
          };

    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      reference,
      userPhone: params.userPhone,
      quoteId: params.quoteId,
      fromCurrency: params.fromCurrency,
      toCurrency: params.toCurrency,
      fromAmount: params.fromAmount,
      toAmount: params.toAmount,
      rate: params.rate,
      fee: params.fee,
      recipientAccount: params.recipientAccount,
      recipientName: params.recipientName,
      recipientRail: rail,
      status: 'AWAITING_PAYMENT',
      paymentInstructions,
      createdAt: now,
      updatedAt: now,
    };

    this.transactions.set(reference, transaction);

    // Asynchronously write to Neon PostgreSQL
    const prisma = getPrisma();
    if (prisma) {
      (async () => {
        try {
          const user = await prisma.user.findUnique({ where: { whatsappPhone: params.userPhone } });
          if (user) {
            await prisma.transaction.create({
              data: {
                reference,
                userId: user.id,
                userPhone: params.userPhone,
                quoteId: params.quoteId,
                type: 'EXCHANGE',
                sourceCurrency: params.fromCurrency,
                sourceAmount: params.fromAmount,
                targetCurrency: params.toCurrency,
                targetAmount: params.toAmount,
                exchangeRate: params.rate,
                fee: params.fee,
                recipientBank: params.recipientBank || paymentInstructions.bankOrProvider,
                recipientAccount: params.recipientAccount,
                recipientName: params.recipientName,
                recipientRail: rail,
                paymentReference: reference,
                paymentInstructions: paymentInstructions,
                status: 'AWAITING_PAYMENT',
              },
            });

            await auditService.log({
              action: 'TRANSACTION_INITIATED',
              actor: 'USER',
              userId: user.id,
              userPhone: params.userPhone,
              metadata: { reference, fromCurrency: params.fromCurrency, toCurrency: params.toCurrency, amount: params.fromAmount },
            });
          }
        } catch (err: any) {
          console.warn('[TransactionService Prisma Save Error]:', err.message);
        }
      })();
    }

    return transaction;
  }

  public getTransactionByRef(ref: string): Transaction | undefined {
    return this.transactions.get(ref);
  }

  public getUserTransactionByRef(userPhone: string, ref: string): Transaction | undefined {
    const tx = this.transactions.get(ref);
    return tx && tx.userPhone === userPhone ? tx : undefined;
  }

  public getLatestActiveTransaction(userPhone: string): Transaction | undefined {
    return this.getLatestActiveTransactionForUser(userPhone);
  }

  public getUserTransactions(userPhone: string, limit: number = 5): Transaction[] {
    return this.getTransactionsForUser(userPhone, limit);
  }

  public getLatestActiveTransactionForUser(userPhone: string): Transaction | undefined {
    const list = Array.from(this.transactions.values())
      .filter((t) => t.userPhone === userPhone)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list.find(
      (t) => t.status === 'AWAITING_PAYMENT' || t.status === 'PAYMENT_VERIFICATION' || t.status === 'PROCESSING'
    );
  }

  public getTransactionsForUser(userPhone: string, limit: number = 5): Transaction[] {
    return Array.from(this.transactions.values())
      .filter((t) => t.userPhone === userPhone)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  public submitPaymentProof(ref: string, note?: string): { success: boolean; transaction?: Transaction } {
    const tx = this.transactions.get(ref);
    if (!tx) return { success: false };

    tx.status = 'PAYMENT_VERIFICATION';
    tx.paymentProofSubmittedAt = new Date().toISOString();
    tx.paymentProofNote = note;
    tx.updatedAt = new Date().toISOString();

    const prisma = getPrisma();
    if (prisma) {
      prisma.transaction.updateMany({
        where: { reference: ref },
        data: {
          status: 'PAYMENT_VERIFICATION',
          proofSubmittedAt: new Date(),
          proofNote: note,
        },
      }).catch(() => {});
    }

    return { success: true, transaction: tx };
  }

  public verifyAndCompletePayment(ref: string, adminNote?: string): { success: boolean; transaction?: Transaction } {
    const tx = this.transactions.get(ref);
    if (!tx) return { success: false };

    const now = new Date().toISOString();
    tx.status = 'COMPLETED';
    tx.verifiedAt = now;
    tx.completedAt = now;
    tx.updatedAt = now;

    // Persist to Neon PostgreSQL
    const prisma = getPrisma();
    if (prisma) {
      (async () => {
        try {
          await prisma.transaction.updateMany({
            where: { reference: ref },
            data: {
              status: 'COMPLETED',
              verifiedAt: new Date(),
              completedAt: new Date(),
              adminNote: adminNote || 'Payment verified by settlement desk',
            },
          });

          const user = await prisma.user.findUnique({ where: { whatsappPhone: tx.userPhone } });
          if (user) {
            // Update wallet balance
            await walletService.updateBalance(user.id, tx.toCurrency, tx.toAmount);
            await auditService.log({
              action: 'TRANSACTION_SETTLED',
              actor: 'ADMIN',
              userId: user.id,
              userPhone: tx.userPhone,
              metadata: { reference: ref, amount: tx.toAmount, currency: tx.toCurrency },
            });
          }
        } catch (err: any) {
          console.warn('[TransactionService Prisma Complete Error]:', err.message);
        }
      })();
    }

    return { success: true, transaction: tx };
  }

  public updateStatus(ref: string, status: TransactionStatus): { success: boolean; transaction?: Transaction } {
    const tx = this.transactions.get(ref);
    if (!tx) return { success: false };

    tx.status = status;
    tx.updatedAt = new Date().toISOString();

    const prisma = getPrisma();
    if (prisma) {
      prisma.transaction.updateMany({
        where: { reference: ref },
        data: { status },
      }).catch(() => {});
    }

    return { success: true, transaction: tx };
  }

  public getAllTransactions(): Transaction[] {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export const transactionService = new TransactionService();

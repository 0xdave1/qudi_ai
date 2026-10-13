import {
  Currency,
  ExchangeQuote,
  Transaction,
  TransactionStatus,
} from '../types/bot';
import { rateService } from './rateService';

class TransactionService {
  private transactions: Map<string, Transaction> = new Map();

  constructor() {
    // Seed initial realistic transactions for demonstration
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.transactions.set('tx_init_1', {
      id: 'tx_init_1',
      reference: 'QX-2610-8492',
      userPhone: '2348031234567',
      quoteId: 'QT-882103-AX1',
      fromCurrency: 'NGN',
      toCurrency: 'XOF',
      fromAmount: 150000,
      toAmount: 58235,
      rate: 0.39215,
      fee: 1200,
      recipientAccount: '+229 97 45 88 12',
      recipientName: 'David Dossou',
      recipientRail: 'MTN_MOMO',
      status: 'COMPLETED',
      paymentInstructions: {
        bankOrProvider: 'Zenith Bank PLC',
        accountOrMerchantCode: '9012847102',
        accountName: 'Qudi Escrow / Amina Bello',
        paymentReference: 'QX-2610-8492',
        note: 'Pay exactly ₦150,000 to this dedicated virtual account.',
      },
      paymentProofSubmittedAt: yesterday.toISOString(),
      verifiedAt: yesterday.toISOString(),
      completedAt: yesterday.toISOString(),
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
    });

    this.transactions.set('tx_init_2', {
      id: 'tx_init_2',
      reference: 'QX-2610-9104',
      userPhone: '22997458812',
      quoteId: 'QT-991045-BX2',
      fromCurrency: 'XOF',
      toCurrency: 'NGN',
      fromAmount: 200000,
      toAmount: 505920,
      rate: 2.55,
      fee: 1600,
      recipientAccount: '0123456789 (GTBank)',
      recipientName: 'Babatunde Adeleke',
      recipientRail: 'NIBSS_NIP',
      status: 'PAYMENT_VERIFICATION',
      paymentInstructions: {
        bankOrProvider: 'MTN MoMo Benin',
        accountOrMerchantCode: '884910',
        accountName: 'Qudi Exchange Cotonou',
        paymentReference: 'QX-2610-9104',
        note: 'Dial *880# and enter Merchant ID 884910 with reference QX-2610-9104.',
      },
      paymentProofSubmittedAt: now.toISOString(),
      paymentProofNote: 'MoMo transaction ID: 2948102394',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  public createTransaction(params: {
    quote: ExchangeQuote;
    recipientAccount: string;
    recipientName: string;
    recipientRail?: 'NIBSS_NIP' | 'MTN_MOMO' | 'MOOV_MONEY' | 'BANK_TRANSFER';
  }): { success: boolean; transaction?: Transaction; error?: string } {
    const { quote, recipientAccount, recipientName } = params;

    if (quote.status !== 'PENDING') {
      return { success: false, error: 'Quote is no longer pending or has expired.' };
    }

    if (new Date(quote.expiresAt).getTime() < Date.now()) {
      rateService.updateQuoteStatus(quote.id, 'EXPIRED');
      return { success: false, error: 'Quote has expired. Please request a new exchange quote.' };
    }

    rateService.updateQuoteStatus(quote.id, 'CONFIRMED');

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const reference = `QX-2610-${randomSuffix}`;
    const id = `tx_${Date.now()}_${randomSuffix}`;
    const now = new Date().toISOString();

    const recipientRail =
      params.recipientRail ||
      (quote.toCurrency === 'NGN' ? 'NIBSS_NIP' : 'MTN_MOMO');

    // Generate strict payment instructions
    let paymentInstructions: Transaction['paymentInstructions'];
    if (quote.fromCurrency === 'NGN') {
      paymentInstructions = {
        bankOrProvider: 'Zenith Bank PLC (Nigeria)',
        accountOrMerchantCode: '9012847102',
        accountName: `Qudi Escrow / ${quote.userPhone.slice(-4)}`,
        paymentReference: reference,
        note: `Transfer exactly ₦${quote.fromAmount.toLocaleString()} to this account. Include reference ${reference} in transfer narration.`,
      };
    } else {
      paymentInstructions = {
        bankOrProvider: 'MTN MoMo / Moov Money Benin',
        accountOrMerchantCode: '884910',
        accountName: 'Qudi XOF Escrow Gateway',
        paymentReference: reference,
        note: `Pay ${quote.fromAmount.toLocaleString()} FCFA using Merchant Code 884910. Enter reference ${reference}.`,
      };
    }

    const transaction: Transaction = {
      id,
      reference,
      userPhone: quote.userPhone,
      quoteId: quote.id,
      fromCurrency: quote.fromCurrency,
      toCurrency: quote.toCurrency,
      fromAmount: quote.fromAmount,
      toAmount: quote.toAmount,
      rate: quote.rate,
      fee: quote.fee,
      recipientAccount,
      recipientName,
      recipientRail,
      status: 'AWAITING_PAYMENT',
      paymentInstructions,
      createdAt: now,
      updatedAt: now,
    };

    this.transactions.set(reference, transaction);

    return { success: true, transaction };
  }

  public getTransaction(reference: string): Transaction | undefined {
    return this.transactions.get(reference);
  }

  public getUserTransactionByRef(
    userPhone: string,
    reference: string
  ): Transaction | undefined {
    const tx = this.transactions.get(reference.toUpperCase().trim());
    if (tx && tx.userPhone === userPhone) {
      return tx;
    }
    return undefined;
  }

  public getLatestActiveTransaction(userPhone: string): Transaction | undefined {
    const active = Array.from(this.transactions.values())
      .filter(
        (tx) =>
          tx.userPhone === userPhone &&
          (tx.status === 'AWAITING_PAYMENT' ||
            tx.status === 'PAYMENT_VERIFICATION' ||
            tx.status === 'PROCESSING')
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return active[0];
  }

  public getUserTransactions(userPhone: string, limit: number = 5): Transaction[] {
    return Array.from(this.transactions.values())
      .filter((tx) => tx.userPhone === userPhone)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  public submitPaymentProof(
    reference: string,
    userPhone: string,
    proofNote: string
  ): { success: boolean; transaction?: Transaction; error?: string } {
    const tx = this.getUserTransactionByRef(userPhone, reference);
    if (!tx) {
      return { success: false, error: 'Transaction not found.' };
    }

    if (tx.status !== 'AWAITING_PAYMENT') {
      return {
        success: false,
        error: `Transaction is currently ${tx.status}, cannot submit payment proof.`,
      };
    }

    tx.status = 'PAYMENT_VERIFICATION';
    tx.paymentProofSubmittedAt = new Date().toISOString();
    tx.paymentProofNote = proofNote;
    tx.updatedAt = new Date().toISOString();
    this.transactions.set(reference, tx);

    return { success: true, transaction: tx };
  }

  public verifyAndCompletePayment(
    reference: string,
    adminNote?: string
  ): { success: boolean; transaction?: Transaction; error?: string } {
    const tx = this.transactions.get(reference);
    if (!tx) return { success: false, error: 'Transaction not found.' };

    const now = new Date().toISOString();
    tx.status = 'COMPLETED';
    tx.verifiedAt = now;
    tx.completedAt = now;
    tx.updatedAt = now;
    this.transactions.set(reference, tx);

    return { success: true, transaction: tx };
  }

  public updateStatus(
    reference: string,
    status: TransactionStatus
  ): { success: boolean; transaction?: Transaction } {
    const tx = this.transactions.get(reference);
    if (!tx) return { success: false };
    tx.status = status;
    tx.updatedAt = new Date().toISOString();
    this.transactions.set(reference, tx);
    return { success: true, transaction: tx };
  }

  public getAllTransactions(): Transaction[] {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export const transactionService = new TransactionService();

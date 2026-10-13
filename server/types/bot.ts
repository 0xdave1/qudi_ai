export type SupportedLanguage = 'en' | 'fr';

export type UserCountry = 'NG' | 'BJ';

export type OnboardingStep =
  | 'AWAITING_LANGUAGE'
  | 'AWAITING_NAME'
  | 'AWAITING_COUNTRY'
  | 'AWAITING_CONSENT'
  | 'ACTIVE';

export interface UserProfile {
  phone: string; // WhatsApp international phone e.g. "2348031234567" or "22997123456"
  name: string;
  language: SupportedLanguage;
  country: UserCountry;
  onboardingStep: OnboardingStep;
  consentGiven: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Currency = 'NGN' | 'XOF';

export type QuoteStatus = 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';

export interface ExchangeQuote {
  id: string;
  userPhone: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  expiresAt: string; // ISO String (10 mins from creation)
  status: QuoteStatus;
  createdAt: string;
}

export type TransactionStatus =
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_VERIFICATION'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'UNDER_REVIEW';

export interface Transaction {
  id: string;
  reference: string; // e.g. "QX-2610-8492"
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
  recipientRail: 'NIBSS_NIP' | 'MTN_MOMO' | 'MOOV_MONEY' | 'BANK_TRANSFER';
  status: TransactionStatus;
  paymentInstructions: {
    bankOrProvider: string;
    accountOrMerchantCode: string;
    accountName: string;
    paymentReference: string;
    note: string;
  };
  paymentProofSubmittedAt?: string;
  paymentProofNote?: string;
  verifiedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type BotIntent =
  | 'GREETING'
  | 'CHANGE_LANGUAGE'
  | 'CHANGE_COUNTRY'
  | 'CHECK_RATE'
  | 'REQUEST_QUOTE'
  | 'CONFIRM_QUOTE'
  | 'CANCEL_QUOTE'
  | 'SUBMIT_PAYMENT_PROOF'
  | 'CHECK_TRANSACTION'
  | 'TRANSACTION_HISTORY'
  | 'CUSTOMER_SUPPORT'
  | 'UNKNOWN_INTENT';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userPhone: string;
  userName: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
}

export interface WebhookLogEntry {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  timestamp: string;
  userPhone?: string;
  eventType: string;
  payload: any;
  status: 'SUCCESS' | 'ERROR' | 'DEV_MOCK';
  errorMessage?: string;
}

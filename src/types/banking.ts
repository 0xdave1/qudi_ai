export type Currency = 'NGN' | 'XOF';

export type Language = 'en' | 'fr';

export interface UserWallet {
  currency: Currency;
  balance: number;
  reserved: number;
  accountNumber: string;
  bankName: string;
  symbol: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  tag: string;
  email: string;
  country: 'NG' | 'BJ';
  kycTier: 1 | 2 | 3;
  kycStatus: 'VERIFIED' | 'PENDING' | 'TIER_1_LIMIT';
  bvnOrNin: string; // Nigeria BVN/NIN
  cipOrIfu: string; // Benin CIP/IFU
  wallets: {
    NGN: UserWallet;
    XOF: UserWallet;
  };
}

export type TransactionType =
  | 'SWAP_CONVERSION'
  | 'INTERNAL_TRANSFER'
  | 'EXTERNAL_PAYOUT'
  | 'AGENT_DEPOSIT'
  | 'AGENT_WITHDRAWAL';

export interface TransactionRecord {
  id: string;
  reference: string;
  type: TransactionType;
  title: string;
  description: string;
  sourceAmount: number;
  sourceCurrency: Currency;
  targetAmount?: number;
  targetCurrency?: Currency;
  rateApplied?: number;
  fee: number;
  status: 'COMPLETED' | 'PROCESSING' | 'FLAGGED_AML' | 'CANCELLED';
  sender: string;
  recipient: string;
  recipientDetail?: string; // e.g. "GTBank 0123456789" or "MTN MoMo +229 97 12 34 56"
  timestamp: string;
  riskScore: number; // 0 - 100
  flagReason?: string;
}

export interface FXQuote {
  id: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  spreadBps: number;
  expiresAt: number; // epoch ms
  secondsLeft: number;
}

export interface AgentRecord {
  id: string;
  agentName: string;
  location: string;
  city: 'Cotonou' | 'Porto-Novo' | 'Lagos' | 'Badagry' | 'Krake';
  country: 'NG' | 'BJ';
  phone: string;
  ngnFloat: number;
  xofFloat: number;
  totalVolumeMonth: number;
  commissionEarned: number;
  status: 'ACTIVE' | 'LOW_FLOAT' | 'SUSPENDED';
}

export interface TreasuryVault {
  partner: string;
  balance: number;
  reserved: number;
  available: number;
  currency: Currency;
  country: string;
}

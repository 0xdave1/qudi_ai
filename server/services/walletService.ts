import { getPrisma } from '../db/prisma';

export interface WalletRecord {
  id: string;
  userId: string;
  currency: 'NGN' | 'XOF';
  availableBalance: number;
  reservedBalance: number;
  accountNumber?: string;
  bankName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class WalletService {
  private fallbackWallets: Map<string, WalletRecord[]> = new Map();

  public async getWalletsForUser(userId: string): Promise<WalletRecord[]> {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const wallets = await prisma.wallet.findMany({
          where: { userId, isActive: true },
        });
        return wallets.map((w) => ({
          id: w.id,
          userId: w.userId,
          currency: w.currency as 'NGN' | 'XOF',
          availableBalance: w.availableBalance,
          reservedBalance: w.reservedBalance,
          accountNumber: w.accountNumber || undefined,
          bankName: w.bankName || undefined,
          isActive: w.isActive,
          createdAt: w.createdAt.toISOString(),
          updatedAt: w.updatedAt.toISOString(),
        }));
      } catch (err: any) {
        console.warn('[WalletService Prisma Read Error]:', err.message);
      }
    }

    return this.fallbackWallets.get(userId) || [];
  }

  public async createDefaultWallets(userId: string, country: 'NG' | 'BJ'): Promise<WalletRecord[]> {
    const now = new Date().toISOString();
    const isNg = country === 'NG';

    const ngnAccount = `${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const xofAccount = `BJ-${isNg ? 'BOA' : 'ECO'}-${Math.floor(1000000 + Math.random() * 9000000)}`;

    const prisma = getPrisma();
    if (prisma) {
      try {
        const created = await Promise.all([
          prisma.wallet.create({
            data: {
              userId,
              currency: 'NGN',
              availableBalance: 0,
              reservedBalance: 0,
              accountNumber: ngnAccount,
              bankName: 'Zenith Bank PLC',
              isActive: true,
            },
          }),
          prisma.wallet.create({
            data: {
              userId,
              currency: 'XOF',
              availableBalance: 0,
              reservedBalance: 0,
              accountNumber: xofAccount,
              bankName: isNg ? 'Bank of Africa Bénin' : 'Ecobank Bénin',
              isActive: true,
            },
          }),
        ]);

        return created.map((w) => ({
          id: w.id,
          userId: w.userId,
          currency: w.currency as 'NGN' | 'XOF',
          availableBalance: w.availableBalance,
          reservedBalance: w.reservedBalance,
          accountNumber: w.accountNumber || undefined,
          bankName: w.bankName || undefined,
          isActive: w.isActive,
          createdAt: w.createdAt.toISOString(),
          updatedAt: w.updatedAt.toISOString(),
        }));
      } catch (err: any) {
        console.warn('[WalletService Prisma Create Error]:', err.message);
      }
    }

    // Fallback in-memory
    const wallets: WalletRecord[] = [
      {
        id: `wal_ngn_${Date.now()}`,
        userId,
        currency: 'NGN',
        availableBalance: 0,
        reservedBalance: 0,
        accountNumber: ngnAccount,
        bankName: 'Zenith Bank PLC',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `wal_xof_${Date.now()}`,
        userId,
        currency: 'XOF',
        availableBalance: 0,
        reservedBalance: 0,
        accountNumber: xofAccount,
        bankName: isNg ? 'Bank of Africa Bénin' : 'Ecobank Bénin',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.fallbackWallets.set(userId, wallets);
    return wallets;
  }

  public async updateBalance(
    userId: string,
    currency: 'NGN' | 'XOF',
    delta: number
  ): Promise<boolean> {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const wallet = await prisma.wallet.findFirst({
          where: { userId, currency },
        });
        if (wallet) {
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
              availableBalance: Math.max(0, wallet.availableBalance + delta),
            },
          });
          return true;
        }
      } catch (err: any) {
        console.warn('[WalletService Update Error]:', err.message);
      }
    }

    const list = this.fallbackWallets.get(userId);
    if (list) {
      const w = list.find((x) => x.currency === currency);
      if (w) {
        w.availableBalance = Math.max(0, w.availableBalance + delta);
        w.updatedAt = new Date().toISOString();
        return true;
      }
    }

    return false;
  }
}

export const walletService = new WalletService();

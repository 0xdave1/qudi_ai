import { PrismaClient } from '@prisma/client';

export interface DatabaseStatus {
  isConfigured: boolean;
  isConnected: boolean;
  provider: string;
  host?: string;
  database?: string;
  isPooled?: boolean;
  latencyMs?: number;
  lastChecked: string;
  error?: string;
  userCount?: number;
  transactionCount?: number;
}

let prismaInstance: PrismaClient | null = null;
let lastStatus: DatabaseStatus = {
  isConfigured: false,
  isConnected: false,
  provider: 'Neon PostgreSQL (Prisma)',
  lastChecked: new Date().toISOString(),
};

export function getPrisma(): PrismaClient | null {
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    return null;
  }

  if (!prismaInstance) {
    try {
      prismaInstance = new PrismaClient({
        datasources: {
          db: {
            url: dbUrl,
          },
        },
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      });
    } catch (err: any) {
      console.error('[Prisma Client Init Error]:', err.message);
      return null;
    }
  }

  return prismaInstance;
}

export async function checkDatabaseHealth(): Promise<DatabaseStatus> {
  const dbUrl = process.env.DATABASE_URL?.trim();
  const now = new Date().toISOString();

  if (!dbUrl) {
    lastStatus = {
      isConfigured: false,
      isConnected: false,
      provider: 'Neon PostgreSQL (Prisma)',
      lastChecked: now,
      error: 'DATABASE_URL environment variable is not configured. Set it in AI Studio Secrets.',
    };
    return lastStatus;
  }

  // Parse connection URL details safely (without exposing credentials)
  let host = 'Unknown';
  let database = 'neondb';
  let isPooled = false;

  try {
    const parsed = new URL(dbUrl);
    host = parsed.hostname;
    database = parsed.pathname.replace(/^\//, '') || 'neondb';
    isPooled = host.includes('-pooler') || parsed.port === '6543';
  } catch {
    // URL parsing fallback
    const match = dbUrl.match(/@([^:/]+)(?::(\d+))?\/([^?]+)/);
    if (match) {
      host = match[1];
      database = match[3];
      isPooled = host.includes('-pooler');
    }
  }

  const client = getPrisma();
  if (!client) {
    lastStatus = {
      isConfigured: true,
      isConnected: false,
      provider: 'Neon PostgreSQL (Prisma)',
      host,
      database,
      isPooled,
      lastChecked: now,
      error: 'Failed to initialize Prisma Client instance.',
    };
    return lastStatus;
  }

  const startTime = Date.now();
  try {
    // Run a lightweight test query
    await client.$queryRawUnsafe('SELECT 1 as connected');
    const latencyMs = Date.now() - startTime;

    // Fetch counts
    let userCount = 0;
    let transactionCount = 0;
    try {
      [userCount, transactionCount] = await Promise.all([
        client.user.count(),
        client.transaction.count(),
      ]);
    } catch {
      // Tables might need migration/push
    }

    lastStatus = {
      isConfigured: true,
      isConnected: true,
      provider: 'Neon PostgreSQL (Prisma)',
      host,
      database,
      isPooled,
      latencyMs,
      lastChecked: now,
      userCount,
      transactionCount,
    };
    return lastStatus;
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    console.warn('[Database Health Check Error]:', err.message);
    lastStatus = {
      isConfigured: true,
      isConnected: false,
      provider: 'Neon PostgreSQL (Prisma)',
      host,
      database,
      isPooled,
      latencyMs,
      lastChecked: now,
      error: err.message,
    };
    return lastStatus;
  }
}

export function getCachedDatabaseStatus(): DatabaseStatus {
  return lastStatus;
}

/**
 * Seed initial rates and demo data in Neon PostgreSQL if tables are empty
 */
export async function seedDatabaseIfEmpty(): Promise<void> {
  const client = getPrisma();
  if (!client) return;

  try {
    // Check if exchange rates table is populated
    const rateCount = await client.exchangeRate.count();
    if (rateCount === 0) {
      console.log('[Neon PostgreSQL] Seeding initial exchange rates...');
      await client.exchangeRate.createMany({
        data: [
          {
            sourceCurrency: 'XOF',
            targetCurrency: 'NGN',
            rate: 2.55,
            rateSource: 'DYNAMIC_MARKET_MAKER',
            isActive: true,
          },
          {
            sourceCurrency: 'NGN',
            targetCurrency: 'XOF',
            rate: 0.39215,
            rateSource: 'DYNAMIC_MARKET_MAKER',
            isActive: true,
          },
        ],
      });
      console.log('[Neon PostgreSQL] Exchange rates seeded successfully.');
    }

    // Check if users exist
    const userCount = await client.user.count();
    if (userCount === 0) {
      console.log('[Neon PostgreSQL] Seeding initial demo accounts...');
      
      // User 1: Nigeria
      const amina = await client.user.create({
        data: {
          whatsappPhone: '2348031234567',
          fullName: 'Amina Bello',
          country: 'NG',
          preferredLanguage: 'en',
          accountStatus: 'ACTIVE',
          kycStatus: 'TIER_2',
          onboardingStep: 'ACTIVE',
          consentGiven: true,
          isVerified: true,
        },
      });

      await client.wallet.createMany({
        data: [
          {
            userId: amina.id,
            currency: 'NGN',
            availableBalance: 450000,
            reservedBalance: 0,
            accountNumber: '9012384910',
            bankName: 'Zenith Bank PLC',
          },
          {
            userId: amina.id,
            currency: 'XOF',
            availableBalance: 85000,
            reservedBalance: 0,
            accountNumber: 'BJ-BOA-8492019',
            bankName: 'Bank of Africa Bénin',
          },
        ],
      });

      // User 2: Benin Republic
      const david = await client.user.create({
        data: {
          whatsappPhone: '22997458812',
          fullName: 'David Dossou',
          country: 'BJ',
          preferredLanguage: 'fr',
          accountStatus: 'ACTIVE',
          kycStatus: 'TIER_2',
          onboardingStep: 'ACTIVE',
          consentGiven: true,
          isVerified: true,
        },
      });

      await client.wallet.createMany({
        data: [
          {
            userId: david.id,
            currency: 'XOF',
            availableBalance: 320000,
            reservedBalance: 0,
            accountNumber: 'BJ-ECO-1092834',
            bankName: 'Ecobank Bénin',
          },
          {
            userId: david.id,
            currency: 'NGN',
            availableBalance: 125000,
            reservedBalance: 0,
            accountNumber: '0239182390',
            bankName: 'Access Bank Nigeria',
          },
        ],
      });

      console.log('[Neon PostgreSQL] Initial users and dual-currency wallets seeded successfully.');
    }
  } catch (err: any) {
    console.warn('[Neon PostgreSQL Seed Notice]:', err.message);
  }
}

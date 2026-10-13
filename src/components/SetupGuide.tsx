import React, { useState } from 'react';
import { BookOpen, Copy, Check, Terminal, Database, Server, Shield, ExternalLink, RefreshCw, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SetupGuideProps {
  databaseStatus?: any;
  onRefresh?: () => void;
}

export const SetupGuide: React.FC<SetupGuideProps> = ({ databaseStatus, onRefresh }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const prismaSchemaCode = `// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String                @id @default(uuid())
  whatsappPhone     String                @unique
  fullName          String?
  country           String                @default("NG") // NG, BJ
  preferredLanguage String                @default("en") // en, fr
  accountStatus     String                @default("ACTIVE") // ACTIVE, SUSPENDED, PENDING
  kycStatus         String                @default("TIER_1") // UNVERIFIED, TIER_1, TIER_2, TIER_3
  onboardingStep    String                @default("ACTIVE")
  consentGiven      Boolean               @default(true)
  isVerified        Boolean               @default(false)
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt

  wallets           Wallet[]
  quotes            ExchangeQuote[]
  transactions      Transaction[]
  messages          WhatsAppMessage[]
  sessions          ConversationSession[]
  auditLogs         AuditLog[]

  @@index([whatsappPhone])
}

model ExchangeRate {
  id             String    @id @default(uuid())
  sourceCurrency String    // NGN, XOF
  targetCurrency String    // XOF, NGN
  rate           Float
  rateSource     String    @default("DYNAMIC_MARKET_MAKER")
  effectiveAt    DateTime  @default(now())
  expiresAt      DateTime?
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())

  @@index([sourceCurrency, targetCurrency, isActive])
}

model Wallet {
  id               String   @id @default(uuid())
  userId           String
  currency         String   // NGN, XOF
  availableBalance Float    @default(0)
  reservedBalance  Float    @default(0)
  accountNumber    String?
  bankName         String?
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, currency])
  @@index([userId])
}

model ExchangeQuote {
  id             String   @id @default(uuid())
  quoteReference String   @unique // QT-XXXXXX
  userId         String
  userPhone      String
  sourceCurrency String   // NGN, XOF
  targetCurrency String   // XOF, NGN
  sourceAmount   Float
  targetAmount   Float
  exchangeRate   Float
  feeAmount      Float
  totalPayable   Float
  expiresAt      DateTime
  status         String   @default("PENDING") // PENDING, ACCEPTED, EXPIRED, CANCELLED, COMPLETED
  createdAt      DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userPhone])
  @@index([quoteReference])
}

model Transaction {
  id                  String          @id @default(uuid())
  reference           String          @unique // QX-XXXX-XXXX
  userId              String
  userPhone           String
  quoteId             String?
  type                String          @default("EXCHANGE")
  sourceCurrency      String          // NGN, XOF
  sourceAmount        Float
  targetCurrency      String          // XOF, NGN
  targetAmount        Float
  exchangeRate        Float
  fee                 Float
  recipientBank       String?
  recipientAccount    String?
  recipientName       String?
  recipientRail       String?
  recipientPhone      String?
  paymentReference    String?
  payoutReference     String?
  paymentInstructions Json?
  proofSubmittedAt    DateTime?
  proofNote           String?
  adminNote           String?
  verifiedAt          DateTime?
  completedAt         DateTime?
  status              String          @default("INITIATED")
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  paymentRecords PaymentRecord[]

  @@index([userId])
  @@index([userPhone])
  @@index([reference])
  @@index([status])
}

model PaymentRecord {
  id                 String       @id @default(uuid())
  transactionId      String
  providerReference  String       @unique
  amount             Float
  currency           String
  verificationStatus String       @default("PENDING")
  verifiedAt         DateTime?
  createdAt          DateTime     @default(now())

  transaction        Transaction  @relation(fields: [transactionId], references: [id], onDelete: Cascade)

  @@index([transactionId])
  @@index([providerReference])
}

model ConversationSession {
  id                String    @id @default(uuid())
  userId            String
  userPhone         String
  conversationState String    @default("IDLE")
  pendingAction     String?
  sessionExpiration DateTime?
  updatedAt         DateTime  @updatedAt
  createdAt         DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userPhone])
}

model WhatsAppMessage {
  id                String   @id @default(uuid())
  whatsappMessageId String?  @unique
  userId            String?
  userPhone         String
  direction         String   // INBOUND, OUTBOUND
  messageType       String   @default("text")
  content           String
  rawPayload        Json?
  status            String   @default("SUCCESS")
  createdAt         DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userPhone])
  @@index([whatsappMessageId])
}

model AuditLog {
  id         String   @id @default(uuid())
  action     String
  actor      String   // USER, SYSTEM, ADMIN
  actorId    String?
  entityType String?
  entityId   String?
  userId     String?
  userPhone  String?
  riskScore  Float?
  flags      String?
  metadata   Json?
  createdAt  DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([action])
  @@index([userId])
  @@index([entityType, entityId])
}

model SupportTicket {
  id           String    @id @default(uuid())
  ticketNumber String    @unique // TKT-XXXX
  userPhone    String
  userName     String
  subject      String
  message      String
  status       String    @default("OPEN")
  adminNote    String?
  createdAt    DateTime  @default(now())
  resolvedAt   DateTime?

  @@index([userPhone])
  @@index([status])
}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>Qudi Architecture, Neon PostgreSQL & Meta Cloud API Guide</span>
          </h2>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Comprehensive production documentation for connecting Neon PostgreSQL, executing Prisma migrations, configuring Meta WhatsApp Business Platform webhooks, and managing server environment secrets.
        </p>
      </div>

      {/* Database Connection Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${databaseStatus?.isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400 shadow-sm shadow-amber-400/50'}`} />
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Neon PostgreSQL Connection Status</span>
            </h3>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
            databaseStatus?.isConnected
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {databaseStatus?.isConnected ? 'CONNECTED & HEALTHY' : 'FALLBACK MODE (Awaiting DATABASE_URL)'}
          </span>
        </div>

        {databaseStatus?.isConnected ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono-nums">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Host</span>
              <span className="text-white font-bold">{databaseStatus.host || 'Neon Serverless'}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Database</span>
              <span className="text-emerald-400 font-bold">{databaseStatus.database || 'neondb'}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Connection Type</span>
              <span className="text-slate-200">{databaseStatus.isPooled ? 'Pooled (pgBouncer)' : 'Direct Connection'}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Query Latency</span>
              <span className="text-emerald-400">{databaseStatus.latencyMs ? `${databaseStatus.latencyMs} ms` : 'Active'}</span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-200/90 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4" />
              <span>How to connect your Neon PostgreSQL database</span>
            </div>
            <p className="text-slate-300">
              The application is currently running with the resilient in-memory operational cache. To persist all users, transactions, and exchange quotes directly to Neon:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-2">
              <li>Log in to your Neon console (<a href="https://console.neon.tech" target="_blank" rel="noreferrer" className="text-emerald-400 underline">console.neon.tech</a>).</li>
              <li>Select your Project and copy the <strong>Connection String</strong> (Pooled connection string is recommended for standard app traffic).</li>
              <li>In Google AI Studio Build, configure the environment secret: <code className="text-emerald-300 bg-slate-950 px-1.5 py-0.5 rounded">DATABASE_URL</code></li>
              <li>Run <code className="text-emerald-300 bg-slate-950 px-1.5 py-0.5 rounded">npx prisma migrate deploy</code> or click <strong>Seed / Resync Database</strong>.</li>
            </ol>
          </div>
        )}
      </div>

      {/* Step 1: Meta Setup */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
          <span>Meta WhatsApp Cloud API Webhook Verification</span>
        </h3>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            When registering your Webhook in the Meta Developer Portal (<strong>WhatsApp &gt; Configuration &gt; Webhook</strong>):
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono-nums">
            {/* Error 1006 Resolution Banner */}
            <div className="bg-amber-950/40 border border-amber-800/60 p-2.5 rounded-lg text-[11px] text-amber-200 mb-2">
              <strong className="text-amber-300">Important for Meta Error #1006:</strong> Meta’s webhook validation requires an unauthenticated, publicly accessible URL. Do not use internal <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">ais-dev-*</code> workspace URLs. Use the <strong>Public Callback URL</strong> below:
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Public Callback URL (Meta Required):</span>
              <button
                onClick={() => handleCopy('https://ais-pre-pclekuvfazg27rxlkjk4es-482451006325.europe-west3.run.app/webhook', 'cbUrl')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'cbUrl' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>Copy URL</span>
              </button>
            </div>
            <div className="text-emerald-300 font-bold text-xs select-all bg-slate-900 p-2 rounded border border-slate-800 break-all">
              https://ais-pre-pclekuvfazg27rxlkjk4es-482451006325.europe-west3.run.app/webhook
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-400 text-[11px]">Verify Token:</span>
              <button
                onClick={() => handleCopy('qudi_axra_whatsapp_verify_token_2026', 'vfToken')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'vfToken' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>
            <div className="text-emerald-400 font-bold text-xs select-all bg-slate-900 p-2 rounded border border-slate-800">
              qudi_axra_whatsapp_verify_token_2026
            </div>
          </div>
          <p className="text-slate-400 text-[11px]">
            * Note: The server automatically handles the GET handshake query (<code className="text-slate-300">hub.mode=subscribe</code>, <code className="text-slate-300">hub.verify_token</code>, <code className="text-slate-300">hub.challenge</code>) and immediately returns the numeric challenge with HTTP status 200.
          </p>
        </div>
      </div>

      {/* Step 2: Database Schema & Migrations */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
            <span>Neon PostgreSQL Database Schema (Prisma ORM)</span>
          </h3>
          <button
            onClick={() => handleCopy(prismaSchemaCode, 'prisma')}
            className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 flex items-center gap-1 cursor-pointer"
          >
            {copiedKey === 'prisma' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Schema</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          This schema satisfies all required financial entities: Users, Exchange Rates, Wallets, Exchange Quotes, Transactions, Payment Records, Conversation Sessions, WhatsApp Messages, Audit Logs, and Support Tickets.
        </p>

        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono-nums text-emerald-300 overflow-x-auto max-h-72 leading-relaxed">
          {prismaSchemaCode}
        </pre>
      </div>

      {/* Step 3: Secrets Configuration */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">3</span>
          <span>Environment Variables & Secret Configuration</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono-nums">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" />
              <span>DATABASE_URL</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Neon PostgreSQL pooled connection string for application traffic:
              <br />
              <code className="text-slate-300">postgresql://user:pass@ep-pooler.region.neon.tech/neondb?sslmode=require</code>
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" />
              <span>WHATSAPP_VERIFY_TOKEN</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Secret token matched during Meta Webhook validation:
              <br />
              <code className="text-slate-300">qudi_axra_whatsapp_verify_token_2026</code>
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" />
              <span>WHATSAPP_TOKEN</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Meta Graph API System User Bearer Token (starts with EAAG...) for sending WhatsApp messages.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" />
              <span>WHATSAPP_PHONE_NUMBER_ID</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Meta WhatsApp Business Phone Number ID from Meta Developer Portal API Setup.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" />
              <span>WHATSAPP_APP_SECRET</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Meta App Secret used for HMAC-SHA256 signature verification (<code className="text-slate-300">x-hub-signature-256</code>).
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" />
              <span>GEMINI_API_KEY</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Google Gemini API key for natural language intent classification (English and French).
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

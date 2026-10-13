import React, { useState } from 'react';
import { BookOpen, Copy, Check, Terminal, Database, Server, Shield, ExternalLink } from 'lucide-react';

export const SetupGuide: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const prismaSchema = `// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Language {
  en
  fr
}

enum Country {
  NG
  BJ
}

enum OnboardingStep {
  AWAITING_LANGUAGE
  AWAITING_NAME
  AWAITING_COUNTRY
  AWAITING_CONSENT
  ACTIVE
}

enum Currency {
  NGN
  XOF
}

enum QuoteStatus {
  PENDING
  CONFIRMED
  EXPIRED
  CANCELLED
}

enum TransactionStatus {
  AWAITING_PAYMENT
  PAYMENT_VERIFICATION
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
  UNDER_REVIEW
}

model User {
  id              String         @id @default(uuid())
  phone           String         @unique // WhatsApp Phone Number e.g. "2348031234567"
  name            String         @default("")
  language        Language       @default(en)
  country         Country        @default(NG)
  onboardingStep  OnboardingStep @default(AWAITING_LANGUAGE)
  consentGiven    Boolean        @default(false)
  isVerified      Boolean        @default(false)
  quotes          Quote[]
  transactions    Transaction[]
  supportTickets  SupportTicket[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}

model Quote {
  id           String      @id // e.g. "QT-882194-AX"
  userId       String
  user         User        @relation(fields: [userId], references: [id])
  fromCurrency Currency
  toCurrency   Currency
  fromAmount   Decimal     @db.Decimal(18, 4)
  toAmount     Decimal     @db.Decimal(18, 4)
  rate         Decimal     @db.Decimal(12, 6)
  fee          Decimal     @db.Decimal(18, 4)
  status       QuoteStatus @default(PENDING)
  expiresAt    DateTime    // 10 minutes from creation
  transaction  Transaction?
  createdAt    DateTime    @default(now())
}

model Transaction {
  id                   String            @id @default(uuid())
  reference            String            @unique // e.g. "QX-2610-8492"
  userId               String
  user                 User              @relation(fields: [userId], references: [id])
  quoteId              String            @unique
  quote                Quote             @relation(fields: [quoteId], references: [id])
  fromCurrency         Currency
  toCurrency           Currency
  fromAmount           Decimal           @db.Decimal(18, 4)
  toAmount             Decimal           @db.Decimal(18, 4)
  rate                 Decimal           @db.Decimal(12, 6)
  fee                  Decimal           @db.Decimal(18, 4)
  recipientAccount     String
  recipientName        String
  recipientRail        String
  status               TransactionStatus @default(AWAITING_PAYMENT)
  paymentProofNote     String?
  paymentProofSubmitted DateTime?
  verifiedAt           DateTime?
  completedAt          DateTime?
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt
}

model SupportTicket {
  id           String   @id @default(uuid())
  ticketNumber String   @unique // e.g. "SUP-4019"
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  subject      String
  message      String
  status       String   @default("OPEN")
  createdAt    DateTime @default(now())
  resolvedAt   DateTime?
}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>Meta WhatsApp Cloud API Integration & Deployment Guide</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Step-by-step instructions for connecting your live WhatsApp Business Platform account, registering the webhook, configuring PostgreSQL with Prisma, and deploying to production.
        </p>
      </div>

      {/* Step 1: Meta Setup */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
          <span>WhatsApp Business Cloud API Setup (Meta for Developers)</span>
        </h3>

        <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
          <li>
            Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">developers.facebook.com</a> and create a <strong>Business</strong> App.
          </li>
          <li>
            In the App Dashboard, add the <strong>WhatsApp</strong> product.
          </li>
          <li>
            Navigate to <strong>WhatsApp &gt; API Setup</strong>:
            <ul className="list-disc list-inside pl-4 mt-1 text-slate-400 space-y-1">
              <li>Copy your <strong>Phone Number ID</strong> and paste into <code className="text-emerald-400">WHATSAPP_PHONE_NUMBER_ID</code>.</li>
              <li>Generate a Permanent System User Token with permissions <code className="text-slate-300">whatsapp_business_messaging</code> and <code className="text-slate-300">whatsapp_business_management</code>.</li>
              <li>Paste the token into <code className="text-emerald-400">WHATSAPP_TOKEN</code>.</li>
            </ul>
          </li>
          <li>
            Navigate to <strong>WhatsApp &gt; Configuration &gt; Webhook</strong>:
            <ul className="list-disc list-inside pl-4 mt-1 text-slate-400 space-y-1">
              <li>Click <strong>Edit</strong>.</li>
              <li>Set Callback URL to: <code className="text-emerald-400">{window.location.origin}/webhook</code></li>
              <li>Set Verify Token to: <code className="text-emerald-400">qudi_axra_whatsapp_verify_token_2026</code> (or your custom value in <code className="text-slate-300">.env</code>).</li>
              <li>Click <strong>Verify and Save</strong>.</li>
              <li>Under <strong>Webhook fields</strong>, click <strong>Manage</strong> and subscribe to <strong className="text-white">messages</strong>.</li>
            </ul>
          </li>
        </ol>
      </div>

      {/* Step 2: Database Schema */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
            <span>Production Database Schema (Prisma / PostgreSQL)</span>
          </h3>
          <button
            onClick={() => handleCopy(prismaSchema, 'prisma')}
            className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 flex items-center gap-1 cursor-pointer"
          >
            {copiedKey === 'prisma' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Schema</span>
          </button>
        </div>

        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono-nums text-emerald-300 overflow-x-auto max-h-72 leading-relaxed">
          {prismaSchema}
        </pre>
      </div>

      {/* Step 3: Transaction State Machine */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">3</span>
          <span>Secure Transaction State Machine</span>
        </h3>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono-nums text-slate-300 leading-relaxed overflow-x-auto">
          {`[USER REQUESTS QUOTE] 
       │ 10-Min Expiry
       ▼
[QUOTE_GENERATED (PENDING)]
       │ User replies "Confirm"
       ▼
[AWAITING_PAYMENT] ── User receives escrow account & reference (e.g. QX-2610-8492)
       │ User transfers & says "Payment sent"
       ▼
[PAYMENT_VERIFICATION] ── Proof registered; awaiting clearing confirmation
       │ Bank / MoMo API or Ops desk verifies incoming funds
       ▼
[PROCESSING] ── Liquidity reserved; recipient payout initiated via NIBSS / MoMo
       │ External payout succeeds
       ▼
[COMPLETED] ── WhatsApp confirmation & receipt delivered to customer!`}
        </div>
      </div>

      {/* Step 4: Environment Variables */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">4</span>
          <span>Environment Variables Reference</span>
        </h3>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono-nums text-slate-300 space-y-2">
          <div><strong className="text-emerald-400">GEMINI_API_KEY</strong>: Google Gemini API key for natural language intent classification.</div>
          <div><strong className="text-emerald-400">WHATSAPP_TOKEN</strong>: Meta Graph API System User Bearer Token (starts with EAAG...).</div>
          <div><strong className="text-emerald-400">WHATSAPP_PHONE_NUMBER_ID</strong>: ID of the registered WhatsApp Business phone number.</div>
          <div><strong className="text-emerald-400">WHATSAPP_VERIFY_TOKEN</strong>: Secret string configured in Meta Webhook settings.</div>
          <div><strong className="text-emerald-400">WHATSAPP_APP_SECRET</strong>: App secret used to verify X-Hub-Signature-256 header.</div>
        </div>
      </div>

    </div>
  );
};

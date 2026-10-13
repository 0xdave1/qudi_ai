-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "whatsappPhone" TEXT NOT NULL,
    "fullName" TEXT,
    "country" TEXT NOT NULL DEFAULT 'NG',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "kycStatus" TEXT NOT NULL DEFAULT 'TIER_1',
    "onboardingStep" TEXT NOT NULL DEFAULT 'ACTIVE',
    "consentGiven" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "sourceCurrency" TEXT NOT NULL,
    "targetCurrency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "rateSource" TEXT NOT NULL DEFAULT 'DYNAMIC_MARKET_MAKER',
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "availableBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reservedBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accountNumber" TEXT,
    "bankName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeQuote" (
    "id" TEXT NOT NULL,
    "quoteReference" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "sourceCurrency" TEXT NOT NULL,
    "targetCurrency" TEXT NOT NULL,
    "sourceAmount" DOUBLE PRECISION NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL,
    "feeAmount" DOUBLE PRECISION NOT NULL,
    "totalPayable" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "quoteId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'EXCHANGE',
    "sourceCurrency" TEXT NOT NULL,
    "sourceAmount" DOUBLE PRECISION NOT NULL,
    "targetCurrency" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "recipientBank" TEXT,
    "recipientAccount" TEXT,
    "recipientName" TEXT,
    "recipientRail" TEXT,
    "recipientPhone" TEXT,
    "paymentReference" TEXT,
    "payoutReference" TEXT,
    "paymentInstructions" JSONB,
    "proofSubmittedAt" TIMESTAMP(3),
    "proofNote" TEXT,
    "adminNote" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "providerReference" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "conversationState" TEXT NOT NULL DEFAULT 'IDLE',
    "pendingAction" TEXT,
    "sessionExpiration" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "whatsappMessageId" TEXT,
    "userId" TEXT,
    "userPhone" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "content" TEXT NOT NULL,
    "rawPayload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "actorId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "userId" TEXT,
    "userPhone" TEXT,
    "riskScore" DOUBLE PRECISION,
    "flags" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_whatsappPhone_key" ON "User"("whatsappPhone");
CREATE INDEX "User_whatsappPhone_idx" ON "User"("whatsappPhone");

-- CreateIndex
CREATE INDEX "ExchangeRate_sourceCurrency_targetCurrency_isActive_idx" ON "ExchangeRate"("sourceCurrency", "targetCurrency", "isActive");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");
CREATE UNIQUE INDEX "Wallet_userId_currency_key" ON "Wallet"("userId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeQuote_quoteReference_key" ON "ExchangeQuote"("quoteReference");
CREATE INDEX "ExchangeQuote_userId_idx" ON "ExchangeQuote"("userId");
CREATE INDEX "ExchangeQuote_userPhone_idx" ON "ExchangeQuote"("userPhone");
CREATE INDEX "ExchangeQuote_quoteReference_idx" ON "ExchangeQuote"("quoteReference");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_reference_key" ON "Transaction"("reference");
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX "Transaction_userPhone_idx" ON "Transaction"("userPhone");
CREATE INDEX "Transaction_reference_idx" ON "Transaction"("reference");
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_providerReference_key" ON "PaymentRecord"("providerReference");
CREATE INDEX "PaymentRecord_transactionId_idx" ON "PaymentRecord"("transactionId");
CREATE INDEX "PaymentRecord_providerReference_idx" ON "PaymentRecord"("providerReference");

-- CreateIndex
CREATE INDEX "ConversationSession_userId_idx" ON "ConversationSession"("userId");
CREATE INDEX "ConversationSession_userPhone_idx" ON "ConversationSession"("userPhone");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessage_whatsappMessageId_key" ON "WhatsAppMessage"("whatsappMessageId");
CREATE INDEX "WhatsAppMessage_userPhone_idx" ON "WhatsAppMessage"("userPhone");
CREATE INDEX "WhatsAppMessage_whatsappMessageId_idx" ON "WhatsAppMessage"("whatsappMessageId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");
CREATE INDEX "SupportTicket_userPhone_idx" ON "SupportTicket"("userPhone");
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExchangeQuote" ADD CONSTRAINT "ExchangeQuote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationSession" ADD CONSTRAINT "ConversationSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

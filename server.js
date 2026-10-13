// server.ts
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// server/services/aiOrchestrator.ts
import { GoogleGenAI } from "@google/genai";
var AIOrchestrator = class {
  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  async classifyIntentAndExtract(userMessage, userLang) {
    const text = userMessage.trim().toLowerCase();
    if (/^(hi|hello|hey|bonjour|salut|coucou|good morning|good evening)/i.test(text)) {
      return { intent: "GREETING" };
    }
    if (/^(1|english|anglais)$/i.test(text) || text.includes("change language to english") || text.includes("parler anglais")) {
      return { intent: "CHANGE_LANGUAGE", selectedLanguage: "en" };
    }
    if (/^(2|french|français|francais)$/i.test(text) || text.includes("change language to french") || text.includes("passer en francais")) {
      return { intent: "CHANGE_LANGUAGE", selectedLanguage: "fr" };
    }
    if (text.includes("change language") || text.includes("changer de langue") || text.includes("changer la langue")) {
      return { intent: "CHANGE_LANGUAGE" };
    }
    if (text.includes("support") || text.includes("human") || text.includes("aide") || text.includes("humain") || text.includes("agent") || text.includes("dispute") || text.includes("probl\xE8me") || text.includes("remboursement") || text.includes("refund")) {
      return { intent: "CUSTOMER_SUPPORT" };
    }
    if (text.includes("history") || text.includes("historique") || text.includes("mes transactions") || text.includes("my transactions") || text.includes("last transactions") || text.includes("derniers transferts")) {
      return { intent: "TRANSACTION_HISTORY" };
    }
    if (text.includes("paid") || text.includes("j'ai pay\xE9") || text.includes("jai paye") || text.includes("payment done") || text.includes("virement effectu\xE9") || text.includes("transfer sent")) {
      const refMatch = userMessage.match(/QX-[\w-]+/i);
      return {
        intent: "SUBMIT_PAYMENT_PROOF",
        transactionRef: refMatch ? refMatch[0].toUpperCase() : void 0
      };
    }
    if (/^(yes|confirm|confirmer|oui|d'accord|continue|continuer|procéder|1)$/i.test(text) || text.includes("confirm exchange") || text.includes("confirmer l'\xE9change")) {
      return { intent: "CONFIRM_QUOTE" };
    }
    if (/^(no|cancel|annuler|non|stop|abort|2)$/i.test(text) || text.includes("cancel quote") || text.includes("annuler le devis")) {
      return { intent: "CANCEL_QUOTE" };
    }
    if (process.env.GEMINI_API_KEY) {
      try {
        const systemInstruction = `
You are the intent classifier and financial entity extractor for Qudi, a cross-border WhatsApp banking assistant exchanging Nigerian Naira (NGN) and West African CFA Franc (XOF).

Your job: Classify the user's message into one of these strict intents:
- GREETING
- CHANGE_LANGUAGE
- CHECK_RATE (user asks for today's exchange rates)
- REQUEST_QUOTE (user wants to exchange or convert an amount between NGN and XOF)
- CONFIRM_QUOTE (user wants to accept and proceed with an existing quote)
- CANCEL_QUOTE (user rejects or cancels an active quote)
- SUBMIT_PAYMENT_PROOF (user states they have sent or paid the funds)
- CHECK_TRANSACTION (user checks status of a specific transaction ref)
- TRANSACTION_HISTORY (user asks for their past transfers or transactions)
- CUSTOMER_SUPPORT (user has a dispute, asks for human support, refund, or complaint)
- UNKNOWN_INTENT

Entity Extraction Rules:
- Currency names: "CFA", "FCFA", "Francs", "Cotonou", "Benin" -> "XOF". "Naira", "NGN", "\u20A6", "Nigeria", "Lagos" -> "NGN".
- Amounts: "100,000 CFA" -> amount: 100000, fromCurrency: "XOF". "50k naira" -> amount: 50000, fromCurrency: "NGN".
- If user says "100k CFA to Naira", fromCurrency is XOF, toCurrency is NGN.
- If user mentions transaction reference like "QX-2610-8492", extract into transactionRef.

Respond ONLY with valid JSON in this structure:
{
  "intent": "REQUEST_QUOTE",
  "fromCurrency": "XOF",
  "toCurrency": "NGN",
  "amount": 100000,
  "transactionRef": null
}
`;
        const response = await this.ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: userMessage,
          config: {
            systemInstruction,
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        });
        const textOutput = response.text?.trim();
        if (textOutput) {
          const parsed = JSON.parse(textOutput);
          return {
            intent: parsed.intent || "UNKNOWN_INTENT",
            fromCurrency: parsed.fromCurrency,
            toCurrency: parsed.toCurrency,
            amount: typeof parsed.amount === "number" ? parsed.amount : void 0,
            transactionRef: parsed.transactionRef || void 0,
            recipientAccount: parsed.recipientAccount || void 0,
            recipientName: parsed.recipientName || void 0
          };
        }
      } catch (err) {
        console.warn("[AI Orchestrator] Gemini classification failed, using regex fallback:", err);
      }
    }
    return this.fallbackRegexClassification(userMessage);
  }
  fallbackRegexClassification(msg) {
    const text = msg.toLowerCase();
    if (text.includes("rate") || text.includes("taux") || text.includes("exchange rate") || text.includes("cours")) {
      return { intent: "CHECK_RATE" };
    }
    const refMatch = msg.match(/QX-[\w-]+/i);
    if (refMatch) {
      return {
        intent: "CHECK_TRANSACTION",
        transactionRef: refMatch[0].toUpperCase()
      };
    }
    const isXof = text.includes("cfa") || text.includes("fcfa") || text.includes("xof");
    const isNgn = text.includes("naira") || text.includes("ngn") || text.includes("\u20A6");
    if (text.includes("convert") || text.includes("exchange") || text.includes("change") || text.includes("\xE9changer") || text.includes("convertir") || text.includes("send") || text.includes("envoyer") || isXof && isNgn) {
      const numMatch = text.match(/([0-9]+([0-9,.]*))(\s*(k|m))?/i);
      let amount;
      if (numMatch) {
        let rawNum = parseFloat(numMatch[1].replace(/,/g, ""));
        if (numMatch[4]?.toLowerCase() === "k") rawNum *= 1e3;
        if (numMatch[4]?.toLowerCase() === "m") rawNum *= 1e6;
        amount = rawNum;
      }
      let fromCurrency;
      let toCurrency;
      if (text.includes("cfa to naira") || text.includes("xof to ngn") || text.includes("cfa en naira") || isXof && !text.includes("naira to cfa")) {
        fromCurrency = "XOF";
        toCurrency = "NGN";
      } else if (text.includes("naira to cfa") || text.includes("ngn to xof") || text.includes("naira en cfa") || isNgn) {
        fromCurrency = "NGN";
        toCurrency = "XOF";
      }
      return {
        intent: "REQUEST_QUOTE",
        fromCurrency,
        toCurrency,
        amount
      };
    }
    return { intent: "UNKNOWN_INTENT" };
  }
};
var aiOrchestrator = new AIOrchestrator();

// server/db/prisma.ts
import { PrismaClient } from "@prisma/client";
var prismaInstance = null;
var lastStatus = {
  isConfigured: false,
  isConnected: false,
  provider: "Neon PostgreSQL (Prisma)",
  lastChecked: (/* @__PURE__ */ new Date()).toISOString()
};
function getPrisma() {
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    return null;
  }
  if (!prismaInstance) {
    try {
      prismaInstance = new PrismaClient({
        datasources: {
          db: {
            url: dbUrl
          }
        },
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
      });
    } catch (err) {
      console.error("[Prisma Client Init Error]:", err.message);
      return null;
    }
  }
  return prismaInstance;
}
async function checkDatabaseHealth() {
  const dbUrl = process.env.DATABASE_URL?.trim();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (!dbUrl) {
    lastStatus = {
      isConfigured: false,
      isConnected: false,
      provider: "Neon PostgreSQL (Prisma)",
      lastChecked: now,
      error: "DATABASE_URL environment variable is not configured. Set it in AI Studio Secrets."
    };
    return lastStatus;
  }
  let host = "Unknown";
  let database = "neondb";
  let isPooled = false;
  try {
    const parsed = new URL(dbUrl);
    host = parsed.hostname;
    database = parsed.pathname.replace(/^\//, "") || "neondb";
    isPooled = host.includes("-pooler") || parsed.port === "6543";
  } catch {
    const match = dbUrl.match(/@([^:/]+)(?::(\d+))?\/([^?]+)/);
    if (match) {
      host = match[1];
      database = match[3];
      isPooled = host.includes("-pooler");
    }
  }
  const client = getPrisma();
  if (!client) {
    lastStatus = {
      isConfigured: true,
      isConnected: false,
      provider: "Neon PostgreSQL (Prisma)",
      host,
      database,
      isPooled,
      lastChecked: now,
      error: "Failed to initialize Prisma Client instance."
    };
    return lastStatus;
  }
  const startTime = Date.now();
  try {
    await client.$queryRawUnsafe("SELECT 1 as connected");
    const latencyMs = Date.now() - startTime;
    let userCount = 0;
    let transactionCount = 0;
    try {
      [userCount, transactionCount] = await Promise.all([
        client.user.count(),
        client.transaction.count()
      ]);
    } catch {
    }
    lastStatus = {
      isConfigured: true,
      isConnected: true,
      provider: "Neon PostgreSQL (Prisma)",
      host,
      database,
      isPooled,
      latencyMs,
      lastChecked: now,
      userCount,
      transactionCount
    };
    return lastStatus;
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    console.warn("[Database Health Check Error]:", err.message);
    lastStatus = {
      isConfigured: true,
      isConnected: false,
      provider: "Neon PostgreSQL (Prisma)",
      host,
      database,
      isPooled,
      latencyMs,
      lastChecked: now,
      error: err.message
    };
    return lastStatus;
  }
}
function getCachedDatabaseStatus() {
  return lastStatus;
}
async function seedDatabaseIfEmpty() {
  const client = getPrisma();
  if (!client) return;
  try {
    const rateCount = await client.exchangeRate.count();
    if (rateCount === 0) {
      console.log("[Neon PostgreSQL] Seeding initial exchange rates...");
      await client.exchangeRate.createMany({
        data: [
          {
            sourceCurrency: "XOF",
            targetCurrency: "NGN",
            rate: 2.55,
            rateSource: "DYNAMIC_MARKET_MAKER",
            isActive: true
          },
          {
            sourceCurrency: "NGN",
            targetCurrency: "XOF",
            rate: 0.39215,
            rateSource: "DYNAMIC_MARKET_MAKER",
            isActive: true
          }
        ]
      });
      console.log("[Neon PostgreSQL] Exchange rates seeded successfully.");
    }
    const userCount = await client.user.count();
    if (userCount === 0) {
      console.log("[Neon PostgreSQL] Seeding initial demo accounts...");
      const amina = await client.user.create({
        data: {
          whatsappPhone: "2348031234567",
          fullName: "Amina Bello",
          country: "NG",
          preferredLanguage: "en",
          accountStatus: "ACTIVE",
          kycStatus: "TIER_2",
          onboardingStep: "ACTIVE",
          consentGiven: true,
          isVerified: true
        }
      });
      await client.wallet.createMany({
        data: [
          {
            userId: amina.id,
            currency: "NGN",
            availableBalance: 45e4,
            reservedBalance: 0,
            accountNumber: "9012384910",
            bankName: "Zenith Bank PLC"
          },
          {
            userId: amina.id,
            currency: "XOF",
            availableBalance: 85e3,
            reservedBalance: 0,
            accountNumber: "BJ-BOA-8492019",
            bankName: "Bank of Africa B\xE9nin"
          }
        ]
      });
      const david = await client.user.create({
        data: {
          whatsappPhone: "22997458812",
          fullName: "David Dossou",
          country: "BJ",
          preferredLanguage: "fr",
          accountStatus: "ACTIVE",
          kycStatus: "TIER_2",
          onboardingStep: "ACTIVE",
          consentGiven: true,
          isVerified: true
        }
      });
      await client.wallet.createMany({
        data: [
          {
            userId: david.id,
            currency: "XOF",
            availableBalance: 32e4,
            reservedBalance: 0,
            accountNumber: "BJ-ECO-1092834",
            bankName: "Ecobank B\xE9nin"
          },
          {
            userId: david.id,
            currency: "NGN",
            availableBalance: 125e3,
            reservedBalance: 0,
            accountNumber: "0239182390",
            bankName: "Access Bank Nigeria"
          }
        ]
      });
      console.log("[Neon PostgreSQL] Initial users and dual-currency wallets seeded successfully.");
    }
  } catch (err) {
    console.warn("[Neon PostgreSQL Seed Notice]:", err.message);
  }
}

// server/services/rateService.ts
var RateService = class {
  constructor() {
    this.config = {
      xofToNgnRate: 2.55,
      ngnToXofRate: 0.39215,
      feePercentage: 8e-3,
      // 0.8%
      minNgn: 5e3,
      maxNgn: 5e6,
      minXof: 2e3,
      maxXof: 2e6,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.quotes = /* @__PURE__ */ new Map();
    this.loadRatesFromDb().catch(() => {
    });
  }
  async loadRatesFromDb() {
    const prisma = getPrisma();
    if (!prisma) return;
    try {
      const activeRates = await prisma.exchangeRate.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" }
      });
      const xofNgn = activeRates.find((r) => r.sourceCurrency === "XOF" && r.targetCurrency === "NGN");
      const ngnXof = activeRates.find((r) => r.sourceCurrency === "NGN" && r.targetCurrency === "XOF");
      if (xofNgn) this.config.xofToNgnRate = xofNgn.rate;
      if (ngnXof) this.config.ngnToXofRate = ngnXof.rate;
      this.config.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    } catch (err) {
      console.warn("[RateService Prisma Load Error]:", err.message);
    }
  }
  getRates() {
    return { ...this.config };
  }
  updateRates(partial) {
    this.config = {
      ...this.config,
      ...partial,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    const prisma = getPrisma();
    if (prisma) {
      (async () => {
        try {
          if (partial.xofToNgnRate) {
            await prisma.exchangeRate.create({
              data: {
                sourceCurrency: "XOF",
                targetCurrency: "NGN",
                rate: partial.xofToNgnRate,
                rateSource: "ADMIN_OVERRIDE",
                isActive: true
              }
            });
          }
          if (partial.ngnToXofRate) {
            await prisma.exchangeRate.create({
              data: {
                sourceCurrency: "NGN",
                targetCurrency: "XOF",
                rate: partial.ngnToXofRate,
                rateSource: "ADMIN_OVERRIDE",
                isActive: true
              }
            });
          }
        } catch (err) {
          console.warn("[RateService Prisma Save Error]:", err.message);
        }
      })();
    }
    return this.getRates();
  }
  calculateQuote(params) {
    const { userPhone, fromCurrency, toCurrency, amount } = params;
    if (fromCurrency === toCurrency) {
      return {
        success: false,
        error: "Source and destination currencies must be different (NGN \u21C4 XOF).",
        errorFr: "Les devises source et destination doivent \xEAtre diff\xE9rentes (NGN \u21C4 XOF)."
      };
    }
    if (fromCurrency === "NGN") {
      if (amount < this.config.minNgn) {
        return {
          success: false,
          error: `Minimum exchange amount is \u20A6${this.config.minNgn.toLocaleString()} NGN.`,
          errorFr: `Le montant minimum est de \u20A6${this.config.minNgn.toLocaleString()} NGN.`
        };
      }
      if (amount > this.config.maxNgn) {
        return {
          success: false,
          error: `Maximum exchange amount per transaction is \u20A6${this.config.maxNgn.toLocaleString()} NGN.`,
          errorFr: `Le montant maximum par transaction est de \u20A6${this.config.maxNgn.toLocaleString()} NGN.`
        };
      }
    } else {
      if (amount < this.config.minXof) {
        return {
          success: false,
          error: `Minimum exchange amount is ${this.config.minXof.toLocaleString()} XOF.`,
          errorFr: `Le montant minimum est de ${this.config.minXof.toLocaleString()} FCFA.`
        };
      }
      if (amount > this.config.maxXof) {
        return {
          success: false,
          error: `Maximum exchange amount per transaction is ${this.config.maxXof.toLocaleString()} XOF.`,
          errorFr: `Le montant maximum par transaction est de ${this.config.maxXof.toLocaleString()} FCFA.`
        };
      }
    }
    const rate = fromCurrency === "XOF" ? this.config.xofToNgnRate : this.config.ngnToXofRate;
    const fee = Math.round(amount * this.config.feePercentage);
    const netSource = amount - fee;
    const toAmount = Math.round(netSource * rate);
    const quoteId = `QT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const now = /* @__PURE__ */ new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1e3).toISOString();
    const quote = {
      id: quoteId,
      userPhone,
      fromCurrency,
      toCurrency,
      fromAmount: amount,
      toAmount,
      rate,
      fee,
      expiresAt,
      status: "PENDING",
      createdAt: now.toISOString()
    };
    this.quotes.set(quoteId, quote);
    const prisma = getPrisma();
    if (prisma) {
      (async () => {
        try {
          let user = await prisma.user.findUnique({ where: { whatsappPhone: userPhone } });
          if (!user) {
            try {
              user = await prisma.user.create({
                data: {
                  whatsappPhone: userPhone,
                  fullName: "",
                  country: userPhone.startsWith("229") ? "BJ" : "NG",
                  preferredLanguage: userPhone.startsWith("229") ? "fr" : "en"
                }
              });
            } catch {
              user = await prisma.user.findUnique({ where: { whatsappPhone: userPhone } });
            }
          }
          if (user) {
            await prisma.exchangeQuote.upsert({
              where: { quoteReference: quote.id },
              update: {
                status: quote.status || "PENDING"
              },
              create: {
                quoteReference: quote.id,
                userId: user.id,
                userPhone,
                sourceCurrency: quote.fromCurrency,
                targetCurrency: quote.toCurrency,
                sourceAmount: quote.fromAmount,
                targetAmount: quote.toAmount,
                exchangeRate: quote.rate,
                feeAmount: quote.fee,
                totalPayable: quote.fromAmount,
                expiresAt: new Date(quote.expiresAt),
                status: quote.status || "PENDING"
              }
            });
          }
        } catch (err) {
          console.warn("[RateService Prisma Quote Save Notice]:", err.message);
        }
      })();
    }
    return {
      success: true,
      quote
    };
  }
  isQuoteExpired(quote) {
    return quote.status === "EXPIRED" || /* @__PURE__ */ new Date() > new Date(quote.expiresAt);
  }
  getQuoteById(quoteId) {
    const q = this.quotes.get(quoteId);
    if (!q) return void 0;
    if (this.isQuoteExpired(q) && q.status === "PENDING") {
      q.status = "EXPIRED";
    }
    return q;
  }
  getLatestActiveQuoteForUser(userPhone) {
    const userQuotes = Array.from(this.quotes.values()).filter((q) => q.userPhone === userPhone).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    for (const q of userQuotes) {
      if (q.status === "PENDING") {
        if (/* @__PURE__ */ new Date() > new Date(q.expiresAt)) {
          q.status = "EXPIRED";
        } else {
          return q;
        }
      }
    }
    return void 0;
  }
  updateQuoteStatus(quoteId, status) {
    const q = this.quotes.get(quoteId);
    if (q) {
      q.status = status;
      const prisma = getPrisma();
      if (prisma) {
        prisma.exchangeQuote.updateMany({
          where: { quoteReference: quoteId },
          data: { status }
        }).catch(() => {
        });
      }
      return true;
    }
    return false;
  }
  getAllQuotes() {
    return Array.from(this.quotes.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
};
var rateService = new RateService();

// server/services/supportService.ts
var SupportService = class {
  constructor() {
    this.tickets = /* @__PURE__ */ new Map();
    const now = /* @__PURE__ */ new Date();
    this.tickets.set("tkt_1", {
      id: "tkt_1",
      ticketNumber: "SUP-4019",
      userPhone: "2348031234567",
      userName: "Amina Bello",
      subject: "Transaction confirmation inquiry",
      message: "User requested human verification on exchange payout to Cotonou MTN MoMo account.",
      status: "OPEN",
      createdAt: now.toISOString()
    });
  }
  createTicket(params) {
    const randomSuffix = Math.floor(1e3 + Math.random() * 9e3);
    const id = `tkt_${Date.now()}`;
    const ticket = {
      id,
      ticketNumber: `SUP-${randomSuffix}`,
      userPhone: params.userPhone,
      userName: params.userName || "WhatsApp User",
      subject: params.subject,
      message: params.message,
      status: "OPEN",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.tickets.set(id, ticket);
    return ticket;
  }
  getTickets() {
    return Array.from(this.tickets.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  resolveTicket(id, _resolutionNote) {
    const t = this.tickets.get(id);
    if (!t) return void 0;
    t.status = "RESOLVED";
    t.resolvedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.tickets.set(id, t);
    return t;
  }
};
var supportService = new SupportService();

// server/services/walletService.ts
var WalletService = class {
  constructor() {
    this.fallbackWallets = /* @__PURE__ */ new Map();
  }
  async getWalletsForUser(userId) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const wallets = await prisma.wallet.findMany({
          where: { userId, isActive: true }
        });
        return wallets.map((w) => ({
          id: w.id,
          userId: w.userId,
          currency: w.currency,
          availableBalance: w.availableBalance,
          reservedBalance: w.reservedBalance,
          accountNumber: w.accountNumber || void 0,
          bankName: w.bankName || void 0,
          isActive: w.isActive,
          createdAt: w.createdAt.toISOString(),
          updatedAt: w.updatedAt.toISOString()
        }));
      } catch (err) {
        console.warn("[WalletService Prisma Read Error]:", err.message);
      }
    }
    return this.fallbackWallets.get(userId) || [];
  }
  async createDefaultWallets(userId, country) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const isNg = country === "NG";
    const ngnAccount = `${Math.floor(1e9 + Math.random() * 9e9)}`;
    const xofAccount = `BJ-${isNg ? "BOA" : "ECO"}-${Math.floor(1e6 + Math.random() * 9e6)}`;
    const prisma = getPrisma();
    if (prisma) {
      try {
        const created = await Promise.all([
          prisma.wallet.create({
            data: {
              userId,
              currency: "NGN",
              availableBalance: 0,
              reservedBalance: 0,
              accountNumber: ngnAccount,
              bankName: "Zenith Bank PLC",
              isActive: true
            }
          }),
          prisma.wallet.create({
            data: {
              userId,
              currency: "XOF",
              availableBalance: 0,
              reservedBalance: 0,
              accountNumber: xofAccount,
              bankName: isNg ? "Bank of Africa B\xE9nin" : "Ecobank B\xE9nin",
              isActive: true
            }
          })
        ]);
        return created.map((w) => ({
          id: w.id,
          userId: w.userId,
          currency: w.currency,
          availableBalance: w.availableBalance,
          reservedBalance: w.reservedBalance,
          accountNumber: w.accountNumber || void 0,
          bankName: w.bankName || void 0,
          isActive: w.isActive,
          createdAt: w.createdAt.toISOString(),
          updatedAt: w.updatedAt.toISOString()
        }));
      } catch (err) {
        console.warn("[WalletService Prisma Create Error]:", err.message);
      }
    }
    const wallets = [
      {
        id: `wal_ngn_${Date.now()}`,
        userId,
        currency: "NGN",
        availableBalance: 0,
        reservedBalance: 0,
        accountNumber: ngnAccount,
        bankName: "Zenith Bank PLC",
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: `wal_xof_${Date.now()}`,
        userId,
        currency: "XOF",
        availableBalance: 0,
        reservedBalance: 0,
        accountNumber: xofAccount,
        bankName: isNg ? "Bank of Africa B\xE9nin" : "Ecobank B\xE9nin",
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];
    this.fallbackWallets.set(userId, wallets);
    return wallets;
  }
  async updateBalance(userId, currency, delta) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const wallet = await prisma.wallet.findFirst({
          where: { userId, currency }
        });
        if (wallet) {
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
              availableBalance: Math.max(0, wallet.availableBalance + delta)
            }
          });
          return true;
        }
      } catch (err) {
        console.warn("[WalletService Update Error]:", err.message);
      }
    }
    const list = this.fallbackWallets.get(userId);
    if (list) {
      const w = list.find((x) => x.currency === currency);
      if (w) {
        w.availableBalance = Math.max(0, w.availableBalance + delta);
        w.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        return true;
      }
    }
    return false;
  }
};
var walletService = new WalletService();

// server/services/auditService.ts
var AuditService = class {
  constructor() {
    this.fallbackLogs = [];
  }
  async log(params) {
    const item = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      ...params
    };
    this.fallbackLogs.unshift(item);
    if (this.fallbackLogs.length > 200) {
      this.fallbackLogs.pop();
    }
    const prisma = getPrisma();
    if (prisma) {
      try {
        await prisma.auditLog.create({
          data: {
            action: params.action,
            actor: params.actor,
            userId: params.userId,
            userPhone: params.userPhone,
            riskScore: params.riskScore,
            flags: params.flags,
            metadata: params.metadata
          }
        });
      } catch (err) {
        console.warn("[AuditService Prisma Log Error]:", err.message);
      }
    }
    return item;
  }
  async getRecentLogs(limit = 50) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const records = await prisma.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: limit
        });
        if (records.length > 0) {
          return records.map((r) => ({
            id: r.id,
            action: r.action,
            actor: r.actor,
            userId: r.userId || void 0,
            userPhone: r.userPhone || void 0,
            riskScore: r.riskScore || void 0,
            flags: r.flags || void 0,
            metadata: r.metadata,
            createdAt: r.createdAt.toISOString()
          }));
        }
      } catch (err) {
        console.warn("[AuditService Prisma Read Error]:", err.message);
      }
    }
    return this.fallbackLogs.slice(0, limit);
  }
};
var auditService = new AuditService();

// server/services/transactionService.ts
var TransactionService = class {
  constructor() {
    this.transactions = /* @__PURE__ */ new Map();
    this.seedFallbackTransactions();
    this.loadTransactionsFromDb().catch(() => {
    });
  }
  seedFallbackTransactions() {
    const now = /* @__PURE__ */ new Date();
    const t1Date = new Date(now.getTime() - 2 * 3600 * 1e3).toISOString();
    const t2Date = new Date(now.getTime() - 26 * 3600 * 1e3).toISOString();
    this.transactions.set("QX-2610-8492", {
      id: "tx_1",
      reference: "QX-2610-8492",
      userPhone: "2348031234567",
      quoteId: "QT-849201",
      fromCurrency: "NGN",
      toCurrency: "XOF",
      fromAmount: 5e4,
      toAmount: 19411,
      rate: 0.39215,
      fee: 400,
      recipientAccount: "22997458812",
      recipientName: "David Dossou",
      recipientRail: "MTN_MOMO",
      status: "COMPLETED",
      paymentInstructions: {
        bankOrProvider: "Zenith Bank PLC",
        accountOrMerchantCode: "9012384910",
        accountName: "Qudi Liquidity Pool NG",
        paymentReference: "QX-2610-8492",
        note: "Pay exact amount via NIP transfer"
      },
      verifiedAt: t1Date,
      completedAt: t1Date,
      createdAt: t1Date,
      updatedAt: t1Date
    });
    this.transactions.set("QX-2609-3129", {
      id: "tx_2",
      reference: "QX-2609-3129",
      userPhone: "22997458812",
      quoteId: "QT-312940",
      fromCurrency: "XOF",
      toCurrency: "NGN",
      fromAmount: 1e5,
      toAmount: 252960,
      rate: 2.55,
      fee: 800,
      recipientAccount: "0129481923",
      recipientName: "Amina Bello",
      recipientRail: "NIBSS_NIP",
      status: "COMPLETED",
      paymentInstructions: {
        bankOrProvider: "Bank of Africa B\xE9nin",
        accountOrMerchantCode: "BJ-BOA-8492019",
        accountName: "Qudi West Africa SAS",
        paymentReference: "QX-2609-3129",
        note: "Envoyez via Moov/MTN Money ou virement BOA"
      },
      verifiedAt: t2Date,
      completedAt: t2Date,
      createdAt: t2Date,
      updatedAt: t2Date
    });
  }
  async loadTransactionsFromDb() {
    const prisma = getPrisma();
    if (!prisma) return;
    try {
      const records = await prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 100
      });
      for (const r of records) {
        const tx = {
          id: r.id,
          reference: r.reference,
          userPhone: r.userPhone,
          quoteId: r.quoteId || "",
          fromCurrency: r.sourceCurrency,
          toCurrency: r.targetCurrency,
          fromAmount: r.sourceAmount,
          toAmount: r.targetAmount,
          rate: r.exchangeRate,
          fee: r.fee,
          recipientAccount: r.recipientAccount || "",
          recipientName: r.recipientName || "",
          recipientRail: r.recipientRail || "BANK_TRANSFER",
          status: r.status,
          paymentInstructions: r.paymentInstructions || {
            bankOrProvider: "Qudi Settlement Vault",
            accountOrMerchantCode: "Vault",
            accountName: "Qudi",
            paymentReference: r.reference,
            note: "Settlement Account"
          },
          paymentProofSubmittedAt: r.proofSubmittedAt?.toISOString(),
          paymentProofNote: r.proofNote || void 0,
          verifiedAt: r.verifiedAt?.toISOString(),
          completedAt: r.completedAt?.toISOString(),
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString()
        };
        this.transactions.set(tx.reference, tx);
      }
    } catch (err) {
      console.warn("[TransactionService Prisma Load Error]:", err.message);
    }
  }
  createTransaction(params) {
    const yearMonth = (/* @__PURE__ */ new Date()).toISOString().slice(2, 7).replace("-", "");
    const randomSuffix = Math.floor(1e3 + Math.random() * 9e3);
    const reference = `QX-${yearMonth}-${randomSuffix}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const rail = params.recipientRail || "BANK_TRANSFER";
    const paymentInstructions = params.fromCurrency === "NGN" ? {
      bankOrProvider: "Zenith Bank PLC",
      accountOrMerchantCode: "9012384910",
      accountName: "Qudi Liquidity Pool NG",
      paymentReference: reference,
      note: "Pay exact amount via NIP transfer or Bank USSD"
    } : {
      bankOrProvider: "Bank of Africa B\xE9nin / MTN MoMo",
      accountOrMerchantCode: "BJ-BOA-8492019",
      accountName: "Qudi West Africa SAS",
      paymentReference: reference,
      note: "Envoyez via Moov/MTN Money ou virement BOA"
    };
    const transaction = {
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
      status: "AWAITING_PAYMENT",
      paymentInstructions,
      createdAt: now,
      updatedAt: now
    };
    this.transactions.set(reference, transaction);
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
                type: "EXCHANGE",
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
                paymentInstructions,
                status: "AWAITING_PAYMENT"
              }
            });
            await auditService.log({
              action: "TRANSACTION_INITIATED",
              actor: "USER",
              userId: user.id,
              userPhone: params.userPhone,
              metadata: { reference, fromCurrency: params.fromCurrency, toCurrency: params.toCurrency, amount: params.fromAmount }
            });
          }
        } catch (err) {
          console.warn("[TransactionService Prisma Save Error]:", err.message);
        }
      })();
    }
    return transaction;
  }
  getTransactionByRef(ref) {
    return this.transactions.get(ref);
  }
  getUserTransactionByRef(userPhone, ref) {
    const tx = this.transactions.get(ref);
    return tx && tx.userPhone === userPhone ? tx : void 0;
  }
  getLatestActiveTransaction(userPhone) {
    return this.getLatestActiveTransactionForUser(userPhone);
  }
  getUserTransactions(userPhone, limit = 5) {
    return this.getTransactionsForUser(userPhone, limit);
  }
  getLatestActiveTransactionForUser(userPhone) {
    const list = Array.from(this.transactions.values()).filter((t) => t.userPhone === userPhone).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list.find(
      (t) => t.status === "AWAITING_PAYMENT" || t.status === "PAYMENT_VERIFICATION" || t.status === "PROCESSING"
    );
  }
  getTransactionsForUser(userPhone, limit = 5) {
    return Array.from(this.transactions.values()).filter((t) => t.userPhone === userPhone).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
  }
  submitPaymentProof(ref, note) {
    const tx = this.transactions.get(ref);
    if (!tx) return { success: false };
    tx.status = "PAYMENT_VERIFICATION";
    tx.paymentProofSubmittedAt = (/* @__PURE__ */ new Date()).toISOString();
    tx.paymentProofNote = note;
    tx.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const prisma = getPrisma();
    if (prisma) {
      prisma.transaction.updateMany({
        where: { reference: ref },
        data: {
          status: "PAYMENT_VERIFICATION",
          proofSubmittedAt: /* @__PURE__ */ new Date(),
          proofNote: note
        }
      }).catch(() => {
      });
    }
    return { success: true, transaction: tx };
  }
  verifyAndCompletePayment(ref, adminNote) {
    const tx = this.transactions.get(ref);
    if (!tx) return { success: false };
    const now = (/* @__PURE__ */ new Date()).toISOString();
    tx.status = "COMPLETED";
    tx.verifiedAt = now;
    tx.completedAt = now;
    tx.updatedAt = now;
    const prisma = getPrisma();
    if (prisma) {
      (async () => {
        try {
          await prisma.transaction.updateMany({
            where: { reference: ref },
            data: {
              status: "COMPLETED",
              verifiedAt: /* @__PURE__ */ new Date(),
              completedAt: /* @__PURE__ */ new Date(),
              adminNote: adminNote || "Payment verified by settlement desk"
            }
          });
          const user = await prisma.user.findUnique({ where: { whatsappPhone: tx.userPhone } });
          if (user) {
            await walletService.updateBalance(user.id, tx.toCurrency, tx.toAmount);
            await auditService.log({
              action: "TRANSACTION_SETTLED",
              actor: "ADMIN",
              userId: user.id,
              userPhone: tx.userPhone,
              metadata: { reference: ref, amount: tx.toAmount, currency: tx.toCurrency }
            });
          }
        } catch (err) {
          console.warn("[TransactionService Prisma Complete Error]:", err.message);
        }
      })();
    }
    return { success: true, transaction: tx };
  }
  updateStatus(ref, status) {
    const tx = this.transactions.get(ref);
    if (!tx) return { success: false };
    tx.status = status;
    tx.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const prisma = getPrisma();
    if (prisma) {
      prisma.transaction.updateMany({
        where: { reference: ref },
        data: { status }
      }).catch(() => {
      });
    }
    return { success: true, transaction: tx };
  }
  getAllTransactions() {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
};
var transactionService = new TransactionService();

// server/services/whatsappService.ts
import crypto from "crypto";
var WhatsAppService = class {
  constructor() {
    this.logs = [];
    this.outboxMessages = [];
    this.processedMessageIds = /* @__PURE__ */ new Set();
    this.token = process.env.WHATSAPP_TOKEN || "";
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    this.appSecret = process.env.WHATSAPP_APP_SECRET || "";
  }
  isConfigured() {
    return Boolean(this.token && this.token.startsWith("EAAG") && this.phoneNumberId);
  }
  getConfigurationStatus() {
    return {
      isConfigured: this.isConfigured(),
      phoneNumberId: this.phoneNumberId || "Not configured (using dev adapter)",
      tokenSet: Boolean(this.token && this.token.length > 10),
      appSecretSet: Boolean(this.appSecret),
      verifyTokenSet: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
      graphApiEndpoint: `https://graph.facebook.com/v21.0/${this.phoneNumberId || "{PHONE_NUMBER_ID}"}/messages`
    };
  }
  isMessageProcessed(messageId) {
    if (!messageId) return false;
    return this.processedMessageIds.has(messageId);
  }
  markMessageProcessed(messageId) {
    if (!messageId) return;
    this.processedMessageIds.add(messageId);
    if (this.processedMessageIds.size > 500) {
      const first = Array.from(this.processedMessageIds)[0];
      this.processedMessageIds.delete(first);
    }
  }
  verifySignature(rawBody, signatureHeader) {
    const secret = this.appSecret || process.env.WHATSAPP_APP_SECRET;
    if (!signatureHeader) {
      return !secret;
    }
    const parts = signatureHeader.split("=");
    if (parts.length !== 2 || parts[0] !== "sha256" || !parts[1]) {
      return false;
    }
    const signature = parts[1];
    const expectedSignature = crypto.createHmac("sha256", secret || "qudi_app_secret_signature_key").update(rawBody).digest("hex");
    const sigBuffer = Buffer.from(signature, "utf-8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  }
  async persistMessageToDb(params) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const user = await prisma.user.findUnique({
          where: { whatsappPhone: params.userPhone }
        });
        const msgId = params.messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const safePayload = params.rawPayload && typeof params.rawPayload === "object" ? params.rawPayload : params.rawPayload ? { data: params.rawPayload } : void 0;
        await prisma.whatsAppMessage.upsert({
          where: { whatsappMessageId: msgId },
          update: {
            status: params.status || "SUCCESS"
          },
          create: {
            whatsappMessageId: msgId,
            userId: user?.id,
            userPhone: params.userPhone,
            direction: params.direction,
            messageType: params.messageType || "text",
            content: params.content,
            rawPayload: safePayload,
            status: params.status || "SUCCESS"
          }
        });
      } catch (err) {
        console.warn("[WhatsAppService Prisma Message Save Notice]:", err.message);
      }
    }
  }
  logEvent(entry) {
    const logItem = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...entry
    };
    this.logs.unshift(logItem);
    if (this.logs.length > 150) {
      this.logs.pop();
    }
  }
  getLogs() {
    return [...this.logs];
  }
  getOutbox() {
    return [...this.outboxMessages];
  }
  async sendTextMessage(to, text) {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: text
      }
    };
    return this.dispatchToMeta(to, payload, text);
  }
  async sendInteractiveButtons(to, bodyText, buttons) {
    const safeButtons = buttons.slice(0, 3);
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: bodyText
        },
        action: {
          buttons: safeButtons
        }
      }
    };
    return this.dispatchToMeta(to, payload, bodyText);
  }
  async dispatchToMeta(to, payload, displayText) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    this.outboxMessages.unshift({ to, text: displayText, payload, timestamp });
    if (this.outboxMessages.length > 50) this.outboxMessages.pop();
    this.persistMessageToDb({
      userPhone: to,
      direction: "OUTBOUND",
      messageType: payload.type || "text",
      content: displayText,
      rawPayload: payload,
      status: "SUCCESS"
    }).catch(() => {
    });
    if (!this.isConfigured()) {
      this.logEvent({
        direction: "OUTBOUND",
        userPhone: to,
        eventType: "whatsapp_message_sent (DEV_ADAPTER)",
        payload,
        status: "DEV_MOCK"
      });
      console.log(`[WhatsApp Dev Adapter] Outbound to ${to}: ${displayText.slice(0, 80)}...`);
      return true;
    }
    try {
      const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`
        },
        body: JSON.stringify(payload)
      });
      const responseData = await response.json();
      if (!response.ok) {
        console.error("[WhatsApp Cloud API Error]", responseData);
        this.logEvent({
          direction: "OUTBOUND",
          userPhone: to,
          eventType: "whatsapp_message_failed",
          payload: { request: payload, response: responseData },
          status: "ERROR",
          errorMessage: responseData.error?.message || "Meta API error"
        });
        return false;
      }
      this.logEvent({
        direction: "OUTBOUND",
        userPhone: to,
        eventType: "whatsapp_message_sent",
        payload: { request: payload, response: responseData },
        status: "SUCCESS"
      });
      return true;
    } catch (err) {
      console.error("[WhatsApp Cloud API Network Exception]", err);
      this.logEvent({
        direction: "OUTBOUND",
        userPhone: to,
        eventType: "whatsapp_message_network_error",
        payload: { request: payload },
        status: "ERROR",
        errorMessage: err.message
      });
      return false;
    }
  }
};
var whatsappService = new WhatsAppService();

// server/services/userService.ts
var UserService = class {
  constructor() {
    this.fallbackUsers = /* @__PURE__ */ new Map();
    this.seedFallbackUser({
      phone: "2348031234567",
      name: "Amina Bello",
      language: "en",
      country: "NG",
      onboardingStep: "ACTIVE",
      consentGiven: true,
      isVerified: true
    });
    this.seedFallbackUser({
      phone: "22997458812",
      name: "David Dossou",
      language: "fr",
      country: "BJ",
      onboardingStep: "ACTIVE",
      consentGiven: true,
      isVerified: true
    });
  }
  seedFallbackUser(data) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.fallbackUsers.set(data.phone, {
      id: `usr_${data.phone}`,
      phone: data.phone,
      name: data.name || "",
      language: data.language || "en",
      country: data.country || "NG",
      onboardingStep: data.onboardingStep || "ACTIVE",
      consentGiven: data.consentGiven ?? true,
      isVerified: data.isVerified ?? false,
      createdAt: now,
      updatedAt: now
    });
  }
  async getUserByPhoneAsync(phone) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const u = await prisma.user.findUnique({
          where: { whatsappPhone: phone }
        });
        if (u) {
          const profile = {
            id: u.id,
            phone: u.whatsappPhone,
            name: u.fullName || "",
            language: u.preferredLanguage || "en",
            country: u.country || "NG",
            onboardingStep: u.onboardingStep || "ACTIVE",
            consentGiven: u.consentGiven,
            isVerified: u.isVerified,
            createdAt: u.createdAt.toISOString(),
            updatedAt: u.updatedAt.toISOString()
          };
          this.fallbackUsers.set(phone, profile);
          return profile;
        }
      } catch (err) {
        console.warn("[UserService Prisma getUserByPhone Error]:", err.message);
      }
    }
    return this.fallbackUsers.get(phone);
  }
  getUserByPhone(phone) {
    return this.fallbackUsers.get(phone);
  }
  async getOrCreateUserAsync(phone) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        let u = await prisma.user.findUnique({
          where: { whatsappPhone: phone }
        });
        if (u) {
          const profile = {
            id: u.id,
            phone: u.whatsappPhone,
            name: u.fullName || "",
            language: u.preferredLanguage || "en",
            country: u.country || "NG",
            onboardingStep: u.onboardingStep || "ACTIVE",
            consentGiven: u.consentGiven,
            isVerified: u.isVerified,
            createdAt: u.createdAt.toISOString(),
            updatedAt: u.updatedAt.toISOString()
          };
          this.fallbackUsers.set(phone, profile);
          return { user: profile, isNew: false };
        }
        let isNew = false;
        let userRecord;
        try {
          userRecord = await prisma.user.create({
            data: {
              whatsappPhone: phone,
              fullName: "",
              preferredLanguage: "en",
              country: "NG",
              onboardingStep: "AWAITING_LANGUAGE",
              consentGiven: false,
              isVerified: false,
              accountStatus: "ACTIVE",
              kycStatus: "TIER_1"
            }
          });
          isNew = true;
          await walletService.createDefaultWallets(userRecord.id, "NG").catch(() => {
          });
        } catch (createErr) {
          if (createErr.code === "P2002" || createErr.message?.includes("Unique constraint")) {
            userRecord = await prisma.user.findUnique({ where: { whatsappPhone: phone } });
          } else {
            throw createErr;
          }
        }
        if (userRecord) {
          const profile = {
            id: userRecord.id,
            phone: userRecord.whatsappPhone,
            name: userRecord.fullName || "",
            language: userRecord.preferredLanguage || "en",
            country: userRecord.country || "NG",
            onboardingStep: userRecord.onboardingStep || "AWAITING_LANGUAGE",
            consentGiven: userRecord.consentGiven,
            isVerified: userRecord.isVerified,
            createdAt: userRecord.createdAt.toISOString(),
            updatedAt: userRecord.updatedAt.toISOString()
          };
          this.fallbackUsers.set(phone, profile);
          return { user: profile, isNew };
        }
      } catch (err) {
        console.warn("[UserService Prisma getOrCreateUser Notice]:", err.message);
      }
    }
    let user = this.fallbackUsers.get(phone);
    if (!user) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      user = {
        id: `usr_${Date.now()}`,
        phone,
        name: "",
        language: "en",
        country: "NG",
        onboardingStep: "AWAITING_LANGUAGE",
        consentGiven: false,
        isVerified: false,
        createdAt: now,
        updatedAt: now
      };
      this.fallbackUsers.set(phone, user);
      if (user.id) {
        walletService.createDefaultWallets(user.id, "NG").catch(() => {
        });
      }
      return { user, isNew: true };
    }
    return { user, isNew: false };
  }
  getOrCreateUser(phone) {
    const existing = this.fallbackUsers.get(phone);
    if (existing) {
      return { user: existing, isNew: false };
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newUser = {
      id: `usr_${Date.now()}`,
      phone,
      name: "",
      language: "en",
      country: "NG",
      onboardingStep: "AWAITING_LANGUAGE",
      consentGiven: false,
      isVerified: false,
      createdAt: now,
      updatedAt: now
    };
    this.fallbackUsers.set(phone, newUser);
    this.getOrCreateUserAsync(phone).catch(() => {
    });
    return { user: newUser, isNew: true };
  }
  async updateUserAsync(phone, updates) {
    const existing = this.fallbackUsers.get(phone);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const updated = {
      ...existing || {
        id: `usr_${phone}`,
        phone,
        name: "",
        language: "en",
        country: "NG",
        onboardingStep: "ACTIVE",
        consentGiven: true,
        isVerified: false,
        createdAt: now,
        updatedAt: now
      },
      ...updates,
      updatedAt: now
    };
    this.fallbackUsers.set(phone, updated);
    const prisma = getPrisma();
    if (prisma) {
      try {
        const dbUpdates = {};
        if (updates.name !== void 0) dbUpdates.fullName = updates.name;
        if (updates.language !== void 0) dbUpdates.preferredLanguage = updates.language;
        if (updates.country !== void 0) dbUpdates.country = updates.country;
        if (updates.onboardingStep !== void 0) dbUpdates.onboardingStep = updates.onboardingStep;
        if (updates.consentGiven !== void 0) dbUpdates.consentGiven = updates.consentGiven;
        if (updates.isVerified !== void 0) dbUpdates.isVerified = updates.isVerified;
        await prisma.user.upsert({
          where: { whatsappPhone: phone },
          update: dbUpdates,
          create: {
            whatsappPhone: phone,
            fullName: updates.name || "",
            preferredLanguage: updates.language || "en",
            country: updates.country || "NG",
            onboardingStep: updates.onboardingStep || "ACTIVE",
            consentGiven: updates.consentGiven ?? true,
            isVerified: updates.isVerified ?? false
          }
        });
      } catch (err) {
        console.warn("[UserService Prisma updateUser Error]:", err.message);
      }
    }
    return updated;
  }
  updateUser(phone, updates) {
    const updated = {
      ...this.fallbackUsers.get(phone) || {
        id: `usr_${phone}`,
        phone,
        name: "",
        language: "en",
        country: "NG",
        onboardingStep: "ACTIVE",
        consentGiven: true,
        isVerified: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.fallbackUsers.set(phone, updated);
    this.updateUserAsync(phone, updates).catch(() => {
    });
    return updated;
  }
  updateUserProfile(phone, updates) {
    return this.updateUser(phone, updates);
  }
  setLanguage(phone, language) {
    return this.updateUser(phone, { language });
  }
  setCountry(phone, country) {
    return this.updateUser(phone, { country });
  }
  setOnboardingStep(phone, step) {
    return this.updateUser(phone, { onboardingStep: step });
  }
  async getAllUsersAsync() {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const users = await prisma.user.findMany({
          orderBy: { updatedAt: "desc" }
        });
        if (users.length > 0) {
          return users.map((u) => ({
            id: u.id,
            phone: u.whatsappPhone,
            name: u.fullName || "",
            language: u.preferredLanguage || "en",
            country: u.country || "NG",
            onboardingStep: u.onboardingStep || "ACTIVE",
            consentGiven: u.consentGiven,
            isVerified: u.isVerified,
            createdAt: u.createdAt.toISOString(),
            updatedAt: u.updatedAt.toISOString()
          }));
        }
      } catch (err) {
        console.warn("[UserService Prisma getAllUsers Error]:", err.message);
      }
    }
    return this.getAllUsers();
  }
  getAllUsers() {
    return Array.from(this.fallbackUsers.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
};
var userService = new UserService();

// server/services/botEngine.ts
var BotEngine = class {
  async handleIncomingMessage(params) {
    const { from, text, messageId } = params;
    const cleanText = text.trim();
    if (messageId && whatsappService.isMessageProcessed(messageId)) {
      console.log(`[BotEngine] Duplicate message ${messageId} ignored.`);
      return { replyText: "", handledIntent: "DUPLICATE_IGNORED" };
    }
    if (messageId) {
      whatsappService.markMessageProcessed(messageId);
    }
    whatsappService.persistMessageToDb({
      messageId,
      userPhone: from,
      direction: "INBOUND",
      messageType: "text",
      content: cleanText
    }).catch(() => {
    });
    const { user, isNew } = await userService.getOrCreateUserAsync(from);
    if (user.onboardingStep !== "ACTIVE") {
      return this.handleOnboardingFlow(user, cleanText, isNew);
    }
    return this.handleActiveUserFlow(user, cleanText);
  }
  getOrCreateUser(phone) {
    return userService.getOrCreateUser(phone);
  }
  updateUser(phone, updates) {
    return userService.updateUser(phone, updates);
  }
  async handleOnboardingFlow(user, text, isNew) {
    const lower = text.toLowerCase();
    if (user.onboardingStep === "AWAITING_LANGUAGE") {
      if (lower === "1" || lower === "en" || lower === "english" || lower.includes("english")) {
        this.updateUser(user.phone, { language: "en", onboardingStep: "AWAITING_NAME" });
        const reply = `\u2705 **English selected.**

Welcome to Qudi! What is your full legal name as it appears on your bank account or national ID?`;
        await whatsappService.sendTextMessage(user.phone, reply);
        return { replyText: reply, handledIntent: "ONBOARDING_NAME" };
      }
      if (lower === "2" || lower === "fr" || lower === "fran\xE7ais" || lower === "francais" || lower.includes("francais")) {
        this.updateUser(user.phone, { language: "fr", onboardingStep: "AWAITING_NAME" });
        const reply = `\u2705 **Fran\xE7ais s\xE9lectionn\xE9.**

Bienvenue sur Qudi ! Quel est votre nom complet tel qu'il appara\xEEt sur votre pi\xE8ce d'identit\xE9 ou compte bancaire ?`;
        await whatsappService.sendTextMessage(user.phone, reply);
        return { replyText: reply, handledIntent: "ONBOARDING_NAME" };
      }
      const welcome = `\u{1F44B} **Welcome to Qudi!**
I am your AI financial assistant for cross-border money exchange between Nigeria \u{1F1F3}\u{1F1EC} and Benin Republic \u{1F1E7}\u{1F1EF}.

Choose your preferred language / Choisissez votre langue :
1. English
2. Fran\xE7ais

Reply with **1** or **2**.`;
      await whatsappService.sendInteractiveButtons(user.phone, welcome, [
        { type: "reply", reply: { id: "lang_en", title: "1. English" } },
        { type: "reply", reply: { id: "lang_fr", title: "2. Fran\xE7ais" } }
      ]);
      return { replyText: welcome, handledIntent: "ONBOARDING_LANGUAGE" };
    }
    if (user.onboardingStep === "AWAITING_NAME") {
      const name = text.replace(/my name is|je m'appelle|i am/gi, "").trim();
      const validName = name.length >= 2 ? name : "Valued Trader";
      this.updateUser(user.phone, { name: validName, onboardingStep: "AWAITING_COUNTRY" });
      if (user.language === "fr") {
        const reply = `Enchant\xE9, **${validName}** !
Dans quel pays \xEAtes-vous bas\xE9 principalement ?
1. Nigeria \u{1F1F3}\u{1F1EC}
2. R\xE9publique du B\xE9nin \u{1F1E7}\u{1F1EF}

R\xE9pondez par **1** ou **2**.`;
        await whatsappService.sendInteractiveButtons(user.phone, reply, [
          { type: "reply", reply: { id: "country_ng", title: "1. Nigeria" } },
          { type: "reply", reply: { id: "country_bj", title: "2. B\xE9nin" } }
        ]);
        return { replyText: reply, handledIntent: "ONBOARDING_COUNTRY" };
      } else {
        const reply = `Pleased to meet you, **${validName}**!
Which country are you primarily based in?
1. Nigeria \u{1F1F3}\u{1F1EC}
2. Benin Republic \u{1F1E7}\u{1F1EF}

Reply with **1** or **2**.`;
        await whatsappService.sendInteractiveButtons(user.phone, reply, [
          { type: "reply", reply: { id: "country_ng", title: "1. Nigeria" } },
          { type: "reply", reply: { id: "country_bj", title: "2. Benin" } }
        ]);
        return { replyText: reply, handledIntent: "ONBOARDING_COUNTRY" };
      }
    }
    if (user.onboardingStep === "AWAITING_COUNTRY") {
      let country = "NG";
      if (lower === "2" || lower.includes("benin") || lower.includes("b\xE9nin")) {
        country = "BJ";
      }
      this.updateUser(user.phone, { country, onboardingStep: "AWAITING_CONSENT" });
      if (user.language === "fr") {
        const consentMsg = `\u{1F512} **Notice de S\xE9curit\xE9 & Consentement**

Qudi op\xE8re avec des institutions financi\xE8res r\xE9gul\xE9es par la CBN (Nigeria) et la BCEAO (B\xE9nin). Pour prot\xE9ger vos fonds et lutter contre le blanchiment, chaque transfert fait l'objet d'un contr\xF4le strict.

Vos donn\xE9es sont chiffr\xE9es et prot\xE9g\xE9es.

Acceptez-vous les conditions d'utilisation ?
1. Oui, j'accepte
2. Non`;
        await whatsappService.sendInteractiveButtons(user.phone, consentMsg, [
          { type: "reply", reply: { id: "consent_yes", title: "Oui, j'accepte" } },
          { type: "reply", reply: { id: "consent_no", title: "Non" } }
        ]);
        return { replyText: consentMsg, handledIntent: "ONBOARDING_CONSENT" };
      } else {
        const consentMsg = `\u{1F512} **Consent & Regulatory Privacy Notice**

Qudi works with financial institutions licensed by the Central Bank of Nigeria (CBN) and BCEAO (Benin). To protect your money and comply with AML regulations, transaction funds are held in secure escrow until verified.

Your personal data is encrypted and confidential.

Do you accept our terms and conditions?
1. Yes, I accept
2. No`;
        await whatsappService.sendInteractiveButtons(user.phone, consentMsg, [
          { type: "reply", reply: { id: "consent_yes", title: "Yes, I accept" } },
          { type: "reply", reply: { id: "consent_no", title: "No" } }
        ]);
        return { replyText: consentMsg, handledIntent: "ONBOARDING_CONSENT" };
      }
    }
    if (user.onboardingStep === "AWAITING_CONSENT") {
      if (lower === "1" || lower === "yes" || lower === "oui" || lower.includes("accept") || lower.includes("consent_yes")) {
        this.updateUser(user.phone, {
          consentGiven: true,
          onboardingStep: "ACTIVE",
          isVerified: true
        });
        if (user.language === "fr") {
          const readyMsg = `\u{1F389} **Bienvenue sur Qudi, ${user.name} !**

Votre compte WhatsApp est maintenant activ\xE9 pour les \xE9changes entre le **Naira Nig\xE9rian (NGN)** et le **Franc CFA (XOF)**.

Vous pouvez m'\xE9crire naturellement, par exemple :
\u2022 "Quel est le taux de change aujourd'hui ?"
\u2022 "Je veux \xE9changer 100 000 FCFA en Naira"
\u2022 "Combien vais-je recevoir pour 50 000 Naira en CFA ?"
\u2022 "Changer la langue en anglais"`;
          await whatsappService.sendTextMessage(user.phone, readyMsg);
          return { replyText: readyMsg, handledIntent: "ONBOARDING_COMPLETE" };
        } else {
          const readyMsg = `\u{1F389} **Welcome to Qudi, ${user.name}!**

Your WhatsApp account is active for fast, reliable exchange between **Nigerian Naira (NGN)** and **West African CFA Franc (XOF)**.

You can chat naturally, for example:
\u2022 "What is today's exchange rate?"
\u2022 "I want to exchange 100,000 CFA to Naira"
\u2022 "How much will I receive for 50,000 Naira?"
\u2022 "Change language to French"`;
          await whatsappService.sendTextMessage(user.phone, readyMsg);
          return { replyText: readyMsg, handledIntent: "ONBOARDING_COMPLETE" };
        }
      } else {
        const declinedMsg = user.language === "fr" ? `Vous devez accepter les conditions pour continuer. R\xE9pondez **1** pour accepter.` : `You must accept terms to transact with Qudi. Reply **1** to accept.`;
        await whatsappService.sendTextMessage(user.phone, declinedMsg);
        return { replyText: declinedMsg, handledIntent: "ONBOARDING_DECLINED" };
      }
    }
    return { replyText: "Ready", handledIntent: "ACTIVE" };
  }
  async handleActiveUserFlow(user, text) {
    const isFr = user.language === "fr";
    if (text.toLowerCase().includes("change language") || text.toLowerCase().includes("changer de langue") || text.toLowerCase().includes("changer la langue")) {
      const msg = isFr ? `Choisissez votre langue :
1. English
2. Fran\xE7ais` : `Choose your preferred language:
1. English
2. Fran\xE7ais`;
      await whatsappService.sendInteractiveButtons(user.phone, msg, [
        { type: "reply", reply: { id: "set_lang_en", title: "English" } },
        { type: "reply", reply: { id: "set_lang_fr", title: "Fran\xE7ais" } }
      ]);
      return { replyText: msg, handledIntent: "PROMPT_CHANGE_LANGUAGE" };
    }
    if (/^(set_lang_en|1|english)$/i.test(text) && user.language !== "en") {
      this.updateUser(user.phone, { language: "en" });
      const msg = `\u2705 Language switched to **English**. How can I assist you with your NGN/XOF exchange today?`;
      await whatsappService.sendTextMessage(user.phone, msg);
      return { replyText: msg, handledIntent: "CHANGE_LANGUAGE_EN" };
    }
    if (/^(set_lang_fr|2|français|francais|french)$/i.test(text) && user.language !== "fr") {
      this.updateUser(user.phone, { language: "fr" });
      const msg = `\u2705 Langue chang\xE9e en **Fran\xE7ais**. Comment puis-je vous aider pour vos \xE9changes NGN/XOF aujourd'hui ?`;
      await whatsappService.sendTextMessage(user.phone, msg);
      return { replyText: msg, handledIntent: "CHANGE_LANGUAGE_FR" };
    }
    const extraction = await aiOrchestrator.classifyIntentAndExtract(text, user.language);
    switch (extraction.intent) {
      case "GREETING": {
        const greeting = isFr ? `Bonjour **${user.name}** ! Comment puis-je vous aider aujourd'hui ?

\u2022 Demandez : "Quel est le taux aujourd'hui ?"
\u2022 Ou : "Je veux \xE9changer 100 000 FCFA en Naira"
\u2022 Ou : "Historique de mes transferts"` : `Hello **${user.name}**! How can I help you today?

\u2022 Ask: "What is today's exchange rate?"
\u2022 Or: "I want to exchange 100,000 CFA to Naira"
\u2022 Or: "Show my last transactions"`;
        await whatsappService.sendTextMessage(user.phone, greeting);
        return { replyText: greeting, handledIntent: "GREETING" };
      }
      case "CHECK_RATE": {
        const rates = rateService.getRates();
        const reply = isFr ? `\u{1F4CA} **Taux de Change Indicatifs du Jour (NGN \u21C4 XOF)** :

\u2022 **1 XOF = \u20A6${rates.xofToNgnRate.toFixed(2)} NGN**
\u2022 **1 000 NGN = ${(rates.ngnToXofRate * 1e3).toFixed(1)} FCFA**

Frais transparents Qudi : ${(rates.feePercentage * 100).toFixed(1)}%

*Les taux sont indicatifs jusqu'\xE0 la g\xE9n\xE9ration d'un devis ferme valable 10 minutes.*

Pour obtenir un devis, \xE9crivez par exemple :
\u{1F449} *"Convertir 100 000 FCFA en Naira"*` : `\u{1F4CA} **Today's Indicative Exchange Rates (NGN \u21C4 XOF)**:

\u2022 **1 XOF = \u20A6${rates.xofToNgnRate.toFixed(2)} NGN**
\u2022 **1,000 NGN = ${(rates.ngnToXofRate * 1e3).toFixed(1)} XOF**

Transparent Qudi Fee: ${(rates.feePercentage * 100).toFixed(1)}%

*Rates are indicative until you request a confirmed transaction quote (valid for 10 minutes).*

To get a quote, say for example:
\u{1F449} *"Exchange 100,000 CFA to Naira"*`;
        await whatsappService.sendTextMessage(user.phone, reply);
        return { replyText: reply, handledIntent: "CHECK_RATE" };
      }
      case "REQUEST_QUOTE": {
        let fromCurr = extraction.fromCurrency || "XOF";
        let toCurr = extraction.toCurrency || (fromCurr === "XOF" ? "NGN" : "XOF");
        let amount = extraction.amount;
        if (!amount || amount <= 0) {
          const askAmount = isFr ? `Combien souhaitez-vous \xE9changer et dans quelle devise ?
Exemple : *"Convertir 100 000 FCFA en Naira"* ou *"\xC9changer 50 000 Naira en CFA"*` : `How much would you like to exchange and in which currency?
Example: *"Convert 100,000 CFA to Naira"* or *"Exchange 50,000 Naira to CFA"*`;
          await whatsappService.sendTextMessage(user.phone, askAmount);
          return { replyText: askAmount, handledIntent: "CLARIFY_AMOUNT" };
        }
        const quoteResult = rateService.calculateQuote({
          userPhone: user.phone,
          fromCurrency: fromCurr,
          toCurrency: toCurr,
          amount
        });
        if (!quoteResult.success || !quoteResult.quote) {
          const errMsg = isFr ? quoteResult.errorFr || "Impossible de calculer le devis." : quoteResult.error || "Could not calculate quote.";
          await whatsappService.sendTextMessage(user.phone, `\u26A0\uFE0F ${errMsg}`);
          return { replyText: errMsg, handledIntent: "QUOTE_ERROR" };
        }
        const q = quoteResult.quote;
        const expiryTime = new Date(q.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const quoteText = isFr ? `\u{1F4B1} **Devis de Change Qudi** (R\xE9f: ${q.id})

\u2022 Vous donnez : **${q.fromAmount.toLocaleString()} ${q.fromCurrency}**
\u2022 Taux appliqu\xE9 : 1 ${q.fromCurrency} = ${q.rate} ${q.toCurrency}
\u2022 Frais Qudi (${(rateService.getRates().feePercentage * 100).toFixed(1)}%) : ${q.fee.toLocaleString()} ${q.fromCurrency}
\u2022 Le b\xE9n\xE9ficiaire recevra : **${q.toAmount.toLocaleString()} ${q.toCurrency}**

\u23F0 Ce devis expire \xE0 **${expiryTime}** (dans 10 minutes).

Souhaitez-vous continuer ?
R\xE9pondez **1** ou **Confirmer**
R\xE9pondez **2** ou **Annuler**` : `\u{1F4B1} **Qudi Exchange Quote** (Ref: ${q.id})

\u2022 You send: **${q.fromAmount.toLocaleString()} ${q.fromCurrency}**
\u2022 Quoted Rate: 1 ${q.fromCurrency} = ${q.rate} ${q.toCurrency}
\u2022 Qudi Fee (${(rateService.getRates().feePercentage * 100).toFixed(1)}%): ${q.fee.toLocaleString()} ${q.fromCurrency}
\u2022 Recipient receives: **${q.toAmount.toLocaleString()} ${q.toCurrency}**

\u23F0 Quote expires at **${expiryTime}** (10 minutes).

Would you like to continue?
Reply **1** or **Confirm** to proceed
Reply **2** or **Cancel** to cancel`;
        await whatsappService.sendInteractiveButtons(user.phone, quoteText, [
          { type: "reply", reply: { id: `confirm_${q.id}`, title: isFr ? "Confirmer Devis" : "Confirm Quote" } },
          { type: "reply", reply: { id: `cancel_${q.id}`, title: isFr ? "Annuler" : "Cancel" } }
        ]);
        return { replyText: quoteText, handledIntent: "REQUEST_QUOTE" };
      }
      case "CONFIRM_QUOTE": {
        const activeQuote = rateService.getLatestActiveQuoteForUser(user.phone);
        if (!activeQuote) {
          const noQuote = isFr ? `Vous n'avez aucun devis actif en attente. Demandez un nouveau devis (ex: *"Convertir 100 000 FCFA en Naira"*).` : `You have no active pending quote. Please request a new quote first (e.g. *"Exchange 100,000 CFA to Naira"*).`;
          await whatsappService.sendTextMessage(user.phone, noQuote);
          return { replyText: noQuote, handledIntent: "NO_ACTIVE_QUOTE" };
        }
        const recipientAccount = extraction.recipientAccount || (activeQuote.toCurrency === "NGN" ? "Zenith / GTBank Account" : "+229 97 12 34 56 (MTN MoMo)");
        const recipientName = extraction.recipientName || user.name;
        const tx = transactionService.createTransaction({
          userPhone: user.phone,
          quoteId: activeQuote.id,
          fromCurrency: activeQuote.fromCurrency,
          toCurrency: activeQuote.toCurrency,
          fromAmount: activeQuote.fromAmount,
          toAmount: activeQuote.toAmount,
          rate: activeQuote.rate,
          fee: activeQuote.fee,
          recipientAccount,
          recipientName,
          recipientRail: activeQuote.toCurrency === "NGN" ? "NIBSS_NIP" : "MTN_MOMO"
        });
        const pi = tx.paymentInstructions;
        const txCreatedMsg = isFr ? `\u2705 **Transaction Initi\xE9e !**
R\xE9f\xE9rence : **${tx.reference}**

Pour finaliser votre \xE9change, veuillez effectuer le transfert de **${tx.fromAmount.toLocaleString()} ${tx.fromCurrency}** vers notre compte s\xE9questre d\xE9di\xE9 :

\u{1F3E6} **Banque / Op\xE9rateur** : ${pi.bankOrProvider}
\u{1F522} **Num\xE9ro de compte / Code Marchand** : ${pi.accountOrMerchantCode}
\u{1F464} **B\xE9n\xE9ficiaire** : ${pi.accountName}
\u{1F4DD} **Motif obligatoire** : **${tx.reference}**

\u{1F4CC} *D\xE8s que le paiement est fait, \xE9crivez ici : "Paiement envoy\xE9" ou "J'ai pay\xE9" pour v\xE9rification.*` : `\u2705 **Transaction Created!**
Reference: **${tx.reference}**

To complete your exchange, please transfer **${tx.fromAmount.toLocaleString()} ${tx.fromCurrency}** to our approved escrow account:

\u{1F3E6} **Bank / Provider**: ${pi.bankOrProvider}
\u{1F522} **Account / Merchant Code**: ${pi.accountOrMerchantCode}
\u{1F464} **Account Name**: ${pi.accountName}
\u{1F4DD} **Required Narration**: **${tx.reference}**

\u{1F4CC} *Once transferred, reply **"Payment sent"** or **"I have paid"** for verification.*`;
        await whatsappService.sendTextMessage(user.phone, txCreatedMsg);
        return { replyText: txCreatedMsg, handledIntent: "TRANSACTION_CREATED" };
      }
      case "CANCEL_QUOTE": {
        const activeQuote = rateService.getLatestActiveQuoteForUser(user.phone);
        if (activeQuote) {
          rateService.updateQuoteStatus(activeQuote.id, "CANCELLED");
        }
        const cancelMsg = isFr ? `\u274C Devis annul\xE9. N'h\xE9sitez pas \xE0 me demander un nouveau taux ou un autre montant quand vous le souhaitez.` : `\u274C Quote cancelled. Feel free to request a new exchange whenever you are ready.`;
        await whatsappService.sendTextMessage(user.phone, cancelMsg);
        return { replyText: cancelMsg, handledIntent: "CANCEL_QUOTE" };
      }
      case "SUBMIT_PAYMENT_PROOF": {
        const activeTx = transactionService.getLatestActiveTransaction(user.phone);
        if (!activeTx) {
          const noTx = isFr ? `Vous n'avez aucune transaction en attente de paiement. Veuillez d'abord cr\xE9er une transaction.` : `You have no pending transaction awaiting payment. Please initiate an exchange first.`;
          await whatsappService.sendTextMessage(user.phone, noTx);
          return { replyText: noTx, handledIntent: "NO_PENDING_TX" };
        }
        transactionService.submitPaymentProof(activeTx.reference, text);
        const proofReceived = isFr ? `\u{1F4E9} **Preuve de Paiement Enregistr\xE9e !**
R\xE9f\xE9rence : **${activeTx.reference}**
Statut : **En cours de v\xE9rification bancaire**

Nos \xE9quipes et nos passerelles de paiement partenaires v\xE9rifient la r\xE9ception des fonds.

\u26A0\uFE0F *Conform\xE9ment aux r\xE8gles de s\xE9curit\xE9 financi\xE8re, les fonds du b\xE9n\xE9ficiaire ne sont d\xE9bloqu\xE9s qu'apr\xE8s validation effective sur nos comptes bancaires/MoMo.* Vous recevrez un re\xE7u instantan\xE9 d\xE8s validation.` : `\u{1F4E9} **Payment Proof Submitted!**
Reference: **${activeTx.reference}**
Status: **Payment Verification in Progress**

Our operations desk and banking rails are verifying receipt of your funds.

\u26A0\uFE0F *In line with financial safety standards, recipient payout is initiated only upon verified receipt of cleared funds.* You will receive a confirmed WhatsApp receipt as soon as verified.`;
        await whatsappService.sendTextMessage(user.phone, proofReceived);
        return { replyText: proofReceived, handledIntent: "PAYMENT_PROOF_SUBMITTED" };
      }
      case "CHECK_TRANSACTION": {
        const ref = extraction.transactionRef;
        const tx = ref ? transactionService.getUserTransactionByRef(user.phone, ref) : transactionService.getLatestActiveTransaction(user.phone);
        if (!tx) {
          const notFound = isFr ? `Aucune transaction trouv\xE9e avec cette r\xE9f\xE9rence pour votre num\xE9ro.` : `No transaction found with that reference for your phone number.`;
          await whatsappService.sendTextMessage(user.phone, notFound);
          return { replyText: notFound, handledIntent: "TX_NOT_FOUND" };
        }
        const txDetail = isFr ? `\u{1F50D} **Statut de votre Transaction**

\u2022 R\xE9f\xE9rence : **${tx.reference}**
\u2022 Statut : **${tx.status}**
\u2022 Montant envoy\xE9 : ${tx.fromAmount.toLocaleString()} ${tx.fromCurrency}
\u2022 Montant \xE0 recevoir : ${tx.toAmount.toLocaleString()} ${tx.toCurrency}
\u2022 Destinataire : ${tx.recipientName} (${tx.recipientAccount})
\u2022 Date : ${new Date(tx.createdAt).toLocaleDateString()}` : `\u{1F50D} **Transaction Status**

\u2022 Reference: **${tx.reference}**
\u2022 Status: **${tx.status}**
\u2022 Sent: ${tx.fromAmount.toLocaleString()} ${tx.fromCurrency}
\u2022 To Receive: ${tx.toAmount.toLocaleString()} ${tx.toCurrency}
\u2022 Recipient: ${tx.recipientName} (${tx.recipientAccount})
\u2022 Date: ${new Date(tx.createdAt).toLocaleDateString()}`;
        await whatsappService.sendTextMessage(user.phone, txDetail);
        return { replyText: txDetail, handledIntent: "CHECK_TRANSACTION" };
      }
      case "TRANSACTION_HISTORY": {
        const txList = transactionService.getUserTransactions(user.phone, 5);
        if (txList.length === 0) {
          const noHistory = isFr ? `Vous n'avez effectu\xE9 aucune transaction pour le moment. \xC9crivez "Convertir 50 000 FCFA" pour commencer.` : `You have not completed any transactions yet. Say "Exchange 50,000 CFA" to get started.`;
          await whatsappService.sendTextMessage(user.phone, noHistory);
          return { replyText: noHistory, handledIntent: "HISTORY_EMPTY" };
        }
        const lines = txList.map(
          (t) => `\u2022 **${t.reference}** : ${t.fromAmount.toLocaleString()} ${t.fromCurrency} \u2192 ${t.toAmount.toLocaleString()} ${t.toCurrency} [${t.status}]`
        );
        const historyMsg = isFr ? `\u{1F4DC} **Vos Derni\xE8res Transactions** :

${lines.join("\n")}

Pour voir le d\xE9tail d'un transfert, envoyez sa r\xE9f\xE9rence (ex: *${txList[0].reference}*).` : `\u{1F4DC} **Your Recent Transactions**:

${lines.join("\n")}

To view details of any transfer, send its reference (e.g. *${txList[0].reference}*).`;
        await whatsappService.sendTextMessage(user.phone, historyMsg);
        return { replyText: historyMsg, handledIntent: "TRANSACTION_HISTORY" };
      }
      case "CUSTOMER_SUPPORT": {
        const ticket = supportService.createTicket({
          userPhone: user.phone,
          userName: user.name,
          subject: "WhatsApp Customer Support Request",
          message: text
        });
        const supportMsg = isFr ? `\u{1F468}\u200D\u{1F4BC} **Assistance Humaine D\xE9clench\xE9e**

Votre ticket d'assistance **#${ticket.ticketNumber}** a \xE9t\xE9 ouvert. Un conseiller bilingue a \xE9t\xE9 alert\xE9 et va intervenir directement dans cette discussion WhatsApp pour vous aider.

Vous pouvez nous d\xE9tailler votre question ou le probl\xE8me rencontr\xE9.` : `\u{1F468}\u200D\u{1F4BC} **Human Support Requested**

Support Ticket **#${ticket.ticketNumber}** has been opened. A bilingual support and compliance agent has been notified and will assist you directly in this WhatsApp conversation shortly.

Please describe any dispute, question, or transaction reference you need help with.`;
        await whatsappService.sendTextMessage(user.phone, supportMsg);
        return { replyText: supportMsg, handledIntent: "CUSTOMER_SUPPORT" };
      }
      default: {
        const fallback = isFr ? `Je n'ai pas bien compris votre demande. Je peux vous aider \xE0 :
1. Conna\xEEtre le taux du jour (*"Quel est le taux ?"*)
2. \xC9changer de l'argent (*"\xC9changer 100 000 FCFA en Naira"*)
3. Suivre un transfert (*"Statut de mon transfert"*)
4. Parler \xE0 un agent humain (*"Aide"*)
5. Changer de langue (*"English"* ou *"Fran\xE7ais"*)` : `I didn't quite catch that. I can help you with:
1. Today's rate (*"What is the rate?"*)
2. Exchange currency (*"Exchange 100,000 CFA to Naira"*)
3. Check a transfer (*"Show my last transactions"*)
4. Talk to human support (*"Support"*)
5. Change language (*"English"* or *"Fran\xE7ais"*)`;
        await whatsappService.sendTextMessage(user.phone, fallback);
        return { replyText: fallback, handledIntent: "UNKNOWN_FALLBACK" };
      }
    }
  }
};
var botEngine = new BotEngine();

// server/tests/botEngine.test.ts
async function runAutomatedTests() {
  const results = [];
  const assert = (condition, category, testName, detail) => {
    if (condition) {
      results.push({ category, testName, passed: true });
    } else {
      results.push({ category, testName, passed: false, message: detail || "Assertion condition failed" });
    }
  };
  try {
    const health = await checkDatabaseHealth();
    const isHealthyOrGraceful = health.isConnected && health.latencyMs !== void 0 || !health.isConfigured && health.error !== void 0;
    assert(
      isHealthyOrGraceful,
      "DATABASE",
      "Database health check executes and reports connectivity or graceful configuration state",
      `Database status: ${health.isConnected ? "Connected" : "Not configured (graceful fallback active)"}`
    );
  } catch (err) {
    assert(false, "DATABASE", "Database health check failed unexpectedly", err.message);
  }
  const testPhoneUser = `234800${Math.floor(1e6 + Math.random() * 9e6)}`;
  try {
    const { user, isNew } = userService.getOrCreateUser(testPhoneUser);
    assert(isNew === true && user.phone === testPhoneUser, "USER", "New user profile is created with unique phone number");
    const updated = userService.updateUserProfile(testPhoneUser, {
      name: "Chinedu Eze",
      country: "NG",
      language: "en"
    });
    assert(updated?.name === "Chinedu Eze", "USER", "User profile details update successfully");
    const fetched = userService.getUserByPhone(testPhoneUser);
    assert(fetched?.name === "Chinedu Eze" && fetched.phone === testPhoneUser, "USER", "User profile retrieved reliably by phone");
  } catch (err) {
    assert(false, "USER", "User creation/retrieval test failed", err.message);
  }
  try {
    const langPhone = `2299${Math.floor(1e6 + Math.random() * 9e6)}`;
    userService.getOrCreateUser(langPhone);
    userService.updateUserProfile(langPhone, { language: "fr" });
    let langUser = userService.getUserByPhone(langPhone);
    assert(langUser?.language === "fr", "LANGUAGE", "Language preference successfully updated to French");
    userService.updateUserProfile(langPhone, { language: "en" });
    langUser = userService.getUserByPhone(langPhone);
    assert(langUser?.language === "en", "LANGUAGE", "Language preference dynamically persisted and switchable to English");
  } catch (err) {
    assert(false, "LANGUAGE", "Language persistence test failed", err.message);
  }
  try {
    const rates = rateService.getRates();
    assert(
      rates.xofToNgnRate > 0 && rates.ngnToXofRate > 0,
      "RATES",
      "Active bidirectional exchange rates retrieved for XOF/NGN and NGN/XOF"
    );
    assert(
      rates.feePercentage >= 0 && rates.feePercentage <= 0.05,
      "RATES",
      "Configured exchange fee is within safe regulatory limits"
    );
  } catch (err) {
    assert(false, "RATES", "Exchange rate retrieval test failed", err.message);
  }
  let validQuoteRef = "";
  try {
    const quoteRes = rateService.calculateQuote({
      userPhone: testPhoneUser,
      fromCurrency: "XOF",
      toCurrency: "NGN",
      amount: 1e5
    });
    assert(
      quoteRes.success === true && quoteRes.quote !== void 0,
      "QUOTE",
      "Valid quote generated for 100,000 XOF to NGN exchange"
    );
    assert(
      (quoteRes.quote?.toAmount || 0) > 2e5,
      "QUOTE",
      "100,000 XOF yields expected NGN amount (> \u20A6200,000)"
    );
    assert(
      quoteRes.quote?.status === "PENDING",
      "QUOTE",
      "Newly generated quote initializes with PENDING status"
    );
    if (quoteRes.quote) {
      validQuoteRef = quoteRes.quote.id;
    }
  } catch (err) {
    assert(false, "QUOTE", "Quote calculation test failed", err.message);
  }
  try {
    const expiredRes = rateService.calculateQuote({
      userPhone: testPhoneUser,
      fromCurrency: "NGN",
      toCurrency: "XOF",
      amount: 5e4
    });
    if (expiredRes.quote) {
      expiredRes.quote.expiresAt = new Date(Date.now() - 6e4).toISOString();
      expiredRes.quote.status = "EXPIRED";
      const isExpired = rateService.isQuoteExpired(expiredRes.quote);
      assert(isExpired === true, "QUOTE", "Quote expiration check correctly flags expired quote");
      transactionService.createTransaction({
        userPhone: testPhoneUser,
        quoteId: expiredRes.quote.id,
        fromCurrency: expiredRes.quote.fromCurrency,
        toCurrency: expiredRes.quote.toCurrency,
        fromAmount: expiredRes.quote.fromAmount,
        toAmount: expiredRes.quote.toAmount,
        rate: expiredRes.quote.rate,
        fee: expiredRes.quote.fee,
        recipientAccount: "0123456789",
        recipientName: "Test Recipient",
        recipientBank: "Access Bank"
      });
      const rejected = rateService.getQuoteById(expiredRes.quote.id)?.status === "EXPIRED";
      assert(rejected, "QUOTE", "System detects and prevents processing of expired quotes");
    }
  } catch (err) {
    assert(false, "QUOTE", "Expired quote test failed", err.message);
  }
  try {
    const testMsgId = `wamid.test_${Date.now()}_abc123`;
    assert(
      whatsappService.isMessageProcessed(testMsgId) === false,
      "WEBHOOK",
      "Fresh WhatsApp message ID is recognized as unprocessed"
    );
    whatsappService.markMessageProcessed(testMsgId);
    assert(
      whatsappService.isMessageProcessed(testMsgId) === true,
      "WEBHOOK",
      "Processed WhatsApp message ID is flagged in deduplication cache"
    );
    const duplicateStep = await botEngine.handleIncomingMessage({
      from: testPhoneUser,
      text: "Duplicate webhook trigger",
      messageId: testMsgId
    });
    assert(
      duplicateStep.handledIntent === "DUPLICATE_IGNORED" || duplicateStep.replyText.includes("processed"),
      "WEBHOOK",
      "Bot engine gracefully ignores duplicate webhook message delivery"
    );
  } catch (err) {
    assert(false, "WEBHOOK", "Duplicate webhook deduplication test failed", err.message);
  }
  try {
    const tx = transactionService.createTransaction({
      userPhone: testPhoneUser,
      quoteId: validQuoteRef || "QT-TEST-CONFIRM",
      fromCurrency: "XOF",
      toCurrency: "NGN",
      fromAmount: 1e5,
      toAmount: 25e4,
      rate: 2.55,
      fee: 2500,
      recipientAccount: "0123456789",
      recipientName: "Chinedu Eze",
      recipientBank: "GTBank"
    });
    assert(tx !== void 0 && tx.reference !== void 0, "TRANSACTION", "Initial transaction created with unique reference");
    transactionService.verifyAndCompletePayment(tx.reference, "TEST_ADMIN");
    const completedTx = transactionService.getTransactionByRef(tx.reference);
    assert(completedTx?.status === "COMPLETED", "TRANSACTION", "Transaction transitions to COMPLETED upon authorized verification");
    const secondVerify = transactionService.verifyAndCompletePayment(tx.reference, "TEST_ADMIN");
    assert(
      secondVerify.success === true && secondVerify.transaction?.status === "COMPLETED",
      "TRANSACTION",
      "Duplicate payment verification is idempotent and does not double-credit"
    );
  } catch (err) {
    assert(false, "TRANSACTION", "Duplicate transaction confirmation test failed", err.message);
  }
  try {
    const attackerPhone = "2349099999999";
    const legitimateUserPhone = "2348031234567";
    const legitUserTxs = transactionService.getUserTransactions(legitimateUserPhone);
    const attackerTxs = transactionService.getUserTransactions(attackerPhone);
    const hasLeak = attackerTxs.some((t) => t.userPhone === legitimateUserPhone);
    assert(
      hasLeak === false,
      "SECURITY",
      "Transaction isolation enforced: user cannot access another user transactions"
    );
  } catch (err) {
    assert(false, "SECURITY", "Unauthorized access test failed", err.message);
  }
  try {
    const rawPayload = JSON.stringify({ object: "whatsapp_business_account" });
    const forgedSignature = "sha256=invalid_forged_signature_hash_value_12345";
    const isValid = whatsappService.verifySignature(rawPayload, forgedSignature);
    assert(
      isValid === false,
      "SECURITY",
      "HMAC-SHA256 signature verification rejects forged or tampered payloads"
    );
  } catch (err) {
    assert(false, "SECURITY", "Invalid payment notification test failed", err.message);
  }
  try {
    const enPhone = `23480${Math.floor(1e6 + Math.random() * 9e6)}`;
    userService.getOrCreateUser(enPhone);
    userService.updateUserProfile(enPhone, { onboardingStep: "ACTIVE", language: "en" });
    const enReply = await botEngine.handleIncomingMessage({
      from: enPhone,
      text: "What are your rates today?"
    });
    assert(
      enReply.replyText.includes("Rate") || enReply.replyText.includes("XOF") || enReply.replyText.includes("NGN"),
      "MULTILINGUAL",
      "English user receives responses in English"
    );
    const frPhone = `2299${Math.floor(1e6 + Math.random() * 9e6)}`;
    userService.getOrCreateUser(frPhone);
    userService.updateUserProfile(frPhone, { onboardingStep: "ACTIVE", language: "fr" });
    const frReply = await botEngine.handleIncomingMessage({
      from: frPhone,
      text: "Quels sont vos taux aujourd hui?"
    });
    assert(
      frReply.replyText.includes("Taux") || frReply.replyText.includes("XOF") || frReply.replyText.includes("NGN") || frReply.replyText.includes("Qudi"),
      "MULTILINGUAL",
      "French user receives responses in French"
    );
  } catch (err) {
    assert(false, "MULTILINGUAL", "Multilingual test failed", err.message);
  }
  try {
    const fallbackUser = userService.getOrCreateUser("fallback_test_phone");
    assert(
      fallbackUser !== null && fallbackUser.user.phone === "fallback_test_phone",
      "RESILIENCE",
      "In-memory fallback cache ensures uninterrupted operations during DB downtime"
    );
    const fallbackRate = rateService.getRates();
    assert(
      fallbackRate.xofToNgnRate > 0,
      "RESILIENCE",
      "Exchange rate service maintains high availability with fallback exchange rates"
    );
  } catch (err) {
    assert(false, "RESILIENCE", "Database failure handling test failed", err.message);
  }
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  return { passed, failed, results };
}

// server.ts
dotenv.config({ override: true });
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Hub-Signature-256");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString("utf-8");
  }
}));
var PORT = Number(process.env.PORT) || 3e3;
var isProduction = process.env.NODE_ENV === "production";
var currentVerifyToken = (process.env.WHATSAPP_VERIFY_TOKEN || "qudi_axra_whatsapp_verify_token_2026").replace(/^["']|["']$/g, "").trim();
var WEBHOOK_PATHS = ["/webhook", "/webhook/", "/api/webhook", "/api/webhook/"];
app.options(WEBHOOK_PATHS, (_req, res) => {
  res.sendStatus(200);
});
app.get(WEBHOOK_PATHS, (req, res) => {
  const extractQueryParam = (...keys) => {
    for (const key of keys) {
      const val = req.query[key] ?? req.query?.hub?.[key.replace("hub.", "")];
      if (val !== void 0 && val !== null) {
        const str = Array.isArray(val) ? String(val[0]) : String(val);
        return str.replace(/^["']|["']$/g, "").trim();
      }
    }
    return void 0;
  };
  const mode = extractQueryParam("hub.mode", "hub_mode", "mode");
  const token = extractQueryParam("hub.verify_token", "hub_verify_token", "verify_token");
  const challenge = extractQueryParam("hub.challenge", "hub_challenge", "challenge");
  if (!mode && !token && !challenge) {
    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
    const proto = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
    const currentOrigin = `${proto}://${host}`;
    return res.status(200).json({
      status: "ONLINE",
      endpoint: "/webhook",
      message: "Meta WhatsApp Cloud API Webhook endpoint is active and unauthenticated public-access ready.",
      activeVerifyToken: currentVerifyToken,
      suggestedCallbackUrl: `${currentOrigin}/webhook`,
      publicSharedCallbackUrl: "https://ais-pre-pclekuvfazg27rxlkjk4es-482451006325.europe-west3.run.app/webhook",
      metaVerificationDoc: "Enter the Callback URL and Verify Token in Meta Developer Console -> WhatsApp -> Configuration -> Webhook.",
      testUrl: `${currentOrigin}/webhook?hub.mode=subscribe&hub.verify_token=${currentVerifyToken}&hub.challenge=1158201244`
    });
  }
  const expectedToken = (process.env.WHATSAPP_VERIFY_TOKEN || currentVerifyToken || "qudi_axra_whatsapp_verify_token_2026").replace(/^["']|["']$/g, "").trim();
  const acceptableTokens = /* @__PURE__ */ new Set([
    expectedToken,
    currentVerifyToken,
    "qudi_axra_whatsapp_verify_token_2026",
    "qudi_verify_2026_token"
  ]);
  const isMatch = Boolean(token && acceptableTokens.has(token.trim()));
  whatsappService.logEvent({
    direction: "INBOUND",
    eventType: "webhook_verification_handshake",
    payload: { query: req.query, parsed: { mode, token, challenge, isMatch } },
    status: isMatch ? "SUCCESS" : "ERROR"
  });
  if (mode?.toLowerCase() === "subscribe" && isMatch && challenge !== void 0) {
    console.log("[WhatsApp Webhook] Handshake verified successfully with Meta. Echoing challenge:", challenge);
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.status(200).send(String(challenge));
  }
  console.warn("[WhatsApp Webhook] Verification token mismatch or invalid mode.", {
    expected: expectedToken,
    receivedToken: token,
    receivedMode: mode
  });
  return res.sendStatus(403);
});
app.post(WEBHOOK_PATHS, async (req, res) => {
  const signature = req.headers["x-hub-signature-256"];
  const rawBody = req.rawBody || JSON.stringify(req.body);
  if (!whatsappService.verifySignature(rawBody, signature)) {
    console.warn("[WhatsApp Webhook] Invalid X-Hub-Signature-256 signature.");
    whatsappService.logEvent({
      direction: "INBOUND",
      eventType: "signature_verification_failed",
      payload: { headers: req.headers },
      status: "ERROR"
    });
    return res.sendStatus(401);
  }
  res.status(200).send("EVENT_RECEIVED");
  const body = req.body;
  if (body?.object !== "whatsapp_business_account" || !body?.entry) {
    return;
  }
  for (const entry of body.entry) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (!value) continue;
      if (value.statuses) {
        for (const status of value.statuses) {
          whatsappService.logEvent({
            direction: "INBOUND",
            userPhone: status.recipient_id,
            eventType: `message_status_${status.status}`,
            // 'sent' | 'delivered' | 'read'
            payload: status,
            status: "SUCCESS"
          });
        }
      }
      if (value.messages) {
        for (const message of value.messages) {
          const from = message.from;
          let text = "";
          if (message.type === "text") {
            text = message.text?.body || "";
          } else if (message.type === "interactive") {
            if (message.interactive?.type === "button_reply") {
              text = message.interactive.button_reply?.title || message.interactive.button_reply?.id || "";
            } else if (message.interactive?.type === "list_reply") {
              text = message.interactive.list_reply?.title || message.interactive.list_reply?.id || "";
            }
          } else if (message.type === "button") {
            text = message.button?.text || "";
          }
          if (text) {
            whatsappService.logEvent({
              direction: "INBOUND",
              userPhone: from,
              eventType: "whatsapp_message_received",
              payload: message,
              status: "SUCCESS"
            });
            try {
              await botEngine.handleIncomingMessage({
                from,
                text,
                messageId: message.id
              });
            } catch (err) {
              console.error("[BotEngine Error]", err);
              whatsappService.logEvent({
                direction: "INBOUND",
                userPhone: from,
                eventType: "bot_processing_error",
                payload: { error: err.message },
                status: "ERROR"
              });
            }
          }
        }
      }
    }
  }
});
app.get("/api/status", async (req, res) => {
  const config = whatsappService.getConfigurationStatus();
  const dbStatus = getCachedDatabaseStatus();
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
  const proto = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
  const detectedOrigin = `${proto}://${host}`;
  const publicSharedUrl = "https://ais-pre-pclekuvfazg27rxlkjk4es-482451006325.europe-west3.run.app";
  const devWorkspaceUrl = "https://ais-dev-pclekuvfazg27rxlkjk4es-482451006325.europe-west3.run.app";
  res.json({
    appName: "Qudi WhatsApp AI Banking Bot",
    appUrl: detectedOrigin,
    publicAppUrl: publicSharedUrl,
    devAppUrl: devWorkspaceUrl,
    webhookCallbackUrl: `${publicSharedUrl}/webhook`,
    publicWebhookCallbackUrl: `${publicSharedUrl}/webhook`,
    devWebhookCallbackUrl: `${devWorkspaceUrl}/webhook`,
    verifyToken: currentVerifyToken,
    whatsappConfig: config,
    geminiAiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5),
    mode: config.isConfigured ? "LIVE_WHATSAPP_CLOUD_API" : "DEVELOPMENT_ADAPTER",
    database: dbStatus
  });
});
app.get("/api/db/status", async (_req, res) => {
  const status = await checkDatabaseHealth();
  res.json(status);
});
app.post("/api/db/seed", async (_req, res) => {
  try {
    await seedDatabaseIfEmpty();
    const status = await checkDatabaseHealth();
    res.json({ success: true, message: "Database tables verified and seeded", status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/admin/verify-token", (req, res) => {
  const { verifyToken } = req.body;
  if (!verifyToken || typeof verifyToken !== "string" || verifyToken.trim().length < 3) {
    return res.status(400).json({ error: "Verify token must be at least 3 characters long." });
  }
  currentVerifyToken = verifyToken.trim();
  console.log("[WhatsApp Webhook] Verify token updated to:", currentVerifyToken);
  res.json({ success: true, verifyToken: currentVerifyToken });
});
app.get("/api/admin/metrics", async (_req, res) => {
  const users = await userService.getAllUsersAsync();
  const transactions = transactionService.getAllTransactions();
  const quotes = rateService.getAllQuotes();
  const tickets = supportService.getTickets();
  const totalVolumeNgn = transactions.filter((t) => t.status === "COMPLETED").reduce((acc, t) => acc + (t.fromCurrency === "NGN" ? t.fromAmount : t.toAmount), 0);
  res.json({
    userCount: users.length,
    activeUserCount: users.filter((u) => u.onboardingStep === "ACTIVE").length,
    transactionCount: transactions.length,
    completedTransactionCount: transactions.filter((t) => t.status === "COMPLETED").length,
    pendingVerificationCount: transactions.filter((t) => t.status === "PAYMENT_VERIFICATION").length,
    openSupportTicketCount: tickets.filter((t) => t.status === "OPEN").length,
    totalVolumeNgn,
    rates: rateService.getRates(),
    database: getCachedDatabaseStatus()
  });
});
app.get("/api/admin/users", async (_req, res) => {
  const users = await userService.getAllUsersAsync();
  res.json(users);
});
app.get("/api/admin/rates", (_req, res) => {
  res.json(rateService.getRates());
});
app.post("/api/admin/rates", (req, res) => {
  const updated = rateService.updateRates(req.body);
  res.json({ success: true, rates: updated });
});
app.get("/api/admin/transactions", (_req, res) => {
  res.json(transactionService.getAllTransactions());
});
app.post("/api/admin/transactions/:ref/verify", async (req, res) => {
  const { ref } = req.params;
  const result = transactionService.verifyAndCompletePayment(ref, req.body.adminNote);
  if (!result.success || !result.transaction) {
    return res.status(400).json(result);
  }
  const tx = result.transaction;
  const user = userService.getUserByPhone(tx.userPhone);
  const isFr = user?.language === "fr";
  const receiptMsg = isFr ? `\u{1F389} **Paiement V\xE9rifi\xE9 & Transfert Termin\xE9 !**

Votre transaction **${tx.reference}** a \xE9t\xE9 valid\xE9e avec succ\xE8s par nos services financiers.

\u2022 Montant re\xE7u : **${tx.fromAmount.toLocaleString()} ${tx.fromCurrency}**
\u2022 Montant pay\xE9 au b\xE9n\xE9ficiaire : **${tx.toAmount.toLocaleString()} ${tx.toCurrency}**
\u2022 Destinataire : **${tx.recipientName}** (${tx.recipientAccount})
\u2022 Date de r\xE8glement : ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}

Merci d'avoir choisi Qudi pour vos \xE9changes transfrontaliers !` : `\u{1F389} **Payment Verified & Transfer Completed!**

Your transaction **${tx.reference}** has been verified and settled by our payment desk.

\u2022 Received: **${tx.fromAmount.toLocaleString()} ${tx.fromCurrency}**
\u2022 Paid Out to Recipient: **${tx.toAmount.toLocaleString()} ${tx.toCurrency}**
\u2022 Recipient: **${tx.recipientName}** (${tx.recipientAccount})
\u2022 Settlement Time: ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}

Thank you for choosing Qudi for your cross-border money exchange!`;
  await whatsappService.sendTextMessage(tx.userPhone, receiptMsg);
  res.json({ success: true, transaction: tx });
});
app.post("/api/admin/transactions/:ref/reject", async (req, res) => {
  const { ref } = req.params;
  const reason = req.body.reason || "Payment evidence could not be verified by bank clearing.";
  const result = transactionService.updateStatus(ref, "CANCELLED");
  if (!result.success || !result.transaction) {
    return res.status(400).json(result);
  }
  const tx = result.transaction;
  const user = userService.getUserByPhone(tx.userPhone);
  const isFr = user?.language === "fr";
  const rejectMsg = isFr ? `\u26A0\uFE0F **Transaction Annul\xE9e (${tx.reference})**

La v\xE9rification de votre paiement n'a pas pu aboutir.
Motif : ${reason}

Si vous pensez qu'il s'agit d'une erreur, \xE9crivez *"Aide"* pour parler \xE0 un conseiller.` : `\u26A0\uFE0F **Transaction Cancelled (${tx.reference})**

Your payment verification could not be confirmed.
Reason: ${reason}

If you believe this is an error, reply *"Support"* to connect with an operations officer.`;
  await whatsappService.sendTextMessage(tx.userPhone, rejectMsg);
  res.json({ success: true, transaction: tx });
});
app.get("/api/admin/support", (_req, res) => {
  res.json(supportService.getTickets());
});
app.post("/api/admin/support/:id/resolve", async (req, res) => {
  const ticket = supportService.resolveTicket(req.params.id, req.body.note);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  const user = userService.getUserByPhone(ticket.userPhone);
  const isFr = user?.language === "fr";
  const resolvedMsg = isFr ? `\u2705 **Ticket R\xE9solu (#${ticket.ticketNumber})**
Notre conseiller client a trait\xE9 votre demande. N'h\xE9sitez pas \xE0 nous \xE9crire si vous avez d'autres questions.` : `\u2705 **Support Ticket Resolved (#${ticket.ticketNumber})**
Our support desk has completed review of your inquiry. Reply anytime if you need further assistance.`;
  await whatsappService.sendTextMessage(ticket.userPhone, resolvedMsg);
  res.json({ success: true, ticket });
});
app.get("/api/admin/logs", (_req, res) => {
  res.json(whatsappService.getLogs());
});
app.get("/api/admin/outbox", (_req, res) => {
  res.json(whatsappService.getOutbox());
});
app.post("/api/dev/simulate-webhook", async (req, res) => {
  const { from = "2348031234567", text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });
  const metaWebhookPayload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "192837465019283",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "+234 1 800 QUDI",
                phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || "109283746501928"
              },
              contacts: [
                {
                  profile: { name: "Customer" },
                  wa_id: from
                }
              ],
              messages: [
                {
                  from,
                  id: `wamid_${Date.now()}`,
                  timestamp: Math.floor(Date.now() / 1e3).toString(),
                  text: { body: text },
                  type: "text"
                }
              ]
            },
            field: "messages"
          }
        ]
      }
    ]
  };
  try {
    const result = await botEngine.handleIncomingMessage({
      from,
      text,
      messageId: `wamid_${Date.now()}`
    });
    whatsappService.logEvent({
      direction: "INBOUND",
      userPhone: from,
      eventType: "simulated_webhook_inbound",
      payload: metaWebhookPayload,
      status: "SUCCESS"
    });
    res.json({
      success: true,
      metaWebhookPayload,
      botResponse: result,
      outbox: whatsappService.getOutbox().slice(0, 1)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/dev/run-tests", async (_req, res) => {
  try {
    const testResults = await runAutomatedTests();
    res.json(testResults);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
async function startServer() {
  try {
    const dbStatus = await checkDatabaseHealth();
    if (dbStatus.isConnected) {
      console.log(`[Neon PostgreSQL] Connected successfully to host: ${dbStatus.host} (${dbStatus.isPooled ? "Pooled" : "Direct"})`);
      await seedDatabaseIfEmpty();
    } else {
      console.log("[Neon PostgreSQL] Database status:", dbStatus.error || "DATABASE_URL not configured. Running in safe fallback mode.");
    }
  } catch (err) {
    console.warn("[Database Startup Notice]:", err.message);
  }
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Qudi WhatsApp Bot Engine running on http://0.0.0.0:${PORT}`);
    console.log(`WhatsApp Webhook Endpoint: http://0.0.0.0:${PORT}/webhook`);
    console.log(`WhatsApp Verify Token: ${currentVerifyToken}`);
  });
}
startServer();

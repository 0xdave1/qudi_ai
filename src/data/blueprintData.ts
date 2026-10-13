export interface BlueprintSection {
  id: number;
  slug: string;
  title: string;
  category: 'Strategic' | 'Product & UX' | 'Engineering & System' | 'Treasury & Liquidity' | 'Compliance & Security' | 'Commercial & Scale';
  summary: string;
  content: string;
  highlights: string[];
  diagramOrCode?: string;
}

export const BLUEPRINT_SECTIONS: BlueprintSection[] = [
  {
    id: 1,
    slug: 'executive-summary',
    title: '1. Executive Summary',
    category: 'Strategic',
    summary: 'Institutional overview of Qudi: the conversational cross-border neobank powering informal and formal trade between Nigeria and Benin Republic.',
    highlights: [
      'Corridor Focus: Lagos–Cotonou axis ($11.3B aggregate annual cross-border trade).',
      'Dual Sovereign Currencies: Nigerian Naira (NGN) and West African CFA Franc (XOF).',
      'Interface Architecture: WhatsApp-first conversational banking expanding to Web & Mobile PWA.',
      'Core Innovation: Sub-3-second cross-border liquidity without physical border cash transit.'
    ],
    content: `### The Regional Opportunity
The commercial trade corridor between Nigeria (Africa's largest economy with 220M+ population) and Benin Republic (the primary transit gateway into the Francophone UEMOA zone) is one of the most active yet structurally broken financial arteries in Sub-Saharan Africa. More than 70% of cross-border trade between Lagos (Alaba International, Trade Fair, Idumota) and Cotonou (Marché Dantokpa, Port Autonome de Cotonou) is conducted using physical cash transited across the Seme-Krake border.

### The Pain Points
- **Physical Banditry & Border Extortion**: Merchants carry sacks of physical CFA Francs and Naira across border checkpoints, losing 3% to 6% in customs harassment and physical security risks.
- **Predatory Street Bureau de Change Spreads**: Street brokers at Seme Border and Dantokpa charge up to 7.5% spread over mid-market rates.
- **Formal Banking Friction**: Traditional correspondent banking (SWIFT through European intermediary banks) takes 3 to 5 business days and incurs $35+ in wire fees for simple regional payments.
- **Fragmented Payment Rails**: Nigeria is dominated by NIBSS Instant Payments (NIP) and Bank Accounts; Benin Republic is dominated by Mobile Money (MTN MoMo, Moov Money, Wave). Zero direct interoperability exists between them.

### The Qudi Solution
Qudi bridges this divide by delivering an AI-powered conversational banking experience directly on WhatsApp. Users hold verified dual-currency NGN and XOF wallets, swap between currencies in under 3 seconds using our Dynamic Market Maker liquidity pools, and execute direct deposits/payouts into Nigerian commercial banks and Beninese Mobile Money accounts.`
  },
  {
    id: 2,
    slug: 'investor-pitch',
    title: '2. Investor Pitch & Investment Thesis',
    category: 'Strategic',
    summary: 'The venture thesis, market sizing, competitive moat, and $3.5M Seed round capitalization plan.',
    highlights: [
      'Total Addressable Market (TAM): $42B West African intra-regional trade corridor.',
      'Serviceable Obtainable Market (SOM): $1.2B annual volume across 180,000 active cross-border merchants within 36 months.',
      'Blended Take-Rate: 1.25% average across FX conversion spread and payout clearing.',
      'Customer Acquisition Cost (CAC): $0.18 via WhatsApp social referral graph vs $6.50 industry average.'
    ],
    content: `### The Investment Thesis
Informal trade in West Africa is not disappearing; it is digitizing. By meeting West African merchants on their primary operating system—WhatsApp—Qudi captures the largest unbanked cross-border currency volume in Africa.

### Market Sizing
- **Total Addressable Market (TAM)**: $42 Billion total intra-regional trade across the 15 ECOWAS member states.
- **Serviceable Addressable Market (SAM)**: $11.3 Billion annual cross-border commercial money flow between Nigeria and the Benin/Togo coastal corridor.
- **Serviceable Obtainable Market (SOM)**: $1.2 Billion processed GMV by Year 3 (capturing ~10.6% of Nigeria-Benin commercial remittance).

### Why Qudi Wins (Competitive Moat)
1. **Zero App Download Barrier**: 94% of smartphone users in Nigeria and Benin use WhatsApp daily. WhatsApp onboarding reduces user drop-off from 68% to under 9%.
2. **Proprietary Pre-Funded Liquidity Pools**: Direct pre-funded capital vaults in Lagos (Zenith Bank) and Cotonou (Bank of Africa) allow instant local clearing without cross-border wire delays.
3. **Bilingual Conversational AI Engine**: Multilingual entity extraction trained on West African commercial dialects (Pidgin English, French, Yoruba, Fon).
4. **Hybrid Agent Float Network**: Physical OTC deposit kiosks in major markets (Dantokpa, Trade Fair Lagos, Seme Border) solve cash digitisation on day one.`
  },
  {
    id: 3,
    slug: 'complete-prd',
    title: '3. Complete Product Requirement Document (PRD)',
    category: 'Product & UX',
    summary: 'Exhaustive product requirements covering onboarding, dual-wallet state, FX quotation, transfer routing, and notification matrices.',
    highlights: [
      'Tier 1 (Phone + BVN/NIN or CIP): Daily limit ₦250k / 100k FCFA.',
      'Tier 2 (Biometric Face Match + Address): Daily limit ₦5M / 2M FCFA.',
      'Tier 3 (Corporate / Registered SME): Daily limit ₦50M / 20M FCFA.',
      '15-Second Guaranteed Rate Lock with automatic roll-forward protection.'
    ],
    content: `### Product Scope
Qudi provides an end-to-end conversational and digital banking platform enabling consumer and business users to create multi-currency accounts, hold NGN and XOF, exchange currencies in real-time, and route funds across domestic and international payment systems.

### Core Modules
1. **Identity & Onboarding (Auth & KYC)**:
   - WhatsApp-based phone OTP verification.
   - Nigeria KYC verification against NIBSS BVN and NIMC NIN databases.
   - Benin Republic KYC verification against ANIP (Agence Nationale d'Identification des Personnes) CIP and IFU tax registries.
2. **Multi-Currency Account Vault**:
   - Isolated sub-ledgers for NGN and XOF.
   - Real-time balance updates, holds, and reserved balances for pending settlements.
3. **Conversational AI Agent**:
   - Natural language intent parsing and financial entity extraction.
   - Real-time dialog state management with interactive action cards.`
  },
  {
    id: 4,
    slug: 'user-stories',
    title: '4. User Stories & Acceptance Criteria',
    category: 'Product & UX',
    summary: 'Concrete agile user stories spanning merchants, students, remote freelancers, and OTC cash agents.',
    highlights: [
      'Story 1: Trader currency swap via WhatsApp conversational prompt.',
      'Story 2: Parent sending tuition fees from Cotonou to Nigerian university bank account.',
      'Story 3: Remote developer in Cotonou receiving NGN salary and withdrawing to MTN MoMo.',
      'Story 4: Cash agent accepting physical NGN and crediting merchant XOF wallet.'
    ],
    content: `### User Story 1: Cross-Border Textile Merchant
- **As a** textile trader at Marché Dantokpa (Cotonou),
- **I want to** text "Convert 300,000 CFA to Naira and pay my fabric supplier in Lagos" on WhatsApp,
- **So that** my supplier receives ₦765,000 into their Zenith Bank account before my cargo leaves the warehouse.
- **Acceptance Criteria**:
  - AI calculates live rate (1 XOF = 2.55 NGN) and quotes ₦765,000.
  - Interactive message button displays "Confirm Swap & Send (15s Rate Lock)".
  - On user biometric/PIN confirmation, ledger debits 300,000 XOF and initiates NIBSS NIP payout within 2.5 seconds.
  - PDF receipt generated and sent back to WhatsApp chat.`
  },
  {
    id: 5,
    slug: 'functional-requirements',
    title: '5. Functional Requirements',
    category: 'Product & UX',
    summary: 'Detailed system capabilities, ledger operations, rate lock state machines, and payout rails.',
    highlights: [
      'Immutable double-entry book-keeping with zero round-trip currency leakage.',
      'Automated rate ticker polling interbank and parallel market data feeds.',
      'Multi-rail payout dispatcher (NIBSS Instant Payment, Paystack, MTN MoMo, Moov Money).',
      'Instant P2P internal transfer resolving by phone number, @QudiTag, or static QR.'
    ],
    content: `### Functional Specification
1. **Wallet Management**:
   - The system shall create an NGN sub-wallet and an XOF sub-wallet immediately upon Tier 1 verification.
   - The system shall assign a dedicated Nigerian Virtual Account Number (Wema Bank / Providus Bank partnership) for direct NGN bank transfer funding.
   - The system shall generate an integrated Mobile Money deposit reference for Benin Republic funding (MTN MoMo push USSD).
2. **Exchange Engine**:
   - The system shall maintain an active bid/ask spread dynamically updated by the Treasury Engine.
   - Quotes requested by users shall remain locked for exactly 15 seconds.
   - If market rates fluctuate beyond 0.5% during lock period, Qudi absorbs slippage within threshold or requests user re-confirmation.`
  },
  {
    id: 6,
    slug: 'non-functional-requirements',
    title: '6. Non-Functional Requirements (NFR)',
    category: 'Engineering & System',
    summary: 'Performance benchmarks, latency budgets, regulatory data residency, and resilience metrics.',
    highlights: [
      'P95 Latency: < 200ms for wallet queries, < 1.5s for conversational AI intent parsing.',
      'Throughput: Baseline 1,200 TPS; burst capacity 5,000 TPS on peak market days.',
      'Availability: 99.95% high availability with multi-AZ failover.',
      'Data Sovereignty: Encrypted customer records compliant with Nigeria NDPR and Benin APDP.'
    ],
    content: `### Performance & Availability Metrics
- **Response Latency**: Internal double-entry ledger transactions must commit in under 80 milliseconds.
- **Conversational Latency**: WhatsApp webhook processing and Gemini AI entity parsing must return reply payload to Meta Cloud API within 1,200ms.
- **Disaster Recovery**: RPO (Recovery Point Objective) = 0 seconds (zero ledger data loss via synchronous write-ahead logs); RTO (Recovery Time Objective) < 60 seconds.
- **Security Compliance**: Encryption at rest using AES-256-GCM; TLS 1.3 in transit; secret rotation every 90 days.`
  },
  {
    id: 7,
    slug: 'system-architecture',
    title: '7. System Architecture',
    category: 'Engineering & System',
    summary: 'Complete high-level system topology diagram modeling clients, API gateway, microservices, and banking adapters.',
    highlights: [
      'Omnichannel Client Tier: WhatsApp Cloud API Webhook, Next.js Web, Flutter Mobile.',
      'Event-Driven Backbone: Apache Kafka for distributed transaction saga orchestration.',
      'Caching & In-Memory Rates: Redis Cluster for 15-second rate locks and session state.',
      'Relational Financial Ledger: PostgreSQL with row-level locks and strict isolation.'
    ],
    content: `### Architecture Topology
The architecture uses an event-driven microservices pattern with a shared transactional outbox for banking integration. All financial balance changes occur via an immutable double-entry ledger service before external payout instructions are dispatched to payment gateways.`,
    diagramOrCode: `┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                               │
│     WhatsApp Business API  │  React / Next.js Web  │  Flutter Mobile   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / WSS / Webhooks
┌───────────────────────────────────▼────────────────────────────────────┐
│                       KONG API GATEWAY & BFF                           │
│           Rate Limiting · JWT / HMAC Auth · Routing & Telemetry        │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
┌───────────────────▼───────────────┐   ┌───────────▼────────────────────┐
│      CONVERSATIONAL AI ENGINE     │   │      CORE BANKING SERVICES     │
│   Gemini 3.8 Flash Intent Parser  │   │  • Identity & KYC Service      │
│   Multilingual Router (EN / FR)   │   │  • Multi-Currency Wallet Engine│
│   Financial Entity Extractor      │   │  • Double-Entry Ledger Service │
│   Tool & Action Execution Graph   │   │  • Transfer & Settlement Engine│
└───────────────────┬───────────────┘   │  • Agent Network Manager       │
                    │                   └───────────┬────────────────────┘
                    │                               │
┌───────────────────▼───────────────────────────────▼────────────────────┐
│               APACHE KAFKA EVENT STREAMING BACKBONE                    │
│   • fx.rate.updated              • transfer.initiated                  │
│   • ledger.entry.posted          • compliance.aml.flagged              │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
┌───────────────────▼───────────────┐   ┌───────────▼────────────────────┐
│       DATA PERSISTENCE TIER       │   │     EXTERNAL BANKING RAILS     │
│  PostgreSQL (Relational Ledger)   │   │  • Nigeria: NIBSS NIP / Paystack│
│  Redis (Rate Cache & Sessions)    │   │  • Benin: MTN MoMo, Moov, Wave │
│  AWS S3 (KYC Biometrics & Docs)   │   │  • Partner Banks: Zenith / BOA  │
└───────────────────────────────────┘   └────────────────────────────────┘`
  },
  {
    id: 8,
    slug: 'microservice-architecture',
    title: '8. Microservice Architecture',
    category: 'Engineering & System',
    summary: 'Autonomous service boundaries, gRPC internal communication, and saga pattern transaction lifecycles.',
    highlights: [
      'Auth & KYC Service: Verification against NIBSS BVN and ANIP Benin.',
      'Ledger & Wallet Service: Double-entry accounting preserving balance invariants.',
      'FX & Treasury Service: Real-time price aggregation, rate lock, and pool rebalancing.',
      'Payout Gateway Service: Circuit breakers and automated retries for bank & MoMo rails.'
    ],
    content: `### Service Decoupling & Boundaries
1. **identity-kyc-service**: Handles user registration, phone verification, biometrics match, and sanctions screening.
2. **ledger-wallet-service**: Maintains double-entry journals. Every currency swap consists of two debit-credit pairs (source wallet debit, platform FX pool credit; platform target pool debit, user target wallet credit).
3. **fx-treasury-service**: Ingests reference rates from CBN, BCEAO, and parallel market OTC feeds, applies dynamic spread formula, and issues cryptographically signed rate tokens.
4. **transfer-settlement-service**: Executes distributed Sagas for cross-border settlements with automated compensating transactions on timeout.`
  },
  {
    id: 9,
    slug: 'database-design',
    title: '9. Database Design (PostgreSQL DDL)',
    category: 'Engineering & System',
    summary: 'Production-ready relational database schema with double-entry ledger, currency isolation, and audit triggers.',
    highlights: [
      'Users table with tiered KYC flags and country codes.',
      'Wallets table with strict currency constraints and isolation.',
      'Ledger_entries table enforcing DEBIT = CREDIT transactional balance.',
      'FX_quotes table with epoch expiration timestamp for rate locks.'
    ],
    content: `### PostgreSQL Schema Definition`,
    diagramOrCode: `CREATE TYPE currency_code AS ENUM ('NGN', 'XOF');
CREATE TYPE kyc_tier_level AS ENUM ('TIER_1', 'TIER_2', 'TIER_3');
CREATE TYPE entry_direction AS ENUM ('DEBIT', 'CREDIT');
CREATE TYPE tx_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'FLAGGED_AML');

-- Users & Identification
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    tag VARCHAR(30) UNIQUE NOT NULL, -- e.g. @aminabello
    full_name VARCHAR(120) NOT NULL,
    preferred_language VARCHAR(5) DEFAULT 'en', -- 'en' or 'fr'
    country_code VARCHAR(2) NOT NULL, -- 'NG' or 'BJ'
    kyc_tier kyc_tier_level DEFAULT 'TIER_1',
    bvn_or_nin VARCHAR(30),
    cip_or_ifu VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallets
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    currency currency_code NOT NULL,
    balance NUMERIC(18, 4) NOT NULL DEFAULT 0.0000 CHECK (balance >= 0),
    reserved NUMERIC(18, 4) NOT NULL DEFAULT 0.0000 CHECK (reserved >= 0),
    account_number VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- Immutable Financial Journal Entries (Double-Entry Bookkeeping)
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    currency currency_code NOT NULL,
    direction entry_direction NOT NULL,
    amount NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
    balance_after NUMERIC(18, 4) NOT NULL,
    narration TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FX Quotation Locks
CREATE TABLE fx_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    from_currency currency_code NOT NULL,
    to_currency currency_code NOT NULL,
    source_amount NUMERIC(18, 4) NOT NULL,
    quoted_rate NUMERIC(12, 6) NOT NULL,
    spread_bps INT NOT NULL,
    target_amount NUMERIC(18, 4) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_executed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`
  },
  {
    id: 10,
    slug: 'api-specification',
    title: '10. API Specification (OpenAPI / REST)',
    category: 'Engineering & System',
    summary: 'Core REST endpoints for rate quotations, swaps, payouts, and WhatsApp webhook callbacks.',
    highlights: [
      'POST /v1/fx/quote - Request 15s guaranteed currency conversion quote.',
      'POST /v1/fx/swap - Execute locked currency conversion atomically.',
      'POST /v1/transfers/external - Route funds to Nigerian Bank or Benin Mobile Money.',
      'POST /v1/webhooks/whatsapp - Ingest inbound messages and deliver interactive cards.'
    ],
    content: `### Primary Endpoint Contracts`,
    diagramOrCode: `// POST /api/v1/fx/quote
Request:
{
  "fromCurrency": "XOF",
  "toCurrency": "NGN",
  "amount": 250000
}

Response (200 OK):
{
  "quoteId": "qt_9a8f21e0",
  "fromCurrency": "XOF",
  "toCurrency": "NGN",
  "fromAmount": 250000,
  "exchangeRate": 2.55,
  "toAmount": 637500,
  "spreadBps": 95,
  "expiresAt": "2026-10-12T19:35:15.000Z",
  "secondsValid": 15
}

// POST /api/v1/fx/swap
Request:
{
  "quoteId": "qt_9a8f21e0",
  "transactionPin": "••••"
}

Response (200 OK):
{
  "transactionId": "tx_4829104",
  "status": "COMPLETED",
  "debited": "250,000 XOF",
  "credited": "₦637,500 NGN",
  "timestamp": "2026-10-12T19:35:04.120Z",
  "receiptUrl": "https://cdn.qudi.money/receipts/tx_4829104.pdf"
}`
  },
  {
    id: 11,
    slug: 'whatsapp-conversation-flows',
    title: '11. WhatsApp Conversation Flows (EN & FR)',
    category: 'Product & UX',
    summary: 'Full conversational decision trees for WhatsApp onboarding, currency swap, cross-border payouts, and balance inquiries.',
    highlights: [
      'Bilingual Natural Language understanding with seamless language toggle (EN ⇄ FR).',
      'Interactive WhatsApp buttons for 1-tap confirmation and rate locks.',
      'Direct receipt delivery via PDF document attachment in WhatsApp chat.',
      'Zero bot friction: automatic handoff to human support on high-risk disputes.'
    ],
    content: `### Conversational Flow 1: Currency Conversion (French)
- **User**: "Convertis 150 000 FCFA en Naira"
- **Qudi Bot**:
  \`\`\`
  💱 Simulation de Conversion Qudi
  
  • Montant à convertir : 150 000 FCFA
  • Taux garanti (15s) : 1 XOF = 2.55 NGN
  • Vous recevrez : ₦382 500 NGN
  • Frais : 0 FCFA (Taux net transparent)
  
  [ Bouton 1 : Confirmer le Swap ]
  [ Bouton 2 : Annuler ]
  \`\`\`
- **User clicks**: "Confirmer le Swap"
- **Qudi Bot**:
  \`\`\`
  ✅ Conversion Réussie !
  ₦382 500 ont été crédités sur votre portefeuille Naira.
  Nouveau solde NGN : ₦425 000 | Nouveau solde XOF : 35 000 FCFA.
  [ Télécharger le reçu PDF ]
  \`\`\`

### Conversational Flow 2: Send Money to Nigeria (English)
- **User**: "Send ₦50,000 to Babatunde GTBank"
- **Qudi Bot**:
  \`\`\`
  💸 Send Money Confirmation
  
  • Recipient: Babatunde Adeleke
  • Bank: Guaranty Trust Bank (0123456789)
  • Amount: ₦50,000.00 NGN
  • Fee: ₦25.00 NGN (NIP Instant Rail)
  
  Please enter your 4-digit PIN to authorize.
  \`\`\``
  },
  {
    id: 12,
    slug: 'mobile-app-flows',
    title: '12. Mobile App Flows (Flutter / PWA)',
    category: 'Product & UX',
    summary: 'Native mobile interface architecture complementing WhatsApp with high-density portfolio analytics and biometric auth.',
    highlights: [
      'Dual-currency balance switcher with swipeable card carousel.',
      'One-tap Quick Swap slider with real-time rate lock animations.',
      'QR Code payment generator for market merchants (Dantokpa & Lagos).',
      'Offline-first transaction cache with background synchronization.'
    ],
    content: `### Mobile Navigation Hierarchy
- **Home View**: Consolidated net worth graph in user's base currency (NGN or XOF), quick actions (Deposit, Swap, Send, Cashout).
- **Swap View**: High-frequency FX converter with dual inputs, live chart showing 24h parallel vs interbank rate trends, and slippage controls.
- **Pay & Request**: Phonebook sync with automatic detection of Qudi users, bank transfer directory for 26 Nigerian commercial banks, and MoMo directory for Benin networks.
- **Agent Terminal Mode**: Switchable view for certified OTC cash merchants displaying cash float balances and commission earnings.`
  },
  {
    id: 13,
    slug: 'admin-dashboard-flows',
    title: '13. Admin Dashboard Flows',
    category: 'Product & UX',
    summary: 'Executive cockpit for treasury managers, compliance officers, and operations teams.',
    highlights: [
      'Liquidity Pool Reserve Monitor across Nigerian & Beninese partner banks.',
      'Dynamic FX Spread Controller with real-time slider and volatility triggers.',
      'AML / Sanctions Screening alert queue with one-click account freezing.',
      'Agent float rebalancing dashboard and commission payout batching.'
    ],
    content: `### Operational Consoles
1. **Treasury Management Console**:
   - Visualizes live bank balances at Zenith Bank Lagos (NGN) and BOA Cotonou (XOF).
   - Configurable safety thresholds (e.g. alert when XOF vault drops below 15% of daily volume).
   - One-click trigger for cross-border rebalancing wire instructions.
2. **Compliance & Risk Cockpit**:
   - Automated flagging of suspicious transaction velocity (e.g. > $10,000 equivalent in 24h on Tier 1 account).
   - PEP (Politically Exposed Persons) and international sanctions list cross-checks (OFAC, ECOWAS, CBN watchlists).`
  },
  {
    id: 14,
    slug: 'ai-assistant-architecture',
    title: '14. AI Assistant Architecture',
    category: 'Engineering & System',
    summary: 'Multi-turn conversational agent powered by Gemini 3.8 Flash with deterministic function calling and localized prompt grounding.',
    highlights: [
      'LLM Model: Google Gemini 3.8 Flash optimized for high throughput and low latency.',
      'Deterministic Function Calling: Strict schema validation prevents hallucinated transactions.',
      'Multilingual Dialect Adapter: Handles French, English, Nigerian Pidgin, and colloquial terms.',
      'Security Boundary: AI never possesses authorization to debit funds without explicit user PIN/Biometric signature.'
    ],
    content: `### AI Pipeline Design
1. **Inbound Webhook**: Meta WhatsApp Cloud API posts user message to Qudi Gateway.
2. **Context Resolution**: Redis session store retrieves user profile, KYC tier, active wallet balances, and conversation history.
3. **Gemini 3.8 Flash Execution**:
   - System prompt instructs model with financial entity parameters and safety rules.
   - Structured tools defined: \`convertCurrency\`, \`sendMoney\`, \`checkBalance\`, \`getExchangeRate\`, \`getSpendingInsights\`.
4. **Execution Layer**: If model returns a function call, backend validates wallet balances, calculates precise rate quotes, and formats an interactive WhatsApp action template.`
  },
  {
    id: 15,
    slug: 'agent-network-architecture',
    title: '15. Agent Network Architecture',
    category: 'Treasury & Liquidity',
    summary: 'Physical OTC cash merchant network bridging physical notes to digital dual-currency wallets.',
    highlights: [
      'Strategic Geo-Placement: Marché Dantokpa, Seme Border, Badagry, Trade Fair Complex Lagos.',
      'Agent Float Requirement: Minimum $2,500 equivalent working capital in NGN and XOF.',
      'Commission Structure: 0.40% on cash-in deposits; 0.60% on cash-out withdrawals.',
      'Hardware Agnostic: Agents operate using standard Android phones or WhatsApp.'
    ],
    content: `### Why Physical Agents Matter
In West Africa, cross-border trade starts and ends with physical cash. Without an agent network to digitize physical paper notes into Qudi wallets, digital-only neobanks fail to capture over 80% of informal market volume.

### Agent Workflow
- **Cash Deposit (Cash-In)**: Customer hands 50,000 CFA cash to agent at Marché Dantokpa. Agent scans customer's Qudi QR code on phone. Agent's XOF float is debited 50,000 XOF; customer's XOF wallet is credited instantly. Agent earns 200 FCFA commission.
- **Cash Withdrawal (Cash-Out)**: Customer in Badagry generates one-time withdrawal token on WhatsApp. Agent enters code, hands Naira cash to customer. Customer's NGN wallet is debited; Agent's NGN float is credited + 0.6% commission.`
  },
  {
    id: 16,
    slug: 'treasury-and-liquidity',
    title: '16. Treasury & Liquidity System',
    category: 'Treasury & Liquidity',
    summary: 'Dynamic Market Maker model, pre-funded liquidity vaults, and automated corridor rebalancing mechanics.',
    highlights: [
      'Dual Pre-Funded Vaults: $1M USD initial liquidity float split across Lagos & Cotonou.',
      'Dynamic Spread Formula: Base spread (80 bps) + Volatility index + Pool imbalance surcharge.',
      'Automated Rebalancing: Cross-border treasury settlement via partner commercial banks.',
      'Netting Engine: Daily internal netting minimizes external physical currency settlement by 82%.'
    ],
    content: `### Dynamic Market Maker Pricing Formula
\`\`\`
Effective_Rate = Benchmark_Mid_Rate * (1 ± (Base_Spread + Imbalance_Penalty + Volatility_Buffer))

Where:
• Benchmark_Mid_Rate = Blended CBN / BCEAO / Interbank rate
• Base_Spread = 80 basis points (0.80%)
• Imbalance_Penalty = Dynamic adjustment (0 to 45 bps) applied when pool balance skews beyond 65:35 ratio
• Volatility_Buffer = 0 to 30 bps during high market fluctuations
\`\`\`

### Internal Netting & Settlement
Because trade flows both ways (Nigerian electronics/manufactured goods exported to Benin; Beninese agricultural/textile products imported to Nigeria), over 80% of transactions offset internally without requiring cross-border foreign exchange wire movements.`
  },
  {
    id: 17,
    slug: 'security-architecture',
    title: '17. Security Architecture',
    category: 'Compliance & Security',
    summary: 'Zero-trust infrastructure, cryptographic transaction signing, and PCI-DSS / ISO 27001 posture.',
    highlights: [
      'Hardware Security Module (HSM) backed master key encryption for platform vaults.',
      'HMAC-SHA256 signature verification on all WhatsApp and payment gateway webhooks.',
      'Biometric / 4-Digit Financial PIN authorization required for every monetary debit.',
      'Automated session revocation and device fingerprinting.'
    ],
    content: `### Security Defense in Depth
1. **Network Layer**: Cloudflare Enterprise DDoS shielding, Web Application Firewall (WAF), mutual TLS (mTLS) for microservice communication.
2. **Application Layer**: Strict input validation, zero eval/dynamic execution, automated SAST/DAST code audits in CI/CD.
3. **Ledger Integrity**: Cryptographic hashing of transaction chains (Merkle tree audit logs) ensuring immutable historical records.`
  },
  {
    id: 18,
    slug: 'compliance-architecture',
    title: '18. Compliance Architecture (CBN & BCEAO)',
    category: 'Compliance & Security',
    summary: 'Regulatory strategy for Nigeria and Benin Republic, licensing roadmap, AML/CFT rules, and reporting.',
    highlights: [
      'Nigeria: Partnering with CBN-licensed Mobile Money Operator (MMO) & PSSP for local clearing.',
      'Benin Republic: Operating under BCEAO E-Money Institution framework via partner commercial bank.',
      'Automated AML/CFT: Real-time screening against OFAC, PEP, Interpol, and regional watchlists.',
      'Suspicious Activity Reporting (SAR): Automated pipeline to NFIU (Nigeria) and CENTIF (Benin).'
    ],
    content: `### Two-Jurisdiction Regulatory Strategy
- **Nigeria Regulatory Framework**:
  - Operates under the Central Bank of Nigeria (CBN) Regulatory Framework for Mobile Payment Services and Guidelines on International Money Transfer Services.
  - Initial Phase: Embedded sponsorship through a Tier-1 licensed commercial bank (Zenith Bank / Access Bank) and licensed MMO.
  - Phase 2: Direct application for CBN Payment Service Solution Provider (PSSP) and MMO license.
- **Benin & UEMOA Regulatory Framework**:
  - Operates under BCEAO Regulation N° 09/2010/CM/UEMOA regarding cross-border electronic funds transfers.
  - Partner bank acts as designated settlement institution and primary custodian of escrowed customer funds.`
  },
  {
    id: 19,
    slug: 'revenue-model',
    title: '19. Revenue Model',
    category: 'Commercial & Scale',
    summary: 'Four diversified revenue streams yielding high-margin unit economics on cross-border payment volume.',
    highlights: [
      'FX Conversion Spread: 0.85% to 1.40% on gross converted volume.',
      'External Payout Fees: Flat ₦25 - ₦50 on NIBSS transfers; 0.35% on Benin MoMo payouts.',
      'Merchant Gateway Fees: 0.50% on cross-border commercial invoicing and checkout.',
      'Treasury Float Yield: Interest yield on pre-funded commercial bank reserve balances.'
    ],
    content: `### Revenue Stream Breakdown
1. **FX Spread Monetization (Primary - 74% of Revenue)**:
   - Capturing an average of 1.15% spread on all NGN ⇄ XOF currency exchanges.
   - Far cheaper for users than street BDCs (charging 4–7%), yielding strong customer surplus while generating sustainable gross margins.
2. **Payout Rail Markup (16% of Revenue)**:
   - Charging nominal convenience fees on external bank account and Mobile Money withdrawals.
3. **B2B SME Invoicing & Trade Escrow (10% of Revenue)**:
   - 0.50% fee on high-value trade transactions utilizing Qudi's cross-border escrow protection.`
  },
  {
    id: 20,
    slug: 'unit-economics',
    title: '20. Unit Economics',
    category: 'Commercial & Scale',
    summary: 'Customer lifetime value (LTV), blended customer acquisition costs, and payback periods.',
    highlights: [
      'Average Customer Acquisition Cost (CAC): $0.18 for organic WhatsApp referral; $1.40 blended.',
      'Monthly Transacting Volume per Active Merchant: $850 USD equivalent.',
      'Monthly Net Revenue per Active Merchant: $9.77 USD.',
      'LTV / CAC Ratio: 16.4x with a payback period under 2.2 weeks.'
    ],
    content: `### Unit Economics Model (Per Active User / Month)
- **Average Monthly Transactions**: 4.8 swaps / transfers.
- **Average Volume**: $850 USD equivalent (~₦1.27M / 510,000 FCFA).
- **Gross Revenue (1.15% FX spread)**: $9.77.
- **Direct Processing & Bank Rail Costs**: $1.85.
- **WhatsApp Cloud API Meta Messaging Cost**: $0.22.
- **Net Contribution Margin**: $7.70 (78.8% gross margin).
- **Blended CAC**: $1.40.
- **Payback Period**: 0.18 months (< 6 days).`
  },
  {
    id: 21,
    slug: 'launch-roadmap',
    title: '21. Launch Roadmap (24-Month Horizon)',
    category: 'Commercial & Scale',
    summary: 'Phased geographic and technical rollout from Lagos-Cotonou MVP to full ECOWAS coastal belt expansion.',
    highlights: [
      'Phase 1 (Months 1-3): Closed Pilot on Lagos-Cotonou corridor with 500 merchants.',
      'Phase 2 (Months 4-6): Public WhatsApp launch & 50 OTC agents at Dantokpa & Trade Fair.',
      'Phase 3 (Months 7-12): Mobile Apps, SME Invoicing, scaling to 150,000 users.',
      'Phase 4 (Months 13-24): Expansion to Togo (Lomé) and Ghana (Accra), reaching 1M users.'
    ],
    content: `### Execution Milestones
- **Q1 2026**: Bank partner sponsorship contracts executed in Nigeria and Benin; WhatsApp Cloud API integration complete; Dynamic Market Maker simulator verified.
- **Q2 2026**: Alpha launch at Marché Dantokpa and Alaba International Market; 100 liquidity agents equipped with OTC float app.
- **Q3 2026**: Full commercial launch; reach $5M monthly processed volume; launch Flutter mobile companion app.
- **Q4 2026**: Series A fundraise ($12M); expand to Togo (Lomé Port corridor).`
  },
  {
    id: 22,
    slug: 'team-structure',
    title: '22. Team Structure & Operating Model',
    category: 'Commercial & Scale',
    summary: 'Bilingual organizational chart across Lagos, Cotonou, and remote engineering hubs.',
    highlights: [
      'Executive Leadership: Chief Executive Officer (Fintech scale veteran), Bilingual CTO, Head of Treasury.',
      'Compliance & Legal: Dedicated Compliance Officers in Lagos (CBN liaison) and Cotonou (BCEAO liaison).',
      'Engineering: Backend (NestJS/Go), Frontend (React/Flutter), ML/NLP Engineer (Gemini integration).',
      'Ground Operations: Field Agent Managers in Cotonou and Lagos commercial markets.'
    ],
    content: `### Initial 24-Person Team Buildout
- **Executive**: CEO, CTO, Head of Treasury & FX, Chief Compliance Officer.
- **Product & Engineering (10)**: Lead Architect, 4 Backend Engineers (NestJS/Kafka/PostgreSQL), 2 Mobile/Web Engineers, 1 AI/NLP Engineer, 1 QA/Security Engineer, 1 Lead Designer.
- **Compliance & Operations (5)**: Nigeria AML Analyst, Benin AML Analyst, Treasury Operations Associate, 2 Bilingual Customer Support Leads.
- **Growth & Agent Field Team (5)**: Lagos Merchant Lead, Cotonou Agent Manager, 3 Field Activation Officers.`
  },
  {
    id: 23,
    slug: 'scaling-strategy',
    title: '23. Scaling Strategy to 1 Million Users',
    category: 'Commercial & Scale',
    summary: 'Infrastructure scaling, sharding, caching, and financial risk mitigation to support $200M+ monthly GMV.',
    highlights: [
      'Database Sharding: User ID hash partitioning for ledger write scalability.',
      'Redis Distributed Locking: Prevents race conditions and double-spending across distributed nodes.',
      'Multi-Active Liquidity Routing: Automated inter-bank treasury rebalancing via regional RTGS.',
      'Microservices Orchestration: Kubernetes auto-scaling clusters deployed across AWS Africa.'
    ],
    content: `### Technical & Operational Scaling Framework
1. **Ledger Throughput**:
   - PostgreSQL table partitioning by month and account hash prevents ledger tables from degrading past 50 million rows.
   - Read-heavy queries (e.g. balance checks) serviced via Redis cache with 100ms invalidation.
2. **Treasury Capitalization**:
   - At 1,000,000 users with $200M monthly volume, working capital float scales to $6M USD equivalent.
   - Instituting intra-day automated sweeps and liquidity credit lines with partner commercial banks.`
  },
  {
    id: 24,
    slug: 'detailed-development-plan',
    title: '24. Detailed Development Plan (Sprint-by-Sprint)',
    category: 'Commercial & Scale',
    summary: 'Engineering execution schedule detailing sprints, deliverable artifacts, and validation milestones.',
    highlights: [
      'Sprint 1-2: Core Ledger, User Entities, and Double-Entry Engine.',
      'Sprint 3-4: Gemini Conversational AI Integration & WhatsApp Webhook Engine.',
      'Sprint 5-6: NIBSS NIP & Benin MTN MoMo Gateway Connectors.',
      'Sprint 7-8: Treasury Portal, Dynamic Market Maker, and End-to-End Pilot Testing.'
    ],
    content: `### 8-Sprint Engineering Execution Plan
- **Sprint 1 (Weeks 1-2)**: Data models, PostgreSQL migrations, immutable double-entry ledger service, account numbering system.
- **Sprint 2 (Weeks 3-4)**: Authentication, JWT tokens, BVN/NIN and CIP identity verification microservice.
- **Sprint 3 (Weeks 5-6)**: WhatsApp Cloud API webhook receiver, Gemini 3.8 Flash tool-calling orchestration, bilingual prompt grounding.
- **Sprint 4 (Weeks 7-8)**: FX quotation engine, Redis rate locks, dynamic bid/ask calculation, internal swap saga.
- **Sprint 5 (Weeks 9-10)**: Banking rail adapters: Nigeria NIBSS NIP sandbox integration + Benin MTN MoMo / Moov Money API sandbox.
- **Sprint 6 (Weeks 11-12)**: Agent network portal, QR code generator, commission distribution service.
- **Sprint 7 (Weeks 13-14)**: Admin Treasury, compliance cockpit, real-time AML scoring, fraud alerts.
- **Sprint 8 (Weeks 15-16)**: End-to-end integration, performance load testing (5,000 TPS target), security pentesting.`
  }
];

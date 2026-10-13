# Qudi: AI-Powered Cross-Border Banking Platform for West Africa (NGN ⇄ XOF)

> Complete institutional product architecture, engineering specification, compliance blueprint, and interactive fintech suite for conversational cross-border banking between Nigeria and Benin Republic.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions have been confirmed and incorporated into the design:
> - **Brand Identity**: **Qudi** — Pan-West African fintech brand uniting English- and French-speaking commercial hubs (Lagos ⇄ Cotonou/Porto-Novo).
> - **Primary Interactive Experience**: **Unified Suite** — Live WhatsApp AI Conversational Simulator, Dual-Currency Consumer Wallet (NGN & XOF), Admin Treasury & Risk Operations Portal, and Interactive 24-Section Fintech Architecture & Investor Explorer.
> - **Liquidity & FX Execution**: **Dynamic Market Maker (DMM) with Real-Time Parallel/Interbank Spread Management** — Simulating automated bid-ask spreads, liquidity pools, CBN/BCEAO regulatory corridors, and real-time rate lock.

---

## 1. Executive Summary & Core Concept

### 1.1 Executive Summary
**Qudi** is a next-generation conversational cross-border neobank built from the ground up for West Africa, solving the $14B+ informal, friction-heavy cross-border trade corridor between Nigeria and Benin Republic. By leveraging a **WhatsApp-first conversational AI interface** powered by Google Gemini, Qudi enables cross-border traders, remote professionals, SMEs, and diaspora senders to create accounts, pass tiered KYC, hold dual-currency wallets (Nigerian Naira [NGN] and West African CFA Franc [XOF]), exchange currencies instantly at institutional-grade mid-market spreads, and deposit/withdraw seamlessly via bank rails, mobile money (MTN MoMo, Moov Money, Wave), and physical OTC cash agents.

### 1.2 Target Audience & Core Personas
1. **The Cross-Border Trader (Alaba ⇄ Dantokpa Corridor)**: Sells electronics or textiles in Cotonou, receives XOF, needs instant conversion into NGN to pay suppliers in Lagos without carrying bags of cash across Seme Border.
2. **The Tech Freelancer / Remote Professional**: Lives in Cotonou or Lagos, bills clients in XOF/NGN, demands low-fee conversion and instant settlement into local bank accounts or mobile wallets.
3. **The SME Merchant**: Imports agricultural produce or consumer goods across borders, requires multi-currency invoicing, statement exports, and hedging against currency volatility.
4. **OTC Cash Agents (Neighborhood Boutiques / Bureau de Change)**: Liquidity distribution partners providing cash-in/cash-out services with tiered commissions.

### 1.3 Key Value Proposition
- **Conversational Native**: 100% of banking actions accessible over WhatsApp without forcing app downloads.
- **Sub-3-Second Settlement**: Instant dual-wallet crediting and automated local clearing (NIBSS Instant Payment in Nigeria; BCEAO RTGS / Mobile Money in Benin).
- **Multilingual By Design**: Fluent French and English conversational AI with localized dialect and colloquial understanding (e.g., "CFA", "Francs", "Naira", "Kudi").
- **Institutional Compliance**: Embedded bank-partner model compliant with the Central Bank of Nigeria (CBN) and Banque Centrale des États de l'Afrique de l'Ouest (BCEAO).

---

## 2. User Experience & Visual Design

### 2.1 Aesthetic Direction & Theme Tokens
In accordance with modern fintech standards (Wise, Revolut, Moniepoint) and anti-AI slop design discipline:
- **Canvas & Neutral Surfaces**: Clean deep slate (`#090D16`) for dark administrative & high-trust banking surfaces, crisp warm bone (`#F8FAFC` / `#FFFFFF`) for consumer mobile viewports.
- **Primary Brand Tokens**:
  - Forest Emerald (`#059669` / `#10B981`): Symbolizing prosperity, West African financial security, and active transaction clearance.
  - Deep Indigo/Navy (`#0F172A` / `#1E1B4B`): Institutional stability and sovereign regulatory trust.
  - Saffron Amber (`#D97706`): Indicating pending holds, OTP rate locks, and treasury liquidity rebalancing alerts.
- **Typography**: Display typography using `Plus Jakarta Sans` and `Outfit` for confident brand hierarchy; dense data grids and ledger tables strictly use tabular monospace numerals (`font-mono tabular-nums`).
- **Zero-Pill Discipline**: Metadata, transaction states, and timestamps are rendered as clean unboxed text separated by subtle typographic dots (`·`), without candy-badge clutter.

### 2.2 Key User Flows & Viewport Architecture
The interactive application provides an omnichannel navigation bar allowing instant switching across four operational environments:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Qudi Platform · Pan-West African AI Banking               [ 🇳🇬 NGN / 🇧🇯 XOF ] [ FR | EN ]│
├───────────────────┬───────────────────┬────────────────────┬───────────────────────────┤
│ 💬 WhatsApp AI    │ 💳 Consumer       │ 🏛️ Admin Treasury  │ 📚 Institutional          │
│    Simulator      │    Dual-Wallet    │    & Risk Console  │    Fintech Blueprint      │
└───────────────────┴───────────────────┴────────────────────┴───────────────────────────┘
```

1. **WhatsApp AI Simulator**:
   - Realistic WhatsApp interface with end-to-end conversational banking.
   - Natural language intent parsing via server-side Gemini 3.8 Flash (`"Convert 100,000 CFA to Naira"`, `"Send 50,000 CFA to David"`, `"Montre mes dépenses du mois"`).
   - WhatsApp Interactive Messages: Quick Reply buttons, interactive transaction approval cards, rate lock countdown timers, and downloadable PDF-style receipts.
2. **Consumer Dual-Wallet (Web / Mobile PWA)**:
   - Primary balances in NGN and XOF with real-time conversion rates.
   - Instant Currency Swap modal with live countdown (15s rate guarantee), transparent spread breakdown, and slippage tolerance.
   - Send Money flow: Internal P2P (via Phone, @QudiTag, QR code) and External (Nigerian Banks via NIBSS, Benin Mobile Money via MTN MoMo/Moov).
   - Deposit / Cash-in via Virtual Account or Agent QR code.
3. **Admin Treasury, Liquidity & Compliance Portal**:
   - Real-time Liquidity Pool reserve metrics (NGN Vault at Zenith/Access Bank; XOF Vault at Ecobank/BOA Benin).
   - Dynamic Spread Controller (basis point adjustment for parallel vs. interbank market).
   - Live Transaction Stream with real-time automated AML/PEP risk scoring and flag triggers.
   - Agent Network management: Float balances, commission payouts, and cash transaction velocity.
4. **Institutional Fintech Blueprint & Documentation Viewer**:
   - Complete 24-section reference viewer covering Executive Summary, Pitch Deck, PRD, System Architecture, Database Schemas, API Specs, and Regulatory Roadmaps.

---

## 3. Product Specification & Comprehensive Deliverables (1 – 24)

### 1. Executive Summary & Market Sizing
- **TAM**: Total cross-border trade in ECOWAS exceeds $42B annually; Nigeria-Benin represents ~$8.2B informal corridor and $3.1B formal trade.
- **Target Opportunity**: Convert $1.2B of informal currency exchange and remittance into secure digital rails over 36 months.

### 2. Investor Pitch Deck Outline
- **Slide 1**: Problem: Traders losing 4–7% in informal street FX (Dantokpa/Badagry parallel market) + physical theft risks.
- **Slide 2**: Solution: Qudi — Conversational AI banking on WhatsApp with instant NGN ⇄ XOF liquidity.
- **Slide 3**: Traction & Unit Economics: $0.14 blended CAC via WhatsApp viral loops, 1.25% take-rate on cross-border volume.
- **Slide 4**: Proprietary Moat: Direct local settlement rails + custom multilingual AI conversational engine.
- **Slide 5**: The Ask: $3.5M Seed round for treasury float capitalization, licensing, and agent network expansion.

### 3. Product Requirement Document (PRD)
- Multi-currency ledger with double-entry accounting.
- Tiered KYC (Tier 1: Phone + BVN/NIN for Nigeria, CIP/IFU for Benin; Tier 2: Biometric selfie + Proof of Address).
- Rate Lock Engine: 15-second guaranteed quote with automated slippage protection.

### 4. User Stories & Acceptance Criteria
- *As a trader in Cotonou*, I want to type "Convert 200,000 CFA to Naira and send to Alaba Electronics" so that my supplier is paid within 30 seconds.
- *As a Benin student in Nigeria*, I want to receive money from my parents' MTN MoMo wallet into my Qudi XOF wallet and withdraw to my Nigerian GTBank account.

### 5. Functional Requirements
- Multi-currency balances, rate quotation, instant P2P internal transfer, external payouts to NIP and Mobile Money APIs.
- AI assistant with entity extraction (amount, source currency, target currency, recipient).
- Multi-channel notification dispatch (WhatsApp webhook, SMS, email).

### 6. Non-Functional Requirements
- **Latency**: P95 < 250ms for internal transfers; < 1.2s for AI intent resolution.
- **Availability**: 99.95% uptime across dual active-active cloud regions.
- **Compliance & Privacy**: ISO 27001, PCI-DSS Level 1, NDPR (Nigeria Data Protection Regulation), and Benin APDP compliance.

### 7. System Architecture
```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                               │
│     WhatsApp Business API  │  React / Next.js Web  │  Flutter Mobile   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / WSS / Webhooks
┌───────────────────────────────────▼────────────────────────────────────┐
│                           API GATEWAY & BFF                            │
│           Rate Limiting · JWT / HMAC Auth · Request Routing            │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
┌───────────────────▼───────────────┐   ┌───────────▼────────────────────┐
│      CONVERSATIONAL AI ENGINE     │   │      CORE BANKING SERVICES     │
│   Gemini 3.8 Flash Intent Parser  │   │  • Identity & KYC Service      │
│   Multilingual Router (EN / FR)   │   │  • Multi-Currency Wallet Engine│
│   Tool & Action Execution Graph   │   │  • Double-Entry Ledger Service │
└───────────────────┬───────────────┘   │  • Transfer & Settlement Engine│
                    │                   │  • Agent Network Manager       │
                    │                   └───────────┬────────────────────┘
                    │                               │
┌───────────────────▼───────────────────────────────▼────────────────────┐
│                  TREASURY, FX & RISK ENGINE (KAFKA)                    │
│   • Dynamic Market Maker (DMM)   • AML / Sanctions Screener            │
│   • NGN/XOF Liquidity Pools      • Real-Time Fraud & Anomaly Detector  │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
┌───────────────────▼───────────────┐   ┌───────────▼────────────────────┐
│       DATA PERSISTENCE TIER       │   │     EXTERNAL BANKING RAILS     │
│  PostgreSQL (Relational Ledger)   │   │  • Nigeria: NIBSS NIP / Paystack│
│  Redis (Rate Cache & Sessions)    │   │  • Benin: MTN MoMo, Moov, Wave │
│  Kafka (Event Streaming)          │   │  • Partner Banks: Zenith / BOA  │
└───────────────────────────────────┘   └────────────────────────────────┘
```

### 8. Microservice Architecture
- **Auth & Identity Service**: Phone OTP, session token issuance, role-based access control.
- **Ledger Service**: Immutable double-entry transaction posting (Debit/Credit balance invariants).
- **FX & Treasury Service**: Quotation engine, market-maker pricing, spread control, liquidity monitoring.
- **Payout Integration Service**: Orchestrates payment gateways across Nigeria and Benin.
- **AI Banking Assistant Service**: Orchestrates conversation context, tool-use calls, and translations.

### 9. Database Design (PostgreSQL Schema)
- Tables: `users`, `kyc_records`, `wallets`, `ledger_entries`, `transactions`, `fx_quotes`, `agents`, `commissions`, `audit_logs`.

### 10. API Specification
- REST & Webhook endpoints documented with OpenAPI standards:
  - `POST /api/v1/fx/quote`
  - `POST /api/v1/transfers/internal`
  - `POST /api/v1/transfers/external`
  - `POST /api/v1/whatsapp/webhook`
  - `POST /api/v1/ai/chat`

### 11. WhatsApp Conversation Flows (EN & FR)
- Onboarding flow with phone verification and KYC selfie upload link.
- Conversational swap, send, balance inquiry, and mini-statement generation.

### 12. Mobile & Web App Flows
- Biometric login, unified portfolio overview, one-tap swap, QR code merchant pay.

### 13. Admin Dashboard Flows
- Executive metrics, liquidity threshold alerts, manual transaction override, compliance freeze.

### 14. AI Assistant Architecture
- Integration of `gemini-3.8-flash` with strict function calling:
  - `check_balance({ currency })`
  - `get_exchange_rate({ from, to })`
  - `initiate_transfer({ recipient, amount, currency })`
  - `get_spending_insights({ timeframe })`

### 15. Agent Network Architecture
- Geo-distributed OTC cash distribution; agent liquidity float; tiered 0.4% cash-in / 0.6% cash-out commission splits.

### 16. Treasury & Liquidity System
- Dual-vault liquidity pools: $500k NGN float at Nigerian partner bank, 300M XOF float at Benin partner bank; automated rebalancing triggers via cross-border interbank SWIFT/UEMOA RTGS.

### 17. Security Architecture
- End-to-end payload encryption, HMAC webhook validation, HSM-backed master keys, PIN/biometric authentication for financial actions.

### 18. Compliance Architecture (CBN & BCEAO)
- **Nigeria**: Compliance with CBN Guidelines on Mobile Money and Cross-Border Remittances.
- **Benin**: Compliance with BCEAO Instruction N° 08/07/2010 on Electronic Money Issuance.

### 19. Revenue Model
- 0.8% - 1.5% FX conversion spread.
- Flat $0.25 equivalent on external bank/MoMo payouts.
- 0.15% merchant acceptance fee.

### 20. Unit Economics
- Average user volume: $450/month; Gross margin per user: $4.85/month; Customer Acquisition Cost (CAC): $1.40; LTV/CAC ratio: 12.8x.

### 21. Launch Roadmap
- **Phase 1 (Months 1–3)**: Regulatory sandbox partnership + WhatsApp closed beta (Lagos-Cotonou).
- **Phase 2 (Months 4–6)**: Public rollout + Agent network in Dantokpa & Trade Fair Lagos.
- **Phase 3 (Months 7–12)**: Expansion to Togo (Lomé) and Ghana (Accra).

### 22. Team Structure
- Core leadership: CEO, CTO, Head of Treasury, Head of Compliance (bilingual), Lead ML Engineer, Growth Leads (Lagos & Cotonou).

### 23. Scaling Strategy to 1 Million Users
- Distributed Kafka messaging, horizontally partitioned database clusters, edge-cached rate distribution via Redis Cluster.

### 24. Detailed Development Plan
- Sprint-by-sprint development phases with concrete milestones.

---

## 4. Technical Implementation & State Strategy

### 4.1 Client Architecture
- Single-page full-stack React + TypeScript app with Tailwind CSS.
- **Live Simulator Engine**:
  - Full financial state store with real double-entry ledger calculations.
  - Live Gemini 3.8 Flash server endpoint (`/api/ai/chat`) executing conversational banking function calling with realistic bilingual fallback.
  - Interactive WhatsApp viewport with real keyboard typing, sound cues, message bubbles, and action buttons.
  - Interactive Admin Treasury dashboard with live liquidity rebalancing and spread adjustments that immediately alter FX rates across the user wallet and WhatsApp.

---

## 5. Verification Plan
- Verify compilation with `npm run build` / `compile_applet`.
- Verify responsive layout across desktop and mobile screens.
- Test natural language conversational banking in English and French.
- Validate double-entry ledger arithmetic and rate lock mechanics.

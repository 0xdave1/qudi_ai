import { GoogleGenAI } from '@google/genai';
import { BotIntent, Currency, SupportedLanguage } from '../types/bot';

export interface ExtractedIntentPayload {
  intent: BotIntent;
  fromCurrency?: Currency;
  toCurrency?: Currency;
  amount?: number;
  recipientAccount?: string;
  recipientName?: string;
  transactionRef?: string;
  selectedLanguage?: SupportedLanguage;
  rawExplanation?: string;
}

class AIOrchestrator {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  public async classifyIntentAndExtract(
    userMessage: string,
    userLang: SupportedLanguage
  ): Promise<ExtractedIntentPayload> {
    const text = userMessage.trim().toLowerCase();

    // Fast-path deterministic classification for common keywords
    if (/^(hi|hello|hey|bonjour|salut|coucou|good morning|good evening)/i.test(text)) {
      return { intent: 'GREETING' };
    }
    if (/^(1|english|anglais)$/i.test(text) || text.includes('change language to english') || text.includes('parler anglais')) {
      return { intent: 'CHANGE_LANGUAGE', selectedLanguage: 'en' };
    }
    if (/^(2|french|français|francais)$/i.test(text) || text.includes('change language to french') || text.includes('passer en francais')) {
      return { intent: 'CHANGE_LANGUAGE', selectedLanguage: 'fr' };
    }
    if (text.includes('change language') || text.includes('changer de langue') || text.includes('changer la langue')) {
      return { intent: 'CHANGE_LANGUAGE' };
    }
    if (text.includes('support') || text.includes('human') || text.includes('aide') || text.includes('humain') || text.includes('agent') || text.includes('dispute') || text.includes('problème') || text.includes('remboursement') || text.includes('refund')) {
      return { intent: 'CUSTOMER_SUPPORT' };
    }
    if (text.includes('history') || text.includes('historique') || text.includes('mes transactions') || text.includes('my transactions') || text.includes('last transactions') || text.includes('derniers transferts')) {
      return { intent: 'TRANSACTION_HISTORY' };
    }
    if (text.includes('paid') || text.includes('j\'ai payé') || text.includes('jai paye') || text.includes('payment done') || text.includes('virement effectué') || text.includes('transfer sent')) {
      // Extract reference if present
      const refMatch = userMessage.match(/QX-[\w-]+/i);
      return {
        intent: 'SUBMIT_PAYMENT_PROOF',
        transactionRef: refMatch ? refMatch[0].toUpperCase() : undefined,
      };
    }
    if (/^(yes|confirm|confirmer|oui|d'accord|continue|continuer|procéder|1)$/i.test(text) || text.includes('confirm exchange') || text.includes('confirmer l\'échange')) {
      return { intent: 'CONFIRM_QUOTE' };
    }
    if (/^(no|cancel|annuler|non|stop|abort|2)$/i.test(text) || text.includes('cancel quote') || text.includes('annuler le devis')) {
      return { intent: 'CANCEL_QUOTE' };
    }

    // Try Gemini LLM for deep natural language understanding
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
- Currency names: "CFA", "FCFA", "Francs", "Cotonou", "Benin" -> "XOF". "Naira", "NGN", "₦", "Nigeria", "Lagos" -> "NGN".
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
          model: 'gemini-3.8-flash',
          contents: userMessage,
          config: {
            systemInstruction,
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        });

        const textOutput = response.text?.trim();
        if (textOutput) {
          const parsed = JSON.parse(textOutput);
          return {
            intent: parsed.intent || 'UNKNOWN_INTENT',
            fromCurrency: parsed.fromCurrency,
            toCurrency: parsed.toCurrency,
            amount: typeof parsed.amount === 'number' ? parsed.amount : undefined,
            transactionRef: parsed.transactionRef || undefined,
            recipientAccount: parsed.recipientAccount || undefined,
            recipientName: parsed.recipientName || undefined,
          };
        }
      } catch (err) {
        console.warn('[AI Orchestrator] Gemini classification failed, using regex fallback:', err);
      }
    }

    // Heuristic regex fallback
    return this.fallbackRegexClassification(userMessage);
  }

  private fallbackRegexClassification(msg: string): ExtractedIntentPayload {
    const text = msg.toLowerCase();

    // Check Rate: "what is the rate", "taux aujourd'hui"
    if (text.includes('rate') || text.includes('taux') || text.includes('exchange rate') || text.includes('cours')) {
      return { intent: 'CHECK_RATE' };
    }

    // Check specific transaction: "QX-1234"
    const refMatch = msg.match(/QX-[\w-]+/i);
    if (refMatch) {
      return {
        intent: 'CHECK_TRANSACTION',
        transactionRef: refMatch[0].toUpperCase(),
      };
    }

    // Conversion / quote request
    const isXof = text.includes('cfa') || text.includes('fcfa') || text.includes('xof');
    const isNgn = text.includes('naira') || text.includes('ngn') || text.includes('₦');

    if (text.includes('convert') || text.includes('exchange') || text.includes('change') || text.includes('échanger') || text.includes('convertir') || text.includes('send') || text.includes('envoyer') || (isXof && isNgn)) {
      const numMatch = text.match(/([0-9]+([0-9,.]*))(\s*(k|m))?/i);
      let amount: number | undefined;

      if (numMatch) {
        let rawNum = parseFloat(numMatch[1].replace(/,/g, ''));
        if (numMatch[4]?.toLowerCase() === 'k') rawNum *= 1000;
        if (numMatch[4]?.toLowerCase() === 'm') rawNum *= 1000000;
        amount = rawNum;
      }

      let fromCurrency: Currency | undefined;
      let toCurrency: Currency | undefined;

      if (text.includes('cfa to naira') || text.includes('xof to ngn') || text.includes('cfa en naira') || (isXof && !text.includes('naira to cfa'))) {
        fromCurrency = 'XOF';
        toCurrency = 'NGN';
      } else if (text.includes('naira to cfa') || text.includes('ngn to xof') || text.includes('naira en cfa') || isNgn) {
        fromCurrency = 'NGN';
        toCurrency = 'XOF';
      }

      return {
        intent: 'REQUEST_QUOTE',
        fromCurrency,
        toCurrency,
        amount,
      };
    }

    return { intent: 'UNKNOWN_INTENT' };
  }
}

export const aiOrchestrator = new AIOrchestrator();

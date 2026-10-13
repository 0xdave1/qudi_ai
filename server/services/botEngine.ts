import {
  Currency,
  ExchangeQuote,
  SupportedLanguage,
  Transaction,
  UserProfile,
} from '../types/bot';
import { aiOrchestrator } from './aiOrchestrator';
import { rateService } from './rateService';
import { supportService } from './supportService';
import { transactionService } from './transactionService';
import { whatsappService } from './whatsappService';
import { userService } from './userService';

class BotEngine {
  public async handleIncomingMessage(params: {
    from: string; // WhatsApp phone number e.g. "2348031234567"
    text: string;
    messageId?: string;
  }): Promise<{ replyText: string; handledIntent?: string }> {
    const { from, text, messageId } = params;
    const cleanText = text.trim();

    // 0. Deduplicate message
    if (messageId && whatsappService.isMessageProcessed(messageId)) {
      console.log(`[BotEngine] Duplicate message ${messageId} ignored.`);
      return { replyText: '', handledIntent: 'DUPLICATE_IGNORED' };
    }
    if (messageId) {
      whatsappService.markMessageProcessed(messageId);
    }

    // Persist inbound message to database
    whatsappService.persistMessageToDb({
      messageId,
      userPhone: from,
      direction: 'INBOUND',
      messageType: 'text',
      content: cleanText,
    }).catch(() => {});

    // 1. Identify or register user (persisted in Neon PostgreSQL)
    const { user, isNew } = await userService.getOrCreateUserAsync(from);

    // 2. Check if in Onboarding
    if (user.onboardingStep !== 'ACTIVE') {
      return this.handleOnboardingFlow(user, cleanText, isNew);
    }

    // 3. User is ACTIVE: Run conversational banking intent handling
    return this.handleActiveUserFlow(user, cleanText);
  }

  private getOrCreateUser(phone: string): { user: UserProfile; isNew: boolean } {
    return userService.getOrCreateUser(phone);
  }

  private updateUser(phone: string, updates: Partial<UserProfile>): UserProfile {
    return userService.updateUser(phone, updates);
  }

  private async handleOnboardingFlow(
    user: UserProfile,
    text: string,
    isNew: boolean
  ): Promise<{ replyText: string; handledIntent: string }> {
    const lower = text.toLowerCase();

    // STEP 1: Language selection
    if (user.onboardingStep === 'AWAITING_LANGUAGE') {
      if (lower === '1' || lower === 'en' || lower === 'english' || lower.includes('english')) {
        this.updateUser(user.phone, { language: 'en', onboardingStep: 'AWAITING_NAME' });
        const reply = `✅ **English selected.**\n\nWelcome to Qudi! What is your full legal name as it appears on your bank account or national ID?`;
        await whatsappService.sendTextMessage(user.phone, reply);
        return { replyText: reply, handledIntent: 'ONBOARDING_NAME' };
      }

      if (lower === '2' || lower === 'fr' || lower === 'français' || lower === 'francais' || lower.includes('francais')) {
        this.updateUser(user.phone, { language: 'fr', onboardingStep: 'AWAITING_NAME' });
        const reply = `✅ **Français sélectionné.**\n\nBienvenue sur Qudi ! Quel est votre nom complet tel qu'il apparaît sur votre pièce d'identité ou compte bancaire ?`;
        await whatsappService.sendTextMessage(user.phone, reply);
        return { replyText: reply, handledIntent: 'ONBOARDING_NAME' };
      }

      // Initial welcome message
      const welcome = `👋 **Welcome to Qudi!**\nI am your AI financial assistant for cross-border money exchange between Nigeria 🇳🇬 and Benin Republic 🇧🇯.\n\nChoose your preferred language / Choisissez votre langue :\n1. English\n2. Français\n\nReply with **1** or **2**.`;
      
      await whatsappService.sendInteractiveButtons(user.phone, welcome, [
        { type: 'reply', reply: { id: 'lang_en', title: '1. English' } },
        { type: 'reply', reply: { id: 'lang_fr', title: '2. Français' } },
      ]);

      return { replyText: welcome, handledIntent: 'ONBOARDING_LANGUAGE' };
    }

    // STEP 2: Name collection
    if (user.onboardingStep === 'AWAITING_NAME') {
      const name = text.replace(/my name is|je m'appelle|i am/gi, '').trim();
      const validName = name.length >= 2 ? name : 'Valued Trader';

      this.updateUser(user.phone, { name: validName, onboardingStep: 'AWAITING_COUNTRY' });

      if (user.language === 'fr') {
        const reply = `Enchanté, **${validName}** !\nDans quel pays êtes-vous basé principalement ?\n1. Nigeria 🇳🇬\n2. République du Bénin 🇧🇯\n\nRépondez par **1** ou **2**.`;
        await whatsappService.sendInteractiveButtons(user.phone, reply, [
          { type: 'reply', reply: { id: 'country_ng', title: '1. Nigeria' } },
          { type: 'reply', reply: { id: 'country_bj', title: '2. Bénin' } },
        ]);
        return { replyText: reply, handledIntent: 'ONBOARDING_COUNTRY' };
      } else {
        const reply = `Pleased to meet you, **${validName}**!\nWhich country are you primarily based in?\n1. Nigeria 🇳🇬\n2. Benin Republic 🇧🇯\n\nReply with **1** or **2**.`;
        await whatsappService.sendInteractiveButtons(user.phone, reply, [
          { type: 'reply', reply: { id: 'country_ng', title: '1. Nigeria' } },
          { type: 'reply', reply: { id: 'country_bj', title: '2. Benin' } },
        ]);
        return { replyText: reply, handledIntent: 'ONBOARDING_COUNTRY' };
      }
    }

    // STEP 3: Country selection
    if (user.onboardingStep === 'AWAITING_COUNTRY') {
      let country: 'NG' | 'BJ' = 'NG';
      if (lower === '2' || lower.includes('benin') || lower.includes('bénin')) {
        country = 'BJ';
      }
      this.updateUser(user.phone, { country, onboardingStep: 'AWAITING_CONSENT' });

      if (user.language === 'fr') {
        const consentMsg = `🔒 **Notice de Sécurité & Consentement**\n\nQudi opère avec des institutions financières régulées par la CBN (Nigeria) et la BCEAO (Bénin). Pour protéger vos fonds et lutter contre le blanchiment, chaque transfert fait l'objet d'un contrôle strict.\n\nVos données sont chiffrées et protégées.\n\nAcceptez-vous les conditions d'utilisation ?\n1. Oui, j'accepte\n2. Non`;
        await whatsappService.sendInteractiveButtons(user.phone, consentMsg, [
          { type: 'reply', reply: { id: 'consent_yes', title: 'Oui, j\'accepte' } },
          { type: 'reply', reply: { id: 'consent_no', title: 'Non' } },
        ]);
        return { replyText: consentMsg, handledIntent: 'ONBOARDING_CONSENT' };
      } else {
        const consentMsg = `🔒 **Consent & Regulatory Privacy Notice**\n\nQudi works with financial institutions licensed by the Central Bank of Nigeria (CBN) and BCEAO (Benin). To protect your money and comply with AML regulations, transaction funds are held in secure escrow until verified.\n\nYour personal data is encrypted and confidential.\n\nDo you accept our terms and conditions?\n1. Yes, I accept\n2. No`;
        await whatsappService.sendInteractiveButtons(user.phone, consentMsg, [
          { type: 'reply', reply: { id: 'consent_yes', title: 'Yes, I accept' } },
          { type: 'reply', reply: { id: 'consent_no', title: 'No' } },
        ]);
        return { replyText: consentMsg, handledIntent: 'ONBOARDING_CONSENT' };
      }
    }

    // STEP 4: Consent acceptance
    if (user.onboardingStep === 'AWAITING_CONSENT') {
      if (lower === '1' || lower === 'yes' || lower === 'oui' || lower.includes('accept') || lower.includes('consent_yes')) {
        this.updateUser(user.phone, {
          consentGiven: true,
          onboardingStep: 'ACTIVE',
          isVerified: true,
        });

        if (user.language === 'fr') {
          const readyMsg = `🎉 **Bienvenue sur Qudi, ${user.name} !**\n\nVotre compte WhatsApp est maintenant activé pour les échanges entre le **Naira Nigérian (NGN)** et le **Franc CFA (XOF)**.\n\nVous pouvez m'écrire naturellement, par exemple :\n• "Quel est le taux de change aujourd'hui ?"\n• "Je veux échanger 100 000 FCFA en Naira"\n• "Combien vais-je recevoir pour 50 000 Naira en CFA ?"\n• "Changer la langue en anglais"`;
          await whatsappService.sendTextMessage(user.phone, readyMsg);
          return { replyText: readyMsg, handledIntent: 'ONBOARDING_COMPLETE' };
        } else {
          const readyMsg = `🎉 **Welcome to Qudi, ${user.name}!**\n\nYour WhatsApp account is active for fast, reliable exchange between **Nigerian Naira (NGN)** and **West African CFA Franc (XOF)**.\n\nYou can chat naturally, for example:\n• "What is today's exchange rate?"\n• "I want to exchange 100,000 CFA to Naira"\n• "How much will I receive for 50,000 Naira?"\n• "Change language to French"`;
          await whatsappService.sendTextMessage(user.phone, readyMsg);
          return { replyText: readyMsg, handledIntent: 'ONBOARDING_COMPLETE' };
        }
      } else {
        const declinedMsg = user.language === 'fr'
          ? `Vous devez accepter les conditions pour continuer. Répondez **1** pour accepter.`
          : `You must accept terms to transact with Qudi. Reply **1** to accept.`;
        await whatsappService.sendTextMessage(user.phone, declinedMsg);
        return { replyText: declinedMsg, handledIntent: 'ONBOARDING_DECLINED' };
      }
    }

    return { replyText: 'Ready', handledIntent: 'ACTIVE' };
  }

  private async handleActiveUserFlow(
    user: UserProfile,
    text: string
  ): Promise<{ replyText: string; handledIntent: string }> {
    const isFr = user.language === 'fr';

    // 1. Language change trigger
    if (
      text.toLowerCase().includes('change language') ||
      text.toLowerCase().includes('changer de langue') ||
      text.toLowerCase().includes('changer la langue')
    ) {
      const msg = isFr
        ? `Choisissez votre langue :\n1. English\n2. Français`
        : `Choose your preferred language:\n1. English\n2. Français`;
      await whatsappService.sendInteractiveButtons(user.phone, msg, [
        { type: 'reply', reply: { id: 'set_lang_en', title: 'English' } },
        { type: 'reply', reply: { id: 'set_lang_fr', title: 'Français' } },
      ]);
      return { replyText: msg, handledIntent: 'PROMPT_CHANGE_LANGUAGE' };
    }

    // Direct language switcher keywords
    if (/^(set_lang_en|1|english)$/i.test(text) && user.language !== 'en') {
      this.updateUser(user.phone, { language: 'en' });
      const msg = `✅ Language switched to **English**. How can I assist you with your NGN/XOF exchange today?`;
      await whatsappService.sendTextMessage(user.phone, msg);
      return { replyText: msg, handledIntent: 'CHANGE_LANGUAGE_EN' };
    }
    if (/^(set_lang_fr|2|français|francais|french)$/i.test(text) && user.language !== 'fr') {
      this.updateUser(user.phone, { language: 'fr' });
      const msg = `✅ Langue changée en **Français**. Comment puis-je vous aider pour vos échanges NGN/XOF aujourd'hui ?`;
      await whatsappService.sendTextMessage(user.phone, msg);
      return { replyText: msg, handledIntent: 'CHANGE_LANGUAGE_FR' };
    }

    // 2. Classify intent via AI Orchestrator
    const extraction = await aiOrchestrator.classifyIntentAndExtract(text, user.language);

    switch (extraction.intent) {
      case 'GREETING': {
        const greeting = isFr
          ? `Bonjour **${user.name}** ! Comment puis-je vous aider aujourd'hui ?\n\n• Demandez : "Quel est le taux aujourd'hui ?"\n• Ou : "Je veux échanger 100 000 FCFA en Naira"\n• Ou : "Historique de mes transferts"`
          : `Hello **${user.name}**! How can I help you today?\n\n• Ask: "What is today's exchange rate?"\n• Or: "I want to exchange 100,000 CFA to Naira"\n• Or: "Show my last transactions"`;
        await whatsappService.sendTextMessage(user.phone, greeting);
        return { replyText: greeting, handledIntent: 'GREETING' };
      }

      case 'CHECK_RATE': {
        const rates = rateService.getRates();
        const reply = isFr
          ? `📊 **Taux de Change Indicatifs du Jour (NGN ⇄ XOF)** :\n\n• **1 XOF = ₦${rates.xofToNgnRate.toFixed(2)} NGN**\n• **1 000 NGN = ${(rates.ngnToXofRate * 1000).toFixed(1)} FCFA**\n\nFrais transparents Qudi : ${(rates.feePercentage * 100).toFixed(1)}%\n\n*Les taux sont indicatifs jusqu'à la génération d'un devis ferme valable 10 minutes.*\n\nPour obtenir un devis, écrivez par exemple :\n👉 *"Convertir 100 000 FCFA en Naira"*`
          : `📊 **Today's Indicative Exchange Rates (NGN ⇄ XOF)**:\n\n• **1 XOF = ₦${rates.xofToNgnRate.toFixed(2)} NGN**\n• **1,000 NGN = ${(rates.ngnToXofRate * 1000).toFixed(1)} XOF**\n\nTransparent Qudi Fee: ${(rates.feePercentage * 100).toFixed(1)}%\n\n*Rates are indicative until you request a confirmed transaction quote (valid for 10 minutes).*\n\nTo get a quote, say for example:\n👉 *"Exchange 100,000 CFA to Naira"*`;
        await whatsappService.sendTextMessage(user.phone, reply);
        return { replyText: reply, handledIntent: 'CHECK_RATE' };
      }

      case 'REQUEST_QUOTE': {
        let fromCurr: Currency = extraction.fromCurrency || 'XOF';
        let toCurr: Currency = extraction.toCurrency || (fromCurr === 'XOF' ? 'NGN' : 'XOF');
        let amount = extraction.amount;

        if (!amount || amount <= 0) {
          const askAmount = isFr
            ? `Combien souhaitez-vous échanger et dans quelle devise ?\nExemple : *"Convertir 100 000 FCFA en Naira"* ou *"Échanger 50 000 Naira en CFA"*`
            : `How much would you like to exchange and in which currency?\nExample: *"Convert 100,000 CFA to Naira"* or *"Exchange 50,000 Naira to CFA"*`;
          await whatsappService.sendTextMessage(user.phone, askAmount);
          return { replyText: askAmount, handledIntent: 'CLARIFY_AMOUNT' };
        }

        const quoteResult = rateService.calculateQuote({
          userPhone: user.phone,
          fromCurrency: fromCurr,
          toCurrency: toCurr,
          amount,
        });

        if (!quoteResult.success || !quoteResult.quote) {
          const errMsg = isFr
            ? (quoteResult.errorFr || 'Impossible de calculer le devis.')
            : (quoteResult.error || 'Could not calculate quote.');
          await whatsappService.sendTextMessage(user.phone, `⚠️ ${errMsg}`);
          return { replyText: errMsg, handledIntent: 'QUOTE_ERROR' };
        }

        const q = quoteResult.quote;
        const expiryTime = new Date(q.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const quoteText = isFr
          ? `💱 **Devis de Change Qudi** (Réf: ${q.id})\n\n• Vous donnez : **${q.fromAmount.toLocaleString()} ${q.fromCurrency}**\n• Taux appliqué : 1 ${q.fromCurrency} = ${q.rate} ${q.toCurrency}\n• Frais Qudi (${(rateService.getRates().feePercentage * 100).toFixed(1)}%) : ${q.fee.toLocaleString()} ${q.fromCurrency}\n• Le bénéficiaire recevra : **${q.toAmount.toLocaleString()} ${q.toCurrency}**\n\n⏰ Ce devis expire à **${expiryTime}** (dans 10 minutes).\n\nSouhaitez-vous continuer ?\nRépondez **1** ou **Confirmer**\nRépondez **2** ou **Annuler**`
          : `💱 **Qudi Exchange Quote** (Ref: ${q.id})\n\n• You send: **${q.fromAmount.toLocaleString()} ${q.fromCurrency}**\n• Quoted Rate: 1 ${q.fromCurrency} = ${q.rate} ${q.toCurrency}\n• Qudi Fee (${(rateService.getRates().feePercentage * 100).toFixed(1)}%): ${q.fee.toLocaleString()} ${q.fromCurrency}\n• Recipient receives: **${q.toAmount.toLocaleString()} ${q.toCurrency}**\n\n⏰ Quote expires at **${expiryTime}** (10 minutes).\n\nWould you like to continue?\nReply **1** or **Confirm** to proceed\nReply **2** or **Cancel** to cancel`;

        await whatsappService.sendInteractiveButtons(user.phone, quoteText, [
          { type: 'reply', reply: { id: `confirm_${q.id}`, title: isFr ? 'Confirmer Devis' : 'Confirm Quote' } },
          { type: 'reply', reply: { id: `cancel_${q.id}`, title: isFr ? 'Annuler' : 'Cancel' } },
        ]);

        return { replyText: quoteText, handledIntent: 'REQUEST_QUOTE' };
      }

      case 'CONFIRM_QUOTE': {
        const activeQuote = rateService.getLatestActiveQuoteForUser(user.phone);
        if (!activeQuote) {
          const noQuote = isFr
            ? `Vous n'avez aucun devis actif en attente. Demandez un nouveau devis (ex: *"Convertir 100 000 FCFA en Naira"*).`
            : `You have no active pending quote. Please request a new quote first (e.g. *"Exchange 100,000 CFA to Naira"*).`;
          await whatsappService.sendTextMessage(user.phone, noQuote);
          return { replyText: noQuote, handledIntent: 'NO_ACTIVE_QUOTE' };
        }

        // Generate Transaction
        const recipientAccount = extraction.recipientAccount || (activeQuote.toCurrency === 'NGN' ? 'Zenith / GTBank Account' : '+229 97 12 34 56 (MTN MoMo)');
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
          recipientRail: activeQuote.toCurrency === 'NGN' ? 'NIBSS_NIP' : 'MTN_MOMO',
        });

        const pi = tx.paymentInstructions;

        const txCreatedMsg = isFr
          ? `✅ **Transaction Initiée !**\nRéférence : **${tx.reference}**\n\nPour finaliser votre échange, veuillez effectuer le transfert de **${tx.fromAmount.toLocaleString()} ${tx.fromCurrency}** vers notre compte séquestre dédié :\n\n🏦 **Banque / Opérateur** : ${pi.bankOrProvider}\n🔢 **Numéro de compte / Code Marchand** : ${pi.accountOrMerchantCode}\n👤 **Bénéficiaire** : ${pi.accountName}\n📝 **Motif obligatoire** : **${tx.reference}**\n\n📌 *Dès que le paiement est fait, écrivez ici : "Paiement envoyé" ou "J'ai payé" pour vérification.*`
          : `✅ **Transaction Created!**\nReference: **${tx.reference}**\n\nTo complete your exchange, please transfer **${tx.fromAmount.toLocaleString()} ${tx.fromCurrency}** to our approved escrow account:\n\n🏦 **Bank / Provider**: ${pi.bankOrProvider}\n🔢 **Account / Merchant Code**: ${pi.accountOrMerchantCode}\n👤 **Account Name**: ${pi.accountName}\n📝 **Required Narration**: **${tx.reference}**\n\n📌 *Once transferred, reply **"Payment sent"** or **"I have paid"** for verification.*`;

        await whatsappService.sendTextMessage(user.phone, txCreatedMsg);
        return { replyText: txCreatedMsg, handledIntent: 'TRANSACTION_CREATED' };
      }

      case 'CANCEL_QUOTE': {
        const activeQuote = rateService.getLatestActiveQuoteForUser(user.phone);
        if (activeQuote) {
          rateService.updateQuoteStatus(activeQuote.id, 'CANCELLED');
        }
        const cancelMsg = isFr
          ? `❌ Devis annulé. N'hésitez pas à me demander un nouveau taux ou un autre montant quand vous le souhaitez.`
          : `❌ Quote cancelled. Feel free to request a new exchange whenever you are ready.`;
        await whatsappService.sendTextMessage(user.phone, cancelMsg);
        return { replyText: cancelMsg, handledIntent: 'CANCEL_QUOTE' };
      }

      case 'SUBMIT_PAYMENT_PROOF': {
        const activeTx = transactionService.getLatestActiveTransaction(user.phone);
        if (!activeTx) {
          const noTx = isFr
            ? `Vous n'avez aucune transaction en attente de paiement. Veuillez d'abord créer une transaction.`
            : `You have no pending transaction awaiting payment. Please initiate an exchange first.`;
          await whatsappService.sendTextMessage(user.phone, noTx);
          return { replyText: noTx, handledIntent: 'NO_PENDING_TX' };
        }

        transactionService.submitPaymentProof(activeTx.reference, text);

        const proofReceived = isFr
          ? `📩 **Preuve de Paiement Enregistrée !**\nRéférence : **${activeTx.reference}**\nStatut : **En cours de vérification bancaire**\n\nNos équipes et nos passerelles de paiement partenaires vérifient la réception des fonds.\n\n⚠️ *Conformément aux règles de sécurité financière, les fonds du bénéficiaire ne sont débloqués qu'après validation effective sur nos comptes bancaires/MoMo.* Vous recevrez un reçu instantané dès validation.`
          : `📩 **Payment Proof Submitted!**\nReference: **${activeTx.reference}**\nStatus: **Payment Verification in Progress**\n\nOur operations desk and banking rails are verifying receipt of your funds.\n\n⚠️ *In line with financial safety standards, recipient payout is initiated only upon verified receipt of cleared funds.* You will receive a confirmed WhatsApp receipt as soon as verified.`;

        await whatsappService.sendTextMessage(user.phone, proofReceived);
        return { replyText: proofReceived, handledIntent: 'PAYMENT_PROOF_SUBMITTED' };
      }

      case 'CHECK_TRANSACTION': {
        const ref = extraction.transactionRef;
        const tx = ref
          ? transactionService.getUserTransactionByRef(user.phone, ref)
          : transactionService.getLatestActiveTransaction(user.phone);

        if (!tx) {
          const notFound = isFr
            ? `Aucune transaction trouvée avec cette référence pour votre numéro.`
            : `No transaction found with that reference for your phone number.`;
          await whatsappService.sendTextMessage(user.phone, notFound);
          return { replyText: notFound, handledIntent: 'TX_NOT_FOUND' };
        }

        const txDetail = isFr
          ? `🔍 **Statut de votre Transaction**\n\n• Référence : **${tx.reference}**\n• Statut : **${tx.status}**\n• Montant envoyé : ${tx.fromAmount.toLocaleString()} ${tx.fromCurrency}\n• Montant à recevoir : ${tx.toAmount.toLocaleString()} ${tx.toCurrency}\n• Destinataire : ${tx.recipientName} (${tx.recipientAccount})\n• Date : ${new Date(tx.createdAt).toLocaleDateString()}`
          : `🔍 **Transaction Status**\n\n• Reference: **${tx.reference}**\n• Status: **${tx.status}**\n• Sent: ${tx.fromAmount.toLocaleString()} ${tx.fromCurrency}\n• To Receive: ${tx.toAmount.toLocaleString()} ${tx.toCurrency}\n• Recipient: ${tx.recipientName} (${tx.recipientAccount})\n• Date: ${new Date(tx.createdAt).toLocaleDateString()}`;

        await whatsappService.sendTextMessage(user.phone, txDetail);
        return { replyText: txDetail, handledIntent: 'CHECK_TRANSACTION' };
      }

      case 'TRANSACTION_HISTORY': {
        const txList = transactionService.getUserTransactions(user.phone, 5);
        if (txList.length === 0) {
          const noHistory = isFr
            ? `Vous n'avez effectué aucune transaction pour le moment. Écrivez "Convertir 50 000 FCFA" pour commencer.`
            : `You have not completed any transactions yet. Say "Exchange 50,000 CFA" to get started.`;
          await whatsappService.sendTextMessage(user.phone, noHistory);
          return { replyText: noHistory, handledIntent: 'HISTORY_EMPTY' };
        }

        const lines = txList.map(
          (t: Transaction) =>
            `• **${t.reference}** : ${t.fromAmount.toLocaleString()} ${t.fromCurrency} → ${t.toAmount.toLocaleString()} ${t.toCurrency} [${t.status}]`
        );

        const historyMsg = isFr
          ? `📜 **Vos Dernières Transactions** :\n\n${lines.join('\n')}\n\nPour voir le détail d'un transfert, envoyez sa référence (ex: *${txList[0].reference}*).`
          : `📜 **Your Recent Transactions**:\n\n${lines.join('\n')}\n\nTo view details of any transfer, send its reference (e.g. *${txList[0].reference}*).`;

        await whatsappService.sendTextMessage(user.phone, historyMsg);
        return { replyText: historyMsg, handledIntent: 'TRANSACTION_HISTORY' };
      }

      case 'CUSTOMER_SUPPORT': {
        const ticket = supportService.createTicket({
          userPhone: user.phone,
          userName: user.name,
          subject: 'WhatsApp Customer Support Request',
          message: text,
        });

        const supportMsg = isFr
          ? `👨‍💼 **Assistance Humaine Déclenchée**\n\nVotre ticket d'assistance **#${ticket.ticketNumber}** a été ouvert. Un conseiller bilingue a été alerté et va intervenir directement dans cette discussion WhatsApp pour vous aider.\n\nVous pouvez nous détailler votre question ou le problème rencontré.`
          : `👨‍💼 **Human Support Requested**\n\nSupport Ticket **#${ticket.ticketNumber}** has been opened. A bilingual support and compliance agent has been notified and will assist you directly in this WhatsApp conversation shortly.\n\nPlease describe any dispute, question, or transaction reference you need help with.`;

        await whatsappService.sendTextMessage(user.phone, supportMsg);
        return { replyText: supportMsg, handledIntent: 'CUSTOMER_SUPPORT' };
      }

      default: {
        const fallback = isFr
          ? `Je n'ai pas bien compris votre demande. Je peux vous aider à :\n1. Connaître le taux du jour (*"Quel est le taux ?"*)\n2. Échanger de l'argent (*"Échanger 100 000 FCFA en Naira"*)\n3. Suivre un transfert (*"Statut de mon transfert"*)\n4. Parler à un agent humain (*"Aide"*)\n5. Changer de langue (*"English"* ou *"Français"*)`
          : `I didn't quite catch that. I can help you with:\n1. Today's rate (*"What is the rate?"*)\n2. Exchange currency (*"Exchange 100,000 CFA to Naira"*)\n3. Check a transfer (*"Show my last transactions"*)\n4. Talk to human support (*"Support"*)\n5. Change language (*"English"* or *"Français"*)`;
        await whatsappService.sendTextMessage(user.phone, fallback);
        return { replyText: fallback, handledIntent: 'UNKNOWN_FALLBACK' };
      }
    }
  }
}

export const botEngine = new BotEngine();

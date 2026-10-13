import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Language, TransactionRecord } from '../types/banking';
import {
  Send,
  CheckCheck,
  ArrowRightLeft,
  Clock,
  Sparkles,
  Download,
  AlertCircle,
  FileText,
  BadgeCheck,
  ShieldCheck,
  RefreshCw,
  PhoneCall,
  MoreVertical,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  action?: string;
  actionPayload?: any;
  cardType?: 'QUOTE_LOCK' | 'SEND_APPROVAL' | 'RECEIPT' | 'BALANCE';
  status?: 'pending' | 'executed' | 'cancelled';
}

interface WhatsAppSimulatorProps {
  userProfile: UserProfile;
  language: Language;
  onExecuteSwap: (fromCurrency: 'NGN' | 'XOF', toCurrency: 'NGN' | 'XOF', fromAmount: number, toAmount: number) => void;
  onExecuteSend: (recipient: string, amount: number, currency: 'NGN' | 'XOF', rail: string) => void;
  recentTransactions: TransactionRecord[];
}

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({
  userProfile,
  language,
  onExecuteSwap,
  onExecuteSend,
  recentTransactions,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lockCountdown, setLockCountdown] = useState<number>(15);
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [pinInput, setPinInput] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionRecord | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize initial conversation based on language
  useEffect(() => {
    const welcomeEn: ChatMessage[] = [
      {
        id: 'msg_welcome',
        sender: 'bot',
        text: `👋 **Welcome to Qudi Banking!**\n\nI am your AI assistant for seamless cross-border money movement between Nigeria 🇳🇬 and Benin Republic 🇧🇯.\n\nYour Verified Wallets:\n• NGN: ₦${userProfile.wallets.NGN.balance.toLocaleString()}\n• XOF: ${userProfile.wallets.XOF.balance.toLocaleString()} FCFA\n\nHow can I help you today? You can type naturally like:\n• "Convert 100,000 CFA to Naira"\n• "Send 50,000 CFA to David"\n• "What's today's exchange rate?"`,
        timestamp: '10:02 AM',
      },
    ];

    const welcomeFr: ChatMessage[] = [
      {
        id: 'msg_welcome',
        sender: 'bot',
        text: `👋 **Bienvenue sur Qudi Banking !**\n\nJe suis votre assistant IA pour les transferts et le change instantanés entre le Nigeria 🇳🇬 et le Bénin 🇧🇯.\n\nVos Portefeuilles Vérifiés :\n• NGN : ₦${userProfile.wallets.NGN.balance.toLocaleString()}\n• XOF : ${userProfile.wallets.XOF.balance.toLocaleString()} FCFA\n\nComment puis-je vous aider ? Vous pouvez écrire naturellement :\n• "Convertis 100 000 FCFA en Naira"\n• "Envoie 50 000 FCFA à David"\n• "Quel est le taux de change du jour ?"`,
        timestamp: '10:02 AM',
      },
    ];

    setMessages(language === 'fr' ? welcomeFr : welcomeEn);
  }, [language]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Rate lock countdown timer
  useEffect(() => {
    if (!activeQuoteId) return;
    const interval = setInterval(() => {
      setLockCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setActiveQuoteId(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQuoteId]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsgId = `usr_${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: nowTime,
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language,
          userProfile: {
            name: userProfile.name,
            phone: userProfile.phone,
            ngnBalance: userProfile.wallets.NGN.balance,
            xofBalance: userProfile.wallets.XOF.balance,
          },
        }),
      });

      const data = await response.json();
      const botMsgId = `bot_${Date.now()}`;

      let cardType: ChatMessage['cardType'] = undefined;
      if (data.action === 'convertCurrency') {
        cardType = 'QUOTE_LOCK';
        setActiveQuoteId(botMsgId);
        setLockCountdown(15);
      } else if (data.action === 'sendMoney') {
        cardType = 'SEND_APPROVAL';
      } else if (data.action === 'checkBalance') {
        cardType = 'BALANCE';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: 'bot',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: data.action,
          actionPayload: data.actionPayload,
          cardType,
          status: 'pending',
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'bot',
          text: language === 'fr' 
            ? 'Désolé, une erreur de connexion réseau est survenue. Veuillez réessayer.' 
            : 'Network connection error. Please try again.',
          timestamp: nowTime,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmSwap = (messageId: string, payload: any) => {
    const fromCurr = payload.fromCurrency || 'XOF';
    const toCurr = payload.toCurrency || 'NGN';
    const fromAmt = payload.amount || 100000;
    const estAmt = payload.estimatedReceive || (fromCurr === 'XOF' ? Math.round(fromAmt * 2.55) : Math.round(fromAmt / 2.55));

    onExecuteSwap(fromCurr, toCurr, fromAmt, estAmt);

    // Update message status
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, status: 'executed' } : msg
      )
    );

    setActiveQuoteId(null);

    // Add confirmation message
    const confirmTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        id: `bot_confirm_${Date.now()}`,
        sender: 'bot',
        text: language === 'fr'
          ? `✅ **Transaction Exécutée avec Succès !**\n\n• Débité : **${fromAmt.toLocaleString()} ${fromCurr}**\n• Crédité : **${estAmt.toLocaleString()} ${toCurr}**\n• Référence : **TX-${Math.random().toString(36).substring(2, 9).toUpperCase()}**\n\nVos nouveaux soldes ont été mis à jour instantanément.`
          : `✅ **Swap Executed Successfully!**\n\n• Debited: **${fromAmt.toLocaleString()} ${fromCurr}**\n• Credited: **${estAmt.toLocaleString()} ${toCurr}**\n• Reference: **TX-${Math.random().toString(36).substring(2, 9).toUpperCase()}**\n\nYour dual-currency balances updated immediately.`,
        timestamp: confirmTime,
        cardType: 'RECEIPT',
        actionPayload: {
          reference: `TX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          fromAmt,
          fromCurr,
          toAmt: estAmt,
          toCurr,
        },
      },
    ]);
  };

  const handleInitiatePinApproval = (payload: any) => {
    setPendingAction(payload);
    setPinInput('');
    setPinModalOpen(true);
  };

  const handleAuthorizePin = () => {
    if (!pendingAction) return;
    const recipient = pendingAction.recipient || 'David (Cotonou)';
    const amount = pendingAction.amount || 50000;
    const currency = pendingAction.currency || 'XOF';

    onExecuteSend(recipient, amount, currency, 'Qudi Internal / MoMo');
    setPinModalOpen(false);

    const confirmTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        id: `bot_send_done_${Date.now()}`,
        sender: 'bot',
        text: language === 'fr'
          ? `💸 **Transfert Réussi !**\n\n**${amount.toLocaleString()} ${currency}** envoyés à **${recipient}**.\nLe destinataire recevra une notification instantanée.`
          : `💸 **Transfer Completed!**\n\nSent **${amount.toLocaleString()} ${currency}** to **${recipient}**.\nRecipient received instant credit notification.`,
        timestamp: confirmTime,
        cardType: 'RECEIPT',
        actionPayload: {
          reference: `TX-OUT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          recipient,
          amount,
          currency,
        },
      },
    ]);
  };

  const quickPrompts = language === 'fr'
    ? [
        'Convertis 100 000 FCFA en Naira',
        'Envoie 50 000 FCFA à David',
        'Quel est mon solde ?',
        'Quel est le taux de change du jour ?',
        'Montre mes dépenses du mois',
        'Transfère 25 000 Naira vers mon compte Bénin',
      ]
    : [
        'Convert 100,000 CFA to Naira',
        'Send 50,000 CFA to David',
        'How much money do I have?',
        "What's today's exchange rate?",
        'Show my spending this month',
        'Transfer 25,000 Naira to my Benin wallet',
      ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Container simulating a sleek WhatsApp desktop/web client */}
      <div className="bg-[#0b141a] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[740px]">
        
        {/* WhatsApp Header */}
        <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-base">
                Q
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#1f2c34] rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white text-sm">Qudi Banking AI</span>
                <BadgeCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              </div>
              <span className="text-[11px] text-emerald-400 font-medium">
                {language === 'fr' ? 'Compte Professionnel Vérifié · En ligne' : 'Verified Business · Online'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <button
              onClick={() => {
                setMessages([]);
                setTimeout(() => handleSendMessage(quickPrompts[2]), 100);
              }}
              className="p-1.5 hover:bg-slate-700 rounded-full transition-colors text-slate-300 hover:text-white"
              title="Reset Conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="h-4 w-[1px] bg-slate-700"></div>
            <span className="text-xs font-mono-nums text-slate-400 hidden sm:inline">
              +234 1 800 QUDI
            </span>
          </div>
        </div>

        {/* WhatsApp Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0c1317] bg-opacity-95 bg-[radial-gradient(#182229_1px,transparent_1px)] [background-size:16px_16px]">
          
          {/* Security notice banner */}
          <div className="flex justify-center my-2">
            <div className="bg-[#182229] border border-amber-900/40 rounded-lg px-3 py-1.5 text-[11px] text-amber-200/90 flex items-center gap-2 max-w-md text-center shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {language === 'fr'
                  ? 'Messages chiffrés de bout en bout. Partenaire bancaire régulé CBN & BCEAO.'
                  : 'Messages are end-to-end encrypted. Partnered with CBN & BCEAO regulated banks.'}
              </span>
            </div>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-[#005c4b] text-white rounded-tr-none'
                    : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/50'
                }`}
              >
                {/* Text Body */}
                <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>

                {/* Interactive Card: Rate Lock Card */}
                {msg.cardType === 'QUOTE_LOCK' && msg.actionPayload && (
                  <div className="mt-3 pt-3 border-t border-slate-700/80 space-y-2">
                    <div className="bg-slate-900/80 rounded-xl p-3 border border-emerald-500/30">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {language === 'fr' ? 'Taux Garanti' : 'Guaranteed Rate'}
                        </span>
                        <span className="font-mono-nums text-xs text-amber-400 font-bold">
                          {lockCountdown > 0 ? `${lockCountdown}s` : language === 'fr' ? 'Expiré' : 'Expired'}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mb-2">
                        <div
                          className="bg-emerald-400 h-full transition-all duration-1000"
                          style={{ width: `${(lockCountdown / 15) * 100}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono-nums py-1 border-b border-slate-800">
                        <span className="text-slate-400">
                          {language === 'fr' ? 'Vous donnez :' : 'You Pay:'}
                        </span>
                        <span className="text-white font-semibold">
                          {msg.actionPayload.amount?.toLocaleString()} {msg.actionPayload.fromCurrency}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono-nums py-1">
                        <span className="text-slate-400">
                          {language === 'fr' ? 'Vous recevez :' : 'You Receive:'}
                        </span>
                        <span className="text-emerald-400 font-bold text-sm">
                          {msg.actionPayload.estimatedReceive?.toLocaleString()} {msg.actionPayload.toCurrency}
                        </span>
                      </div>
                    </div>

                    {msg.status !== 'executed' ? (
                      <button
                        disabled={lockCountdown === 0}
                        onClick={() => handleConfirmSwap(msg.id, msg.actionPayload)}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          lockCountdown > 0
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>
                          {lockCountdown > 0
                            ? language === 'fr' ? 'Confirmer le Swap Immédiat' : 'Confirm Instant Swap'
                            : language === 'fr' ? 'Taux Expiré - Redemandez' : 'Quote Expired - Request New'}
                        </span>
                      </button>
                    ) : (
                      <div className="text-center text-xs text-emerald-400 font-semibold py-1">
                        ✓ {language === 'fr' ? 'Converti avec succès' : 'Converted Successfully'}
                      </div>
                    )}
                  </div>
                )}

                {/* Interactive Card: Send Approval */}
                {msg.cardType === 'SEND_APPROVAL' && msg.actionPayload && (
                  <div className="mt-3 pt-3 border-t border-slate-700/80">
                    <button
                      onClick={() => handleInitiatePinApproval(msg.actionPayload)}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{language === 'fr' ? 'Autoriser avec le PIN Secret' : 'Authorize with 4-Digit PIN'}</span>
                    </button>
                  </div>
                )}

                {/* Interactive Card: Receipt */}
                {msg.cardType === 'RECEIPT' && msg.actionPayload && (
                  <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="font-mono-nums text-slate-400">
                      Ref: {msg.actionPayload.reference}
                    </span>
                    <button
                      onClick={() => alert(`Receipt downloaded for ${msg.actionPayload.reference}. Verified on ECOWAS RTGS.`)}
                      className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>{language === 'fr' ? 'Reçu PDF' : 'PDF Receipt'}</span>
                    </button>
                  </div>
                )}

                {/* Bubble Timestamp & Status */}
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-1">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-sky-400" />}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start">
              <div className="bg-[#202c33] text-slate-400 rounded-2xl rounded-tl-none px-4 py-2 text-xs flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span>{language === 'fr' ? 'Qudi AI réfléchit...' : 'Qudi AI is typing...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-[#111b21] px-3 py-2 border-t border-slate-800/80 overflow-x-auto flex items-center gap-2 scrollbar-none">
          <span className="text-[11px] text-slate-400 shrink-0 font-medium">
            {language === 'fr' ? 'Suggestions :' : 'Quick actions:'}
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-slate-700/60 shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* WhatsApp Chat Input Footer */}
        <div className="bg-[#202c33] p-3 flex items-center gap-2 border-t border-slate-700/60">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={
              language === 'fr'
                ? 'Écrivez naturellement (ex: "Convertis 50 000 CFA")...'
                : 'Type naturally (e.g. "Convert 100,000 CFA to Naira")...'
            }
            className="flex-1 bg-[#2a3942] text-white text-sm rounded-lg px-4 py-2.5 outline-none placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim()}
            className={`p-2.5 rounded-full transition-colors ${
              inputMessage.trim()
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Security PIN Authorization Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-slate-100">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span>{language === 'fr' ? 'Autorisation Sécurisée' : 'Security Authorization'}</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {language === 'fr'
                ? `Veuillez saisir votre code PIN à 4 chiffres pour envoyer ${pendingAction?.amount?.toLocaleString()} ${pendingAction?.currency} à ${pendingAction?.recipient}.`
                : `Enter your 4-digit PIN to transfer ${pendingAction?.amount?.toLocaleString()} ${pendingAction?.currency} to ${pendingAction?.recipient}.`}
            </p>

            <div className="flex justify-center mb-6">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-32 tracking-widest text-center text-2xl font-mono-nums bg-slate-950 border border-slate-700 rounded-lg py-2 outline-none focus:border-emerald-500 text-emerald-400"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPinModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
              >
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={handleAuthorizePin}
                disabled={pinInput.length < 4}
                className="flex-1 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg disabled:opacity-50 font-bold"
              >
                {language === 'fr' ? 'Valider' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

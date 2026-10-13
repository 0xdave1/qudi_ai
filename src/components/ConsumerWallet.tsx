import React, { useState, useEffect } from 'react';
import { UserProfile, Language, TransactionRecord } from '../types/banking';
import {
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  Copy,
  Check,
  Clock,
  Download,
  Search,
  Filter,
  ShieldCheck,
  Sparkles,
  Building2,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

interface ConsumerWalletProps {
  userProfile: UserProfile;
  language: Language;
  onExecuteSwap: (fromCurrency: 'NGN' | 'XOF', toCurrency: 'NGN' | 'XOF', fromAmount: number, toAmount: number) => void;
  onExecuteSend: (recipient: string, amount: number, currency: 'NGN' | 'XOF', rail: string) => void;
  transactions: TransactionRecord[];
}

export const ConsumerWallet: React.FC<ConsumerWalletProps> = ({
  userProfile,
  language,
  onExecuteSwap,
  onExecuteSend,
  transactions,
}) => {
  const [fromCurrency, setFromCurrency] = useState<'NGN' | 'XOF'>('XOF');
  const [toCurrency, setToCurrency] = useState<'NGN' | 'XOF'>('NGN');
  const [swapAmount, setSwapAmount] = useState<string>('100000');
  const [isSwapping, setIsSwapping] = useState(false);
  const [rateLockCountdown, setRateLockCountdown] = useState(15);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modals
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositCurrency, setDepositCurrency] = useState<'NGN' | 'XOF'>('NGN');

  // Send form state
  const [sendType, setSendType] = useState<'internal' | 'bank_ngn' | 'momo_bj'>('internal');
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendCurrency, setSendCurrency] = useState<'NGN' | 'XOF'>('NGN');
  const [selectedBank, setSelectedBank] = useState('Zenith Bank');

  // Transaction filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Exchange rate: 1 XOF = 2.55 NGN (or 1 NGN = 0.39215 XOF)
  const xofToNgnRate = 2.55;
  const ngnToXofRate = 1 / xofToNgnRate;

  const currentRate = fromCurrency === 'XOF' ? xofToNgnRate : ngnToXofRate;
  const numSwapAmount = parseFloat(swapAmount) || 0;
  const estimatedReceive = Math.round(numSwapAmount * currentRate);

  // Rate lock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRateLockCountdown((prev) => (prev <= 1 ? 15 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFlipCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleExecuteSwap = () => {
    if (numSwapAmount <= 0) return;
    const balance = userProfile.wallets[fromCurrency].balance;
    if (numSwapAmount > balance) {
      alert(language === 'fr' ? 'Solde insuffisant dans ce portefeuille' : 'Insufficient balance in source wallet');
      return;
    }

    setIsSwapping(true);
    setTimeout(() => {
      onExecuteSwap(fromCurrency, toCurrency, numSwapAmount, estimatedReceive);
      setIsSwapping(false);
      setRateLockCountdown(15);
    }, 600);
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(sendAmount);
    if (!amt || amt <= 0) return;

    let targetDesc = sendRecipient;
    if (sendType === 'bank_ngn') {
      targetDesc = `${sendRecipient} (${selectedBank})`;
    } else if (sendType === 'momo_bj') {
      targetDesc = `${sendRecipient} (MTN MoMo Benin)`;
    }

    onExecuteSend(targetDesc, amt, sendCurrency, sendType);
    setSendModalOpen(false);
    setSendAmount('');
    setSendRecipient('');
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.recipient.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'ALL' || tx.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Portfolio Overview & Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* NGN Naira Wallet Card */}
        <div className="bg-gradient-to-br from-slate-900 to-[#0e1726] border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🇳🇬</span>
              <span className="text-sm font-semibold text-slate-200">
                {language === 'fr' ? 'Portefeuille Naira Nigérian' : 'Nigerian Naira Wallet'}
              </span>
            </div>
            <span className="text-xs font-mono-nums text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              NGN · Active
            </span>
          </div>

          <div className="mb-4">
            <div className="text-xs text-slate-400 mb-1">
              {language === 'fr' ? 'Solde disponible' : 'Available Balance'}
            </div>
            <div className="text-3xl font-bold font-mono-nums text-white tracking-tight">
              ₦{Math.round(userProfile.wallets.NGN.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono-nums">
              ≈ {(Math.round(userProfile.wallets.NGN.balance) / 2.55).toLocaleString('en-US', { maximumFractionDigits: 0 })} FCFA
            </div>
          </div>

          {/* Account Details Box */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between text-xs mb-4 font-mono-nums">
            <div>
              <div className="text-slate-400 text-[10px]">
                {language === 'fr' ? 'Compte Virtuel Dédié (NIP)' : 'Dedicated Virtual Account (NIP)'}
              </div>
              <div className="text-slate-200 font-semibold">
                Zenith Bank · {userProfile.wallets.NGN.accountNumber}
              </div>
            </div>
            <button
              onClick={() => handleCopy(userProfile.wallets.NGN.accountNumber, 'ngn_acc')}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Copy Account Number"
            >
              {copiedField === 'ngn_acc' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => {
                setDepositCurrency('NGN');
                setDepositModalOpen(true);
              }}
              className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Déposer NGN' : 'Deposit NGN'}</span>
            </button>
            <button
              onClick={() => {
                setSendCurrency('NGN');
                setSendModalOpen(true);
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Envoyer NGN' : 'Send NGN'}</span>
            </button>
          </div>
        </div>

        {/* XOF CFA Franc Wallet Card */}
        <div className="bg-gradient-to-br from-slate-900 to-[#151c2d] border border-blue-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🇧🇯</span>
              <span className="text-sm font-semibold text-slate-200">
                {language === 'fr' ? 'Portefeuille Franc CFA Bénin' : 'Benin CFA Franc Wallet'}
              </span>
            </div>
            <span className="text-xs font-mono-nums text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              XOF · Active
            </span>
          </div>

          <div className="mb-4">
            <div className="text-xs text-slate-400 mb-1">
              {language === 'fr' ? 'Solde disponible' : 'Available Balance'}
            </div>
            <div className="text-3xl font-bold font-mono-nums text-white tracking-tight">
              {Math.round(userProfile.wallets.XOF.balance).toLocaleString('en-US')} <span className="text-lg font-normal text-slate-300">FCFA</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono-nums">
              ≈ ₦{(Math.round(userProfile.wallets.XOF.balance) * 2.55).toLocaleString('en-US')} NGN
            </div>
          </div>

          {/* Account Details Box */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between text-xs mb-4 font-mono-nums">
            <div>
              <div className="text-slate-400 text-[10px]">
                {language === 'fr' ? 'Identifiant de Dépôt MoMo / BOA' : 'MoMo / BOA Deposit ID'}
              </div>
              <div className="text-slate-200 font-semibold">
                MTN MoMo · {userProfile.wallets.XOF.accountNumber}
              </div>
            </div>
            <button
              onClick={() => handleCopy(userProfile.wallets.XOF.accountNumber, 'xof_acc')}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Copy Account Number"
            >
              {copiedField === 'xof_acc' ? (
                <Check className="w-4 h-4 text-blue-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => {
                setDepositCurrency('XOF');
                setDepositModalOpen(true);
              }}
              className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Déposer FCFA' : 'Deposit XOF'}</span>
            </button>
            <button
              onClick={() => {
                setSendCurrency('XOF');
                setSendModalOpen(true);
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Envoyer FCFA' : 'Send XOF'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Live Currency Swap & Dynamic Market Maker Calculator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              <span>
                {language === 'fr' ? 'Conversion de Devises Instantanée' : 'Instant Cross-Border Currency Swap'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'fr'
                ? 'Taux interbancaire garanti avec carnet d\'ordres automatisé'
                : 'Guaranteed mid-market rate powered by Qudi Dynamic Market Maker'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono-nums">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {language === 'fr' ? 'Verrouillage de taux :' : 'Rate lock:'}
            </span>
            <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {rateLockCountdown}s
            </span>
          </div>
        </div>

        {/* Swap Form Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center my-6">
          
          {/* Source Currency */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>{language === 'fr' ? 'Vous envoyez' : 'You Send'}</span>
              <span className="font-mono-nums">
                {language === 'fr' ? 'Solde :' : 'Balance:'}{' '}
                {fromCurrency === 'NGN' ? '₦' : ''}
                {Math.round(userProfile.wallets[fromCurrency].balance).toLocaleString()}{' '}
                {fromCurrency === 'XOF' ? 'FCFA' : ''}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-2xl font-bold font-mono-nums text-white outline-none"
              />
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-white shrink-0">
                <span>{fromCurrency === 'NGN' ? '🇳🇬 NGN' : '🇧🇯 XOF'}</span>
              </div>
            </div>
          </div>

          {/* Flip Currency Button */}
          <div className="lg:col-span-1 flex justify-center">
            <button
              onClick={handleFlipCurrencies}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-full border border-slate-700 transition-transform active:rotate-180 cursor-pointer shadow-lg"
              title="Flip currencies"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Currency */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>{language === 'fr' ? 'Vous recevez (estimé)' : 'You Receive (Guaranteed)'}</span>
              <span className="text-emerald-400 font-mono-nums text-[11px]">
                {language === 'fr' ? 'Frais 0 FCFA' : 'Zero Hidden Fees'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 text-2xl font-bold font-mono-nums text-emerald-400">
                {estimatedReceive.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-white shrink-0">
                <span>{toCurrency === 'NGN' ? '🇳🇬 NGN' : '🇧🇯 XOF'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Spread breakdown and savings comparison */}
        <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono-nums mb-6">
          <div className="space-y-1">
            <div className="text-slate-400">
              {language === 'fr' ? 'Taux appliqué :' : 'Applied Rate:'}{' '}
              <span className="text-white font-semibold">
                {fromCurrency === 'XOF' ? '1 XOF = 2.55 NGN' : '1,000 NGN = 392.15 XOF'}
              </span>
            </div>
            <div className="text-slate-500 text-[11px]">
              {language === 'fr'
                ? 'Écart interbancaire Qudi : 0.95% (Économie moyenne de 4.2% vs bureau de change de rue à Dantokpa)'
                : 'Qudi Spread: 0.95% (Saves ~4.2% compared to street money changers at Dantokpa or Badagry)'}
            </div>
          </div>

          <button
            onClick={handleExecuteSwap}
            disabled={isSwapping || numSwapAmount <= 0}
            className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSwapping ? (
              <span>{language === 'fr' ? 'Exécution en cours...' : 'Executing Swap...'}</span>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" />
                <span>
                  {language === 'fr' ? 'Convertir Maintenant' : 'Swap Instantly'}
                </span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Transaction Ledger & Financial History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <h3 className="text-base font-bold text-white">
              {language === 'fr' ? 'Historique des Transactions' : 'Transaction History & Statements'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'fr'
                ? 'Journal immuable à partie double avec références de compensation'
                : 'Immutable double-entry ledger with instant clearing references'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'fr' ? 'Rechercher...' : 'Search transactions...'}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 w-44"
              />
            </div>

            <button
              onClick={() => alert('Full CSV Statement exported.')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">{language === 'fr' ? 'Référence / Date' : 'Reference / Date'}</th>
                <th className="py-3 px-3">{language === 'fr' ? 'Type / Description' : 'Type / Details'}</th>
                <th className="py-3 px-3">{language === 'fr' ? 'Bénéficiaire / Rail' : 'Recipient / Rail'}</th>
                <th className="py-3 px-3 text-right">{language === 'fr' ? 'Montant' : 'Amount'}</th>
                <th className="py-3 px-3 text-center">{language === 'fr' ? 'Statut' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-nums">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="text-slate-200 font-semibold">{tx.reference}</div>
                    <div className="text-[11px] text-slate-500">{tx.timestamp}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="text-slate-200 font-sans font-medium">{tx.title}</div>
                    <div className="text-[11px] text-slate-400">{tx.description}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                    <div>{tx.recipient}</div>
                    <div className="text-[10px] text-slate-500">{tx.recipientDetail || 'Qudi Internal'}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-right">
                    <div className="text-slate-100 font-bold">
                      {tx.sourceCurrency === 'NGN' ? '₦' : ''}
                      {tx.sourceAmount.toLocaleString()}{' '}
                      {tx.sourceCurrency === 'XOF' ? 'FCFA' : ''}
                    </div>
                    {tx.targetAmount && tx.targetCurrency && (
                      <div className="text-[11px] text-emerald-400">
                        → {tx.targetCurrency === 'NGN' ? '₦' : ''}
                        {tx.targetAmount.toLocaleString()} {tx.targetCurrency === 'XOF' ? 'FCFA' : ''}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-center">
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded font-sans font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Send Money Modal */}
      {sendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white mb-1">
              {language === 'fr' ? 'Envoyer de l\'Argent' : 'Send Money Cross-Border'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {language === 'fr'
                ? 'Transfert direct vers utilisateur Qudi, compte bancaire ou Mobile Money'
                : 'Direct transfer to Qudi user, Nigerian bank account, or Benin Mobile Money'}
            </p>

            <form onSubmit={handleSendSubmit} className="space-y-4">
              {/* Rail Selection */}
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setSendType('internal')}
                  className={`py-1.5 rounded transition-colors ${sendType === 'internal' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400'}`}
                >
                  @QudiTag
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSendType('bank_ngn');
                    setSendCurrency('NGN');
                  }}
                  className={`py-1.5 rounded transition-colors ${sendType === 'bank_ngn' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400'}`}
                >
                  🇳🇬 Bank (NIP)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSendType('momo_bj');
                    setSendCurrency('XOF');
                  }}
                  className={`py-1.5 rounded transition-colors ${sendType === 'momo_bj' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400'}`}
                >
                  🇧🇯 MoMo (CFA)
                </button>
              </div>

              {/* Bank Selector if Nigerian Bank */}
              {sendType === 'bank_ngn' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Select Nigerian Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Zenith Bank">Zenith Bank PLC</option>
                    <option value="Access Bank">Access Bank PLC</option>
                    <option value="GTBank">Guaranty Trust Bank (GTBank)</option>
                    <option value="First Bank">First Bank of Nigeria</option>
                    <option value="UBA">United Bank for Africa (UBA)</option>
                    <option value="Moniepoint MFB">Moniepoint Microfinance Bank</option>
                    <option value="OPay">OPay Digital Services</option>
                  </select>
                </div>
              )}

              {/* Recipient Input */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {sendType === 'internal'
                    ? language === 'fr' ? 'Nom d\'utilisateur ou Téléphone' : 'Qudi Tag or Phone Number'
                    : sendType === 'bank_ngn'
                    ? '10-Digit NUBAN Account Number'
                    : 'MTN MoMo / Moov Phone Number (+229)'}
                </label>
                <input
                  type="text"
                  required
                  value={sendRecipient}
                  onChange={(e) => setSendRecipient(e.target.value)}
                  placeholder={
                    sendType === 'internal'
                      ? '@david_cotonou'
                      : sendType === 'bank_ngn'
                      ? '0123456789'
                      : '+229 97 12 34 56'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono-nums"
                />
              </div>

              {/* Currency & Amount */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs text-slate-400 mb-1">Currency</label>
                  <select
                    value={sendCurrency}
                    onChange={(e) => setSendCurrency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                  >
                    <option value="NGN">NGN (₦)</option>
                    <option value="XOF">XOF (FCFA)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Amount</label>
                  <input
                    type="number"
                    required
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="50,000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono-nums"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSendModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg cursor-pointer"
                >
                  {language === 'fr' ? 'Confirmer Transfert' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit / Cash-In Modal */}
      {depositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white mb-1">
              {language === 'fr' ? 'Approvisionner votre Portefeuille' : 'Deposit / Fund Wallet'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {depositCurrency === 'NGN'
                ? 'Effectuez un virement bancaire NIP ou déposez des espèces auprès d\'un agent'
                : 'Effectuez un dépôt par Mobile Money (MTN/Moov) ou auprès d\'un agent Dantokpa'}
            </p>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3 mb-4">
              {depositCurrency === 'NGN' ? (
                <>
                  <div className="text-xs text-slate-400">
                    Bank: <strong className="text-white">Zenith Bank PLC (Nigeria)</strong>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Account Number:</span>
                    <strong className="text-emerald-400 font-mono-nums text-sm">
                      {userProfile.wallets.NGN.accountNumber}
                    </strong>
                  </div>
                  <div className="text-xs text-slate-400">
                    Beneficiary: <strong className="text-white">Qudi / {userProfile.name}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs text-slate-400">
                    Network: <strong className="text-white">MTN MoMo Benin / Bank of Africa</strong>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Merchant Push ID:</span>
                    <strong className="text-blue-400 font-mono-nums text-sm">
                      {userProfile.wallets.XOF.accountNumber}
                    </strong>
                  </div>
                </>
              )}
            </div>

            {/* OTC Agent Cash-in QR Code Option */}
            <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center">
              <QrCode className="w-16 h-16 text-emerald-400 mx-auto mb-2 opacity-90" />
              <div className="text-xs font-semibold text-white">
                {language === 'fr' ? 'QR Code pour Agent de Marché' : 'Market Agent OTC Deposit QR'}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {language === 'fr'
                  ? 'Présentez ce QR à un agent agréé Qudi à Dantokpa, Seme Border ou Lagos'
                  : 'Show this QR code to any certified Qudi agent at Dantokpa, Seme Border, or Lagos'}
              </p>
            </div>

            <button
              onClick={() => setDepositModalOpen(false)}
              className="w-full mt-4 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
            >
              {language === 'fr' ? 'Fermer' : 'Close'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

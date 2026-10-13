import React, { useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

interface TransactionLedgerProps {
  transactions: any[];
  onVerifyPayment: (ref: string) => Promise<void>;
  onRejectPayment: (ref: string, reason: string) => Promise<void>;
  onRefresh: () => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  onVerifyPayment,
  onRejectPayment,
  onRefresh,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingRef, setProcessingRef] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const filtered = transactions.filter((tx) => {
    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;
    const matchesSearch =
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.userPhone.includes(searchQuery) ||
      tx.recipientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleVerify = async (ref: string) => {
    if (!window.confirm(`Verify received funds for ${ref} and initiate recipient payout?`)) return;
    setProcessingRef(ref);
    try {
      await onVerifyPayment(ref);
    } finally {
      setProcessingRef(null);
    }
  };

  const handleReject = async (ref: string) => {
    const reason = window.prompt('Enter cancellation / rejection reason for customer notification:', 'Payment evidence could not be verified by bank clearing.');
    if (!reason) return;
    setProcessingRef(ref);
    try {
      await onRejectPayment(ref, reason);
    } finally {
      setProcessingRef(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
            <span>Cross-Border Transaction Settlement Desk</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage incoming deposits, verify bank & MoMo evidence, and authorize instant payouts to recipients
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500 font-mono-nums"
          >
            <option value="ALL">All Statuses ({transactions.length})</option>
            <option value="PAYMENT_VERIFICATION">Awaiting Ops Verification</option>
            <option value="AWAITING_PAYMENT">Awaiting User Payment</option>
            <option value="COMPLETED">Completed Transfers</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference, phone..."
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 w-44 font-mono-nums"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-nums">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Reference / Time</th>
                <th className="py-3 px-3">WhatsApp Sender</th>
                <th className="py-3 px-3">Exchange Amounts</th>
                <th className="py-3 px-3">Recipient Details</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Settlement Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-white font-bold">{tx.reference}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-slate-200">+{tx.userPhone}</div>
                      <div className="text-[10px] text-slate-500 font-sans">Verified Customer</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-white font-semibold">
                        {tx.fromAmount.toLocaleString()} {tx.fromCurrency}
                      </div>
                      <div className="text-[11px] text-emerald-400">
                        → {tx.toAmount.toLocaleString()} {tx.toCurrency}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Rate: {tx.rate} · Fee: {tx.fee} {tx.fromCurrency}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-slate-200 font-sans font-medium">{tx.recipientName}</div>
                      <div className="text-[10px] text-slate-400">{tx.recipientAccount}</div>
                      <div className="text-[10px] text-slate-500">{tx.recipientRail}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                          tx.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : tx.status === 'PAYMENT_VERIFICATION'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                            : tx.status === 'AWAITING_PAYMENT'
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {tx.status}
                      </span>
                      {tx.paymentProofNote && (
                        <div className="text-[10px] text-amber-300 mt-1 max-w-xs truncate" title={tx.paymentProofNote}>
                          Note: "{tx.paymentProofNote}"
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      {tx.status === 'PAYMENT_VERIFICATION' || tx.status === 'AWAITING_PAYMENT' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleVerify(tx.reference)}
                            disabled={processingRef === tx.reference}
                            className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify & Pay</span>
                          </button>
                          <button
                            onClick={() => handleReject(tx.reference)}
                            disabled={processingRef === tx.reference}
                            className="py-1 px-2 bg-slate-800 hover:bg-rose-900/40 text-rose-400 text-xs rounded border border-slate-700 transition-colors cursor-pointer"
                            title="Reject Payment"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-sans">Settled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

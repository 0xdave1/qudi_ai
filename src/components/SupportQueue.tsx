import React, { useState } from 'react';
import { LifeBuoy, CheckCircle2, MessageSquare, Clock, User, Phone } from 'lucide-react';

interface SupportQueueProps {
  tickets: any[];
  onResolveTicket: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export const SupportQueue: React.FC<SupportQueueProps> = ({
  tickets,
  onResolveTicket,
  onRefresh,
}) => {
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await onResolveTicket(id);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-emerald-400" />
            <span>Customer Support & Human Handoff Queue</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Incoming escalations from WhatsApp users requesting human assistance, disputes, or transaction reviews
          </p>
        </div>
        <div className="text-xs font-mono-nums text-slate-400">
          {tickets.filter((t) => t.status === 'OPEN').length} Open Tickets
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tickets.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            No support tickets open. All WhatsApp user conversations handled smoothly.
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono-nums font-bold text-emerald-400">
                    {ticket.ticketNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      ticket.status === 'OPEN'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{ticket.userName}</span>
                    <span className="text-slate-500">·</span>
                    <span className="font-mono-nums text-slate-400">+{ticket.userPhone}</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-slate-300 italic text-xs leading-relaxed">
                    "{ticket.message}"
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px] font-mono-nums text-slate-500">
                <span>{new Date(ticket.createdAt).toLocaleTimeString()} · {new Date(ticket.createdAt).toLocaleDateString()}</span>

                {ticket.status === 'OPEN' && (
                  <button
                    onClick={() => handleResolve(ticket.id)}
                    disabled={resolvingId === ticket.id}
                    className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolve & Notify User</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

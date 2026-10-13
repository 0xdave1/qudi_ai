import React, { useState } from 'react';
import { Sliders, Check, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';

interface RateManagerProps {
  rates: any;
  onUpdateRates: (newRates: any) => Promise<void>;
  onRefresh: () => void;
}

export const RateManager: React.FC<RateManagerProps> = ({
  rates,
  onUpdateRates,
  onRefresh,
}) => {
  const [xofToNgn, setXofToNgn] = useState<number>(rates?.xofToNgnRate || 2.55);
  const [ngnToXof, setNgnToXof] = useState<number>(rates?.ngnToXofRate || 0.39215);
  const [feePercent, setFeePercent] = useState<number>((rates?.feePercentage || 0.008) * 100);
  const [minNgn, setMinNgn] = useState<number>(rates?.minNgn || 5000);
  const [maxNgn, setMaxNgn] = useState<number>(rates?.maxNgn || 5000000);
  const [minXof, setMinXof] = useState<number>(rates?.minXof || 2000);
  const [maxXof, setMaxXof] = useState<number>(rates?.maxXof || 2000000);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await onUpdateRates({
        xofToNgnRate: Number(xofToNgn),
        ngnToXofRate: Number(ngnToXof),
        feePercentage: Number(feePercent) / 100,
        minNgn: Number(minNgn),
        maxNgn: Number(maxNgn),
        minXof: Number(minXof),
        maxXof: Number(maxXof),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Exchange Rate & Corridor Limits Management</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Updates to these rates are fetched dynamically by the WhatsApp AI bot for quotes and conversions
            </p>
          </div>

          <div className="text-xs font-mono-nums text-slate-400">
            Last Updated: {rates?.lastUpdated ? new Date(rates.lastUpdated).toLocaleTimeString() : 'Recent'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Exchange Rates Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                1 XOF in NGN (CFA to Naira Rate)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono-nums text-sm">₦</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={xofToNgn}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setXofToNgn(val);
                    if (val > 0) setNgnToXof(Number((1 / val).toFixed(5)));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono-nums outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-[11px] text-slate-500 font-mono-nums block">
                100,000 XOF ≈ ₦{(xofToNgn * 100000).toLocaleString()} NGN
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                1 NGN in XOF (Naira to CFA Rate)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono-nums text-sm">FCFA</span>
                <input
                  type="number"
                  step="0.00001"
                  required
                  value={ngnToXof}
                  onChange={(e) => setNgnToXof(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono-nums outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-[11px] text-slate-500 font-mono-nums block">
                100,000 NGN ≈ {(ngnToXof * 100000).toLocaleString()} XOF
              </span>
            </div>

          </div>

          {/* Fee & Limits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                Platform Exchange Fee (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  required
                  value={feePercent}
                  onChange={(e) => setFeePercent(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono-nums outline-none focus:border-emerald-500"
                />
                <span className="text-slate-400 font-mono-nums text-sm">%</span>
              </div>
              <span className="text-[11px] text-slate-500">Transparent flat spread</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                NGN Min / Max Per Transfer
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono-nums">
                <input
                  type="number"
                  value={minNgn}
                  onChange={(e) => setMinNgn(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
                  placeholder="Min"
                />
                <input
                  type="number"
                  value={maxNgn}
                  onChange={(e) => setMaxNgn(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
                  placeholder="Max"
                />
              </div>
              <span className="text-[11px] text-slate-500">₦5,000 to ₦5,000,000</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                XOF Min / Max Per Transfer
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono-nums">
                <input
                  type="number"
                  value={minXof}
                  onChange={(e) => setMinXof(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
                  placeholder="Min"
                />
                <input
                  type="number"
                  value={maxXof}
                  onChange={(e) => setMaxXof(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
                  placeholder="Max"
                />
              </div>
              <span className="text-[11px] text-slate-500">2,000 to 2,000,000 CFA</span>
            </div>

          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {saveSuccess ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Rates successfully updated for all WhatsApp users.
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                Changes take effect instantly on all future quotes.
              </span>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Updating...' : 'Save & Broadcast Rates'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Language, AgentRecord, TransactionRecord } from '../types/banking';
import {
  Landmark,
  Sliders,
  ShieldAlert,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRightLeft,
  DollarSign,
  Activity,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';

interface AdminTreasuryProps {
  language: Language;
  transactions: TransactionRecord[];
  onUpdateSpread: (bps: number, parallelAdj: number) => void;
  currentSpreadBps: number;
}

export const AdminTreasury: React.FC<AdminTreasuryProps> = ({
  language,
  transactions,
  onUpdateSpread,
  currentSpreadBps,
}) => {
  const [spreadBps, setSpreadBps] = useState(currentSpreadBps);
  const [parallelAdj, setParallelAdj] = useState(0.04);
  const [activeTab, setActiveTab] = useState<'liquidity' | 'spread' | 'aml' | 'agents'>('liquidity');
  const [rebalanceLoading, setRebalanceLoading] = useState(false);
  const [rebalanceSuccess, setRebalanceSuccess] = useState(false);

  // Vault mock balances
  const [ngnVaultBalance, setNgnVaultBalance] = useState(1450000000);
  const [xofVaultBalance, setXofVaultBalance] = useState(580000000);

  // Agent Fleet Mock Data
  const [agents, setAgents] = useState<AgentRecord[]>([
    {
      id: 'ag_01',
      agentName: 'Mamadou Touré (Kiosque Dantokpa)',
      location: 'Marché Dantokpa, Hall 4',
      city: 'Cotonou',
      country: 'BJ',
      phone: '+229 97 45 88 12',
      ngnFloat: 18500000,
      xofFloat: 42000000,
      totalVolumeMonth: 340000000,
      commissionEarned: 1360000,
      status: 'ACTIVE',
    },
    {
      id: 'ag_02',
      agentName: 'Chinedu Okafor (Alaba FX Terminal)',
      location: 'Alaba International Market, Line 12',
      city: 'Lagos',
      country: 'NG',
      phone: '+234 803 992 1104',
      ngnFloat: 54000000,
      xofFloat: 12000000,
      totalVolumeMonth: 580000000,
      commissionEarned: 2320000,
      status: 'ACTIVE',
    },
    {
      id: 'ag_03',
      agentName: 'Seme-Krake Border Exchange Post',
      location: 'Seme Border Joint Control Post',
      city: 'Krake',
      country: 'BJ',
      phone: '+229 95 10 33 29',
      ngnFloat: 25000000,
      xofFloat: 18000000,
      totalVolumeMonth: 410000000,
      commissionEarned: 1640000,
      status: 'ACTIVE',
    },
    {
      id: 'ag_04',
      agentName: 'Badagry Market Cash Kiosk',
      location: 'Agbalata Central Market',
      city: 'Badagry',
      country: 'NG',
      phone: '+234 812 550 4910',
      ngnFloat: 8200000,
      xofFloat: 6500000,
      totalVolumeMonth: 95000000,
      commissionEarned: 380000,
      status: 'LOW_FLOAT',
    },
  ]);

  const handleApplySpread = () => {
    onUpdateSpread(spreadBps, parallelAdj);
    alert(
      language === 'fr'
        ? `Nouveau spread de ${spreadBps} bps appliqué avec succès sur tout le réseau Qudi.`
        : `Spread updated to ${spreadBps} bps across all client interfaces.`
    );
  };

  const handleTriggerRebalance = () => {
    setRebalanceLoading(true);
    setTimeout(() => {
      setNgnVaultBalance((prev) => prev + 250000000);
      setXofVaultBalance((prev) => prev + 100000000);
      setRebalanceLoading(false);
      setRebalanceSuccess(true);
      setTimeout(() => setRebalanceSuccess(false), 4000);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Treasury Header & Corridor Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              {language === 'fr' ? 'Console de Trésorerie & Risque Qudi' : 'Qudi Treasury, Liquidity & Risk Console'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'fr'
              ? 'Surveillance en direct des coffres de liquidité, marge de change et filtrage LCB-FT (Nigeria & UEMOA)'
              : 'Real-time vault reserve surveillance, FX spread management, and AML/CFT monitoring (CBN & BCEAO)'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('liquidity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'liquidity' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'fr' ? 'Coffres de Liquidité' : 'Liquidity Vaults'}
          </button>
          <button
            onClick={() => setActiveTab('spread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'spread' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'fr' ? 'Contrôle du Spread FX' : 'FX Spread'}
          </button>
          <button
            onClick={() => setActiveTab('aml')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'aml' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'fr' ? 'Surveillance AML / LCB' : 'AML Monitoring'}
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'agents' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'fr' ? 'Réseau d\'Agents' : 'Agent Network'}
          </button>
        </div>
      </div>

      {/* Tab 1: Liquidity Vaults */}
      {activeTab === 'liquidity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* NGN Vault */}
            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🇳🇬</span>
                  <div>
                    <div className="text-xs text-slate-400">Partner Settlement Bank</div>
                    <div className="text-sm font-bold text-white">Zenith Bank PLC (Lagos)</div>
                  </div>
                </div>
                <span className="text-[11px] font-mono-nums bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  HEALTH: 99.2%
                </span>
              </div>

              <div className="my-4">
                <div className="text-xs text-slate-400 mb-1">Total Vault Reserve Balance</div>
                <div className="text-2xl font-bold font-mono-nums text-emerald-400">
                  ₦{ngnVaultBalance.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1 font-mono-nums">
                  Safety Floor: ₦300,000,000 · Buffer Ratio: 4.8x
                </div>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden mb-4">
                <div className="bg-emerald-400 h-full w-[82%]"></div>
              </div>

              <div className="text-xs text-slate-400 space-y-1 font-mono-nums border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span>Reserved for Inbound Clearing:</span>
                  <span className="text-slate-200">₦120,000,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Available Instant Liquidity:</span>
                  <span className="text-emerald-400 font-bold">
                    ₦{(ngnVaultBalance - 120000000).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* XOF Vault */}
            <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-6 shadow-xl relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🇧🇯</span>
                  <div>
                    <div className="text-xs text-slate-400">Partner Settlement Bank</div>
                    <div className="text-sm font-bold text-white">Bank of Africa (BOA) / Ecobank Benin</div>
                  </div>
                </div>
                <span className="text-[11px] font-mono-nums bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                  HEALTH: 97.8%
                </span>
              </div>

              <div className="my-4">
                <div className="text-xs text-slate-400 mb-1">Total Vault Reserve Balance</div>
                <div className="text-2xl font-bold font-mono-nums text-blue-400">
                  {xofVaultBalance.toLocaleString()} FCFA
                </div>
                <div className="text-xs text-slate-400 mt-1 font-mono-nums">
                  Safety Floor: 120,000,000 FCFA · Buffer Ratio: 4.8x
                </div>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden mb-4">
                <div className="bg-blue-500 h-full w-[78%]"></div>
              </div>

              <div className="text-xs text-slate-400 space-y-1 font-mono-nums border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span>Reserved for MoMo Payouts:</span>
                  <span className="text-slate-200">45,000,000 FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>Available Instant Liquidity:</span>
                  <span className="text-blue-400 font-bold">
                    {(xofVaultBalance - 45000000).toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Rebalance Controller Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>
                  {language === 'fr'
                    ? 'Rééquilibrage Interbancaire Transfrontalier'
                    : 'Automated Cross-Border Treasury Rebalancing'}
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'fr'
                  ? 'Déclenche un virement de compensation RTGS BCEAO / NIBSS pour renflouer les réserves bilatérales'
                  : 'Executes interbank RTGS clearing order between Zenith Bank and Bank of Africa to equalize corridor buffers.'}
              </p>
            </div>

            <button
              onClick={handleTriggerRebalance}
              disabled={rebalanceLoading}
              className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {rebalanceLoading ? (
                <span>Rebalancing Rails...</span>
              ) : rebalanceSuccess ? (
                <span className="text-emerald-950 font-extrabold">✓ Buffer Equalized</span>
              ) : (
                <span>
                  {language === 'fr' ? 'Exécuter Rééquilibrage' : 'Trigger Corridor Rebalance'}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Dynamic Spread Manager */}
      {activeTab === 'spread' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>
                {language === 'fr' ? 'Gestionnaire de Spread de Marché' : 'Dynamic Market Maker Spread Controller'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'fr'
                ? 'Ajustez la marge de change Qudi appliquée aux conversions NGN ⇄ XOF en temps réel.'
                : 'Adjust the target platform spread (in basis points) applied across WhatsApp AI and consumer wallet swaps.'}
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-slate-300">
                  Target Platform Spread (BPS):
                </label>
                <span className="font-mono-nums text-sm font-bold text-emerald-400">
                  {spreadBps} bps ({(spreadBps / 100).toFixed(2)}%)
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="250"
                step="5"
                value={spreadBps}
                onChange={(e) => setSpreadBps(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono-nums mt-1">
                <span>30 bps (Aggressive Growth)</span>
                <span>95 bps (Balanced Optimum)</span>
                <span>250 bps (High Volatility Defense)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-slate-300">
                  Parallel Market Adjustment Premium:
                </label>
                <span className="font-mono-nums text-sm font-bold text-amber-400">
                  +{parallelAdj} NGN / XOF
                </span>
              </div>
              <input
                type="range"
                min="0.00"
                max="0.15"
                step="0.01"
                value={parallelAdj}
                onChange={(e) => setParallelAdj(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleApplySpread}
                className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer"
              >
                {language === 'fr' ? 'Déployer les Nouveaux Taux' : 'Deploy Spread Update Platform-Wide'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AML / CFT Risk Monitoring */}
      {activeTab === 'aml' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>
                {language === 'fr' ? 'Filtrage AML & Détection de Fraude en Temps Réel' : 'Real-Time AML & Fraud Screening'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'fr'
                ? 'Surveillance continue des seuils de transaction, listes PEP et vitesse anormale de flux'
                : 'Automated velocity checks, PEP screening, and high-value cross-border threshold alerts'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-nums">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Transaction</th>
                  <th className="py-2.5 px-3">Sender / Recipient</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="text-slate-200 font-semibold">{tx.reference}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{tx.title}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <div>{tx.sender}</div>
                      <div className="text-[10px] text-slate-500">→ {tx.recipient}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {tx.sourceCurrency === 'NGN' ? '₦' : ''}
                      {tx.sourceAmount.toLocaleString()}{' '}
                      {tx.sourceCurrency === 'XOF' ? 'FCFA' : ''}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.riskScore > 50
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : tx.riskScore > 20
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        SCORE: {tx.riskScore}/100 {tx.riskScore > 50 ? '· HIGH RISK' : '· CLEAR'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => alert(`Transaction ${tx.reference} verified and approved.`)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-sans font-semibold cursor-pointer"
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Agent Network */}
      {activeTab === 'agents' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>
                  {language === 'fr' ? 'Réseau d\'Agents OTC Agréés' : 'Certified OTC Cash Agent Fleet'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'fr'
                  ? 'Gestion des liquidités en espèces à Dantokpa, Alaba, Badagry et au poste frontière de Seme'
                  : 'Physical cash-in and cash-out liquidity merchants across key trade terminals.'}
              </p>
            </div>

            <button
              onClick={() => alert('New agent onboarding modal.')}
              className="py-1.5 px-3 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Ajouter un Agent' : 'Onboard Agent'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-nums">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Agent & Terminal</th>
                  <th className="py-2.5 px-3">Location / Hub</th>
                  <th className="py-2.5 px-3">NGN Float</th>
                  <th className="py-2.5 px-3">XOF Float</th>
                  <th className="py-2.5 px-3">Commission Month</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {agents.map((ag) => (
                  <tr key={ag.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="text-slate-200 font-sans font-semibold">{ag.agentName}</div>
                      <div className="text-[10px] text-slate-500">{ag.phone}</div>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-300">
                      <div>{ag.location}</div>
                      <div className="text-[10px] text-slate-500">{ag.city}, {ag.country}</div>
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      ₦{ag.ngnFloat.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-blue-400 font-bold">
                      {ag.xofFloat.toLocaleString()} FCFA
                    </td>
                    <td className="py-3 px-3 text-white">
                      ₦{ag.commissionEarned.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-sans font-semibold ${
                          ag.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {ag.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

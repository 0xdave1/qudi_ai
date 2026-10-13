import React from 'react';
import {
  Webhook,
  ArrowRightLeft,
  Sliders,
  LifeBuoy,
  FlaskConical,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Database,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'webhook' | 'transactions' | 'rates' | 'support' | 'tests' | 'setup';
  setActiveTab: (tab: 'webhook' | 'transactions' | 'rates' | 'support' | 'tests' | 'setup') => void;
  isConfigured: boolean;
  pendingVerifications: number;
  openTickets: number;
  verifyToken?: string;
  databaseStatus?: {
    isConfigured: boolean;
    isConnected: boolean;
    provider: string;
    host?: string;
    isPooled?: boolean;
    latencyMs?: number;
    error?: string;
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isConfigured,
  pendingVerifications,
  openTickets,
  verifyToken,
  databaseStatus,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        
        {/* Zone 1: Brand Wordmark & Mode Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-display font-bold text-emerald-400 text-base">
            Q
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base tracking-tight text-white whitespace-nowrap">
                Qudi
              </span>
              <span className="text-[10px] text-slate-400 font-mono-nums border-l border-slate-700 pl-2">
                WhatsApp Bot (NGN ⇄ XOF)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono-nums text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>/webhook</span>
              <span className="text-slate-600">·</span>
              <span className={isConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                {isConfigured ? 'Meta Cloud API Live' : 'Dev Adapter Mode'}
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Single-Line Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('webhook')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'webhook'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>Webhook & Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap relative ${
              activeTab === 'transactions'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transactions</span>
            {pendingVerifications > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                {pendingVerifications}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('rates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'rates'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Rates & Fees</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap relative ${
              activeTab === 'support'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Support Handoff</span>
            {openTickets > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center">
                {openTickets}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'tests'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Test Harness</span>
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'setup'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Setup & Deploy</span>
          </button>
        </nav>

        {/* Zone 3: Quick Action Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('setup')}
            className={`text-[11px] font-mono-nums px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer border ${
              databaseStatus?.isConnected
                ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-amber-950/60 border-amber-800/80 text-amber-300 hover:bg-amber-900/60'
            }`}
            title={databaseStatus?.isConnected ? `Connected to Neon PostgreSQL (${databaseStatus.host})` : 'Neon PostgreSQL: Awaiting DATABASE_URL in AI Studio Secrets'}
          >
            <Database className="w-3 h-3" />
            <span>DB:</span>
            <strong className={databaseStatus?.isConnected ? 'text-emerald-400' : 'text-amber-400'}>
              {databaseStatus?.isConnected ? 'Neon Live' : 'Fallback / Setup'}
            </strong>
          </button>

          <button
            onClick={() => setActiveTab('webhook')}
            className="text-[11px] font-mono-nums bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Click to view/edit Verify Token in Webhook settings"
          >
            <span>Verify Token:</span>{' '}
            <strong className="text-emerald-400">
              {verifyToken ? (verifyToken.length > 12 ? `${verifyToken.slice(0, 10)}...` : verifyToken) : 'qudi_axra_...'}
            </strong>
          </button>
        </div>

      </div>

      {/* Mobile nav bar */}
      <div className="lg:hidden flex items-center justify-between overflow-x-auto border-t border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-400">
        <button
          onClick={() => setActiveTab('webhook')}
          className={`px-2 py-1 ${activeTab === 'webhook' ? 'text-emerald-400 font-bold' : ''}`}
        >
          Webhook
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-2 py-1 ${activeTab === 'transactions' ? 'text-emerald-400 font-bold' : ''}`}
        >
          Transactions ({pendingVerifications})
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`px-2 py-1 ${activeTab === 'rates' ? 'text-emerald-400 font-bold' : ''}`}
        >
          Rates
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`px-2 py-1 ${activeTab === 'support' ? 'text-emerald-400 font-bold' : ''}`}
        >
          Support
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-2 py-1 ${activeTab === 'tests' ? 'text-emerald-400 font-bold' : ''}`}
        >
          Tests
        </button>
        <button
          onClick={() => setActiveTab('setup')}
          className={`px-2 py-1 ${activeTab === 'setup' ? 'text-emerald-400 font-bold' : ''}`}
        >
          Setup
        </button>
      </div>
    </header>
  );
};

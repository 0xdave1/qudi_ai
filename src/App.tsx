import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WebhookConsole } from './components/WebhookConsole';
import { TransactionLedger } from './components/TransactionLedger';
import { RateManager } from './components/RateManager';
import { SupportQueue } from './components/SupportQueue';
import { TestHarness } from './components/TestHarness';
import { SetupGuide } from './components/SetupGuide';

export default function App() {
  const [activeTab, setActiveTab] = useState<'webhook' | 'transactions' | 'rates' | 'support' | 'tests' | 'setup'>('webhook');
  const [statusData, setStatusData] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [rates, setRates] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      const [statusRes, metricsRes, logsRes, txRes, ratesRes, supportRes] = await Promise.all([
        fetch('/api/status').then((r) => r.json()).catch(() => null),
        fetch('/api/admin/metrics').then((r) => r.json()).catch(() => null),
        fetch('/api/admin/logs').then((r) => r.json()).catch(() => []),
        fetch('/api/admin/transactions').then((r) => r.json()).catch(() => []),
        fetch('/api/admin/rates').then((r) => r.json()).catch(() => null),
        fetch('/api/admin/support').then((r) => r.json()).catch(() => []),
      ]);

      if (statusRes) setStatusData(statusRes);
      if (metricsRes) setMetrics(metricsRes);
      if (logsRes) setLogs(logsRes);
      if (txRes) setTransactions(txRes);
      if (ratesRes) setRates(ratesRes);
      if (supportRes) setTickets(supportRes);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyPayment = async (ref: string) => {
    const res = await fetch(`/api/admin/transactions/${ref}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNote: 'Verified by Settlement Desk' }),
    });
    if (res.ok) {
      fetchAllData();
    } else {
      const err = await res.json();
      alert(`Error verifying payment: ${err.error || 'Failed'}`);
    }
  };

  const handleRejectPayment = async (ref: string, reason: string) => {
    const res = await fetch(`/api/admin/transactions/${ref}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) {
      fetchAllData();
    } else {
      const err = await res.json();
      alert(`Error rejecting payment: ${err.error || 'Failed'}`);
    }
  };

  const handleUpdateRates = async (newRates: any) => {
    const res = await fetch('/api/admin/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRates),
    });
    if (res.ok) {
      fetchAllData();
    } else {
      alert('Failed to update rates.');
    }
  };

  const handleResolveTicket = async (id: string) => {
    const res = await fetch(`/api/admin/support/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: 'Resolved by operations' }),
    });
    if (res.ok) {
      fetchAllData();
    } else {
      alert('Failed to resolve ticket.');
    }
  };

  const pendingVerifications = transactions.filter((t) => t.status === 'PAYMENT_VERIFICATION').length;
  const openTickets = tickets.filter((t) => t.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Universal Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConfigured={Boolean(statusData?.whatsappConfig?.isConfigured)}
        pendingVerifications={pendingVerifications}
        openTickets={openTickets}
        verifyToken={statusData?.verifyToken}
      />

      {/* Main Content Viewports */}
      <main className="flex-1">
        {activeTab === 'webhook' && (
          <WebhookConsole
            statusData={statusData}
            logs={logs}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionLedger
            transactions={transactions}
            onVerifyPayment={handleVerifyPayment}
            onRejectPayment={handleRejectPayment}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'rates' && (
          <RateManager
            rates={rates}
            onUpdateRates={handleUpdateRates}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'support' && (
          <SupportQueue
            tickets={tickets}
            onResolveTicket={handleResolveTicket}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'tests' && (
          <TestHarness onRefresh={fetchAllData} />
        )}

        {activeTab === 'setup' && (
          <SetupGuide />
        )}
      </main>

      {/* Footer with Compliance & Architecture Credentials */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
              Q
            </span>
            <span>
              Qudi WhatsApp AI Financial Assistant · Nigeria & Benin Republic (NGN ⇄ XOF)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono-nums text-slate-400">
            <span>Meta Graph API v21.0</span>
            <span>·</span>
            <span>Gemini 3.8 Flash Intent Orchestration</span>
            <span>·</span>
            <span>Webhook: /webhook</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

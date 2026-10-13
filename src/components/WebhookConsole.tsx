import React, { useState } from 'react';
import {
  Webhook,
  Copy,
  Check,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Code2,
  ShieldCheck,
  Radio,
  ExternalLink,
  Edit3,
  Save,
  X,
} from 'lucide-react';

interface WebhookConsoleProps {
  statusData: any;
  logs: any[];
  onRefresh: () => void;
}

export const WebhookConsole: React.FC<WebhookConsoleProps> = ({
  statusData,
  logs,
  onRefresh,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Verify token editing state
  const [isEditingToken, setIsEditingToken] = useState(false);
  const [newTokenInput, setNewTokenInput] = useState('');
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenSuccess, setTokenSuccess] = useState<string | null>(null);

  const webhookUrl = `${window.location.origin}/webhook`;
  const verifyToken = statusData?.verifyToken || 'qudi_axra_whatsapp_verify_token_2026';

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTestHandshake = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const challengeCode = `chal_${Math.random().toString(36).substring(2, 8)}`;
      const res = await fetch(`/webhook?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=${challengeCode}`);
      if (res.ok) {
        const text = await res.text();
        if (text === challengeCode) {
          setTestResult('✅ 200 OK: Challenge matched! Webhook is verified and ready for Meta.');
        } else {
          setTestResult(`⚠️ HTTP 200 but challenge mismatch: expected ${challengeCode}, received ${text}`);
        }
      } else {
        setTestResult(`❌ HTTP ${res.status}: Webhook returned error.`);
      }
    } catch (e: any) {
      setTestResult(`❌ Network error: ${e.message}`);
    } finally {
      setIsTesting(false);
      onRefresh();
    }
  };

  const handleStartEditingToken = () => {
    setNewTokenInput(verifyToken);
    setTokenError(null);
    setTokenSuccess(null);
    setIsEditingToken(true);
  };

  const handleSaveVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTokenInput.trim();
    if (!trimmed || trimmed.length < 3) {
      setTokenError('Verify token must be at least 3 characters long.');
      return;
    }

    setIsSavingToken(true);
    setTokenError(null);
    try {
      const res = await fetch('/api/admin/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifyToken: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setTokenSuccess(`Verify token updated to "${data.verifyToken}"!`);
        setIsEditingToken(false);
        onRefresh();
        setTimeout(() => setTokenSuccess(null), 4000);
      } else {
        setTokenError(data.error || 'Failed to update verify token.');
      }
    } catch (err: any) {
      setTokenError(err.message || 'Network error updating verify token.');
    } finally {
      setIsSavingToken(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Webhook Configuration Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>WhatsApp Cloud API Webhook Endpoint</span>
                <span className="text-[10px] font-mono-nums bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                  HTTP 200 OK
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure this URL and Token in Meta for Developers &gt; WhatsApp &gt; Configuration &gt; Webhook
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestHandshake}
              disabled={isTesting}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isTesting ? 'Testing Handshake...' : 'Test Meta Handshake'}</span>
            </button>
            <button
              onClick={onRefresh}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs transition-colors cursor-pointer"
              title="Refresh Event Logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Handshake Result Alert */}
        {testResult && (
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono-nums text-slate-200">
            {testResult}
          </div>
        )}

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* Callback URL */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono-nums">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Callback URL</div>
              <div className="text-emerald-400 font-semibold break-all">{webhookUrl}</div>
            </div>
            <button
              onClick={() => handleCopy(webhookUrl, 'url')}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors ml-2 shrink-0 cursor-pointer"
              title="Copy URL"
            >
              {copiedField === 'url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Verify Token (Editable) */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono-nums">
            {isEditingToken ? (
              <form onSubmit={handleSaveVerifyToken} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Edit Webhook Verify Token
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingToken(false)}
                    className="text-slate-400 hover:text-white p-1 rounded"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={newTokenInput}
                    onChange={(e) => setNewTokenInput(e.target.value)}
                    placeholder="Enter verify token..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono-nums outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isSavingToken}
                    className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingToken ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>

                {tokenError && (
                  <div className="text-[11px] text-rose-400 font-sans">{tokenError}</div>
                )}
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Verify Token</span>
                    {tokenSuccess && (
                      <span className="text-emerald-400 font-sans font-normal">
                        ({tokenSuccess})
                      </span>
                    )}
                  </div>
                  <div className="text-white font-semibold break-all">{verifyToken}</div>
                </div>

                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button
                    onClick={handleStartEditingToken}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded transition-colors cursor-pointer"
                    title="Edit Verify Token"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCopy(verifyToken, 'token')}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                    title="Copy Token"
                  >
                    {copiedField === 'token' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Integration Status Notice */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs flex items-start gap-2 text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0"></div>
          <div>
            <strong className="text-slate-200">Production WhatsApp Mode:</strong>{' '}
            {statusData?.whatsappConfig?.isConfigured ? (
              <span className="text-emerald-400">
                Connected to WhatsApp Cloud Phone ID {statusData?.whatsappConfig?.phoneNumberId}. Outgoing messages are dispatched via Meta Graph API v21.0.
              </span>
            ) : (
              <span>
                Currently running in <strong className="text-amber-400">Development Adapter Mode</strong>. Inbound webhooks process real conversations, and outbound WhatsApp responses are logged to the development outbox. Add <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded font-mono">WHATSAPP_TOKEN</code> in <code className="text-slate-300">.env</code> to connect a live phone number.
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Webhook Logs Stream & Raw Payload Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Events Table */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Webhook className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Webhook Event Stream</span>
            </h3>
            <span className="text-xs font-mono-nums text-slate-400">
              {logs.length} logged events
            </span>
          </div>

          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No webhook events yet. Test with the test harness or trigger a message.
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs font-mono-nums cursor-pointer ${
                      selectedLog?.id === log.id
                        ? 'bg-slate-800 border-emerald-500/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {log.direction === 'INBOUND' ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-bold">
                            <ArrowDownLeft className="w-3.5 h-3.5" /> INBOUND
                          </span>
                        ) : (
                          <span className="text-sky-400 flex items-center gap-1 font-bold">
                            <ArrowUpRight className="w-3.5 h-3.5" /> OUTBOUND
                          </span>
                        )}
                        <span className="text-slate-400 font-sans font-medium">
                          {log.eventType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Phone: {log.userPhone || 'System'}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : log.status === 'DEV_MOCK'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {log.status}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Event Payload Viewer */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>Event Payload Inspector</span>
            </h3>
            {selectedLog && (
              <span className="text-xs font-mono-nums text-slate-400">
                {selectedLog.id}
              </span>
            )}
          </div>

          {selectedLog ? (
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-400 font-mono-nums">
                <span>Timestamp: {selectedLog.timestamp}</span>
                <span>Status: {selectedLog.status}</span>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono-nums text-emerald-300 overflow-x-auto max-h-[460px] overflow-y-auto leading-relaxed">
                {JSON.stringify(selectedLog.payload, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-slate-500">
              Click any event on the left to inspect its raw Meta JSON payload.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

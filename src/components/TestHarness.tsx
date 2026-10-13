import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  XCircle,
  Send,
  Terminal,
  Code2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface TestHarnessProps {
  onRefresh: () => void;
}

export const TestHarness: React.FC<TestHarnessProps> = ({ onRefresh }) => {
  const [testPhone, setTestPhone] = useState('2348031234567');
  const [testText, setTestText] = useState('Convert 100,000 CFA to Naira');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulationResponse, setSimulationResponse] = useState<any | null>(null);

  // Automated Tests
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<any | null>(null);

  const sampleScenarios = [
    { label: 'Rate Inquiry (EN)', text: "What is today's exchange rate?" },
    { label: 'Rate Inquiry (FR)', text: "Quel est le taux aujourd'hui ?" },
    { label: 'Quote: 100k CFA to NGN', text: 'Convert 100,000 CFA to Naira' },
    { label: 'Quote: 50k NGN to CFA', text: 'Exchange 50,000 Naira to CFA' },
    { label: 'Confirm Quote', text: 'Confirm' },
    { label: 'Submit Payment Proof', text: 'Payment sent via bank transfer' },
    { label: 'Transaction History', text: 'Show my last transactions' },
    { label: 'Human Support Trigger', text: 'I need human help with a transfer dispute' },
    { label: 'New User: Hello', text: 'Hello' },
    { label: 'New User: Bonjour', text: 'Bonjour' },
  ];

  const handleSimulateWebhook = async (customText?: string) => {
    const textToRun = customText || testText;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dev/simulate-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: testPhone, text: textToRun }),
      });
      const data = await res.json();
      setSimulationResponse(data);
      onRefresh();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunAutomatedTests = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/dev/run-tests');
      const data = await res.json();
      setTestResults(data);
    } catch (err: any) {
      alert(`Automated tests failed: ${err.message}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Test Harness Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-emerald-400" />
            <span>Developer Webhook Test Harness & Automated Test Suite</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dispatches authentic Meta WhatsApp Cloud API webhook events directly into the bot state machine
          </p>
        </div>

        <button
          onClick={handleRunAutomatedTests}
          disabled={isRunningTests}
          className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <span>{isRunningTests ? 'Running Test Suite...' : 'Run Automated Tests'}</span>
        </button>
      </div>

      {/* Automated Test Results Banner if run */}
      {testResults && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Automated Test Suite Results</span>
            </h3>
            <span className="text-xs font-mono-nums text-slate-300">
              <strong className="text-emerald-400">{testResults.passed} Passed</strong> ·{' '}
              <strong className={testResults.failed > 0 ? 'text-rose-400' : 'text-slate-500'}>
                {testResults.failed} Failed
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono-nums">
            {testResults.results.map((r: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  {r.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="text-slate-300 font-sans">{r.testName}</span>
                </div>
                <span className="text-[10px] text-emerald-400 uppercase font-bold shrink-0">
                  {r.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Webhook Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Input Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Simulate Incoming WhatsApp Message</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Sender WhatsApp Phone Number
              </label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="2348031234567"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono-nums outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Message Text Body
              </label>
              <textarea
                rows={3}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="What is today's exchange rate?"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => handleSimulateWebhook()}
              disabled={isSubmitting || !testText.trim()}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Webhook Event'}</span>
            </button>
          </div>

          {/* Quick Scenario Buttons */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">
              Quick Test Scenarios:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleScenarios.map((sc, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setTestText(sc.text);
                    handleSimulateWebhook(sc.text);
                  }}
                  className="text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-md border border-slate-800 transition-colors"
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Simulation Output */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span>Webhook Pipeline Response & Outbox Dispatch</span>
          </h3>

          {simulationResponse ? (
            <div className="space-y-4 text-xs font-mono-nums">
              {/* Bot Response Bubble */}
              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="text-emerald-400 font-bold uppercase">
                    Bot Response Delivered to WhatsApp:
                  </span>
                  <span>Intent: {simulationResponse.botResponse?.handledIntent}</span>
                </div>
                <div className="text-slate-100 whitespace-pre-line font-sans text-xs bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  {simulationResponse.botResponse?.replyText}
                </div>
              </div>

              {/* Inbound Meta Payload */}
              <div className="space-y-1">
                <div className="text-[11px] text-slate-400 font-sans">
                  Inbound Meta Cloud API JSON Webhook:
                </div>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-300 max-h-48 overflow-y-auto leading-relaxed">
                  {JSON.stringify(simulationResponse.metaWebhookPayload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-slate-500">
              Select or send a scenario on the left to see the inbound webhook payload and the bot's response.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

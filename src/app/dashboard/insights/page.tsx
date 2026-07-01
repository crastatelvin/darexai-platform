'use client';

import { useState } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function InsightsPane() {
  const [logs, setLogs] = useState<string[]>([]);
  const [activeActions, setActiveActions] = useState<Record<number, boolean>>({});

  const executeAction = async (idx: number, actionName: string) => {
    if (activeActions[idx]) return;

    setActiveActions(prev => ({ ...prev, [idx]: true }));
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] Triggered action: "${actionName}"`, ...prev]);

    // Simulate API request to trigger the automation or audit log
    try {
      await fetch('/api/crm/contacts'); // just a dummy request to check auth
    } catch (e) {
      console.error(e);
    }
  };

  const insights = [
    {
      title: 'You are losing 22% of leads because response time exceeds 10 minutes.',
      details: 'Across 142 inbound leads this week, average first-response was 14m 32s. Leads responded to within 5m closed 3.4x more.',
      confidence: '96%',
      actionText: 'Auto-reply within 60 seconds on WhatsApp →',
      icon: TrendingDown,
      color: 'red',
    },
    {
      title: 'Customers from Meta Ads convert 3.2x better than Google Ads.',
      details: 'Meta-sourced leads close at 18% vs Google at 5.6% over the last 30 days. CAC is also 28% lower on Meta.',
      confidence: '91%',
      actionText: 'Reallocate ₹40k from Google to Meta →',
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      title: '5 customers are likely to churn this month.',
      details: 'Usage dropped >40% week over week and support sentiment turned negative for these accounts.',
      confidence: '87%',
      actionText: null,
      icon: AlertTriangle,
      color: 'amber',
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl bg-zinc-950 text-zinc-100 font-sans min-h-[calc(100vh-10rem)]">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Insights</h1>
        <p className="text-zinc-400 text-sm mt-1">Your AI Employee monitors the business 24/7 and surfaces what actually moves revenue.</p>
      </div>

      {/* Insights Cards List */}
      <div className="space-y-6">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          const isDone = activeActions[idx];
          return (
            <div 
              key={idx}
              className="p-6 rounded-xl border border-zinc-900 bg-zinc-900/20 backdrop-blur flex flex-col md:flex-row gap-5 items-start justify-between glow-border"
            >
              <div className="flex gap-4 items-start">
                {/* Icon Container */}
                <div className={`p-2.5 rounded-lg border shrink-0 ${
                  insight.color === 'red' ? 'bg-red-500/5 border-red-500/10 text-red-400' :
                  insight.color === 'emerald' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' :
                  'bg-amber-500/5 border-amber-500/10 text-amber-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-sm font-bold text-white leading-relaxed">{insight.title}</h3>
                    <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded font-mono text-zinc-500">{insight.confidence} conf</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">{insight.details}</p>
                </div>
              </div>

              {/* Action Button */}
              {insight.actionText && (
                <button
                  onClick={() => executeAction(idx, insight.actionText!)}
                  disabled={isDone}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isDone 
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 disabled:opacity-80' 
                      : 'bg-white hover:bg-zinc-200 text-black shadow'
                  }`}
                >
                  {isDone ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Action Executed
                    </>
                  ) : (
                    insight.actionText
                  )}
                </button>
              )}

            </div>
          );
        })}
      </div>

      {/* Execution Logger Console */}
      {logs.length > 0 && (
        <div className="rounded-xl border border-zinc-900 bg-black/40 overflow-hidden">
          <div className="px-4 py-2 border-b border-zinc-900 bg-zinc-950/20 text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider">
            Insights Execution Log
          </div>
          <div className="p-4 font-mono text-[11px] text-emerald-400 max-h-[140px] overflow-y-auto space-y-1">
            {logs.map((log, i) => <div key={i}>{log}</div>)}
          </div>
        </div>
      )}

    </div>
  );
}

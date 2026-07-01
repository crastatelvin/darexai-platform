'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CheckSquare, 
  Bell, 
  FileText, 
  AlertCircle,
  ArrowUpRight,
  Activity,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { Alert } from '@/components/Alert';

interface DashboardData {
  kpis: {
    activeOpportunitiesCount: number;
    revenuePipeline: number;
    closedRevenue: number;
    pendingTasksCount: number;
  };
  activities: Array<{
    id: string;
    type: string;
    direction: string;
    title: string;
    body: string;
    contactName: string;
    createdAt: string;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    details: string;
    createdAt: string;
  }>;
  aiAlerts: Array<{
    type: string;
    message: string;
  }>;
}

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/dashboard/metrics');
        if (res.ok) {
          const metrics = await res.json();
          setData(metrics);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 border-r-2 border-transparent mb-4"></div>
        <span>Hydrating Business Metrics...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Welcome Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Executive Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Real-time indicators and operational AI notifications.</p>
      </div>

      {/* Dynamic AI Alerts section */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-blue-400" />
          AI Alerts & Recommendations
        </h2>
        <div className="grid gap-3">
          {data.aiAlerts.map((alert, idx) => (
            <Alert key={idx} type={alert.type as any} message={alert.message} />
          ))}
        </div>
      </div>

      {/* Live KPIs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur glow-border">
          <div className="flex justify-between items-start">
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Active Deals</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-white">{data.kpis.activeOpportunitiesCount}</div>
          <div className="mt-1 text-xs text-zinc-500 flex items-center gap-1">
            In qualification & proposal stages.
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur glow-border">
          <div className="flex justify-between items-start">
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Revenue Pipeline</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><DollarSign className="w-4 h-4" /></div>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-white">${data.kpis.revenuePipeline.toLocaleString()}</div>
          <div className="mt-1 text-xs text-zinc-500">Unclosed opportunities value sum.</div>
        </div>

        {/* Metric 3 */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur glow-border">
          <div className="flex justify-between items-start">
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Closed Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><DollarSign className="w-4 h-4" /></div>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-white">${data.kpis.closedRevenue.toLocaleString()}</div>
          <div className="mt-1 text-xs text-zinc-500">Total won sales contract value.</div>
        </div>

        {/* Metric 4 */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur glow-border">
          <div className="flex justify-between items-start">
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Pending Actions</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><CheckSquare className="w-4 h-4" /></div>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-white">{data.kpis.pendingTasksCount}</div>
          <div className="mt-1 text-xs text-zinc-500">Follow-up reminders incomplete.</div>
        </div>
      </div>

      {/* Columns: Recent Activity Feed & Audit Log Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Customer Activity Feed */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Customer Activity
            </h2>
            <Link href="/dashboard/timeline" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              View Inbox <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4 divide-y divide-zinc-900 pt-2">
            {data.activities.length === 0 ? (
              <p className="text-zinc-500 text-sm">No activity recorded yet.</p>
            ) : (
              data.activities.map((act) => (
                <div key={act.id} className="pt-4 first:pt-0 flex flex-col gap-1.5">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-white">{act.contactName}</span>
                    <span className="text-xs text-zinc-500">{new Date(act.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      act.type === 'whatsapp' ? 'bg-emerald-500/10 text-emerald-400' :
                      act.type === 'email' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {act.type} {act.direction}
                    </span>
                    <span className="text-xs text-zinc-300 font-medium">{act.title}</span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-1 italic">"{act.body}"</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Platform Audit Trail */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Audit Log Trail
            </h2>
          </div>

          <div className="space-y-4 pt-2">
            {data.auditLogs.length === 0 ? (
              <p className="text-zinc-500 text-sm">No operations logged yet.</p>
            ) : (
              data.auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-900 text-xs space-y-1.5 hover:border-zinc-800 transition">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-300 uppercase tracking-wider text-[10px] bg-zinc-800 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed font-mono text-[11px]">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Floating Call to Action: Chat with AI */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-transparent border border-blue-500/20 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            AI Agent is ready for commands
          </h3>
          <p className="text-zinc-400 text-xs mt-1">Ask the agent to update opportunity statuses, schedule calendar follow-up tasks, or query contact files.</p>
        </div>
        <Link 
          href="/dashboard/agent"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition cursor-pointer shrink-0"
        >
          Open Chat Agent
        </Link>
      </div>
    </div>
  );
}

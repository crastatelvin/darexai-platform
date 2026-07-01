'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  MessageSquare, 
  Calendar, 
  Phone, 
  Users, 
  ClipboardList, 
  Zap, 
  Plus, 
  AtSign, 
  Mic, 
  ArrowUp
} from 'lucide-react';

export default function ActionsPane() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('prefilled_agent_query', query);
      router.push('/dashboard/conversations');
    }
  };

  const templates = [
    {
      title: 'Send WhatsApp campaign',
      description: 'Personalized to a segment',
      prompt: 'Draft and schedule a personalized WhatsApp follow-up campaign to all leads marked as LEAD status.',
      icon: MessageSquare,
    },
    {
      title: 'Book appointments',
      description: 'From recent intent signals',
      prompt: 'Review all recent high-intent emails from this week and draft calendar invite proposals.',
      icon: Calendar,
    },
    {
      title: 'Call warm prospects',
      description: 'Auto-dial top intent leads',
      prompt: 'Check contacts with high intent and list phone numbers sorted by highest urgency.',
      icon: Phone,
    },
    {
      title: 'Assign leads to team',
      description: 'Round-robin by load',
      prompt: 'Create a task mapping new unassigned contacts round-robin style to available team members.',
      icon: Users,
    },
    {
      title: 'Create tasks',
      description: 'Across deals at risk',
      prompt: 'Analyze opportunities marked as NEGOTIATION and create check follow-up tasks.',
      icon: ClipboardList,
    },
    {
      title: 'Win-back ghosted',
      description: 'ROI 1-pager sequence',
      prompt: 'Draft a win-back sequence proposing a 15% discount for cold opportunities.',
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl bg-zinc-950 text-zinc-100 font-sans min-h-[calc(100vh-10rem)]">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Actions</h1>
        <p className="text-zinc-400 text-sm mt-1">This is where your AI Employee executes the work. No workflow builder. Just intent.</p>
      </div>

      {/* Large Input Box */}
      <form onSubmit={handleExecute} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 backdrop-blur space-y-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-zinc-205 placeholder-zinc-600 focus:outline-none resize-none min-h-[5rem]"
          placeholder="e.g. Follow up with every warm lead from this week on WhatsApp"
        />
        <div className="flex justify-between items-center pt-2 border-t border-zinc-900">
          <div className="flex items-center gap-3 text-zinc-500">
            <button type="button" className="hover:text-zinc-300 transition"><Plus className="w-4 h-4" /></button>
            <button type="button" className="hover:text-zinc-300 transition"><AtSign className="w-4 h-4" /></button>
            <button type="button" className="hover:text-zinc-300 transition"><Mic className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-500">AI Employee • gpt-5 class</span>
            <button
              type="submit"
              disabled={!query.trim()}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white rounded-lg transition"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>

      {/* Disclaimer */}
      <div className="text-center text-[10px] text-zinc-600 font-semibold tracking-wider uppercase">
        DareXAI sees your leads, calls, WhatsApp, and revenue. Replies are recommendations, not promises.
      </div>

      {/* Templates Section */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl, idx) => {
            const Icon = tpl.icon;
            return (
              <div
                key={idx}
                onClick={() => setQuery(tpl.prompt)}
                className="p-6 rounded-xl border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800 hover:bg-zinc-900/30 transition text-left cursor-pointer space-y-3 glow-border"
              >
                <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-400 w-fit">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{tpl.title}</h4>
                  <p className="text-xs text-zinc-500 mt-1">{tpl.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

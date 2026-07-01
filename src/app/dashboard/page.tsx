'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Bot,
  ArrowRight,
  FileText,
  Bell,
  Building2,
  Paperclip,
  Mic,
  AtSign,
  ArrowUp
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  name: string;
  email: string;
}

export default function HomeDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [inputMsg, setInputMsg] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchProfile();
  }, []);

  const triggerFocusQuery = (query: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('prefilled_agent_query', query);
      router.push('/dashboard/conversations');
    }
  };

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    triggerFocusQuery(inputMsg);
  };

  const suggestedFocus = [
    'Which leads need my attention?',
    "Summarize yesterday's calls",
    'Find revenue opportunities',
    'Follow up with all warm leads'
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-10rem)] bg-zinc-950 text-zinc-100 font-sans">
      
      {/* Left Main Dashboard Pane */}
      <div className="flex-1 space-y-8 pr-0 lg:pr-4">
        
        {/* Status Line */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-green"></span>
            AI EMPLOYEE • ONLINE
          </div>
        </div>

        {/* Hello Banner */}
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Good Morning, {profile?.name ? profile.name.split(' ')[0] : 'Sanu'}
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
            I reviewed yesterday's performance, the overnight conversations, and the pipeline. Here is what I think matters today.
          </p>
        </div>

        {/* Central Inline Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/10 backdrop-blur">
          
          <div className="p-3 text-left">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Leads</span>
            <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-1.5">
              42
              <span className="text-xs text-emerald-400 font-bold">+18%</span>
            </div>
          </div>

          <div className="p-3 text-left border-l border-zinc-900">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">High Intent</span>
            <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-1.5">
              8
              <span className="text-xs text-emerald-400 font-bold">+2</span>
            </div>
          </div>

          <div className="p-3 text-left border-l border-zinc-900">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Booked</span>
            <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-1">
              4
              <span className="text-xs text-zinc-500 font-semibold">calls</span>
            </div>
          </div>

          <div className="p-3 text-left border-l border-zinc-900">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Pipeline</span>
            <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-1">
              ₹32L
              <span className="text-xs text-zinc-500 font-semibold">est.</span>
            </div>
          </div>

        </div>

        {/* Daily Briefing Card */}
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 backdrop-blur space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            BRIEFING just now
          </div>

          <p className="text-base text-zinc-200 leading-relaxed font-medium">
            I identified <span className="text-white font-bold">14 warm leads</span> that have not been contacted in over 72 hours. Together they represent roughly <span className="text-emerald-400 font-extrabold">₹8.4L</span> in immediate pipeline value.
          </p>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Based on their previous WhatsApp intent scores, I recommend a short personalized nudge with the revised Q4 pricing brochure. I can draft and queue all 14 in about 30 seconds.
          </p>
        </div>

        {/* Chat Input Prompt at Bottom */}
        <form onSubmit={handleSendPrompt} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur space-y-3">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none"
            placeholder="Ask your AI employee anything..."
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
                disabled={!inputMsg.trim()}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white rounded-lg transition"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>

      </div>

      {/* Right Sidebar: Focus & Insights */}
      <div className="w-full lg:w-80 space-y-6 shrink-0 border-l border-zinc-900 pl-0 lg:pl-6">
        
        {/* Right Metric Quick Grid */}
        <div className="grid grid-cols-2 gap-4">
          
          <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10">
            <span className="text-3xl font-extrabold text-white">42</span>
            <span className="block text-[9px] font-bold text-zinc-500 uppercase mt-1">Leads</span>
          </div>

          <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10">
            <span className="text-3xl font-extrabold text-white">8</span>
            <span className="block text-[9px] font-bold text-zinc-500 uppercase mt-1">High Intent</span>
          </div>

          <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10">
            <span className="text-3xl font-extrabold text-white">4</span>
            <span className="block text-[9px] font-bold text-zinc-500 uppercase mt-1">Booked</span>
          </div>

          <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10">
            <span className="text-3xl font-extrabold text-white">₹32L</span>
            <span className="block text-[9px] font-bold text-zinc-500 uppercase mt-1">Pipeline</span>
          </div>

        </div>

        {/* Suggested Focus triggers */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Suggested Focus</h3>
          <div className="space-y-2">
            {suggestedFocus.map((focus, idx) => (
              <button
                key={idx}
                onClick={() => triggerFocusQuery(focus)}
                className="w-full flex items-center justify-between text-left p-3.5 rounded-xl border border-zinc-900 bg-zinc-900/20 hover:bg-zinc-900/50 hover:border-zinc-800 transition text-xs font-semibold text-zinc-300 cursor-pointer"
              >
                {focus}
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Key Insights Alert Card */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Key Insights</h3>
          <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/30 space-y-4">
            <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
              Meta Ads are converting <span className="text-emerald-400 font-bold">3.2x better</span> than Google search this week.
            </p>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-zinc-500">Confidence • 94%</span>
              <Link href="/dashboard/insights" className="text-blue-400 hover:underline flex items-center gap-0.5">
                Take action <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

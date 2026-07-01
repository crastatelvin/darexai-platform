'use client';

import { useState } from 'react';
import { 
  Zap, 
  Play, 
  Sparkles, 
  Terminal, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  ClipboardList,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface AutomationResult {
  success: boolean;
  score: number;
  reasoning: string;
  autoWhatsAppSent: boolean;
  autoTaskCreated: boolean;
  executionLogs: string[];
}

export default function AutomationRunner() {
  const [name, setName] = useState('Sarah Connor');
  const [email, setEmail] = useState('sarah.c@cyberdyne.io');
  const [phone, setPhone] = useState('+1555987654');
  const [notes, setNotes] = useState('Looking to implement Generative AI workflows immediately. Have a team of 45 engineers and $50k budget.');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AutomationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/automation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, notes }),
      });

      if (!res.ok) {
        throw new Error('Automation execution failed.');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Server error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (type: 'high' | 'low') => {
    if (type === 'high') {
      setName('Sarah Connor');
      setEmail('sarah.c@cyberdyne.io');
      setPhone('+1555987654');
      setNotes('Looking to implement Generative AI workflows immediately. Have a team of 45 engineers and $50k budget.');
    } else {
      setName('John Doe');
      setEmail('john.doe@hobbyist.net');
      setPhone('+1555123456');
      setNotes('Just looking around. I am a student doing a research project and would like to see if there are free templates available.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Workflow Automation</h1>
        <p className="text-zinc-400 text-sm mt-1">Configure triggers and run automated multi-stage decision sequences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Configuration Form */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md space-y-6">
          
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-blue-400" />
              Trigger: New Lead Intake
            </h2>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => loadPreset('high')}
                className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2 py-0.5 rounded font-bold uppercase cursor-pointer"
              >
                Hot Lead
              </button>
              <button 
                type="button" 
                onClick={() => loadPreset('low')}
                className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/15 px-2 py-0.5 rounded font-bold uppercase cursor-pointer"
              >
                Cold Lead
              </button>
            </div>
          </div>

          <form onSubmit={handleRunWorkflow} className="space-y-4">
            
            <div>
              <label className="block text-zinc-400 text-xs font-semibold mb-1">Lead Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-semibold mb-1">Inquiry / Business Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-xs focus:outline-none resize-none font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {loading ? 'Executing Flow...' : 'Trigger Qualification Flow'}
            </button>

          </form>

        </div>

        {/* Right Side: Step Execution Trace & Console */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step Sequence Visualization */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-md space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Sequence Status Map
            </h2>

            <div className="space-y-4">
              
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  result ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {result ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
                    Record Intake Lead Contact
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Saves contact profile in PostgreSQL.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  result ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {result ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                    AI Qualification Evaluation
                  </h4>
                  {result && (
                    <span className={`inline-flex mt-1 text-[9px] px-2 py-0.5 rounded font-extrabold uppercase border ${
                      result.score > 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' : 'bg-amber-500/10 text-amber-400 border-amber-500/10'
                    }`}>
                      Score: {result.score}/100 - {result.score > 80 ? 'Qualified' : 'Manual Review'}
                    </span>
                  )}
                  <p className="text-[10px] text-zinc-500 mt-0.5">Gemini analyzes budget/intent from lead profile notes.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  result ? (result.autoWhatsAppSent ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/20') : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {result ? (result.autoWhatsAppSent ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />) : '3'}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                    Outbound WhatsApp Notification (Conditional)
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Sends automated invitation WhatsApp if score exceeds 80.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-4">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  result ? (result.autoTaskCreated ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/20') : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {result ? (result.autoTaskCreated ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />) : '4'}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-zinc-500" />
                    Create Follow-up CRM Task (Conditional)
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Saves pending follow-up task for high-scoring leads.</p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex items-start gap-4">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  result ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {result ? <CheckCircle2 className="w-4 h-4" /> : '5'}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                    Log Portal Audit Entry
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Saves qualification audit log with reasoning details.</p>
                </div>
              </div>

            </div>

          </div>

          {/* Console Output */}
          <div className="rounded-2xl border border-zinc-850 bg-black/60 overflow-hidden">
            
            <div className="px-4 py-2 border-b border-zinc-900 flex items-center gap-2 bg-zinc-950/40">
              <Terminal className="w-4 h-4 text-zinc-400" />
              <span className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-wider">Sequence Console Logs</span>
            </div>

            <div className="p-4 font-mono text-[11px] leading-relaxed text-zinc-300 min-h-[140px] max-h-[220px] overflow-y-auto space-y-1.5 bg-black/90">
              {loading && (
                <div className="text-zinc-500 flex items-center gap-2 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Executing multi-stage flow...
                </div>
              )}
              {error && <div className="text-red-400">ERROR: {error}</div>}
              {!result && !loading && !error && (
                <div className="text-zinc-500">Console ready. Trigger qualification flow to observe logs.</div>
              )}
              {result && (
                <>
                  {result.executionLogs.map((log, idx) => (
                    <div key={idx} className={log.includes('Score is') ? 'text-blue-400 font-bold' : log.includes('Decision Point') ? 'text-indigo-400 font-semibold' : ''}>
                      {log}
                    </div>
                  ))}
                  <div className="pt-2 text-zinc-400 italic">
                    AI reasoning: "{result.reasoning}"
                  </div>
                </>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  Smartphone, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sparkles,
  Terminal,
  Smile,
  Meh,
  Frown,
  Activity,
  Plus
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string | null;
}

interface WhatsAppMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  sentiment: string | null;
  intent: string | null;
  createdAt: string;
}

export default function WhatsAppInbox() {
  const [threads, setThreads] = useState<Contact[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [replyInput, setReplyInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Simulation form states
  const [showSimulate, setShowSimulate] = useState(false);
  const [simulateSenderPhone, setSimulateSenderPhone] = useState('+1555019921');
  const [simulateSenderName, setSimulateSenderName] = useState('Alice Johnson');
  const [simulateText, setSimulateText] = useState('Hello, I am interested in purchasing an AI integration workshop.');
  const [simulating, setSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch threads (contacts with timeline events)
  const fetchThreads = async () => {
    try {
      setLoadingThreads(true);
      const res = await fetch('/api/crm/contacts');
      if (res.ok) {
        const data = await res.json();
        // Keep contacts that have phone numbers
        const whatsappContacts = data.filter((c: any) => c.phone);
        setThreads(whatsappContacts);
        if (whatsappContacts.length > 0 && !activeContactId) {
          setActiveContactId(whatsappContacts[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingThreads(false);
    }
  };

  // Fetch WhatsApp logs for active contact thread
  const fetchThreadMessages = async (contactId: string) => {
    try {
      setLoadingMessages(true);
      const res = await fetch(`/api/crm/timeline?contactId=${contactId}`);
      if (res.ok) {
        const data = await res.json();
        // Filter only WhatsApp events
        const whatsappLogs = data
          .filter((e: any) => e.type === 'whatsapp')
          // Sort ascending for thread flow
          .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setMessages(whatsappLogs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    if (activeContactId) {
      fetchThreadMessages(activeContactId);
    }
  }, [activeContactId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingMessages]);

  const handleManualReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !activeContactId || sending) return;

    setSending(true);
    const textToSend = replyInput;
    setReplyInput('');

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: activeContactId,
          messageText: textToSend,
        }),
      });

      if (res.ok) {
        fetchThreadMessages(activeContactId);
      } else {
        const errData = await res.json();
        alert(`Failed to send WhatsApp: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimulationLogs(['[1/3] Bundling webhook simulation payload...']);

    try {
      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulation: true,
          from: simulateSenderPhone,
          name: simulateSenderName,
          text: simulateText,
        }),
      });

      setSimulationLogs((prev) => [...prev, '[2/3] Webhook POST sent. Processing classification...']);

      if (res.ok) {
        const data = await res.json();
        setSimulationLogs((prev) => [
          ...prev,
          `[3/3] Incoming webhook logged! AI Auto-reply sent: "${data.reply}"`,
        ]);
        
        // Refresh contacts/threads list
        fetchThreads();
        if (activeContactId) {
          fetchThreadMessages(activeContactId);
        }
      } else {
        throw new Error('Simulation endpoint failed');
      }
    } catch (err: any) {
      setSimulationLogs((prev) => [...prev, `[ERROR] Simulation failed: ${err.message}`]);
    } finally {
      setSimulating(false);
    }
  };

  const activeContact = threads.find((t) => t.id === activeContactId);

  const getSentimentEmoji = (sentiment: string | null) => {
    if (sentiment === 'positive') return <Smile className="w-3.5 h-3.5 text-emerald-400" title="Positive Sentiment" />;
    if (sentiment === 'negative') return <Frown className="w-3.5 h-3.5 text-red-400" title="Negative Sentiment" />;
    return <Meh className="w-3.5 h-3.5 text-zinc-400" title="Neutral Sentiment" />;
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">WhatsApp CRM Inbox</h1>
          <p className="text-zinc-400 text-sm mt-1">Simulate webhooks, view complete logs, and manually text clients.</p>
        </div>

        {/* Simulate Webhook Trigger */}
        <button
          onClick={() => {
            setShowSimulate(true);
            setSimulationLogs([]);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <Smartphone className="w-4 h-4" /> Simulate Webhook Message
        </button>
      </div>

      <div className="h-[calc(100vh-12rem)] flex border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/10 backdrop-blur-md">
        
        {/* Left Side: Active WhatsApp Threads */}
        <div className="w-72 border-r border-zinc-800 bg-zinc-950/40 flex flex-col">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/20 text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Active Threads
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {loadingThreads ? (
              <div className="text-center py-6 text-xs text-zinc-600">Loading Threads...</div>
            ) : threads.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-600">No active threads.</div>
            ) : (
              threads.map((thread) => {
                const isActive = activeContactId === thread.id;
                return (
                  <button
                    key={thread.id}
                    onClick={() => setActiveContactId(thread.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition duration-150 cursor-pointer ${
                      isActive 
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                        : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-300'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-[10px]">
                      {thread.name.charAt(0)}
                    </div>
                    <div className="flex-1 truncate">
                      <div className="font-bold truncate text-white">{thread.name}</div>
                      <div className="text-[9px] text-zinc-500 font-mono mt-0.5">{thread.phone}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Chat Panel */}
        <div className="flex-1 flex flex-col justify-between bg-zinc-950/10">
          {activeContact ? (
            <>
              {/* Active Thread Title */}
              <div className="h-12 px-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/30">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-green"></span>
                  {activeContact.name} ({activeContact.phone})
                </div>
              </div>

              {/* Chat Timeline Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                    Loading thread history...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs text-center max-w-xs mx-auto">
                    <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
                    <span>No messages logged. Simulating an inbound webhook message will start the thread conversation.</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isInbound = msg.direction === 'inbound';
                    return (
                      <div key={msg.id} className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-2 border ${
                          isInbound 
                            ? 'bg-zinc-900/60 border-zinc-800 text-zinc-200' 
                            : 'bg-emerald-600/10 border-emerald-500/20 text-white'
                        }`}>
                          <div className="whitespace-pre-wrap">{msg.body}</div>
                          
                          {/* AI Telemetry tag indicators (for inbound messages) */}
                          {isInbound && (msg.sentiment || msg.intent) && (
                            <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2 text-[9px] font-bold text-zinc-500 tracking-wider">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="flex items-center gap-1">
                                {getSentimentEmoji(msg.sentiment)}
                                {msg.sentiment}
                              </span>
                              {msg.intent && <span>• {msg.intent.toUpperCase()}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Manual Input Reply Form */}
              <form onSubmit={handleManualReply} className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex gap-3">
                <input
                  type="text"
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  disabled={sending}
                  className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
                  placeholder={`Send WhatsApp reply to ${activeContact.name}...`}
                />
                <button
                  type="submit"
                  disabled={sending || !replyInput.trim()}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl shadow-lg shadow-emerald-500/25 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs">
              Select or simulate a thread.
            </div>
          )}
        </div>

      </div>

      {/* Simulate Incoming Webhook Popup Modal */}
      {showSimulate && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            
            <button
              type="button"
              onClick={() => setShowSimulate(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white font-bold text-lg cursor-pointer"
            >
              &times;
            </button>

            {/* Left Column: Form */}
            <form onSubmit={handleSimulateWebhook} className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                Simulate Incoming WhatsApp
              </h3>

              <div>
                <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">Sender Name</label>
                <input
                  type="text"
                  value={simulateSenderName}
                  onChange={(e) => setSimulateSenderName(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-xs focus:outline-none"
                  placeholder="Alice Johnson"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">Sender Phone</label>
                <input
                  type="text"
                  value={simulateSenderPhone}
                  onChange={(e) => setSimulateSenderPhone(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-xs focus:outline-none font-mono"
                  placeholder="+1555019921"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">Message Content</label>
                <textarea
                  value={simulateText}
                  onChange={(e) => setSimulateText(e.target.value)}
                  required
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-xs focus:outline-none resize-none font-sans"
                  placeholder="Type message here..."
                />
              </div>

              <button
                type="submit"
                disabled={simulating}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Inject Webhook Event
              </button>
            </form>

            {/* Right Column: Console Log Trace */}
            <div className="flex flex-col border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6 justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 mb-3">
                  <Terminal className="w-4 h-4 text-zinc-500" />
                  Webhook Trace Console
                </h4>
                <div className="p-3.5 rounded-xl bg-black/60 font-mono text-[10px] text-zinc-300 space-y-1.5 min-h-[160px] max-h-[220px] overflow-y-auto">
                  {simulationLogs.length === 0 ? (
                    <div className="text-zinc-650">Console idle. Trigger webhook to view trace.</div>
                  ) : (
                    simulationLogs.map((log, idx) => (
                      <div key={idx} className={log.includes('Logged') ? 'text-emerald-400' : log.includes('ERROR') ? 'text-red-400' : ''}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="text-[10px] text-zinc-500 font-medium pt-4 leading-relaxed">
                This triggers a local POST callback to `api/whatsapp/webhook` simulating Meta API requests, running sentiment logic, and executing AI auto-replies.
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles,
  Search,
  Filter,
  Smile,
  Meh,
  Frown,
  Brain
} from 'lucide-react';

interface Contact {
  name: string;
  email: string | null;
}

interface TimelineEvent {
  id: string;
  type: string;
  direction: string;
  title: string;
  body: string;
  sentiment: string | null;
  intent: string | null;
  createdAt: string;
  contact: Contact;
}

export default function UnifiedTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/timeline');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchesType = typeFilter === 'all' || e.type === typeFilter;
    const matchesSearch = 
      e.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.body.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getSentimentIcon = (sentiment: string | null) => {
    if (sentiment === 'positive') return <Smile className="w-3.5 h-3.5 text-emerald-400" />;
    if (sentiment === 'negative') return <Frown className="w-3.5 h-3.5 text-red-400" />;
    return <Meh className="w-3.5 h-3.5 text-zinc-400" />;
  };

  const getSentimentClass = (sentiment: string | null) => {
    if (sentiment === 'positive') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10';
    if (sentiment === 'negative') return 'bg-red-500/10 text-red-400 border-red-500/10';
    return 'bg-zinc-800 text-zinc-400 border-zinc-700/60';
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Unified Inbox Timeline</h1>
        <p className="text-zinc-400 text-sm mt-1">Chronological feed of emails, calls, and WhatsApp messages with AI telemetry.</p>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-zinc-200 text-xs focus:outline-none focus:border-blue-500 transition"
            placeholder="Search contact, title or content..."
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer shrink-0 ${
              typeFilter === 'all' 
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' 
                : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Logs
          </button>
          <button
            onClick={() => setTypeFilter('email')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer shrink-0 ${
              typeFilter === 'email' 
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' 
                : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Emails
          </button>
          <button
            onClick={() => setTypeFilter('whatsapp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer shrink-0 ${
              typeFilter === 'whatsapp' 
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' 
                : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            WhatsApp
          </button>
          <button
            onClick={() => setTypeFilter('call')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer shrink-0 ${
              typeFilter === 'call' 
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' 
                : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Call Logs
          </button>
        </div>

      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 border-r-2 border-transparent mb-4"></div>
          <span>Loading timeline history...</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
          <p className="text-zinc-500 text-sm">No activity events match your filter parameters.</p>
        </div>
      ) : (
        <div className="relative pl-6 border-l border-zinc-800 space-y-8 max-w-4xl mx-auto py-2">
          
          {filteredEvents.map((event) => {
            const isEmail = event.type === 'email';
            const isWhatsApp = event.type === 'whatsapp';
            const isCall = event.type === 'call';
            const isInbound = event.direction === 'inbound';

            return (
              <div key={event.id} className="relative">
                
                {/* Timeline Icon Node */}
                <span className={`absolute -left-[38px] top-1.5 w-7 h-7 rounded-full flex items-center justify-center text-white border shadow-md ${
                  isEmail ? 'bg-blue-600/80 border-blue-500' :
                  isWhatsApp ? 'bg-emerald-600/80 border-emerald-500' :
                  'bg-indigo-600/80 border-indigo-500'
                }`}>
                  {isEmail && <Mail className="w-3.5 h-3.5" />}
                  {isWhatsApp && <MessageSquare className="w-3.5 h-3.5" />}
                  {isCall && <Phone className="w-3.5 h-3.5" />}
                </span>

                {/* Event Card */}
                <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 transition space-y-4 glow-border">
                  
                  {/* Card Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
                    
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">{event.contact.name}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5 px-2 py-0.5 rounded border ${
                        isInbound ? 'bg-blue-500/10 text-blue-400 border-blue-500/10' : 'bg-amber-500/10 text-amber-400 border-amber-500/10'
                      }`}>
                        {isInbound ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        {event.direction}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-500">
                      {new Date(event.createdAt).toLocaleString()}
                    </span>

                  </div>

                  {/* Message Title & Body */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-white text-sm">{event.title}</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed whitespace-pre-wrap font-sans">{event.body}</p>
                  </div>

                  {/* AI Intent & Sentiment Detection indicators */}
                  <div className="pt-3 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-4">
                    
                    {/* Tags */}
                    <div className="flex gap-2">
                      {/* Sentiment pill */}
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${getSentimentClass(event.sentiment)}`}>
                        {getSentimentIcon(event.sentiment)}
                        {event.sentiment} sentiment
                      </span>

                      {/* Intent pill */}
                      {event.intent && (
                        <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {event.intent} intent
                        </span>
                      )}
                    </div>

                    {/* Quick AI Summary Preview */}
                    <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5 text-indigo-400" />
                      <span>AI Engine classification logged.</span>
                    </div>

                  </div>

                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}

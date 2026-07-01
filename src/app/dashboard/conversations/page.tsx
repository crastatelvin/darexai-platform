'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Search, 
  Smile, 
  Meh, 
  Frown, 
  Brain,
  Wrench,
  Send,
  Bot,
  Sparkles,
  ArrowRight,
  PhoneCall,
  User,
  ArrowLeft
} from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  createdAt: string;
}

export default function ConversationsInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingReply, setGeneratingReply] = useState(false);
  const [activeTool, setActiveTool] = useState<{ name: string; args: any } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch recent conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/agent/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);

        // Persistent active chat selection
        if (typeof window !== 'undefined') {
          const savedId = sessionStorage.getItem('active_chat_id');
          const prefilledQuery = sessionStorage.getItem('prefilled_agent_query');

          if (savedId && data.some((c: any) => c.id === savedId)) {
            setActiveConvId(savedId);
          } else if (data.length > 0) {
            setActiveConvId(data[0].id);
            sessionStorage.setItem('active_chat_id', data[0].id);
          }

          // Prefilled prompt logic (from Home or Actions)
          if (prefilledQuery) {
            sessionStorage.removeItem('prefilled_agent_query');
            setTimeout(() => {
              executePrompt(prefilledQuery, savedId || data[0]?.id);
            }, 300);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for active conversation
  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/agent/messages?conversationId=${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, activeTool]);

  const selectConversation = (id: string) => {
    setActiveConvId(id);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('active_chat_id', id);
    }
  };

  // Execute prefilled or focus queries
  const executePrompt = async (promptText: string, convId?: string) => {
    const targetId = convId || activeConvId;
    if (!targetId || isStreaming) return;

    setIsStreaming(true);
    setActiveTool(null);

    // Append user message locally
    const tempUserMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: promptText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptText, conversationId: targetId }),
      });

      if (!res.body) throw new Error('No body returned from stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let assistantText = '';
      let assistantMsgId = Math.random().toString();

      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, sender: 'assistant', text: '', createdAt: new Date().toISOString() },
      ]);

      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === 'tool') {
              setActiveTool({ name: data.toolName, args: data.args });
            } else if (data.type === 'text') {
              assistantText += data.text;
              setMessages((prev) => 
                prev.map((msg) => 
                  msg.id === assistantMsgId ? { ...msg, text: assistantText } : msg
                )
              );
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
      setActiveTool(null);
      if (targetId) fetchMessages(targetId);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isStreaming) return;
    const msg = inputMsg;
    setInputMsg('');
    await executePrompt(msg);
  };

  // Generate Suggested Auto Reply using Groq AI
  const handleReplyForMe = async () => {
    if (!activeConvId || messages.length === 0 || generatingReply) return;
    setGeneratingReply(true);

    try {
      // Mock or fetch suggestion
      const prompt = `Based on the conversation history with ${activeContactName}, draft a short, professional, and action-oriented WhatsApp response to their last message. Respond ONLY with the suggested message text.`;
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, conversationId: activeConvId }),
      });
      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let textResult = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.type === 'text') textResult += data.text;
            } catch (_) {}
          }
        }
        // Prefill input box with generated suggestion!
        // Clean out any metadata headers
        const cleanReply = textResult.replace(/\*\[Running.*\]\*/g, '').trim();
        setInputMsg(cleanReply);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingReply(false);
    }
  };

  const handleCallNow = () => {
    alert(`Initiating outbound dialer to client channel associated with ${activeContactName}...`);
  };

  // Active Contact metadata mapping matching screenshots
  const activeContactName = conversations.find(c => c.id === activeConvId)?.title || 'Rahul Sharma';
  
  const isRahul = activeContactName.includes('Rahul');
  const isMaya = activeContactName.includes('Maya');
  const isAditi = activeContactName.includes('Aditi');
  const isMantis = activeContactName.includes('Mantis');
  const isKabir = activeContactName.includes('Kabir');

  // Hardcoded details matching the visual specs in Image 4
  const summaryText = isRahul 
    ? "Rahul has reviewed pricing three times in 24 hours and is asking for a call. Intent is high. Objection: annual vs monthly commitment. Buying signal: requested invoice address."
    : isMaya ? "Maya shared the updated Statement of Work (SOW). They are reviewing legal terms. Response is needed today."
    : "AI summary pending log parsing. Customer interest holds within normal parameters.";

  const urgencyPill = isRahul ? "48h" : isMaya ? "24h" : "Low";
  const objectionPill = isRahul ? "Annual price" : isMaya ? "Legal SOW" : "None";
  const intentPill = isRahul ? "High" : isMaya ? "Medium" : "Normal";

  const getContactIcon = (name: string) => {
    if (name.includes('Maya')) return <Mail className="w-3.5 h-3.5" />;
    if (name.includes('Mantis')) return <Phone className="w-3.5 h-3.5" />;
    return <MessageSquare className="w-3.5 h-3.5" />;
  };

  const getContactSnippet = (name: string) => {
    if (name.includes('Rahul')) return "Can we hop on a call tomorrow at 11?";
    if (name.includes('Maya')) return "Sharing the updated SOW for legal review.";
    if (name.includes('Aditi')) return "Will revert after our team sync.";
    if (name.includes('Mantis')) return "Voicemail · 38s · transcript ready";
    return "Thanks, will think and revert.";
  };

  const getContactTimeBadge = (name: string) => {
    if (name.includes('Rahul')) return "2m";
    if (name.includes('Maya')) return "1h";
    if (name.includes('Aditi')) return "4h";
    if (name.includes('Mantis')) return "Yesterday";
    return "3d";
  };

  const getContactCountBadge = (name: string) => {
    if (name.includes('Rahul')) return 2;
    if (name.includes('Mantis')) return 1;
    return 0;
  };

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-10rem)] flex border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/10 backdrop-blur-md font-sans">
      
      {/* Left Conversations Thread Panel */}
      <div className="w-80 border-r border-zinc-800 bg-zinc-950/40 flex flex-col justify-between shrink-0">
        
        {/* Search header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/20 space-y-3">
          <h2 className="text-lg font-extrabold text-white">Conversations</h2>
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-lg pl-10 pr-4 py-2 text-zinc-200 text-xs focus:outline-none focus:border-blue-500 transition"
              placeholder="Search people, intent, objections..."
            />
          </div>
        </div>

        {/* Conversations Thread Cards List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading && conversations.length === 0 ? (
            <div className="text-center py-10 text-xs text-zinc-500">Loading inbox...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-10 text-xs text-zinc-500">No chat threads found.</div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConvId === conv.id;
              const snippet = getContactSnippet(conv.title);
              const time = getContactTimeBadge(conv.title);
              const countBadge = getContactCountBadge(conv.title);
              
              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition duration-150 cursor-pointer flex gap-3 ${
                    isActive 
                      ? 'bg-zinc-900 border-zinc-800' 
                      : 'border-transparent hover:bg-zinc-900/30'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {conv.title.charAt(0)}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-white truncate">{conv.title}</span>
                      <span className="text-[10px] text-zinc-500 font-medium shrink-0">{time}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-[11px] text-zinc-400 truncate flex items-center gap-1.5 font-medium">
                        {getContactIcon(conv.title)}
                        {snippet}
                      </p>
                      {countBadge > 0 && (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-black flex items-center justify-center shrink-0">
                          {countBadge}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Right Active Conversation Pane */}
      <div className="flex-1 flex flex-col justify-between bg-zinc-950/10">
        
        {/* Pane Header */}
        <div className="h-16 px-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/30">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {activeContactName}
            </h3>
            <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              whatsapp • last seen 2m ago
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleReplyForMe}
              disabled={generatingReply || isStreaming || messages.length === 0}
              className="px-3.5 py-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 rounded-lg text-[10px] font-bold text-zinc-200 cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              {generatingReply ? 'Drafting...' : 'Reply for me'}
            </button>
            <button
              onClick={handleCallNow}
              className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black rounded-lg text-[10px] font-black cursor-pointer shadow"
            >
              Call now
            </button>
          </div>
        </div>

        {/* Dynamic Summary + Badges Block */}
        <div className="p-5 border-b border-zinc-900 bg-zinc-900/5 mx-6 mt-4 rounded-2xl border border-zinc-900/80 space-y-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            <Brain className="w-3.5 h-3.5" />
            AI SUMMARY
          </div>
          
          <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl italic">
            "{summaryText}"
          </p>

          <div className="flex gap-3 pt-2">
            <span className="text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 px-3 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
              Intent: <span className="font-extrabold">{intentPill}</span>
            </span>
            <span className="text-[10px] font-bold bg-amber-500/10 border border-amber-500/15 text-amber-400 px-3 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
              Objection: <span className="font-extrabold">{objectionPill}</span>
            </span>
            <span className="text-[10px] font-bold bg-red-500/10 border border-red-500/15 text-red-400 px-3 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
              Urgency: <span className="font-extrabold">{urgencyPill}</span>
            </span>
          </div>
        </div>

        {/* Message bubbles stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[65%] rounded-2xl px-4.5 py-3 text-xs leading-relaxed border ${
                  isUser 
                    ? 'bg-zinc-900 border-zinc-850 text-zinc-300' 
                    : 'bg-white border-zinc-100 text-black shadow-md'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text.replace(/\*\[Running.*\]\*/g, '').trim()}</p>
                </div>
              </div>
            );
          })}

          {activeTool && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-[10px] font-semibold animate-pulse">
                <Wrench className="w-3.5 h-3.5 shrink-0" />
                <span>Running database command: {activeTool.name}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Text Input box */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex gap-3">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            disabled={isStreaming}
            className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition"
            placeholder={isStreaming ? 'AI employee is writing response...' : 'Type message...'}
          />
          <button
            type="submit"
            disabled={isStreaming || !inputMsg.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>

    </div>
  );
}

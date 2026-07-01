'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Plus, 
  MessageSquare,
  Wrench,
  AlertCircle
} from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  toolCall?: {
    name: string;
    args: any;
  };
}

export default function AgentChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTool, setActiveTool] = useState<{ name: string; args: any } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch recent conversations
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/crm/timeline'); // timeline fetches recent events, let's create a specific route for conversations if needed, or write a fallback fetch
      // Let's query from conversations list
      const convsRes = await fetch('/api/agent/conversations');
      if (convsRes.ok) {
        const data = await convsRes.json();
        setConversations(data);
        if (data.length > 0 && !activeConvId) {
          setActiveConvId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
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

  const handleStartNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessageText = input;
    setInput('');
    setIsStreaming(true);
    setActiveTool(null);

    // Append user message locally
    const tempUserMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: userMessageText,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessageText,
          conversationId: activeConvId || undefined,
        }),
      });

      if (!res.body) throw new Error('No body returned from stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let assistantMessageText = '';
      let tempAssistantMsgId = Math.random().toString();

      // Placeholder assistant message
      setMessages((prev) => [
        ...prev,
        { id: tempAssistantMsgId, sender: 'assistant', text: '' },
      ]);

      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Save the last partial line back to buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'meta') {
              // Update active conversation ID if it was a new conversation
              if (!activeConvId) {
                setActiveConvId(data.conversationId);
                fetchConversations();
              }
            } else if (data.type === 'tool') {
              // Show active tool running
              setActiveTool({ name: data.toolName, args: data.args });
            } else if (data.type === 'text') {
              // Append text chunk
              assistantMessageText += data.text;
              setMessages((prev) => 
                prev.map((msg) => 
                  msg.id === tempAssistantMsgId 
                    ? { ...msg, text: assistantMessageText }
                    : msg
                )
              );
            }
          } catch (err) {
            console.error('Failed to parse stream line:', line, err);
          }
        }
      }

      // Finalize text after stream ends
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer);
          if (data.type === 'text') {
            assistantMessageText += data.text;
            setMessages((prev) => 
              prev.map((msg) => 
                msg.id === tempAssistantMsgId 
                  ? { ...msg, text: assistantMessageText }
                  : msg
              )
            );
          }
        } catch (_) {}
      }

    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { id: Math.random().toString(), sender: 'assistant', text: `Error occurred during message transmission: ${err.message}` },
      ]);
    } finally {
      setIsStreaming(false);
      setActiveTool(null);
      fetchConversations();
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/10 backdrop-blur-md">
      
      {/* Left Conversations Navigation Panel */}
      <div className="w-72 border-r border-zinc-800 bg-zinc-950/40 flex flex-col justify-between">
        
        {/* Panel Header */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/20">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Recent Chats
          </span>
          <button
            onClick={handleStartNewChat}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer"
            title="Start New Conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-600 font-medium">No previous chats.</div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConvId === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold truncate transition duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' 
                      : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-300'
                  }`}
                >
                  {conv.title || 'Conversation File'}
                </button>
              );
            })
          )}
        </div>

        {/* Floating Instruction help */}
        <div className="p-4 border-t border-zinc-800/60 text-[10px] text-zinc-500 bg-zinc-950/20 space-y-1.5 font-medium leading-relaxed">
          <div className="text-zinc-400 font-bold uppercase tracking-wider">Available Commands:</div>
          <div>• "Search for Bob"</div>
          <div>• "Create task to call Alice tomorrow"</div>
          <div>• "Update opportunity AI Consultation stage to PROPOSAL"</div>
          <div>• "Send WhatsApp message to Alice"</div>
          <div>• "Show pipeline metrics summary"</div>
        </div>
      </div>

      {/* Right Stream Chat Pane */}
      <div className="flex-1 flex flex-col justify-between bg-zinc-950/10">
        
        {/* Chat Header */}
        <div className="h-12 px-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/30">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            DareXAI Operations Agent
          </div>
          {activeConvId && (
            <span className="text-[10px] font-mono text-zinc-500">ID: {activeConvId}</span>
          )}
        </div>

        {/* Message Bubble List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white">Ask DareXAI Operations Assistant</h3>
                <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed">
                  Converse naturally with the business agent. Ask it to query contacts, schedule tasks, log WhatsApps, or fetch live metrics logs.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-2 border ${
                    isUser 
                      ? 'bg-zinc-800 border-zinc-700/60 text-white' 
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-200'
                  }`}>
                    {/* Message Bubble Content */}
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                </div>
              );
            })
          )}

          {/* Active Tool Calling Display */}
          {activeTool && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-semibold animate-pulse">
                <Wrench className="w-4 h-4 shrink-0" />
                <span>Running database tool action: <span className="font-bold font-mono">{activeTool.name}</span>...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
            placeholder={isStreaming ? 'Agent is responding...' : 'Ask DareXAI Agent...'}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-lg shadow-blue-500/25 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
}

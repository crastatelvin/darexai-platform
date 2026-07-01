'use client';

import { Globe, ArrowUpRight } from 'lucide-react';

export default function IntegrationsStub() {
  const integrations = [
    { name: 'Google Calendar & Gmail', desc: 'Sync discovery sessions and lead email threads automatically.', active: true },
    { name: 'WhatsApp Cloud API', desc: 'Outbound campaigns and two-way inbox messaging.', active: true },
    { name: 'Meta Lead Ads API', desc: 'Feed Meta-sourced leads directly into qualification flows in real-time.', active: false },
    { name: 'Stripe Billings', desc: 'Sync paid subscription invoices and churn telemetry metrics.', active: false },
  ];

  return (
    <div className="space-y-8 max-w-4xl bg-zinc-950 text-zinc-100 font-sans min-h-[calc(100vh-10rem)]">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Integrations</h1>
        <p className="text-zinc-400 text-sm mt-1">Connect your existing channels and databases to DareXAI active agent context.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item, idx) => (
          <div key={idx} className="p-6 rounded-xl border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800 transition flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-zinc-500" />
                <h3 className="text-sm font-bold text-white">{item.name}</h3>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">{item.desc}</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
              item.active 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                : 'bg-zinc-800 text-zinc-500'
            }`}>
              {item.active ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}

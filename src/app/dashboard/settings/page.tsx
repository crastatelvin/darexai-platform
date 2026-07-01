'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, User, Key } from 'lucide-react';

interface TenantProfile {
  name: string;
}

export default function SettingsStub() {
  const [profile, setProfile] = useState<any>(null);

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

  return (
    <div className="space-y-8 max-w-4xl bg-zinc-950 text-zinc-100 font-sans min-h-[calc(100vh-10rem)]">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">Configure tenant boundaries, API configurations, and user settings.</p>
      </div>

      {/* Cards list */}
      <div className="space-y-6">
        
        {/* User Card */}
        <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-900/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-zinc-500" />
            User Settings
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold block mb-1">Full Name</span>
              <div className="text-zinc-300 font-semibold">{profile?.name || 'Sanu'}</div>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-bold block mb-1">Email Address</span>
              <div className="text-zinc-300 font-semibold">{profile?.email || 'sanu@example.com'}</div>
            </div>
          </div>
        </div>

        {/* Tenant boundary Card */}
        <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-900/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-500" />
            Tenant Security Boundaries
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold block mb-1">Tenant ID Scope</span>
              <div className="text-zinc-400 font-mono select-all truncate">{profile?.tenantId || 'Scope active'}</div>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-bold block mb-1">Database Mode</span>
              <div className="text-emerald-400 font-bold">Relational & Document Hybrid (Isolated)</div>
            </div>
          </div>
        </div>

        {/* Keys Settings */}
        <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-900/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-zinc-500" />
            Active Keys Configuration
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-zinc-400">Groq API Key</span>
              <span className="text-zinc-500 font-mono">••••••••••••••••••••••••••••</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-zinc-400">Google Client OAuth Key</span>
              <span className="text-zinc-500 font-mono">••••••••••••••••••••••••••••.apps.googleusercontent.com</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

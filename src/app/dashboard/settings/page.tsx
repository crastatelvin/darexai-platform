'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, User, Key, Save, CheckCircle2, Loader2 } from 'lucide-react';

interface SettingsData {
  groqApiKey: string;
  googleClientId: string;
  googleClientSecret: string;
  leadScoreThreshold: number;
  autoWhatsappReply: boolean;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<SettingsData>({
    groqApiKey: '',
    googleClientId: '',
    googleClientSecret: '',
    leadScoreThreshold: 80,
    autoWhatsappReply: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch settings & user profile on mount
  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const data = await meRes.json();
          setProfile(data);
        }

        const settingsRes = await fetch('/api/tenant/settings');
        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          setSettings({
            groqApiKey: sData.groqApiKey || '',
            googleClientId: sData.googleClientId || '',
            googleClientSecret: sData.googleClientSecret || '',
            leadScoreThreshold: sData.leadScoreThreshold ?? 80,
            autoWhatsappReply: sData.autoWhatsappReply ?? false,
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/tenant/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-10rem)] flex items-center justify-center text-zinc-500 text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl bg-zinc-950 text-zinc-100 font-sans min-h-[calc(100vh-10rem)]">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings</h1>
          <p className="text-zinc-400 text-sm mt-1">Configure tenant boundaries, API credentials, and automation parameters.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* User Card */}
        <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-900/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-zinc-500" />
            User Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
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

        {/* API Credentials */}
        <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-900/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-zinc-500" />
            Custom API Credentials
          </h3>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            By default, the platform uses global sandbox environment keys. Provide custom keys here to isolate your AI model operations.
          </p>
          <div className="space-y-4 text-xs">
            
            <div className="grid grid-cols-1 gap-2">
              <label className="text-[10px] text-zinc-400 font-bold block">Groq API Key</label>
              <input
                type="password"
                value={settings.groqApiKey}
                onChange={(e) => setSettings(prev => ({ ...prev, groqApiKey: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500 transition"
                placeholder="gsk_..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-400 font-bold block">Google Client ID</label>
                <input
                  type="text"
                  value={settings.googleClientId}
                  onChange={(e) => setSettings(prev => ({ ...prev, googleClientId: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500 transition"
                  placeholder="379317...apps.googleusercontent.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-400 font-bold block">Google Client Secret</label>
                <input
                  type="password"
                  value={settings.googleClientSecret}
                  onChange={(e) => setSettings(prev => ({ ...prev, googleClientSecret: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500 transition"
                  placeholder="GOCSPX-..."
                />
              </div>
            </div>

          </div>
        </div>

        {/* Lead Automation Rules */}
        <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-900/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-500" />
            Lead Qualification Rules
          </h3>
          <div className="space-y-4 text-xs">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-400 font-bold block">Lead Qualification Score Threshold (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.leadScoreThreshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, leadScoreThreshold: Number(e.target.value) }))}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div className="flex items-center pt-6 gap-2">
                <input
                  type="checkbox"
                  id="autoWhatsapp"
                  checked={settings.autoWhatsappReply}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoWhatsappReply: e.target.checked }))}
                  className="w-4 h-4 bg-zinc-950 border border-zinc-850 text-blue-500 rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="autoWhatsapp" className="text-[11px] text-zinc-400 font-semibold cursor-pointer select-none">
                  Enable automated WhatsApp reply outreach (score &gt; threshold)
                </label>
              </div>
            </div>

          </div>
        </div>

        {/* Save button and alerts */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-40 text-black font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Save settings
              </>
            )}
          </button>

          {success && (
            <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
            </div>
          )}
        </div>

      </form>

    </div>
  );
}

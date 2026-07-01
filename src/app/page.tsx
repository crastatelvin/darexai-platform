'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('testowner@darexai.com');
  const [name, setName] = useState('Demo Business Owner');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Check for query parameters for errors
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      if (error) {
        if (error === 'invalid_auth_state') setErrorMsg('Invalid authentication state. Try again.');
        else if (error === 'token_exchange_failed') setErrorMsg('Google Token exchange failed.');
        else if (error === 'no_email_provided') setErrorMsg('Google profile did not provide email.');
        else setErrorMsg('Authentication failed.');
      }
    }
  }, []);

  const handleMockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      if (!res.ok) {
        throw new Error('Login request failed');
      }

      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
      } else {
        setErrorMsg('Mock login failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 relative overflow-hidden bg-grid-pattern">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-12 md:gap-16 z-10 py-12">
        
        {/* Left Side: Product Intro */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-green"></span>
            DareXAI Operations Center v1.0
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Intelligent AI <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text">Business Agent</span>
          </h1>
          <p className="mt-6 text-zinc-400 text-lg leading-relaxed max-w-lg">
            Streamline customer relationships, trigger natural language automations, and manage business workflows in a unified tenant-isolated dashboard.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur">
              <h3 className="font-semibold text-white text-sm">Google OAuth PKCE</h3>
              <p className="text-zinc-500 text-xs mt-1">HttpOnly token rotation, tenant isolation.</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur">
              <h3 className="font-semibold text-white text-sm">Streaming Agent</h3>
              <p className="text-zinc-500 text-xs mt-1">Streaming responses & real database tool-calling.</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur">
              <h3 className="font-semibold text-white text-sm">Unified Inbox</h3>
              <p className="text-zinc-500 text-xs mt-1">WhatsApp, Email, Calls timeline logs.</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur">
              <h3 className="font-semibold text-white text-sm">Lead Automation</h3>
              <p className="text-zinc-500 text-xs mt-1">Lead qualification score logic and hooks.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Panel */}
        <div className="w-full max-w-md p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md shadow-2xl">
          <div className="mb-6 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white">Log in</h2>
            <p className="text-zinc-400 text-sm mt-1">Access your business operations platform.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Real Google OAuth Login */}
          <a
            href="/api/auth/google/login"
            className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-200 font-medium rounded-lg transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Sign in with Google OAuth
          </a>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-3 text-zinc-500 font-medium">Or Use Local Sandbox</span>
            </div>
          </div>

          {/* Local Mock Login Form */}
          <form onSubmit={handleMockLogin} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Workspace Owner Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-blue-500 transition"
                placeholder="Business Owner Name"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Sandbox Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-blue-500 transition"
                placeholder="owner@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition flex items-center justify-center"
            >
              {loading ? 'Initializing Workspace...' : 'Log in to Sandbox'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

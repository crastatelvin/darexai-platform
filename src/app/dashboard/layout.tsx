'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Bot, 
  Mail, 
  Zap, 
  LogOut,
  Sparkles,
  Building2,
  MessageSquare
} from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  tenant: {
    name: string;
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          // If 401, redirect to home
          router.push('/');
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    // Clear cookies via route or mock logout clearing
    // Let's implement logout endpoint or just client redirect which triggers state clear
    // We can write a route for /api/auth/logout that deletes cookies, which is clean.
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/');
  };

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'CRM Pipeline', href: '/dashboard/crm', icon: Users },
    { name: 'AI Business Agent', href: '/dashboard/agent', icon: Bot },
    { name: 'WhatsApp Inbox', href: '/dashboard/whatsapp', icon: MessageSquare },
    { name: 'Unified Inbox', href: '/dashboard/timeline', icon: Mail },
    { name: 'Lead Automation', href: '/dashboard/automation', icon: Zap },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/40 backdrop-blur-md flex flex-col justify-between p-6">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/25">
              D
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">DareX</span>
              <span className="text-blue-400 font-semibold text-sm">AI</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition duration-200 ${
                    isActive 
                      ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' 
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile Card / Footer */}
        <div className="border-t border-zinc-800 pt-4 space-y-4">
          {profile && (
            <div className="px-2">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5" />
                {profile.tenant.name}
              </div>
              <div className="text-sm font-bold text-white truncate">{profile.name}</div>
              <div className="text-xs text-zinc-500 truncate">{profile.email}</div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/5 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 px-8 flex items-center justify-between bg-zinc-900/10 backdrop-blur">
          <div className="text-zinc-400 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            Platform status: <span className="text-emerald-400 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-300">
              Multi-tenant sandbox mode
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-zinc-950 relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          {children}
        </main>
      </div>
    </div>
  );
}

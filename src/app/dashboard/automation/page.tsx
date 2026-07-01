'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectAutomation() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/actions');
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-xs">
      Redirecting to actions...
    </div>
  );
}

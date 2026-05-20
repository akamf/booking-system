'use client';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabase-browser';

export function Topbar({ displayName, email }: { displayName: string; email: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    router.replace('/sign-in');
    router.refresh();
  }

  return (
    <header className="border-b border-neutral-200 bg-white px-6 h-14 flex items-center justify-between">
      <h2 className="text-sm font-medium text-neutral-700">Admin</h2>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm text-neutral-900">{displayName}</div>
          <div className="text-xs text-neutral-500">{email}</div>
        </div>
        <button
          type="button"
          onClick={() => { void handleSignOut(); }}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

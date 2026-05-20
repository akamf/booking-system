'use client';
import { useState, type FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabase-browser';

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const supabase = getBrowserSupabase();

    // In local dev seed (admin@sportshallen.local / admin1234) we use password sign-in.
    // In production we use OTP magic links. Probe by trying password first when running
    // against the local Supabase URL.
    const isLocal = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1') ?? false;
    if (isLocal && email.endsWith('@sportshallen.local')) {
      const { error } = await supabase.auth.signInWithPassword({ email, password: 'admin1234' });
      setSubmitting(false);
      if (error) {
        setMessage({ kind: 'error', text: error.message });
        return;
      }
      router.replace(next);
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setSubmitting(false);
    if (error) {
      setMessage({ kind: 'error', text: error.message });
      return;
    }
    setMessage({ kind: 'info', text: 'Check your email for the sign-in link.' });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm text-neutral-700">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          disabled={submitting}
        />
      </label>
      <button
        type="submit"
        disabled={submitting || !email}
        className="w-full rounded bg-brand-600 text-white py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? 'Sending…' : 'Continue'}
      </button>
      {message ? (
        <p className={message.kind === 'error' ? 'text-sm text-danger' : 'text-sm text-neutral-600'}>
          {message.text}
        </p>
      ) : null}
    </form>
  );
}

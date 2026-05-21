import { useEffect, useState } from 'react';
import { getSupabase } from './supabase';

export function useCurrentUser() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
      setReady(true);
    })();
    const supabase = getSupabase();
    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, []);

  return { userId, ready };
}

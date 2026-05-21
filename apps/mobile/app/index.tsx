import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { getSupabase } from '@/lib/supabase';

export default function Index() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      if (active) setAuthed(Boolean(data.session));
    })();
    return () => {
      active = false;
    };
  }, []);

  if (authed === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href={authed ? '/(tabs)/home' : '/(auth)/sign-in'} />;
}

import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getSupabase } from '@/lib/supabase';

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    void (async () => {
      const code = typeof params.code === 'string' ? params.code : undefined;
      if (!code) {
        router.replace('/(auth)/sign-in');
        return;
      }
      const supabase = getSupabase();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      router.replace(error ? '/(auth)/sign-in' : '/(tabs)/home');
    })();
  }, [params.code]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}

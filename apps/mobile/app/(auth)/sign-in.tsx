import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { getSupabase } from '@/lib/supabase';
import { colors, spacing } from '@/lib/colors';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setMessage(null);
    const supabase = getSupabase();

    // Local-dev fast path
    if (email.endsWith('@sportshallen.local')) {
      const { error } = await supabase.auth.signInWithPassword({ email, password: 'admin1234' });
      setSubmitting(false);
      if (error) {
        setMessage({ kind: 'error', text: error.message });
        return;
      }
      router.replace('/(tabs)/home');
      return;
    }

    const redirectUrl = Linking.createURL('/(auth)/verify');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: redirectUrl },
    });
    setSubmitting(false);
    if (error) {
      setMessage({ kind: 'error', text: error.message });
      return;
    }
    setMessage({ kind: 'info', text: 'Check your email for the sign-in link.' });
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: spacing[6], backgroundColor: colors.neutral[50] }}>
      <Text style={{ fontSize: 24, fontWeight: '600', color: colors.neutral[900], marginBottom: spacing[1] }}>
        Sportshallen
      </Text>
      <Text style={{ color: colors.neutral[500], marginBottom: spacing[6] }}>
        Sign in with your email.
      </Text>

      <Text style={{ color: colors.neutral[700], marginBottom: spacing[1] }}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoComplete="email"
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!submitting}
        placeholder="you@example.com"
        style={{
          borderWidth: 1,
          borderColor: colors.neutral[300],
          backgroundColor: 'white',
          borderRadius: 8,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[2],
          marginBottom: spacing[4],
        }}
      />

      <TouchableOpacity
        onPress={() => { void handleSubmit(); }}
        disabled={submitting || email.length === 0}
        style={{
          backgroundColor: colors.brand[600],
          opacity: submitting || email.length === 0 ? 0.5 : 1,
          borderRadius: 8,
          paddingVertical: spacing[3],
          alignItems: 'center',
        }}
      >
        {submitting ? <ActivityIndicator color="white" /> : (
          <Text style={{ color: 'white', fontWeight: '600' }}>Continue</Text>
        )}
      </TouchableOpacity>

      {message ? (
        <Text style={{
          marginTop: spacing[4],
          color: message.kind === 'error' ? colors.danger : colors.neutral[600],
        }}>
          {message.text}
        </Text>
      ) : null}
    </View>
  );
}

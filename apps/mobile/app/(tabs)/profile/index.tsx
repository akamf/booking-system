import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { ProfileSchema, type Profile } from '@booking/types';
import { getSupabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/use-current-user';
import { colors, spacing } from '@/lib/colors';

export default function ProfileScreen() {
  const { userId, ready } = useCurrentUser();
  const qc = useQueryClient();

  const profileQuery = useQuery({
    enabled: ready && userId !== null,
    queryKey: ['profile', userId],
    queryFn: async (): Promise<Profile> => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId ?? '')
        .single();
      if (error) throw error;
      return ProfileSchema.parse(data);
    },
  });

  const [displayName, setDisplayName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [locale, setLocale] = useState('sv-SE');

  useEffect(() => {
    if (profileQuery.data) {
      setDisplayName(profileQuery.data.display_name);
      setBirthYear(profileQuery.data.birth_year?.toString() ?? '');
      setLocale(profileQuery.data.locale);
    }
  }, [profileQuery.data]);

  const save = useMutation({
    mutationFn: async () => {
      const supabase = getSupabase();
      const payload: Record<string, string | number | null> = {
        display_name: displayName,
        birth_year: birthYear ? Number.parseInt(birthYear, 10) : null,
        locale,
      };
      const { error } = await (supabase as unknown as {
        from: (t: string) => { update: (v: unknown) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> } };
      })
        .from('profiles')
        .update(payload)
        .eq('user_id', userId ?? '');
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  async function signOut() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  }

  if (!ready || profileQuery.isLoading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing[6] }}>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: spacing[4] }}>Profile</Text>

      <Field label="Display name">
        <TextInput value={displayName} onChangeText={setDisplayName} style={inputStyle} maxLength={60} />
      </Field>
      <Field label="Birth year">
        <TextInput value={birthYear} onChangeText={setBirthYear} keyboardType="number-pad" style={inputStyle} />
      </Field>
      <Field label="Locale">
        <TextInput value={locale} onChangeText={setLocale} style={inputStyle} />
      </Field>

      <TouchableOpacity
        onPress={() => save.mutate()}
        disabled={save.isPending}
        style={{
          backgroundColor: colors.brand[600],
          opacity: save.isPending ? 0.5 : 1,
          borderRadius: 8,
          paddingVertical: spacing[3],
          alignItems: 'center',
          marginTop: spacing[2],
        }}
      >
        {save.isPending ? <ActivityIndicator color="white" /> : (
          <Text style={{ color: 'white', fontWeight: '600' }}>Save changes</Text>
        )}
      </TouchableOpacity>

      {save.error ? (
        <Text style={{ color: colors.danger, marginTop: spacing[3] }}>
          {(save.error as Error).message}
        </Text>
      ) : null}
      {save.isSuccess ? (
        <Text style={{ color: colors.success, marginTop: spacing[3] }}>Saved.</Text>
      ) : null}

      <TouchableOpacity
        onPress={() => { void signOut(); }}
        style={{ marginTop: spacing[8], alignSelf: 'center' }}
      >
        <Text style={{ color: colors.neutral[600] }}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: colors.neutral[300],
  backgroundColor: 'white',
  borderRadius: 8,
  paddingHorizontal: spacing[3],
  paddingVertical: spacing[2],
  marginBottom: spacing[3],
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing[1] }}>
      <Text style={{ color: colors.neutral[700], marginBottom: spacing[1] }}>{label}</Text>
      {children}
    </View>
  );
}

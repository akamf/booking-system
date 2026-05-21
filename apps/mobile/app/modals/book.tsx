import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { BookingSchema, type Booking } from '@booking/types';
import { fromPostgrestError, BookingError } from '@booking/api';
import { getSupabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/use-current-user';
import { colors, spacing } from '@/lib/colors';

type LinkedMinor = { user_id: string; display_name: string };

export default function BookModal() {
  const params = useLocalSearchParams<{
    resourceId: string;
    activityId: string;
    startsAt: string;
    endsAt: string;
  }>();
  const { userId } = useCurrentUser();
  const qc = useQueryClient();
  const [target, setTarget] = useState<string | 'self'>('self');

  const minorsQuery = useQuery({
    enabled: userId !== null,
    queryKey: ['linked-minors', userId],
    queryFn: async (): Promise<LinkedMinor[]> => {
      const supabase = getSupabase();
      const linksRes = await supabase
        .from('guardian_links')
        .select('minor_user_id')
        .eq('guardian_user_id', userId ?? '');
      const ids = z.array(z.object({ minor_user_id: z.string().uuid() })).parse(linksRes.data ?? []);
      if (ids.length === 0) return [];
      const profileRes = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', ids.map((r) => r.minor_user_id));
      return z.array(z.object({ user_id: z.string().uuid(), display_name: z.string() })).parse(profileRes.data ?? []);
    },
  });

  const book = useMutation({
    mutationFn: async (): Promise<Booking> => {
      const supabase = getSupabase();
      const args: Record<string, string> = {
        p_resource_id: params.resourceId,
        p_activity_id: params.activityId,
        p_starts_at: params.startsAt,
        p_ends_at: params.endsAt,
      };
      if (target !== 'self') args.p_on_behalf_of_user_id = target;
      const { data, error } = await (supabase as unknown as {
        rpc: (fn: string, p: Record<string, string>) => Promise<{ data: unknown; error: unknown }>;
      }).rpc('book_resource', args);
      if (error) throw fromPostgrestError(error);
      return BookingSchema.parse(data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookings'] });
      void qc.invalidateQueries({ queryKey: ['availability'] });
      router.replace('/(tabs)/bookings');
    },
  });

  const startsAt = new Date(params.startsAt);
  const endsAt = new Date(params.endsAt);
  const minors = minorsQuery.data ?? [];

  return (
    <View style={{ flex: 1, padding: spacing[6], backgroundColor: colors.neutral[50] }}>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: spacing[2] }}>Confirm booking</Text>
      <Text style={{ color: colors.neutral[600], marginBottom: spacing[4] }}>
        {startsAt.toLocaleString()} – {endsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>

      {minors.length > 0 ? (
        <View style={{ marginBottom: spacing[4] }}>
          <Text style={{ color: colors.neutral[700], marginBottom: spacing[2] }}>Book for</Text>
          <Pill label="Myself" active={target === 'self'} onPress={() => setTarget('self')} />
          {minors.map((m) => (
            <Pill key={m.user_id} label={m.display_name} active={target === m.user_id} onPress={() => setTarget(m.user_id)} />
          ))}
        </View>
      ) : null}

      <TouchableOpacity
        onPress={() => book.mutate()}
        disabled={book.isPending}
        style={{
          backgroundColor: colors.brand[600],
          opacity: book.isPending ? 0.5 : 1,
          borderRadius: 8,
          paddingVertical: spacing[3],
          alignItems: 'center',
          marginTop: spacing[2],
        }}
      >
        {book.isPending ? <ActivityIndicator color="white" /> : (
          <Text style={{ color: 'white', fontWeight: '600' }}>Confirm booking</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: spacing[3], alignItems: 'center' }}>
        <Text style={{ color: colors.neutral[600] }}>Cancel</Text>
      </TouchableOpacity>

      {book.error ? (
        <Text style={{ color: colors.danger, marginTop: spacing[4] }}>
          {book.error instanceof BookingError ? `${book.error.code}: ${book.error.message}` : (book.error as Error).message}
        </Text>
      ) : null}
    </View>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: active ? colors.brand[500] : colors.neutral[300],
        backgroundColor: active ? colors.brand[50] : 'white',
        borderRadius: 8,
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[3],
        marginVertical: 4,
      }}
    >
      <Text style={{ color: active ? colors.brand[700] : colors.neutral[800] }}>{label}</Text>
    </TouchableOpacity>
  );
}

import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { BookingSchema, type Booking } from '@booking/types';
import { fromPostgrestError, BookingError } from '@booking/api';
import { getSupabase } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/use-current-user';
import { colors, spacing } from '@/lib/colors';

export default function BookingsScreen() {
  const { userId, ready } = useCurrentUser();
  const qc = useQueryClient();

  const query = useQuery({
    enabled: ready && userId !== null,
    queryKey: ['bookings', 'mine', userId],
    queryFn: async (): Promise<Booking[]> => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('starts_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return z.array(BookingSchema).parse(data);
    },
  });

  const cancel = useMutation({
    mutationFn: async (bookingId: string) => {
      const supabase = getSupabase();
      const { error } = await (supabase as unknown as {
        rpc: (fn: string, p: Record<string, string>) => Promise<{ error: unknown }>;
      }).rpc('cancel_booking', { p_booking_id: bookingId });
      if (error) throw fromPostgrestError(error);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (e) => {
      const message = e instanceof BookingError ? `${e.code}: ${e.message}` : (e as Error).message;
      Alert.alert('Cancel failed', message);
    },
  });

  if (!ready || query.isLoading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  }
  if (query.error) {
    return <View style={{ padding: spacing[4] }}><Text>{(query.error as Error).message}</Text></View>;
  }

  const bookings = query.data ?? [];
  const now = Date.now();
  const upcoming = bookings.filter((b) => new Date(b.starts_at).getTime() >= now);
  const past = bookings.filter((b) => new Date(b.starts_at).getTime() < now);

  return (
    <FlatList
      data={[...upcoming, ...past]}
      keyExtractor={(b) => b.id}
      contentContainerStyle={{ padding: spacing[4] }}
      ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
      renderItem={({ item, index }) => (
        <>
          {index === 0 ? <SectionHeader title="Upcoming" /> : null}
          {index === upcoming.length && past.length > 0 ? <SectionHeader title="Past" /> : null}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 8,
              padding: spacing[4],
              borderWidth: 1,
              borderColor: colors.neutral[200],
            }}
          >
            <Text style={{ fontWeight: '600' }}>
              {new Date(item.starts_at).toLocaleString()}
            </Text>
            <Text style={{ color: colors.neutral[500], marginTop: 4 }}>{item.status}</Text>
            {(item.status === 'pending' || item.status === 'confirmed') && new Date(item.starts_at).getTime() > now ? (
              <TouchableOpacity
                onPress={() => cancel.mutate(item.id)}
                style={{ marginTop: spacing[2], alignSelf: 'flex-start' }}
              >
                <Text style={{ color: colors.danger }}>Cancel</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </>
      )}
      ListEmptyComponent={() => (
        <Text style={{ color: colors.neutral[500] }}>No bookings.</Text>
      )}
    />
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ marginTop: spacing[2], marginBottom: spacing[2], color: colors.neutral[500], fontWeight: '600', fontSize: 13 }}>
      {title.toUpperCase()}
    </Text>
  );
}

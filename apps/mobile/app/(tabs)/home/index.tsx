import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BookingSchema, type Booking } from '@booking/types';
import { z } from 'zod';
import { getSupabase } from '@/lib/supabase';
import { colors, spacing } from '@/lib/colors';

export default function HomeScreen() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, []);

  const todayQuery = useQuery({
    enabled: userId !== null,
    queryKey: ['bookings', 'today', userId],
    queryFn: async (): Promise<Booking[]> => {
      const supabase = getSupabase();
      const now = new Date();
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .gte('starts_at', dayStart)
        .lt('starts_at', dayEnd)
        .order('starts_at');
      if (error) throw error;
      return z.array(BookingSchema).parse(data);
    },
  });

  if (!userId || todayQuery.isLoading) {
    return <Centered><ActivityIndicator /></Centered>;
  }
  if (todayQuery.error) {
    return <Centered><Text>{(todayQuery.error as Error).message}</Text></Centered>;
  }
  const bookings = todayQuery.data ?? [];

  return (
    <View style={{ flex: 1, padding: spacing[4], backgroundColor: colors.neutral[50] }}>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: spacing[4] }}>
        Today
      </Text>
      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
        ListEmptyComponent={() => (
          <Text style={{ color: colors.neutral[500] }}>No bookings today.</Text>
        )}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 8,
              padding: spacing[4],
              borderWidth: 1,
              borderColor: colors.neutral[200],
            }}
          >
            <Text style={{ fontWeight: '600', marginBottom: 4 }}>
              {new Date(item.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {' – '}
              {new Date(item.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={{ color: colors.neutral[500] }}>{item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
  );
}

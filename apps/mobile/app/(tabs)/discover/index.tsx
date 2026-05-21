import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ActivitySchema, type Activity } from '@booking/types';
import { z } from 'zod';
import { router } from 'expo-router';
import { getSupabase } from '@/lib/supabase';
import { colors, spacing } from '@/lib/colors';

export default function DiscoverScreen() {
  const query = useQuery({
    queryKey: ['activities'],
    queryFn: async (): Promise<Activity[]> => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .is('archived_at', null)
        .order('name');
      if (error) throw error;
      return z.array(ActivitySchema).parse(data);
    },
  });

  if (query.isLoading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  }
  if (query.error) {
    return <View style={{ padding: spacing[4] }}><Text>{(query.error as Error).message}</Text></View>;
  }
  const activities = query.data ?? [];

  return (
    <FlatList
      data={activities}
      keyExtractor={(a) => a.id}
      contentContainerStyle={{ padding: spacing[4] }}
      ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/discover/${item.id}`)}
          style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: spacing[4],
            borderWidth: 1,
            borderColor: colors.neutral[200],
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[3],
          }}
        >
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color ?? colors.neutral[400] }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600' }}>{item.name}</Text>
            {item.description ? (
              <Text style={{ color: colors.neutral[500], marginTop: 2 }} numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

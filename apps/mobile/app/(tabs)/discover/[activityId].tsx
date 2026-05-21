import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { z } from 'zod';
import {
  ActivitySchema, BlockedTimeSchema, BookingSchema, OpeningHoursSchema,
  ResourceSchema, type Activity, type Resource,
} from '@booking/types';
import { computeAvailableSlots } from '@booking/domain';
import { getSupabase } from '@/lib/supabase';
import { colors, spacing } from '@/lib/colors';

const STK = 'Europe/Stockholm';

function toIsoDate(d: Date): string {
  return `${d.getFullYear().toString().padStart(4, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

export default function ActivityDetailScreen() {
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const today = useMemo(() => new Date(), []);
  const [dayOffset, setDayOffset] = useState(0);

  const date = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() + dayOffset);
    return d;
  }, [today, dayOffset]);

  const dateStr = toIsoDate(date);

  const baseQuery = useQuery({
    queryKey: ['activity-with-resources', activityId],
    queryFn: async () => {
      const supabase = getSupabase();
      const [actRes, compatRes] = await Promise.all([
        supabase.from('activities').select('*').eq('id', activityId).single(),
        supabase.from('activity_resource_compatibility').select('resource_id').eq('activity_id', activityId),
      ]);
      if (actRes.error) throw actRes.error;
      if (compatRes.error) throw compatRes.error;
      const compatRows = z.array(z.object({ resource_id: z.string().uuid() })).parse(compatRes.data ?? []);
      const resIds = compatRows.map((r) => r.resource_id);
      if (resIds.length === 0) return { activity: ActivitySchema.parse(actRes.data), resources: [] as Resource[] };
      const resRes = await supabase.from('resources').select('*').in('id', resIds).is('archived_at', null);
      if (resRes.error) throw resRes.error;
      return {
        activity: ActivitySchema.parse(actRes.data),
        resources: z.array(ResourceSchema).parse(resRes.data ?? []),
      };
    },
  });

  if (baseQuery.isLoading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  }
  if (baseQuery.error) {
    return <View style={{ padding: spacing[4] }}><Text>{(baseQuery.error as Error).message}</Text></View>;
  }
  const data = baseQuery.data;
  if (!data) return null;

  return (
    <View style={{ flex: 1, padding: spacing[4], backgroundColor: colors.neutral[50] }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>{data.activity.name}</Text>
      <DayPicker offset={dayOffset} onChange={setDayOffset} today={today} />
      <FlatList
        data={data.resources}
        keyExtractor={(r) => r.id}
        ItemSeparatorComponent={() => <View style={{ height: spacing[4] }} />}
        ListEmptyComponent={() => (
          <Text style={{ color: colors.neutral[500], marginTop: spacing[6] }}>
            No resources support this activity.
          </Text>
        )}
        renderItem={({ item }) => (
          <ResourceSlots
            resource={item}
            activity={data.activity}
            dateStr={dateStr}
          />
        )}
      />
    </View>
  );
}

function DayPicker({ offset, onChange, today }: { offset: number; onChange: (o: number) => void; today: Date }) {
  const date = new Date(today);
  date.setDate(today.getDate() + offset);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginVertical: spacing[4] }}>
      <TouchableOpacity onPress={() => onChange(Math.max(0, offset - 1))} disabled={offset === 0}>
        <Text style={{ color: offset === 0 ? colors.neutral[300] : colors.brand[600] }}>← Prev</Text>
      </TouchableOpacity>
      <Text style={{ flex: 1, textAlign: 'center', fontWeight: '500' }}>
        {date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
      </Text>
      <TouchableOpacity onPress={() => onChange(offset + 1)}>
        <Text style={{ color: colors.brand[600] }}>Next →</Text>
      </TouchableOpacity>
    </View>
  );
}

function ResourceSlots({ resource, activity, dateStr }: { resource: Resource; activity: Activity; dateStr: string }) {
  const slotsQuery = useQuery({
    queryKey: ['availability', resource.id, activity.id, dateStr],
    queryFn: async () => {
      const supabase = getSupabase();
      const dayStart = new Date(`${dateStr}T00:00:00`).toISOString();
      const dayEnd = new Date(new Date(`${dateStr}T00:00:00`).getTime() + 86_400_000).toISOString();
      const [openRes, blockRes, bookRes] = await Promise.all([
        supabase.from('opening_hours').select('*').eq('location_id', resource.location_id),
        supabase.from('blocked_times').select('*').eq('location_id', resource.location_id).lt('starts_at', dayEnd).gt('ends_at', dayStart),
        supabase.from('bookings').select('*').eq('resource_id', resource.id).in('status', ['pending', 'confirmed']).gte('starts_at', dayStart).lt('starts_at', dayEnd),
      ]);
      const openingHours = z.array(OpeningHoursSchema).parse(openRes.data ?? []);
      const blockedTimes = z.array(BlockedTimeSchema).parse(blockRes.data ?? []);
      const bookings = z.array(BookingSchema).parse(bookRes.data ?? []);
      return computeAvailableSlots({
        date: dateStr,
        timezone: STK,
        openingHours,
        blockedTimes,
        existingBookings: bookings,
        activity: {
          default_duration_minutes: activity.default_duration_minutes,
          min_duration_minutes: activity.min_duration_minutes,
        },
      });
    },
  });

  const slots = slotsQuery.data ?? [];

  return (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 8,
        padding: spacing[4],
        borderWidth: 1,
        borderColor: colors.neutral[200],
      }}
    >
      <Text style={{ fontWeight: '600', marginBottom: spacing[2] }}>{resource.name}</Text>
      {slotsQuery.isLoading ? (
        <ActivityIndicator />
      ) : slots.length === 0 ? (
        <Text style={{ color: colors.neutral[500] }}>No available slots today.</Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
          {slots.slice(0, 12).map((s) => (
            <TouchableOpacity
              key={s.starts_at}
              onPress={() =>
                router.push({
                  pathname: '/modals/book',
                  params: {
                    resourceId: resource.id,
                    activityId: activity.id,
                    startsAt: s.starts_at,
                    endsAt: s.ends_at,
                  },
                })
              }
              style={{
                borderWidth: 1,
                borderColor: colors.brand[200],
                backgroundColor: colors.brand[50],
                borderRadius: 6,
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[1],
              }}
            >
              <Text style={{ color: colors.brand[700], fontWeight: '500' }}>
                {new Date(s.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

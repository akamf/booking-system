import { Tabs } from 'expo-router';
import { colors } from '@/lib/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand[600],
        tabBarInactiveTintColor: colors.neutral[500],
        headerStyle: { backgroundColor: 'white' },
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="home/index" options={{ title: 'Home' }} />
      <Tabs.Screen name="discover/index" options={{ title: 'Discover' }} />
      <Tabs.Screen name="bookings/index" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

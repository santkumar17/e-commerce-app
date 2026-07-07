import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/src/theme';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.brand,
        tabBarInactiveTintColor: theme.color.muted,
        tabBarStyle: { backgroundColor: theme.color.surfaceSecondary, borderTopColor: theme.color.border, height: 64, paddingBottom: 10, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name="queue" options={{ title: 'Queue', tabBarIcon: ({ color }) => <Feather name="clipboard" size={20} color={color} /> }} />
      <Tabs.Screen name="admin-dashboard" options={{ title: 'Overview', tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={20} color={color} /> }} />
      <Tabs.Screen name="admin-profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} /> }} />
    </Tabs>
  );
}

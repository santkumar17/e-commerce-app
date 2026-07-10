import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { useBreakpoint } from '@/src/hooks/use-breakpoint';
import { DesktopHeader } from '@/src/components/DesktopHeader';

export default function AdminLayout() {
  const { isDesktop } = useBreakpoint();

  return (
    <View style={{ flex: 1 }}>
      {isDesktop && (
        <DesktopHeader
          logoHref="/(admin)/queue"
          profileHref="/(admin)/admin-profile"
          navItems={[
            { href: '/(admin)/queue', label: 'Queue', icon: 'clipboard' },
            { href: '/(admin)/admin-dashboard', label: 'Overview', icon: 'bar-chart-2' },
            { href: '/admin/sellers', label: 'Sellers', icon: 'users' },
            { href: '/admin/coupons', label: 'Coupons', icon: 'tag' },
          ]}
        />
      )}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.color.brand,
            tabBarInactiveTintColor: theme.color.muted,
            tabBarStyle: isDesktop ? { display: 'none' } : { backgroundColor: theme.color.surfaceSecondary, borderTopColor: theme.color.border, height: 64, paddingBottom: 10, paddingTop: 6 },
            tabBarLabelStyle: { fontSize: 11 },
          }}
        >
          <Tabs.Screen name="queue" options={{ title: 'Queue', tabBarIcon: ({ color }) => <Feather name="clipboard" size={20} color={color} /> }} />
          <Tabs.Screen name="admin-dashboard" options={{ title: 'Overview', tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={20} color={color} /> }} />
          <Tabs.Screen name="admin-profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} /> }} />
        </Tabs>
      </View>
    </View>
  );
}

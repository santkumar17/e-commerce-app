import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { useBreakpoint } from '@/src/hooks/use-breakpoint';
import { DesktopHeader } from '@/src/components/DesktopHeader';

export default function SellerLayout() {
  const { isDesktop } = useBreakpoint();

  return (
    <View style={{ flex: 1 }}>
      {isDesktop && (
        <DesktopHeader
          logoHref="/(seller)/dashboard"
          profileHref="/(seller)/seller-profile"
          navItems={[
            { href: '/(seller)/dashboard', label: 'Listings', icon: 'grid' },
            { href: '/(seller)/seller-orders', label: 'Orders', icon: 'package' },
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
          <Tabs.Screen name="dashboard" options={{ title: 'Listings', tabBarIcon: ({ color }) => <Feather name="grid" size={20} color={color} /> }} />
          <Tabs.Screen name="seller-orders" options={{ title: 'Orders', tabBarIcon: ({ color }) => <Feather name="package" size={20} color={color} /> }} />
          <Tabs.Screen name="seller-profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} /> }} />
        </Tabs>
      </View>
    </View>
  );
}

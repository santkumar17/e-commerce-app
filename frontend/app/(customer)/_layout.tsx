import { useCallback, useEffect, useState } from 'react';
import { Tabs, useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

function TabIcon({ name, color, count }: { name: any; color: string; count?: number }) {
  return (
    <View style={{ position: 'relative' }}>
      <Feather name={name} size={20} color={color} />
      {count && count > 0 ? (
        <View style={styles.badge} testID={`tab-badge-${name}`}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : String(count)}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function CustomerLayout() {
  const [cartCount, setCartCount] = useState(0);
  const [wlCount, setWlCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [c, w] = await Promise.all([api.cart().catch(() => []), api.wishlist().catch(() => [])]);
      setCartCount(Array.isArray(c) ? c.reduce((s: number, it: any) => s + (it.qty || 0), 0) : 0);
      setWlCount(Array.isArray(w) ? w.length : 0);
    } catch { }
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.brand,
        tabBarInactiveTintColor: theme.color.muted,
        tabBarStyle: {
          backgroundColor: theme.color.surfaceSecondary,
          borderTopColor: theme.color.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontFamily: theme.font.body, letterSpacing: 0.3, marginTop: 2 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon name="home" color={color} /> }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ color }) => <TabIcon name="search" color={color} /> }} />
      <Tabs.Screen name="wishlist" options={{ title: 'Wishlist', tabBarIcon: ({ color }) => <TabIcon name="heart" color={color} count={wlCount} /> }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart', tabBarIcon: ({ color }) => <TabIcon name="shopping-bag" color={color} count={cartCount} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: ({ color }) => <TabIcon name="package" color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: { position: 'absolute', top: -6, right: -10, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: theme.color.brand, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '600' },
});

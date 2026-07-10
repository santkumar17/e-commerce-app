import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useRouter, usePathname, Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { useAuth } from '@/src/auth';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { NotifBell } from '@/src/components/NotifBell';

interface NavItem {
  href: Href;
  label: string;
  icon?: any;
  badge?: number;
}

interface Props {
  logoHref: Href;
  navItems: NavItem[];
  showSearch?: boolean;
  /** Omit to show just a name + sign-out (no profile screen for this role today). */
  profileHref?: Href;
}

/** Top nav bar shown in place of the bottom tab bar once useBreakpoint().isDesktop is true. */
export function DesktopHeader({ logoHref, navItems, showSearch, profileHref }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [q, setQ] = useState('');

  const submitSearch = () => {
    router.push({ pathname: '/(customer)/search', params: q.trim() ? { q: q.trim() } : {} });
  };

  return (
    <View style={styles.wrap} testID="desktop-header">
      <View style={styles.inner}>
        <AnimatedPressable onPress={() => router.push(logoHref)} testID="desktop-logo">
          <Text style={styles.logo}>ArtisanMarket</Text>
        </AnimatedPressable>

        <View style={styles.nav}>
          {navItems.map((item) => {
            const active = pathname === item.href || (typeof item.href === 'string' && pathname.startsWith(item.href));
            return (
              <AnimatedPressable key={String(item.href)} onPress={() => router.push(item.href)} style={styles.navItem} testID={`desktop-nav-${item.label.toLowerCase()}`}>
                {item.icon && <Feather name={item.icon} size={15} color={active ? theme.color.brand : theme.color.onSurface} />}
                <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
                {!!item.badge && item.badge > 0 && (
                  <View style={styles.badge}><Text style={styles.badgeText}>{item.badge > 9 ? '9+' : item.badge}</Text></View>
                )}
              </AnimatedPressable>
            );
          })}
        </View>

        {showSearch && (
          <View style={styles.searchWrap}>
            <Feather name="search" size={14} color={theme.color.muted} />
            <TextInput
              testID="desktop-search-input"
              value={q}
              onChangeText={setQ}
              onSubmitEditing={submitSearch}
              placeholder="Search handmade goods..."
              placeholderTextColor={theme.color.muted}
              style={styles.searchInput}
            />
          </View>
        )}

        <View style={styles.right}>
          <NotifBell color={theme.color.onSurface} onDark={false} testID="desktop-notif-bell" />
          <AnimatedPressable
            onPress={() => profileHref && router.push(profileHref)}
            testID="desktop-account"
            style={styles.account}
          >
            <View style={styles.avatarDot}><Text style={styles.avatarDotText}>{(user?.name || '?').charAt(0)}</Text></View>
            <Text style={styles.userName} numberOfLines={1}>{user?.name}</Text>
          </AnimatedPressable>
          <AnimatedPressable testID="desktop-logout" onPress={logout} style={styles.logoutBtn}>
            <Feather name="log-out" size={14} color={theme.color.muted} />
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: theme.color.surfaceSecondary, borderBottomWidth: 1, borderBottomColor: theme.color.border },
  inner: { flexDirection: 'row', alignItems: 'center', height: 72, paddingHorizontal: theme.spacing.xxl, gap: theme.spacing.xl },
  logo: { fontFamily: theme.font.heading, fontSize: 20, color: theme.color.onSurface },
  nav: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xl },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  navText: { fontSize: 14, color: theme.color.onSurface, fontFamily: theme.font.body },
  navTextActive: { color: theme.color.brand, fontFamily: theme.font.bodyMedium },
  badge: { minWidth: 16, height: 16, borderRadius: 8, backgroundColor: theme.color.brand, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: theme.color.onBrandPrimary, fontSize: 9, fontWeight: '600' },
  searchWrap: { flex: 1, maxWidth: 320, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.color.border, paddingHorizontal: 14, backgroundColor: theme.color.surface },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 13, color: theme.color.onSurface, fontFamily: theme.font.body },
  right: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginLeft: 'auto' },
  account: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 160 },
  avatarDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: theme.color.brandTertiary, alignItems: 'center', justifyContent: 'center' },
  avatarDotText: { fontFamily: theme.font.heading, fontSize: 12, color: theme.color.brand },
  userName: { fontSize: 13, color: theme.color.onSurface },
  logoutBtn: { padding: 8, borderRadius: theme.radius.pill, backgroundColor: theme.color.surfaceTertiary },
});

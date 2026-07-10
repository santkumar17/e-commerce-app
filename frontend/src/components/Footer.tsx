import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/src/api';
import { theme } from '@/src/theme';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';

const COMPANY_LINKS = ['About', 'Careers', 'Press', 'Blog'];

/** Tablet/desktop-only footer. Shop links are real routes; category links deep-link into Home's existing category filter. Company links are informational placeholders (no matching pages exist yet), rendered as plain text so they don't read as dead links. */
export function Footer() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => { api.categories().then(setCategories).catch(() => {}); }, []);

  return (
    <View style={styles.wrap} testID="site-footer">
      <View style={styles.columns}>
        <View style={[styles.col, styles.brandCol]}>
          <Text style={styles.logo}>ArtisanMarket</Text>
          <Text style={styles.tagline}>Handmade, quietly beautiful.</Text>
        </View>

        <View style={styles.col}>
          <Text style={styles.heading}>Shop</Text>
          <AnimatedPressable onPress={() => router.push('/(customer)/home')} hoverEffect={false} style={styles.linkRow}>
            <Text style={styles.link}>Home</Text>
          </AnimatedPressable>
          <AnimatedPressable onPress={() => router.push('/(customer)/search')} hoverEffect={false} style={styles.linkRow}>
            <Text style={styles.link}>Search</Text>
          </AnimatedPressable>
          <AnimatedPressable onPress={() => router.push('/(customer)/wishlist')} hoverEffect={false} style={styles.linkRow}>
            <Text style={styles.link}>Wishlist</Text>
          </AnimatedPressable>
          <AnimatedPressable onPress={() => router.push('/(customer)/orders')} hoverEffect={false} style={styles.linkRow}>
            <Text style={styles.link}>My Orders</Text>
          </AnimatedPressable>
        </View>

        <View style={styles.col}>
          <Text style={styles.heading}>Categories</Text>
          {categories.slice(0, 6).map((c) => (
            <AnimatedPressable
              key={c.id}
              onPress={() => router.push({ pathname: '/(customer)/home', params: { category: c.id } })}
              hoverEffect={false}
              style={styles.linkRow}
            >
              <Text style={styles.link}>{c.name}</Text>
            </AnimatedPressable>
          ))}
        </View>

        <View style={styles.col}>
          <Text style={styles.heading}>Company</Text>
          {COMPANY_LINKS.map((l) => (
            <Text key={l} style={styles.staticText}>{l}</Text>
          ))}
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Text style={styles.copy}>© 2026 ArtisanMarket. All rights reserved.</Text>
        <Text style={styles.copy}>Handmade marketplace demo.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: theme.color.surfaceInverse, marginTop: theme.spacing.xxxl, paddingTop: theme.spacing.xxxl, paddingHorizontal: theme.spacing.gutter, paddingBottom: theme.spacing.xl },
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xxl },
  col: { minWidth: 140, gap: theme.spacing.sm },
  brandCol: { flex: 1.4, minWidth: 200 },
  logo: { fontFamily: theme.font.heading, fontSize: 20, color: theme.color.onSurfaceInverse },
  tagline: { fontFamily: theme.font.heading, fontStyle: 'italic', fontSize: 14, color: theme.color.onSurfaceInverse, opacity: 0.7, marginTop: 2 },
  heading: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: theme.color.onSurfaceInverse, opacity: 0.6, marginBottom: 4 },
  linkRow: { paddingVertical: 4 },
  link: { fontSize: 13, color: theme.color.onSurfaceInverse, opacity: 0.85 },
  staticText: { fontSize: 13, color: theme.color.onSurfaceInverse, opacity: 0.5, paddingVertical: 4 },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.xxxl, paddingTop: theme.spacing.lg, borderTopWidth: 1, borderTopColor: 'rgba(250,249,246,0.12)' },
  copy: { fontSize: 11, color: theme.color.onSurfaceInverse, opacity: 0.5 },
});

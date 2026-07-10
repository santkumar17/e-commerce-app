import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/src/auth';
import { theme } from '@/src/theme';

export default function SellerProfile() {
  const { user, logout } = useAuth();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.wrap}>
        <View style={styles.avatar}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <Feather name="user" size={32} color={theme.color.brand} />
          )}
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleTag}><Text style={styles.roleText}>ARTISAN / SELLER</Text></View>

        <View style={styles.card}>
          <Feather name="info" size={16} color={theme.color.muted} />
          <Text style={styles.cardText}>
            New listings are reviewed by our team before going live. Feedback on rejections appears in your listings.
          </Text>
        </View>

        <Pressable testID="seller-logout" onPress={logout} style={styles.logoutBtn}>
          <Feather name="log-out" size={16} color={theme.color.error} />
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  wrap: { padding: theme.spacing.xl, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.color.brandTertiary, alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.xl, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  name: { fontFamily: theme.font.heading, fontSize: 24, color: theme.color.onSurface, marginTop: theme.spacing.md },
  email: { color: theme.color.muted, marginTop: 2 },
  roleTag: { marginTop: theme.spacing.md, paddingHorizontal: 12, paddingVertical: 4, borderRadius: theme.radius.pill, backgroundColor: theme.color.brand },
  roleText: { color: '#fff', fontSize: 10, letterSpacing: 2 },
  card: { flexDirection: 'row', gap: theme.spacing.md, padding: theme.spacing.lg, borderRadius: theme.radius.md, backgroundColor: theme.color.surfaceTertiary, marginTop: theme.spacing.xxl },
  cardText: { flex: 1, color: theme.color.onSurfaceTertiary, fontSize: 13, lineHeight: 20 },
  logoutBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: theme.spacing.xxxl, padding: theme.spacing.md, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.color.error },
  logoutText: { color: theme.color.error, fontSize: 14 },
});

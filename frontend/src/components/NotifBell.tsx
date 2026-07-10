import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

interface Props { color?: string; testID?: string; onDark?: boolean; }

export function NotifBell({ color = '#fff', testID = 'notif-bell', onDark = true }: Props) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try { const r = await api.notifications(); setUnread(r.unread || 0); } catch { }
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Pressable
      testID={testID}
      onPress={() => router.push('/notifications')}
      style={[styles.wrap, !onDark && styles.wrapLight]}
      hitSlop={8}
    >
      <Feather name="bell" size={18} color={color} />
      {unread > 0 && (
        <View style={styles.badge} testID="notif-badge">
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : String(unread)}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 8, borderRadius: theme.radius.pill, backgroundColor: 'rgba(255,255,255,0.15)' },
  wrapLight: { backgroundColor: theme.color.surfaceTertiary },
  badge: { position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: theme.color.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: theme.color.onError, fontSize: 9, fontWeight: '600' },
});

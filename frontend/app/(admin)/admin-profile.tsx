import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/src/auth';
import { api } from '@/src/api';
import { theme } from '@/src/theme';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';

export default function AdminProfile() {
  const { user, logout, refresh } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const saveName = async () => {
    setNameMsg(null);
    if (!name.trim()) { setNameMsg({ text: 'Name cannot be empty.', ok: false }); return; }
    setNameBusy(true);
    try {
      await api.updateProfile({ name: name.trim() });
      await refresh();
      setNameMsg({ text: 'Name updated.', ok: true });
    } catch (e: any) {
      setNameMsg({ text: e.message || 'Could not update name', ok: false });
    } finally {
      setNameBusy(false);
    }
  };

  const savePassword = async () => {
    setPwMsg(null);
    if (newPw.length < 8) { setPwMsg({ text: 'New password must be at least 8 characters.', ok: false }); return; }
    if (newPw !== confirmPw) { setPwMsg({ text: 'Passwords do not match.', ok: false }); return; }
    setPwBusy(true);
    try {
      await api.changePassword({ current_password: currentPw, new_password: newPw });
      setPwMsg({ text: 'Password updated.', ok: true });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: any) {
      setPwMsg({ text: e.message || 'Could not update password', ok: false });
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.wrap}>
        <View style={styles.avatar}><Feather name="shield" size={32} color={theme.color.brand} /></View>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleTag}><Text style={styles.roleText}>ADMIN</Text></View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name</Text>
          <TextInput
            testID="admin-name-input"
            value={name}
            onChangeText={setName}
            placeholderTextColor={theme.color.muted}
            style={styles.input}
          />
          {nameMsg && <Text style={[styles.msg, { color: nameMsg.ok ? theme.color.success : theme.color.error }]}>{nameMsg.text}</Text>}
          <AnimatedPressable testID="admin-save-name" onPress={saveName} disabled={nameBusy} style={styles.saveBtn}>
            {nameBusy ? <ActivityIndicator color={theme.color.onBrandPrimary} size="small" /> : <Text style={styles.saveBtnText}>Save name</Text>}
          </AnimatedPressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change password</Text>
          <TextInput
            testID="admin-current-password"
            value={currentPw}
            onChangeText={setCurrentPw}
            secureTextEntry
            placeholder="Current password"
            placeholderTextColor={theme.color.muted}
            style={styles.input}
          />
          <TextInput
            testID="admin-new-password"
            value={newPw}
            onChangeText={setNewPw}
            secureTextEntry
            placeholder="New password (min. 8 characters)"
            placeholderTextColor={theme.color.muted}
            style={[styles.input, { marginTop: theme.spacing.sm }]}
          />
          <TextInput
            testID="admin-confirm-password"
            value={confirmPw}
            onChangeText={setConfirmPw}
            secureTextEntry
            placeholder="Confirm new password"
            placeholderTextColor={theme.color.muted}
            style={[styles.input, { marginTop: theme.spacing.sm }]}
          />
          {pwMsg && <Text style={[styles.msg, { color: pwMsg.ok ? theme.color.success : theme.color.error }]}>{pwMsg.text}</Text>}
          <AnimatedPressable testID="admin-save-password" onPress={savePassword} disabled={pwBusy} style={styles.saveBtn}>
            {pwBusy ? <ActivityIndicator color={theme.color.onBrandPrimary} size="small" /> : <Text style={styles.saveBtnText}>Update password</Text>}
          </AnimatedPressable>
        </View>

        <AnimatedPressable testID="admin-logout" onPress={logout} style={styles.logoutBtn}>
          <Feather name="log-out" size={16} color={theme.color.error} />
          <Text style={styles.logoutText}>Sign out</Text>
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  wrap: { padding: theme.spacing.xl, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.color.brandTertiary, alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.xl },
  email: { color: theme.color.muted, marginTop: theme.spacing.md },
  roleTag: { marginTop: theme.spacing.md, paddingHorizontal: 12, paddingVertical: 4, borderRadius: theme.radius.pill, backgroundColor: theme.color.surfaceInverse },
  roleText: { color: theme.color.onSurfaceInverse, fontSize: 10, letterSpacing: 2 },
  section: { width: '100%', marginTop: theme.spacing.xxl, padding: theme.spacing.lg, borderRadius: theme.radius.md, backgroundColor: theme.color.surfaceSecondary, borderWidth: 1, borderColor: theme.color.border },
  sectionTitle: { fontFamily: theme.font.heading, fontSize: 16, color: theme.color.onSurface, marginBottom: theme.spacing.md },
  input: { borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.sm, paddingHorizontal: theme.spacing.lg, paddingVertical: 12, fontSize: 15, color: theme.color.onSurface, backgroundColor: theme.color.surface },
  msg: { fontSize: 12, marginTop: theme.spacing.sm },
  saveBtn: { marginTop: theme.spacing.md, backgroundColor: theme.color.brand, borderRadius: theme.radius.sm, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: theme.color.onBrandPrimary, fontSize: 14, fontFamily: theme.font.bodyMedium },
  logoutBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: theme.spacing.xxxl, padding: theme.spacing.md, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.color.error },
  logoutText: { color: theme.color.error, fontSize: 14 },
});

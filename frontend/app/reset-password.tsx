import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';

export default function ResetPassword() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErr(null);
    if (password.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setErr('Passwords do not match.'); return; }
    setBusy(true);
    try {
      await api.resetPassword(token!, password);
      setDone(true);
      setTimeout(() => router.replace('/login'), 1500);
    } catch (e: any) {
      setErr(e.message || 'Could not reset password');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.wrap, styles.doneWrap]}>
        <View style={styles.doneCircle}>
          <Feather name="check" size={28} color={theme.color.onSuccess} />
        </View>
        <Text style={styles.doneTitle}>Password updated</Text>
        <Text style={styles.sub}>Taking you back to sign in...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.color.surface }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Set a new password</Text>
        <Text style={styles.sub}>Choose something you haven&rsquo;t used before.</Text>

        <Text style={styles.label}>New password</Text>
        <TextInput
          testID="reset-password-input"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 8 characters"
          placeholderTextColor={theme.color.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Confirm password</Text>
        <TextInput
          testID="reset-password-confirm-input"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="Re-enter password"
          placeholderTextColor={theme.color.muted}
          style={styles.input}
        />

        {err && <Text style={styles.err} testID="reset-error">{err}</Text>}

        <AnimatedPressable testID="reset-submit-button" onPress={submit} disabled={busy} style={styles.primaryBtn}>
          {busy ? <ActivityIndicator color={theme.color.onBrandPrimary} /> : <Text style={styles.primaryBtnText}>Update password</Text>}
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: theme.spacing.xl, paddingTop: theme.spacing.xxl, paddingBottom: theme.spacing.xxxl },
  title: { fontFamily: theme.font.heading, fontSize: 28, color: theme.color.onSurface },
  sub: { color: theme.color.muted, marginTop: theme.spacing.xs, fontSize: 14 },
  label: { fontSize: 12, color: theme.color.muted, marginTop: theme.spacing.xl, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: 1 },
  input: { borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.sm, paddingHorizontal: theme.spacing.lg, paddingVertical: 14, fontSize: 16, color: theme.color.onSurface, backgroundColor: theme.color.surfaceSecondary },
  err: { color: theme.color.error, marginTop: theme.spacing.md, fontSize: 13 },
  primaryBtn: { marginTop: theme.spacing.xl, backgroundColor: theme.color.brand, borderRadius: theme.radius.sm, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: theme.color.onBrandPrimary, fontSize: 16, fontFamily: theme.font.bodyMedium },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.color.surface },
  doneCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.color.success, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg },
  doneTitle: { fontFamily: theme.font.heading, fontSize: 22, color: theme.color.onSurface },
});

import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      const { reset_token } = await api.forgotPassword(email.trim());
      router.replace({ pathname: '/reset-password', params: { token: reset_token } });
    } catch (e: any) {
      setErr(e.message || 'Could not find that account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.color.surface }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Pressable testID="forgot-back" onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Feather name="arrow-left" size={20} color={theme.color.onSurface} />
        </Pressable>

        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.sub}>Enter the email on your account and we&rsquo;ll get you back in.</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          testID="forgot-email-input"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={theme.color.muted}
          style={styles.input}
        />

        {err && <Text style={styles.err} testID="forgot-error">{err}</Text>}

        <AnimatedPressable testID="forgot-submit-button" onPress={submit} disabled={busy || !email.trim()} style={styles.primaryBtn}>
          {busy ? <ActivityIndicator color={theme.color.onBrandPrimary} /> : <Text style={styles.primaryBtnText}>Send reset link</Text>}
        </AnimatedPressable>

        <View style={styles.devNote}>
          <Feather name="info" size={14} color={theme.color.muted} />
          <Text style={styles.devNoteText}>
            This app has no email service configured yet, so you&rsquo;ll be taken straight to the reset screen instead of receiving an email.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: theme.spacing.xl, paddingTop: theme.spacing.xxl, paddingBottom: theme.spacing.xxxl },
  back: { alignSelf: 'flex-start', marginBottom: theme.spacing.lg },
  title: { fontFamily: theme.font.heading, fontSize: 28, color: theme.color.onSurface },
  sub: { color: theme.color.muted, marginTop: theme.spacing.xs, fontSize: 14, lineHeight: 20 },
  label: { fontSize: 12, color: theme.color.muted, marginTop: theme.spacing.xl, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: 1 },
  input: { borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.sm, paddingHorizontal: theme.spacing.lg, paddingVertical: 14, fontSize: 16, color: theme.color.onSurface, backgroundColor: theme.color.surfaceSecondary },
  err: { color: theme.color.error, marginTop: theme.spacing.md, fontSize: 13 },
  primaryBtn: { marginTop: theme.spacing.xl, backgroundColor: theme.color.brand, borderRadius: theme.radius.sm, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: theme.color.onBrandPrimary, fontSize: 16, fontFamily: theme.font.bodyMedium },
  devNote: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xl, padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: theme.color.surfaceTertiary },
  devNoteText: { flex: 1, fontSize: 12, color: theme.color.onSurfaceTertiary, lineHeight: 18 },
});

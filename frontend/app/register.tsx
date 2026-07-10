import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/src/auth';
import { api } from '@/src/api';
import { theme } from '@/src/theme';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';

type Role = 'customer' | 'seller';
const SELLER_STEPS = 3;

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState<Role>('customer');
  const [step, setStep] = useState(1);

  // step 1 (both roles)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // step 2 (seller only)
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  // step 3 (seller only)
  const [photo, setPhoto] = useState<{ uri: string; mime: string } | null>(null);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [address, setAddress] = useState({ line1: '', city: '', state: '', zip: '' });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const chooseRole = (r: Role) => { setRole(r); setStep(1); setErr(null); };

  const step1Valid = name.trim().length > 0 && email.trim().length > 0 && password.length >= 8;
  const step2Valid = phone.trim().length > 0;
  const step3Valid = address.line1.trim() && address.city.trim() && address.state.trim() && address.zip.trim();

  const pickPhoto = async () => {
    setErr(null);
    const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!req.granted) { setErr('Photo access is needed to add a profile photo.'); return; }
    }
    setPickerBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (result.canceled) return;
      const a = result.assets[0];
      setPhoto({ uri: a.uri, mime: a.mimeType || 'image/jpeg' });
    } catch (e: any) {
      setErr(e?.message || 'Could not open picker');
    } finally { setPickerBusy(false); }
  };

  const submitCustomer = async () => {
    setErr(null); setBusy(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, role: 'customer' });
      router.replace('/(customer)/home');
    } catch (e: any) {
      setErr(e.message || 'Registration failed');
    } finally { setBusy(false); }
  };

  const submitSeller = async () => {
    setErr(null); setBusy(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, role: 'seller' });
      let avatar_url: string | undefined;
      if (photo) {
        const up = await api.uploadImage(photo.uri, photo.mime);
        avatar_url = up.url;
      }
      await api.updateProfile({ phone: phone.trim(), bio: bio.trim() || undefined, avatar_url, address });
      router.replace('/(seller)/dashboard');
    } catch (e: any) {
      setErr(e.message || 'Registration failed');
    } finally { setBusy(false); }
  };

  const next = () => {
    setErr(null);
    if (step === 1 && !step1Valid) { setErr('Fill in your name, email, and an 8+ character password.'); return; }
    if (step === 2 && !step2Valid) { setErr('A contact phone number is required.'); return; }
    setStep((s) => Math.min(s + 1, SELLER_STEPS));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.color.surface }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={styles.title}>Join ArtisanMarket</Text>
          <Text style={styles.sub}>Discover handmade or share your craft.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Text style={styles.label}>I want to</Text>
          <View style={styles.roleRow}>
            <AnimatedPressable testID="role-customer" style={[styles.roleCard, role === 'customer' && styles.roleCardActive]} onPress={() => chooseRole('customer')}>
              <Text style={[styles.roleTitle, role === 'customer' && styles.roleTitleActive]}>Shop</Text>
              <Text style={styles.roleDesc}>Browse & buy handmade goods.</Text>
            </AnimatedPressable>
            <AnimatedPressable testID="role-seller" style={[styles.roleCard, role === 'seller' && styles.roleCardActive]} onPress={() => chooseRole('seller')}>
              <Text style={[styles.roleTitle, role === 'seller' && styles.roleTitleActive]}>Sell</Text>
              <Text style={styles.roleDesc}>List my handmade creations.</Text>
            </AnimatedPressable>
          </View>
        </Animated.View>

        {role === 'seller' && (
          <View style={styles.stepRow} testID="wizard-step-indicator">
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.stepDot, i <= step && styles.stepDotActive]} />
            ))}
            <Text style={styles.stepText}>Step {step} of {SELLER_STEPS}</Text>
          </View>
        )}

        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          {(role === 'customer' || step === 1) && (
            <>
              <Text style={styles.label}>Name</Text>
              <TextInput testID="register-name-input" value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={theme.color.muted} style={styles.input} />

              <Text style={styles.label}>Email</Text>
              <TextInput testID="register-email-input" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={theme.color.muted} style={styles.input} />

              <Text style={styles.label}>Password</Text>
              <TextInput testID="register-password-input" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 8 characters" placeholderTextColor={theme.color.muted} style={styles.input} />
            </>
          )}

          {role === 'seller' && step === 2 && (
            <>
              <Text style={styles.label}>Phone</Text>
              <TextInput testID="register-phone-input" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="For order & studio contact" placeholderTextColor={theme.color.muted} style={styles.input} />

              <Text style={styles.label}>Studio bio</Text>
              <TextInput
                testID="register-bio-input"
                value={bio}
                onChangeText={setBio}
                multiline
                placeholder="A line or two about your craft (optional)"
                placeholderTextColor={theme.color.muted}
                style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
              />
            </>
          )}

          {role === 'seller' && step === 3 && (
            <>
              <Text style={styles.label}>Profile photo (optional)</Text>
              <Pressable testID="register-pick-photo" onPress={pickPhoto} disabled={pickerBusy} style={styles.photoPicker}>
                {pickerBusy ? <ActivityIndicator color={theme.color.brand} /> : photo ? (
                  <Image source={{ uri: photo.uri }} style={styles.photoPreview} contentFit="cover" />
                ) : (
                  <>
                    <Feather name="camera" size={20} color={theme.color.brand} />
                    <Text style={styles.photoPickerText}>Add photo</Text>
                  </>
                )}
              </Pressable>

              <Text style={styles.label}>Studio address</Text>
              <TextInput testID="register-address-line1" value={address.line1} onChangeText={(v) => setAddress((s) => ({ ...s, line1: v }))} placeholder="Street address" placeholderTextColor={theme.color.muted} style={styles.input} />
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <TextInput testID="register-address-city" value={address.city} onChangeText={(v) => setAddress((s) => ({ ...s, city: v }))} placeholder="City" placeholderTextColor={theme.color.muted} style={[styles.input, { flex: 1, marginTop: theme.spacing.sm }]} />
                <TextInput testID="register-address-state" value={address.state} onChangeText={(v) => setAddress((s) => ({ ...s, state: v }))} placeholder="State" placeholderTextColor={theme.color.muted} style={[styles.input, { flex: 1, marginTop: theme.spacing.sm }]} />
              </View>
              <TextInput testID="register-address-zip" value={address.zip} onChangeText={(v) => setAddress((s) => ({ ...s, zip: v }))} placeholder="ZIP / postal code" placeholderTextColor={theme.color.muted} style={[styles.input, { marginTop: theme.spacing.sm }]} />
            </>
          )}

          {err && <Text style={styles.err} testID="register-error">{err}</Text>}

          {role === 'customer' ? (
            <AnimatedPressable testID="register-submit-button" onPress={submitCustomer} disabled={busy} style={styles.primaryBtn}>
              {busy ? <ActivityIndicator color={theme.color.onBrandPrimary} /> : <Text style={styles.primaryBtnText}>Create account</Text>}
            </AnimatedPressable>
          ) : (
            <View style={styles.footerRow}>
              {step > 1 && (
                <AnimatedPressable testID="wizard-back" onPress={back} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>Back</Text>
                </AnimatedPressable>
              )}
              {step < SELLER_STEPS ? (
                <AnimatedPressable testID="wizard-next" onPress={next} style={styles.primaryBtnFlex}>
                  <Text style={styles.primaryBtnText}>Continue</Text>
                </AnimatedPressable>
              ) : (
                <AnimatedPressable testID="register-submit-button" onPress={submitSeller} disabled={busy || !step3Valid} style={[styles.primaryBtnFlex, !step3Valid && { opacity: 0.5 }]}>
                  {busy ? <ActivityIndicator color={theme.color.onBrandPrimary} /> : <Text style={styles.primaryBtnText}>Create account</Text>}
                </AnimatedPressable>
              )}
            </View>
          )}

          <Pressable testID="go-to-login" onPress={() => router.replace('/login')} style={styles.linkBtn}>
            <Text style={styles.linkText}>Already have an account? Sign in →</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: theme.spacing.xl, paddingTop: theme.spacing.xxxl, paddingBottom: theme.spacing.xxxl },
  title: { fontFamily: theme.font.heading, fontSize: 32, color: theme.color.onSurface },
  sub: { color: theme.color.muted, marginTop: theme.spacing.xs, fontSize: 14 },
  label: { fontSize: 12, color: theme.color.muted, marginTop: theme.spacing.xl, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: 1 },
  input: { borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.sm, paddingHorizontal: theme.spacing.lg, paddingVertical: 14, fontSize: 16, color: theme.color.onSurface, backgroundColor: theme.color.surfaceSecondary },
  roleRow: { flexDirection: 'row', gap: theme.spacing.md },
  roleCard: { flex: 1, padding: theme.spacing.lg, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surfaceSecondary },
  roleCardActive: { borderColor: theme.color.brand, backgroundColor: theme.color.brandTertiary },
  roleTitle: { fontFamily: theme.font.heading, fontSize: 20, color: theme.color.onSurface },
  roleTitleActive: { color: theme.color.onBrandTertiary },
  roleDesc: { color: theme.color.muted, fontSize: 12, marginTop: theme.spacing.xs },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing.xl },
  stepDot: { width: 20, height: 4, borderRadius: 2, backgroundColor: theme.color.border },
  stepDotActive: { backgroundColor: theme.color.brand },
  stepText: { marginLeft: theme.spacing.sm, fontSize: 12, color: theme.color.muted },
  err: { color: theme.color.error, marginTop: theme.spacing.md, fontSize: 13 },
  primaryBtn: { marginTop: theme.spacing.xl, backgroundColor: theme.color.brand, borderRadius: theme.radius.sm, paddingVertical: 16, alignItems: 'center' },
  primaryBtnFlex: { flex: 1, backgroundColor: theme.color.brand, borderRadius: theme.radius.sm, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: theme.color.onBrandPrimary, fontSize: 16, fontFamily: theme.font.bodyMedium },
  footerRow: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.xl },
  backBtn: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.color.borderStrong, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: theme.color.onSurface, fontSize: 14 },
  linkBtn: { marginTop: theme.spacing.lg, alignItems: 'center' },
  linkText: { color: theme.color.brand, fontSize: 14 },
  photoPicker: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.color.brand, backgroundColor: theme.color.brandTertiary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', gap: 4 },
  photoPickerText: { color: theme.color.brand, fontSize: 11 },
  photoPreview: { width: '100%', height: '100%' },
});

import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

export default function WriteReview() {
  const { product_id, order_id, title } = useLocalSearchParams<{ product_id: string; order_id?: string; title?: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!rating) { setErr('Tap a star to rate this piece.'); return; }
    setErr(null); setBusy(true);
    try {
      await api.addReview({ product_id: product_id!, rating, comment: comment.trim(), order_id });
      setDone(true);
      setTimeout(() => router.back(), 1200);
    } catch (e: any) {
      setErr(e.message || 'Could not submit review');
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <View style={styles.successCircle}><Feather name="check" size={28} color="#fff" /></View>
        <Text style={styles.successTitle} testID="review-success">Thank you</Text>
        <Text style={styles.successSub}>Your review helps other buyers.</Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable testID="review-back" onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={theme.color.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>Rate this piece</Text>
        </View>
        <View style={{ padding: theme.spacing.xl }}>
          {title ? <Text style={styles.subject}>{title}</Text> : null}

          <Text style={styles.label}>How was it?</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                testID={`star-${n}`}
                onPress={() => setRating(n)}
                hitSlop={6}
              >
                <Feather
                  name="star"
                  size={38}
                  color={n <= rating ? theme.color.warning : theme.color.border}
                />
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Share a few words (optional)</Text>
          <TextInput
            testID="review-comment"
            value={comment}
            onChangeText={setComment}
            multiline
            placeholder="What did you love? How does it feel in hand?"
            placeholderTextColor={theme.color.muted}
            style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
          />

          {err && <Text style={styles.err} testID="review-error">{err}</Text>}

          <Pressable testID="review-submit" onPress={submit} disabled={busy} style={styles.cta}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Submit review</Text>}
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, padding: theme.spacing.xl, paddingBottom: theme.spacing.md },
  headerTitle: { fontFamily: theme.font.heading, fontSize: 22, color: theme.color.onSurface },
  subject: { fontFamily: theme.font.heading, fontSize: 20, color: theme.color.onSurface, marginBottom: theme.spacing.md },
  label: { fontSize: 11, color: theme.color.muted, marginTop: theme.spacing.xl, marginBottom: theme.spacing.md, textTransform: 'uppercase', letterSpacing: 1 },
  stars: { flexDirection: 'row', gap: 10, justifyContent: 'center', paddingVertical: theme.spacing.md },
  input: { borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.sm, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: theme.color.surfaceSecondary, fontSize: 15, color: theme.color.onSurface },
  err: { color: theme.color.error, marginTop: theme.spacing.md },
  cta: { marginTop: theme.spacing.xl, backgroundColor: theme.color.brand, paddingVertical: 16, borderRadius: theme.radius.sm, alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.color.success, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontFamily: theme.font.heading, fontSize: 24, color: theme.color.onSurface, marginTop: theme.spacing.md },
  successSub: { color: theme.color.muted, marginTop: 4 },
});

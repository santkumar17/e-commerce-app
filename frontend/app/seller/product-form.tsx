import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=800';

export default function ProductForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const editing = !!id;
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cats, setCats] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    title: '', description: '', price: '', category: 'ceramics',
    stock: '1', materials: '', dimensions: '', shipping_days: '7',
    tags: '', image_url: '',
  });

  useEffect(() => {
    api.categories().then(setCats).catch(() => {});
    if (editing) {
      api.product(id!).then((p) => {
        setForm({
          title: p.title || '',
          description: p.description || '',
          price: String(p.price),
          category: p.category,
          stock: String(p.stock),
          materials: p.materials || '',
          dimensions: p.dimensions || '',
          shipping_days: String(p.shipping_days),
          tags: (p.tags || []).join(', '),
          image_url: p.images?.[0] || '',
        });
      }).catch(() => {});
    }
  }, [id, editing]);

  const set = (k: string) => (v: string) => setForm((s: any) => ({ ...s, [k]: v }));

  const generateAI = async () => {
    if (!form.title.trim()) { setErr('Add a title first.'); return; }
    setErr(null); setAiBusy(true);
    try {
      const r = await api.generateDescription({
        title: form.title,
        keywords: form.tags,
        materials: form.materials,
      });
      setForm((s: any) => ({ ...s, description: r.description }));
    } catch (e: any) {
      setErr(e.message || 'AI generation failed');
    } finally { setAiBusy(false); }
  };

  const submit = async () => {
    if (!form.title || !form.description || !form.price) {
      setErr('Please fill title, description and price.');
      return;
    }
    setErr(null); setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price) || 0,
        category: form.category,
        stock: parseInt(form.stock) || 1,
        materials: form.materials.trim(),
        dimensions: form.dimensions.trim(),
        shipping_days: parseInt(form.shipping_days) || 7,
        images: [form.image_url.trim() || DEFAULT_IMG],
        tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      };
      if (editing) await api.updateProduct(id!, payload);
      else await api.createProduct(payload);
      router.back();
    } catch (e: any) {
      setErr(e.message || 'Save failed');
    } finally { setBusy(false); }
  };

  const del = async () => {
    if (!editing) return;
    setBusy(true);
    try { await api.deleteProduct(id!); router.back(); } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable testID="form-back" onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={theme.color.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>{editing ? 'Edit product' : 'New product'}</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
          <Field label="Title" testID="pf-title" value={form.title} onChangeText={set('title')} placeholder="e.g. Hand-thrown terracotta vase" />

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Description</Text>
            <Pressable testID="ai-generate-btn" onPress={generateAI} disabled={aiBusy} style={styles.aiBtn}>
              {aiBusy ? <ActivityIndicator size="small" color={theme.color.brand} /> : (
                <>
                  <Feather name="edit-3" size={12} color={theme.color.brand} />
                  <Text style={styles.aiBtnText}>Generate with AI</Text>
                </>
              )}
            </Pressable>
          </View>
          <TextInput
            testID="pf-description"
            value={form.description}
            onChangeText={set('description')}
            multiline
            placeholder="Tell the story of this piece..."
            placeholderTextColor={theme.color.muted}
            style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
          />

          <Field label="Price (USD)" testID="pf-price" value={form.price} onChangeText={set('price')} keyboardType="decimal-pad" />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ height: 44 }}>
            {cats.map((c) => (
              <Pressable
                key={c.id}
                testID={`pf-cat-${c.id}`}
                onPress={() => set('category')(c.id)}
                style={[styles.chip, form.category === c.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, form.category === c.id && styles.chipTextActive]}>{c.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Field label="Stock" testID="pf-stock" value={form.stock} onChangeText={set('stock')} keyboardType="number-pad" />
          <Field label="Materials" testID="pf-materials" value={form.materials} onChangeText={set('materials')} placeholder="e.g. Vegetable-tanned leather" />
          <Field label="Dimensions" testID="pf-dimensions" value={form.dimensions} onChangeText={set('dimensions')} placeholder="e.g. 18cm × 12cm" />
          <Field label="Shipping (days)" testID="pf-shipping" value={form.shipping_days} onChangeText={set('shipping_days')} keyboardType="number-pad" />
          <Field label="Tags (comma-separated)" testID="pf-tags" value={form.tags} onChangeText={set('tags')} placeholder="ceramic, vase, home" />
          <Field label="Image URL" testID="pf-image" value={form.image_url} onChangeText={set('image_url')} placeholder="https://..." />

          {err && <Text style={styles.err} testID="pf-error">{err}</Text>}

          {editing && (
            <Pressable testID="pf-delete-btn" onPress={del} style={styles.deleteBtn}>
              <Feather name="trash-2" size={14} color={theme.color.error} />
              <Text style={styles.deleteText}>Delete listing</Text>
            </Pressable>
          )}
        </ScrollView>
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <Pressable testID="pf-save-btn" onPress={submit} disabled={busy} style={styles.cta}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{editing ? 'Resubmit for review' : 'Submit for review'}</Text>}
          </Pressable>
        </SafeAreaView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function Field(props: any) {
  return (
    <>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput {...props} placeholderTextColor={theme.color.muted} style={styles.input} />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, padding: theme.spacing.xl, paddingBottom: theme.spacing.md },
  headerTitle: { fontFamily: theme.font.heading, fontSize: 22, color: theme.color.onSurface },
  label: { fontSize: 11, color: theme.color.muted, marginTop: theme.spacing.md, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: theme.spacing.md },
  input: { borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.sm, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: theme.color.surfaceSecondary, fontSize: 15, color: theme.color.onSurface },
  aiBtn: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.color.brand, backgroundColor: theme.color.brandTertiary },
  aiBtnText: { color: theme.color.brand, fontSize: 12 },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.color.border, backgroundColor: theme.color.surfaceSecondary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chipActive: { backgroundColor: theme.color.brand, borderColor: theme.color.brand },
  chipText: { fontSize: 12, color: theme.color.onSurface },
  chipTextActive: { color: '#fff' },
  err: { color: theme.color.error, marginTop: theme.spacing.md },
  deleteBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.xl, padding: 12, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.color.error },
  deleteText: { color: theme.color.error, fontSize: 13 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: theme.color.surfaceSecondary, padding: theme.spacing.xl, borderTopWidth: 1, borderTopColor: theme.color.border },
  cta: { backgroundColor: theme.color.brand, paddingVertical: 16, borderRadius: theme.radius.sm, alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '500' },
});

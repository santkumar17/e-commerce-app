import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/src/api';
import { theme } from '@/src/theme';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=800';
const MAX_IMAGES = 5;

export default function ProductForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const editing = !!id;
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cats, setCats] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState<any>({
    title: '', description: '', price: '', category: 'ceramics',
    stock: '1', materials: '', dimensions: '', shipping_days: '7',
    tags: '',
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
        });
        setImages(p.images || []);
      }).catch(() => {});
    }
  }, [id, editing]);

  const set = (k: string) => (v: string) => setForm((s: any) => ({ ...s, [k]: v }));

  const pickImages = async () => {
    setErr(null);
    if (images.length >= MAX_IMAGES) {
      setErr(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    // Request permission first
    const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      if (!perm.canAskAgain) {
        setErr('Photo access blocked. Open Settings to enable it.');
        return;
      }
      const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!req.granted) {
        if (!req.canAskAgain) setErr('Photo access blocked. Open Settings to enable it.');
        else setErr('Photo access is needed to attach product images.');
        return;
      }
    }
    setPickerBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES - images.length,
        quality: 0.7,
        base64: true,
      });
      if (result.canceled) return;
      const next: string[] = [];
      for (const a of result.assets) {
        if (a.base64) {
          const mime = a.mimeType || 'image/jpeg';
          next.push(`data:${mime};base64,${a.base64}`);
        } else if (a.uri) {
          next.push(a.uri);
        }
      }
      setImages((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
    } catch (e: any) {
      setErr(e?.message || 'Could not open picker');
    } finally { setPickerBusy(false); }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

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

  const submit = async (asDraft = false) => {
    if (!form.title || !form.price) {
      setErr('Please fill title and price.');
      return;
    }
    if (!asDraft && !form.description) {
      setErr('Please fill description before submitting.');
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
        images: images.length ? images : [DEFAULT_IMG],
        tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        status: asDraft ? 'draft' : 'pending',
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

          <Text style={styles.label}>Photos ({images.length}/{MAX_IMAGES})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
            {images.map((uri, idx) => (
              <View key={idx} style={styles.imgBox} testID={`pf-image-${idx}`}>
                <Image source={{ uri }} style={styles.imgPreview} contentFit="cover" />
                <Pressable
                  testID={`pf-image-remove-${idx}`}
                  onPress={() => removeImage(idx)}
                  hitSlop={8}
                  style={styles.imgRemove}
                >
                  <Feather name="x" size={12} color="#fff" />
                </Pressable>
                {idx === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>COVER</Text>
                  </View>
                )}
              </View>
            ))}
            {images.length < MAX_IMAGES && (
              <Pressable
                testID="pf-add-image"
                onPress={pickImages}
                disabled={pickerBusy}
                style={styles.addImgBtn}
              >
                {pickerBusy ? (
                  <ActivityIndicator color={theme.color.brand} />
                ) : (
                  <>
                    <Feather name="plus" size={22} color={theme.color.brand} />
                    <Text style={styles.addImgText}>Add photo</Text>
                  </>
                )}
              </Pressable>
            )}
          </ScrollView>
          {err === 'Photo access blocked. Open Settings to enable it.' && (
            <Pressable testID="pf-open-settings" onPress={() => Linking.openSettings()} style={styles.settingsBtn}>
              <Text style={styles.settingsBtnText}>Open Settings</Text>
            </Pressable>
          )}

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
          <Field label="Dimensions" testID="pf-dimensions" value={form.dimensions} onChangeText={set('dimensions')} placeholder="e.g. 18cm x 12cm" />
          <Field label="Shipping (days)" testID="pf-shipping" value={form.shipping_days} onChangeText={set('shipping_days')} keyboardType="number-pad" />
          <Field label="Tags (comma-separated)" testID="pf-tags" value={form.tags} onChangeText={set('tags')} placeholder="ceramic, vase, home" />

          {err && <Text style={styles.err} testID="pf-error">{err}</Text>}

          {editing && (
            <Pressable testID="pf-delete-btn" onPress={del} style={styles.deleteBtn}>
              <Feather name="trash-2" size={14} color={theme.color.error} />
              <Text style={styles.deleteText}>Delete listing</Text>
            </Pressable>
          )}
        </ScrollView>
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.footerRow}>
            <Pressable testID="pf-draft-btn" onPress={() => submit(true)} disabled={busy} style={styles.draftBtn}>
              <Text style={styles.draftText}>Save draft</Text>
            </Pressable>
            <Pressable testID="pf-save-btn" onPress={() => submit(false)} disabled={busy} style={styles.cta}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{editing ? 'Resubmit' : 'Submit for review'}</Text>}
            </Pressable>
          </View>
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
  label: { fontSize: 11, color: theme.color.muted, marginTop: theme.spacing.md, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: theme.spacing.md },
  input: { borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.sm, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: theme.color.surfaceSecondary, fontSize: 15, color: theme.color.onSurface },
  imageRow: { gap: 10, paddingVertical: 4 },
  imgBox: { width: 100, height: 100, borderRadius: theme.radius.sm, overflow: 'hidden', backgroundColor: theme.color.surfaceTertiary, position: 'relative' },
  imgPreview: { width: '100%', height: '100%' },
  imgRemove: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  coverBadge: { position: 'absolute', left: 4, bottom: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: theme.color.brand, borderRadius: theme.radius.sm },
  coverBadgeText: { color: '#fff', fontSize: 9, letterSpacing: 1 },
  addImgBtn: { width: 100, height: 100, borderRadius: theme.radius.sm, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.color.brand, backgroundColor: theme.color.brandTertiary, alignItems: 'center', justifyContent: 'center', gap: 4 },
  addImgText: { color: theme.color.brand, fontSize: 11 },
  settingsBtn: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.color.brand },
  settingsBtnText: { color: theme.color.brand, fontSize: 12 },
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
  footerRow: { flexDirection: 'row', gap: theme.spacing.md },
  draftBtn: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.color.borderStrong, alignItems: 'center', justifyContent: 'center' },
  draftText: { color: theme.color.onSurface, fontSize: 14 },
  cta: { flex: 1, backgroundColor: theme.color.brand, paddingVertical: 16, borderRadius: theme.radius.sm, alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '500' },
});

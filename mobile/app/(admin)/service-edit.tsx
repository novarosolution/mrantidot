import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { adminGoBack, adminRoutes } from '@/lib/routes';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { AdminFormCard, AdminFilterChips } from '@/components/kit/AdminPageKit';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { IconInput } from '@/components/kit/IconInput';
import { ServiceIconPicker } from '@/components/kit/ServiceIconPicker';
import { ServiceTypePicker } from '@/components/kit/ServiceTypePicker';
import { Button } from '@/components/ui/Button';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, screenLoadConfig } from '@/lib/api';
import { serviceRealRating } from '@/lib/ratings';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { ServiceCategory, ServiceOption, ServiceStats, ServiceTypeKey } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

const CATEGORIES: { key: ServiceCategory; label: string }[] = [
  { key: 'residential', label: 'Residential' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'cleaning', label: 'Cleaning' },
  { key: 'general', label: 'General' },
];

/** Option row while editing — price stays a string until save. */
type OptionDraft = { key?: string; label: string; price: string; note: string };

const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);
const joinLines = (list?: string[]) => (list ?? []).join('\n');

export default function ServiceEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [name, setName] = useState('');
  const [iconKey, setIconKey] = useState('spray');
  const [category, setCategory] = useState<ServiceCategory>('general');
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeKey[]>([]);
  const [basePrice, setBasePrice] = useState('499');
  const [shortDesc, setShortDesc] = useState('');
  const [steps, setSteps] = useState('Arrival,Before,After,Sign-off');
  const [rating, setRating] = useState('4.8');
  const [realRating, setRealRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [optionsTitle, setOptionsTitle] = useState('Size of home');
  const [options, setOptions] = useState<OptionDraft[]>([]);
  const [durationMins, setDurationMins] = useState('');
  const [highlights, setHighlights] = useState('');
  const [included, setIncluded] = useState('');
  const [excluded, setExcluded] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<'name' | 'shortDesc' | 'basePrice' | 'rating' | 'serviceTypes' | 'options', string>>
  >({});
  const { loading, error, runLoad, reload } = useScreenLoad(!!id);

  const load = useCallback(async () => {
    if (!id) return;
    const [svcRes, statsRes] = await Promise.all([
      api.get<{
        service: {
          name: string;
          iconKey: string;
          basePrice: number;
          shortDesc: string;
          stepTemplate?: string[];
          category?: ServiceCategory;
          rating?: number;
          serviceTypes?: ServiceTypeKey[];
          optionsTitle?: string;
          options?: ServiceOption[];
          durationMins?: number;
          highlights?: string[];
          included?: string[];
          excluded?: string[];
          notes?: string[];
        };
      }>(`/services/${id}`, screenLoadConfig),
      api.get<{ stats: ServiceStats }>(`/services/${id}/stats`, screenLoadConfig),
    ]);
    const s = svcRes.data.service;
    setName(s.name);
    setIconKey(s.iconKey);
    setCategory(s.category ?? 'general');
    setServiceTypes(s.serviceTypes ?? []);
    setBasePrice(String(s.basePrice));
    setShortDesc(s.shortDesc);
    setRating(String(s.rating ?? 4.8));
    setSteps((s.stepTemplate ?? []).join(','));
    setOptionsTitle(s.optionsTitle || 'Size of home');
    setOptions((s.options ?? []).map((o) => ({ key: o.key, label: o.label, price: String(o.price), note: o.note ?? '' })));
    setDurationMins(s.durationMins ? String(s.durationMins) : '');
    setHighlights(joinLines(s.highlights));
    setIncluded(joinLines(s.included));
    setExcluded(joinLines(s.excluded));
    setNotes(joinLines(s.notes));
    const stats = statsRes.data.stats;
    setRealRating(serviceRealRating(stats));
    setReviewCount(stats.reviewCount ?? 0);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void runLoad(load);
  }, [id, load, runLoad]);

  async function save() {
    const next: Partial<Record<'name' | 'shortDesc' | 'basePrice' | 'rating' | 'serviceTypes' | 'options', string>> = {};
    if (!name.trim()) next.name = 'Required';
    if (!shortDesc.trim()) next.shortDesc = 'Required';
    if (serviceTypes.length === 0) next.serviceTypes = 'Select at least one pest type';
    const price = parseFloat(basePrice);
    if (Number.isNaN(price) || price <= 0) next.basePrice = 'Enter a valid base price';
    const ratingNum = parseFloat(rating);
    if (Number.isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) next.rating = 'Must be between 0 and 5';
    // Blank rows are dropped; a named size needs a real price.
    const filledOptions = options.filter((o) => o.label.trim() || o.price.trim());
    if (filledOptions.some((o) => !o.label.trim() || !(parseFloat(o.price) > 0))) {
      next.options = 'Every size needs a name and a price above ₹0';
    }
    const duration = durationMins.trim() ? parseInt(durationMins, 10) : 0;
    setErrors(next);
    if (Object.keys(next).length > 0) {
      Toast.show({ type: 'error', text1: next.serviceTypes || next.options || 'Fix the highlighted fields' });
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        iconKey: iconKey.trim(),
        category,
        serviceTypes,
        basePrice: price,
        rating: ratingNum,
        shortDesc: shortDesc.trim(),
        stepTemplate: steps.split(',').map((s) => s.trim()).filter(Boolean),
        optionsTitle: optionsTitle.trim() || 'Size of home',
        options: filledOptions.map((o) => ({
          ...(o.key ? { key: o.key } : {}),
          label: o.label.trim(),
          price: Math.round(parseFloat(o.price)),
          ...(o.note.trim() ? { note: o.note.trim() } : {}),
        })),
        durationMins: Number.isFinite(duration) && duration > 0 ? duration : 0,
        highlights: lines(highlights),
        included: lines(included),
        excluded: lines(excluded),
        notes: lines(notes),
      };
      if (id) {
        await api.patch(`/services/${id}`, body);
      } else {
        await api.post('/services', body);
      }
      Toast.show({ type: 'success', text1: 'Saved' });
      adminGoBack(adminRoutes.services);
    } finally {
      setSaving(false);
    }
  }

  function remove() {
    if (!id) return;
    Alert.alert('Deactivate service?', 'Customers will no longer see this service.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await api.delete(`/services/${id}`);
              Toast.show({ type: 'success', text1: 'Service deactivated' });
              adminGoBack(adminRoutes.services);
            } catch {
              Toast.show({ type: 'error', text1: 'Could not deactivate service' });
            }
          })();
        },
      },
    ]);
  }

  if (id && loading) return <Spinner fullScreen />;

  if (id && error) {
    return (
      <AdminListShell title="Edit Service" subtitle="Error">
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell
      title={id ? 'Edit Service' : 'New Service'}
      subtitle="Catalog item"
      backFallback={adminRoutes.services}
      keyboardAvoid
      stickyFooter={
        <StickyActionBar row>
          {id ? (
            <Button title="Deactivate" variant="dangerOutline" onPress={remove} fullWidth={false} style={styles.footerSecondary} />
          ) : null}
          <Button title="Save" variant="premium" onPress={save} loading={saving} fullWidth={false} style={styles.footerPrimary} />
        </StickyActionBar>
      }
    >
      <ScrollView
        contentContainerStyle={adminListShellStyles.form}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <PremiumSectionHeader title="Details" style={styles.sectionHead} />
        <AdminFormCard style={styles.form}>
          <IconInput
            label="Name"
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
            }}
            error={errors.name}
          />
          <Text style={styles.label}>Category</Text>
          <AdminFilterChips
            chips={CATEGORIES.map((c) => ({ key: c.key, label: c.label }))}
            selected={category}
            onSelect={(key) => setCategory(key as ServiceCategory)}
          />
          <IconInput
            label="Base price"
            value={basePrice}
            onChangeText={(t) => {
              setBasePrice(t);
              if (errors.basePrice) setErrors((e) => ({ ...e, basePrice: undefined }));
            }}
            keyboardType="numeric"
            error={errors.basePrice}
          />
          <IconInput
            label="Public rating"
            value={rating}
            onChangeText={(t) => {
              setRating(t);
              if (errors.rating) setErrors((e) => ({ ...e, rating: undefined }));
            }}
            keyboardType="decimal-pad"
            error={errors.rating}
          />
          {id ? (
            <Text style={styles.realHint}>
              {realRating != null
                ? `Customer reviews average ★ ${realRating.toFixed(1)} from ${reviewCount} review${reviewCount === 1 ? '' : 's'}`
                : 'No customer reviews yet'}
            </Text>
          ) : null}
          <IconInput
            label="Short description"
            value={shortDesc}
            onChangeText={(t) => {
              setShortDesc(t);
              if (errors.shortDesc) setErrors((e) => ({ ...e, shortDesc: undefined }));
            }}
            error={errors.shortDesc}
          />
          <IconInput label="Steps (comma-separated)" value={steps} onChangeText={setSteps} />
        </AdminFormCard>
        <PremiumSectionHeader
          title="Sizes & pricing"
          subtitle="Customers pick one size and the booking is priced from it. Leave empty to use the base price."
          style={styles.sectionHead}
        />
        <AdminFormCard style={styles.form}>
          <IconInput label="Picker heading" value={optionsTitle} onChangeText={setOptionsTitle} placeholder="Size of home" />
          {options.map((o, i) => (
            <View key={o.key ?? `new-${i}`} style={styles.optionRow}>
              <View style={styles.optionLabel}>
                <IconInput
                  label={i === 0 ? 'Size' : ' '}
                  value={o.label}
                  placeholder="2 BHK"
                  onChangeText={(t) => setOptions((prev) => prev.map((p, j) => (j === i ? { ...p, label: t } : p)))}
                />
              </View>
              <View style={styles.optionPrice}>
                <IconInput
                  label={i === 0 ? 'Price ₹' : ' '}
                  value={o.price}
                  placeholder="899"
                  keyboardType="numeric"
                  onChangeText={(t) => setOptions((prev) => prev.map((p, j) => (j === i ? { ...p, price: t } : p)))}
                />
              </View>
              <Pressable
                style={({ pressed }) => [styles.optionRemove, pressed && styles.pressed]}
                onPress={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove size ${o.label || i + 1}`}
              >
                <X size={18} color={colors.error} strokeWidth={2.4} />
              </Pressable>
            </View>
          ))}
          {errors.options ? <Text style={styles.fieldError}>{errors.options}</Text> : null}
          <Pressable
            style={({ pressed }) => [styles.addOption, pressed && styles.pressed]}
            onPress={() => setOptions((prev) => [...prev, { label: '', price: '', note: '' }])}
            accessibilityRole="button"
          >
            <Plus size={16} color={ui.brand} strokeWidth={2.6} />
            <Text style={styles.addOptionText}>Add size</Text>
          </Pressable>
        </AdminFormCard>

        <PremiumSectionHeader
          title="Detail page content"
          subtitle="One point per line. Empty boxes hide their section in the app."
          style={styles.sectionHead}
        />
        <AdminFormCard style={styles.form}>
          <IconInput
            label="Visit length (minutes)"
            value={durationMins}
            onChangeText={setDurationMins}
            keyboardType="numeric"
            placeholder="60"
          />
          <IconInput label="Highlights (shown on service rows)" value={highlights} onChangeText={setHighlights} multiline />
          <IconInput label="What is included" value={included} onChangeText={setIncluded} multiline />
          <IconInput label="What is excluded" value={excluded} onChangeText={setExcluded} multiline />
          <IconInput label="Please note" value={notes} onChangeText={setNotes} multiline />
        </AdminFormCard>

        <PremiumSectionHeader title="Pest control types" style={styles.sectionHead} />
        <AdminFormCard style={styles.form}>
          <ServiceTypePicker
            value={serviceTypes}
            onChange={(v) => {
              setServiceTypes(v);
              if (errors.serviceTypes) setErrors((e) => ({ ...e, serviceTypes: undefined }));
            }}
          />
          {errors.serviceTypes ? <Text style={styles.fieldError}>{errors.serviceTypes}</Text> : null}
        </AdminFormCard>

        <PremiumSectionHeader title="Icon" style={styles.sectionHead} />
        <AdminFormCard style={styles.form}>
          <ServiceIconPicker value={iconKey} onChange={setIconKey} />
        </AdminFormCard>

      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  footerSecondary: { flex: 1 },
  footerPrimary: { flex: 1.6 },
  sectionHead: { marginTop: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.xs },
  form: { marginBottom: spacing.md },
  optionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  optionLabel: { flex: 1 },
  optionPrice: { width: 104 },
  optionRemove: {
    width: 36,
    height: 36,
    marginTop: 30,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorBg,
  },
  addOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(10,100,35,0.35)',
  },
  addOptionText: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.brand },
  pressed: { opacity: 0.7 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text, marginBottom: 8 },
  fieldError: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },
  realHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.forest,
    marginTop: -4,
    marginBottom: spacing.sm,
    lineHeight: 17,
  },
});

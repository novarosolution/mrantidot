import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { adminGoBack, adminRoutes, appReplace } from '@/lib/routes';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Copy, Plus, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { StepsEditor } from '@/components/admin/StepsEditor';
import { HeaderActionButton } from '@/components/kit/HeaderActionButton';
import { IS_WEB } from '@/lib/webAdmin';
import { AdminFormCard, AdminFilterChips } from '@/components/kit/AdminPageKit';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminFormSkeleton } from '@/components/kit/AdminSkeletons';
import { IconInput } from '@/components/kit/IconInput';
import { ImageField, useBusyCounter } from '@/components/kit/ImageField';
import { ServiceIconPicker } from '@/components/kit/ServiceIconPicker';
import { PestTypePicker } from '@/components/settings/PestTypePicker';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { haptic, stagger } from '@/lib/motion';
import { serviceRealRating } from '@/lib/ratings';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { ServiceCategory, ServiceOption, ServiceStats, ServiceTypeKey, WebsiteImage } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { confirmAsync } from '@/lib/confirm';
import { useBusinessSettings } from '@/lib/businessSettings';
import { categoryLabel } from '@/lib/settingsLabels';

/** Option row while editing — price stays a string until save. */
type OptionDraft = { key?: string; label: string; price: string; note: string };

const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);
const joinLines = (list?: string[]) => (list ?? []).join('\n');

export default function ServiceEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [name, setName] = useState('');
  const [iconKey, setIconKey] = useState('spray');
  // Any key from Business settings → Lists → Categories (admin-added ones too).
  const [category, setCategory] = useState<string>('general');
  const settings = useBusinessSettings();
  // Categories that are on, plus this service's own one if it was switched off or removed since.
  const categoryChips = [
    ...settings.lists.categories.filter((c) => c.active),
    ...(settings.lists.categories.some((c) => c.active && c.key === category)
      ? []
      : [{ key: category, label: `${categoryLabel(category, settings)} (off)`, active: false }]),
  ];
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeKey[]>([]);
  const [basePrice, setBasePrice] = useState('499');
  const [shortDesc, setShortDesc] = useState('');
  /** Visit steps in order (empty = the server's default steps). */
  const [steps, setSteps] = useState<string[]>(['Arrival', 'Before', 'After', 'Sign-off']);
  /** Saved on/off state (existing services). */
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState<null | 'toggle' | 'copy'>(null);
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
  const [coverImage, setCoverImage] = useState<WebsiteImage>({ url: '', alt: '' });
  const [uploading, onBusyChange] = useBusyCounter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<'name' | 'shortDesc' | 'basePrice' | 'rating' | 'serviceTypes' | 'options' | 'coverImage', string>>
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
          coverImage?: WebsiteImage;
          active?: boolean;
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
    setSteps(s.stepTemplate ?? []);
    setActive(s.active !== false);
    setOptionsTitle(s.optionsTitle || 'Size of home');
    setOptions((s.options ?? []).map((o) => ({ key: o.key, label: o.label, price: String(o.price), note: o.note ?? '' })));
    setDurationMins(s.durationMins ? String(s.durationMins) : '');
    setHighlights(joinLines(s.highlights));
    setIncluded(joinLines(s.included));
    setExcluded(joinLines(s.excluded));
    setNotes(joinLines(s.notes));
    setCoverImage({ url: s.coverImage?.url ?? '', alt: s.coverImage?.alt ?? '' });
    const stats = statsRes.data.stats;
    setRealRating(serviceRealRating(stats));
    setReviewCount(stats.reviewCount ?? 0);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void runLoad(load);
  }, [id, load, runLoad]);

  const onCoverImage = useCallback((img: WebsiteImage) => {
    setCoverImage(img);
    setErrors((e) => (e.coverImage ? { ...e, coverImage: undefined } : e));
  }, []);

  async function save() {
    const next: Partial<Record<'name' | 'shortDesc' | 'basePrice' | 'rating' | 'serviceTypes' | 'options' | 'coverImage', string>> = {};
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
    if (coverImage.url && !coverImage.alt.trim()) next.coverImage = 'Add alt text for the website photo';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      haptic('error');
      Toast.show({ type: 'error', text1: next.serviceTypes || next.options || next.coverImage || 'Fix the highlighted fields' });
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
        stepTemplate: steps.map((step) => step.trim()).filter(Boolean),
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
        coverImage: { url: coverImage.url, alt: coverImage.alt.trim() },
      };
      if (id) {
        await api.patch(`/services/${id}`, body);
      } else {
        await api.post('/services', body);
      }
      haptic('success');
      Toast.show({ type: 'success', text1: 'Saved' });
      adminGoBack(adminRoutes.services);
    } catch {
      // The api interceptor already shows the error toast; just make the failure felt.
      haptic('error');
    } finally {
      setSaving(false);
    }
  }

  function remove() {
    if (!id || busy) return;
    void confirmAsync({
      title: 'Deactivate service?',
      message: `Customers will no longer see ${name.trim() || 'this service'} in the app or on the website. Existing bookings are not affected; you can restore it any time.`,
      confirmLabel: 'Deactivate',
      cancelLabel: 'Keep live',
      destructive: true,
    }).then(async (ok) => {
      if (!ok) return;
      setBusy('toggle');
      try {
        await api.delete(`/services/${id}`, { skipErrorToast: true });
        haptic('success');
        Toast.show({ type: 'success', text1: 'Service deactivated' });
        adminGoBack(adminRoutes.services);
      } catch (err) {
        haptic('error');
        Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not deactivate service') });
      } finally {
        setBusy(null);
      }
    });
  }

  async function restore() {
    if (!id || busy) return;
    setBusy('toggle');
    try {
      await api.patch(`/services/${id}`, { active: true }, { skipErrorToast: true });
      haptic('success');
      setActive(true);
      Toast.show({ type: 'success', text1: 'Service is live again', text2: 'Customers can book it now.' });
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not restore service') });
    } finally {
      setBusy(null);
    }
  }

  /** A switched-off copy ("<name> (copy)") right after this one — opens it to edit. */
  async function duplicate() {
    if (!id || busy) return;
    setBusy('copy');
    try {
      const { data } = await api.post<{ service: { id: string; name: string } }>(`/services/${id}/duplicate`, {}, { skipErrorToast: true });
      haptic('success');
      Toast.show({ type: 'success', text1: `Created ${data.service.name}`, text2: 'It is switched off — edit it, then restore it to go live.' });
      appReplace({ pathname: adminRoutes.serviceEdit, params: { id: data.service.id } });
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not copy the service') });
    } finally {
      setBusy(null);
    }
  }

  /** Web: Enter in a single-line field saves. */
  const submitOnEnter = IS_WEB ? { onSubmitEditing: () => void save() } : {};

  if (id && loading) {
    return (
      <AdminListShell title="Edit Service" subtitle="Catalog item" backFallback={adminRoutes.services}>
        <AdminFormSkeleton cards={[5, 2, 3]} />
      </AdminListShell>
    );
  }

  if (id && error) {
    return (
      <AdminListShell title="Edit Service" subtitle="Error" backFallback={adminRoutes.services}>
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell
      title={id ? 'Edit Service' : 'New Service'}
      subtitle={id ? (active ? 'Live · customers can book it' : 'Switched off · hidden from customers') : 'Catalog item'}
      backFallback={adminRoutes.services}
      keyboardAvoid
      rightAction={id ? <HeaderActionButton icon={Copy} onPress={() => void duplicate()} accessibilityLabel="Duplicate service" /> : undefined}
      stickyFooter={
        <StickyActionBar row>
          {id ? (
            active ? (
              <Button
                title="Deactivate"
                variant="dangerOutline"
                onPress={remove}
                loading={busy === 'toggle'}
                disabled={Boolean(busy)}
                fullWidth={false}
                style={styles.footerSecondary}
              />
            ) : (
              <Button
                title="Restore"
                variant="outline"
                onPress={() => void restore()}
                loading={busy === 'toggle'}
                disabled={Boolean(busy)}
                fullWidth={false}
                style={styles.footerSecondary}
              />
            )
          ) : null}
          <Button
            title={uploading ? 'Uploading…' : 'Save'}
            variant="premium"
            onPress={save}
            loading={saving}
            disabled={saving || uploading}
            fullWidth={false}
            style={styles.footerPrimary}
          />
        </StickyActionBar>
      }
    >
      <ScrollView
        contentContainerStyle={adminListShellStyles.form}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <FadeSlideIn delay={stagger(0)} slideFrom={14}>
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
              {...submitOnEnter}
            />
            <Text style={styles.label}>Category</Text>
            <AdminFilterChips
              chips={categoryChips.map((c) => ({ key: c.key, label: c.label }))}
              selected={category}
              onSelect={(key) => setCategory(key)}
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
              {...submitOnEnter}
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
              {...submitOnEnter}
            />
          </AdminFormCard>
        </FadeSlideIn>
        <FadeSlideIn delay={stagger(1)} slideFrom={14}>
          <PremiumSectionHeader
            title="Visit steps"
            subtitle="The technician works through these in order and adds photos at each step. Changes apply to new bookings."
            style={styles.sectionHead}
          />
          <AdminFormCard style={styles.form}>
            <StepsEditor steps={steps} onChange={setSteps} />
          </AdminFormCard>
        </FadeSlideIn>
        <FadeSlideIn delay={stagger(2)} slideFrom={14}>
          <PremiumSectionHeader
            title="Sizes & pricing"
            subtitle="Customers pick one size and the booking is priced from it. Leave empty to use the base price."
            style={styles.sectionHead}
          />
          <AdminFormCard style={styles.form}>
            <IconInput label="Picker heading" value={optionsTitle} onChangeText={setOptionsTitle} placeholder="Size of home" />
            {options.map((o, i) => (
              <View key={o.key ?? `new-${i}`} style={styles.optionBlock}>
                <View style={styles.optionRow}>
                  <View style={styles.optionLabel}>
                    <IconInput
                      label="Size"
                      value={o.label}
                      placeholder="2 BHK"
                      maxLength={40}
                      onChangeText={(t) => setOptions((prev) => prev.map((p, j) => (j === i ? { ...p, label: t } : p)))}
                    />
                  </View>
                  <View style={styles.optionPrice}>
                    <IconInput
                      label="Price ₹"
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
                <IconInput
                  label="Note under the size (optional)"
                  value={o.note}
                  placeholder="e.g. Up to 1,000 sq ft · 2 bathrooms"
                  maxLength={80}
                  hint={o.note.length > 60 ? `${o.note.length}/80` : 'Customers see it on the size picker.'}
                  onChangeText={(t) => setOptions((prev) => prev.map((p, j) => (j === i ? { ...p, note: t } : p)))}
                />
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
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(3)} slideFrom={14}>
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
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(4)} slideFrom={14}>
          <PremiumSectionHeader
            title="Website photo"
            subtitle="Optional photo for this service on the website. Without one the pest artwork is used."
            style={styles.sectionHead}
          />
          <AdminFormCard style={styles.form}>
            <ImageField
              label="Cover photo"
              value={coverImage}
              onChange={onCoverImage}
              aspectRatio={4 / 3}
              onBusyChange={onBusyChange}
              altPlaceholder={name ? `${name} in progress` : 'e.g. Technician treating a kitchen'}
            />
            {errors.coverImage ? <Text style={styles.fieldError}>{errors.coverImage}</Text> : null}
          </AdminFormCard>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(5)} slideFrom={14}>
          <PremiumSectionHeader title="Pest control types" style={styles.sectionHead} />
          <AdminFormCard style={styles.form}>
            <PestTypePicker
              value={serviceTypes}
              onChange={(v) => {
                setServiceTypes(v);
                if (errors.serviceTypes) setErrors((e) => ({ ...e, serviceTypes: undefined }));
              }}
            />
            {errors.serviceTypes ? <Text style={styles.fieldError}>{errors.serviceTypes}</Text> : null}
          </AdminFormCard>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(6)} slideFrom={14}>
          <PremiumSectionHeader title="Icon" style={styles.sectionHead} />
          <AdminFormCard style={styles.form}>
            <ServiceIconPicker value={iconKey} onChange={setIconKey} />
          </AdminFormCard>
        </FadeSlideIn>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  footerSecondary: { flex: 1 },
  footerPrimary: { flex: 1.6 },
  sectionHead: { marginTop: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.xs },
  form: { marginBottom: spacing.md },
  optionBlock: {
    paddingBottom: spacing.xs,
    marginBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
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

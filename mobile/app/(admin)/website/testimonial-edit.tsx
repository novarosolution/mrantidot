import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminFormCard } from '@/components/kit/AdminPageKit';
import { AdminFormSkeleton } from '@/components/kit/AdminSkeletons';
import { IconInput } from '@/components/kit/IconInput';
import { ImageField, useBusyCounter } from '@/components/kit/ImageField';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { haptic, stagger } from '@/lib/motion';
import { paramString } from '@/lib/routeParams';
import { adminGoBack, adminRoutes } from '@/lib/routes';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { Testimonial, WebsiteImage } from '@/types/api';
import { adminType, colors, fonts, spacing, ui } from '@/constants/theme';
import { confirmAsync } from '@/lib/confirm';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function RatingInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.ratingWrap}>
      <Text style={styles.label}>Rating</Text>
      <View style={styles.ratingRow} accessibilityRole="adjustable" accessibilityValue={{ min: 1, max: 5, now: value }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= value;
          return (
            <Pressable
              key={n}
              onPress={() => {
                haptic('select');
                onChange(n);
              }}
              hitSlop={4}
              style={({ pressed }) => [styles.star, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}
              accessibilityState={{ selected: n === value }}
            >
              <Star size={30} color={on ? colors.amber : ui.border} fill={on ? colors.amber : 'transparent'} strokeWidth={1.8} />
            </Pressable>
          );
        })}
        <Text style={styles.ratingText}>{RATING_LABELS[value]}</Text>
      </View>
    </View>
  );
}

type Errors = Partial<Record<'name' | 'quote', string>>;

export default function WebsiteTestimonialEditScreen() {
  const id = paramString(useLocalSearchParams<{ id?: string | string[] }>().id);
  const [photo, setPhoto] = useState<WebsiteImage>({ url: '', alt: '' });
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(5);
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [uploading, onBusyChange] = useBusyCounter();
  const { loading, error, runLoad, reload } = useScreenLoad(!!id);

  // No single-item endpoint: load the admin list and pick this one.
  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get<{ testimonials: Testimonial[] }>('/website/admin/testimonials', {
      ...screenLoadConfig,
      skipCache: true,
    });
    const t = data.testimonials.find((x) => x.id === id);
    if (!t) throw new Error('This testimonial was deleted.');
    setPhoto(t.photo ?? { url: '', alt: '' });
    setName(t.name);
    setRole(t.role ?? '');
    setQuote(t.quote);
    setRating(Math.min(5, Math.max(1, Math.round(t.rating || 5))));
    setActive(t.active);
  }, [id]);

  useEffect(() => {
    if (id) void runLoad(load, 'Could not load this testimonial');
  }, [id, load, runLoad]);

  const onPhoto = useCallback((img: WebsiteImage) => setPhoto(img), []);

  async function save() {
    const next: Errors = {};
    if (!name.trim()) next.name = 'Name is required';
    if (!quote.trim()) next.quote = 'Write what they said';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      haptic('error');
      Toast.show({ type: 'error', text1: 'Fix the highlighted fields' });
      return;
    }
    const body = {
      name: name.trim(),
      role: role.trim(),
      quote: quote.trim(),
      rating,
      photo: { url: photo.url, alt: photo.alt.trim() || name.trim() },
      active,
    };
    setSaving(true);
    try {
      if (id) await api.patch(`/website/admin/testimonials/${id}`, body, { skipErrorToast: true });
      else await api.post('/website/admin/testimonials', body, { skipErrorToast: true });
      haptic('success');
      Toast.show({ type: 'success', text1: id ? 'Testimonial saved' : 'Testimonial added' });
      adminGoBack(adminRoutes.websiteTestimonials);
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not save the testimonial') });
    } finally {
      setSaving(false);
    }
  }

  function remove() {
    if (!id) return;
    void confirmAsync({
      title: 'Delete testimonial?',
      message: `The quote from ${name || 'this client'} will be removed from the website.`,
      confirmLabel: 'Delete',
      destructive: true,
    }).then(async (ok) => {
      if (!ok) return;
      try {
        await api.delete(`/website/admin/testimonials/${id}`, { skipErrorToast: true });
        haptic('success');
        Toast.show({ type: 'success', text1: 'Testimonial deleted' });
        adminGoBack(adminRoutes.websiteTestimonials);
      } catch (err) {
        haptic('error');
        Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not delete the testimonial') });
      }
    });
  }

  if (id && loading) {
    return (
      <AdminListShell title="Testimonial" subtitle="Client quote" backFallback={adminRoutes.websiteTestimonials}>
        <AdminFormSkeleton preview cards={[4]} />
      </AdminListShell>
    );
  }

  if (id && error) {
    return (
      <AdminListShell title="Testimonial" subtitle="Could not load" backFallback={adminRoutes.websiteTestimonials}>
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell
      title={id ? 'Edit testimonial' : 'New testimonial'}
      subtitle="Client quote on the website"
      backFallback={adminRoutes.websiteTestimonials}
      keyboardAvoid
      stickyFooter={
        <StickyActionBar row>
          {id ? (
            <Button title="Delete" variant="dangerOutline" onPress={remove} fullWidth={false} style={styles.footSecondary} />
          ) : null}
          <Button
            title={uploading ? 'Uploading…' : 'Save'}
            variant="premium"
            onPress={() => void save()}
            loading={saving}
            disabled={saving || uploading}
            fullWidth={false}
            style={styles.footPrimary}
          />
        </StickyActionBar>
      }
    >
      <ScrollView
        contentContainerStyle={adminListShellStyles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeSlideIn delay={stagger(0)} slideFrom={14}>
          <View style={styles.previewWrap}>
            <View style={styles.preview}>
              <Text style={styles.previewQuote} numberOfLines={5}>
                “{quote.trim() || 'What the client said appears here.'}”
              </Text>
              <Text style={styles.previewStars}>
                {'★'.repeat(rating)}
                <Text style={styles.previewStarsOff}>{'★'.repeat(5 - rating)}</Text>
              </Text>
              <Text style={styles.previewName} numberOfLines={1}>
                {name.trim() || 'Client name'}
                {role.trim() ? <Text style={styles.previewRole}> · {role.trim()}</Text> : null}
              </Text>
            </View>
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(1)} slideFrom={14}>
          <AdminFormCard>
            <Text style={styles.cardTitle}>Quote</Text>
            <Text style={styles.cardHint}>Who said it and what they said</Text>
            <IconInput
              label="Name"
              value={name}
              maxLength={80}
              onChangeText={(t) => {
                setName(t);
                if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
              }}
              error={errors.name}
            />
            <IconInput label="Role or company" value={role} maxLength={120} onChangeText={setRole} placeholder="e.g. Clinical Coordinator" />
            <IconInput
              label="Quote"
              value={quote}
              maxLength={1000}
              multiline
              onChangeText={(t) => {
                setQuote(t);
                if (errors.quote) setErrors((e) => ({ ...e, quote: undefined }));
              }}
              error={errors.quote}
              hint={`${quote.length}/1000`}
            />
            <RatingInput value={rating} onChange={setRating} />
          </AdminFormCard>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(2)} slideFrom={14}>
          <AdminFormCard>
            <ImageField
              label="Photo (optional)"
              hint="Without a photo the website shows their initials. Alt text defaults to their name."
              value={photo}
              onChange={onPhoto}
              aspectRatio={1}
              requireAlt={false}
              onBusyChange={onBusyChange}
              altPlaceholder={name || 'Client name'}
            />
            <View style={styles.toggleRow}>
              <View style={styles.flex}>
                <Text style={styles.toggleLabel}>Show on website</Text>
                <Text style={styles.toggleHint}>{active ? 'Visible in the reviews block' : 'Hidden from the website'}</Text>
              </View>
              <ToggleSwitch value={active} onToggle={() => setActive((v) => !v)} accessibilityLabel="Show on website" />
            </View>
          </AdminFormCard>
        </FadeSlideIn>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  footSecondary: { flex: 1 },
  footPrimary: { flex: 1.6 },
  previewWrap: { paddingHorizontal: spacing.md, marginTop: spacing.sm },
  preview: {
    padding: spacing.md,
    borderRadius: 22,
    backgroundColor: colors.forest,
    gap: 10,
  },
  previewQuote: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22, color: colors.white },
  previewStars: { fontSize: 16, color: colors.amber, letterSpacing: 2 },
  previewStarsOff: { color: 'rgba(255,255,255,0.25)' },
  previewName: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.white },
  previewRole: { fontFamily: fonts.body, color: 'rgba(255,255,255,0.75)' },
  cardTitle: { ...adminType.formTitle, fontSize: 16, color: ui.text },
  cardHint: { ...adminType.formSub, fontSize: 12, color: ui.textSecondary, marginBottom: spacing.md },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text, marginBottom: 8 },
  ratingWrap: { marginBottom: spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { padding: 2 },
  ratingText: { marginLeft: 8, fontFamily: fonts.bodySemi, fontSize: 13, color: ui.textSecondary },
  pressed: { opacity: 0.7, transform: [{ scale: 0.92 }] },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  toggleLabel: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: ui.text },
  toggleHint: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary, marginTop: 2 },
});

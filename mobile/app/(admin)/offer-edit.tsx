import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Copy } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { DatePickerField } from '@/components/admin/DatePickerField';
import { istTodayKey } from '@/components/admin/DateRangePicker';
import { OfferStatsCard } from '@/components/admin/OfferStatsCard';
import { HeaderActionButton } from '@/components/kit/HeaderActionButton';
import { AdminCollapsibleCard, AdminFilterChips, AdminFormCard } from '@/components/kit/AdminPageKit';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminFormSkeleton } from '@/components/kit/AdminSkeletons';
import { IconInput } from '@/components/kit/IconInput';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { localDateKey } from '@/lib/dates';
import { haptic, stagger } from '@/lib/motion';
import { paramString } from '@/lib/routeParams';
import { adminGoBack, adminRoutes, appPush, appReplace } from '@/lib/routes';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { IS_WEB } from '@/lib/webAdmin';
import type { OfferDiscountType } from '@/types/api';
import type { AdminOfferDetail, OfferRecentUse, OfferStats } from '@/types/adminManage';
import { colors, fonts, spacing } from '@/constants/theme';
import { confirmAsync } from '@/lib/confirm';

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDateKey(d);
}

export default function OfferEditScreen() {
  const id = paramString(useLocalSearchParams<{ id?: string | string[] }>().id);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('50');
  const [discountType, setDiscountType] = useState<OfferDiscountType>('fixed');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<null | 'toggle' | 'delete' | 'copy'>(null);
  const [errors, setErrors] = useState<Partial<Record<'code' | 'description' | 'discount', string>>>({});
  /** Saved state of the offer being edited (null for a new one). */
  const [active, setActive] = useState(true);
  const [savedCode, setSavedCode] = useState('');
  const [useCount, setUseCount] = useState(0);
  const [stats, setStats] = useState<OfferStats | null>(null);
  const [recent, setRecent] = useState<OfferRecentUse[]>([]);
  const { loading, error, runLoad, reload } = useScreenLoad(!!id);

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get<AdminOfferDetail>(`/admin/offers/${id}`, screenLoadConfig);
    const o = data.offer;
    setActive(o.active !== false);
    setSavedCode(o.code);
    setUseCount(o.useCount ?? 0);
    setStats(data.stats ?? null);
    setRecent(data.recent ?? []);
    setCode(o.code);
    setDiscount(String(o.discount));
    setDiscountType(o.discountType ?? 'fixed');
    setDescription(o.description);
    setExpiresAt(o.expiresAt ? o.expiresAt.slice(0, 10) : '');
    setMaxUses(o.maxUses != null ? String(o.maxUses) : '');
    setMinOrderAmount(o.minOrderAmount != null ? String(o.minOrderAmount) : '');
  }, [id]);

  useEffect(() => {
    if (id) void runLoad(load);
  }, [id, load, runLoad]);

  const previewDiscount = useMemo(() => {
    const amount = parseFloat(discount);
    if (Number.isNaN(amount) || amount <= 0) return 'Set discount';
    return discountType === 'percent' ? `${amount}% off` : `₹${amount} off`;
  }, [discount, discountType]);

  function buildBody() {
    const amount = parseFloat(discount);
    const body: Record<string, unknown> = {
      code: code.trim().toUpperCase(),
      discount: amount,
      discountType,
      description: description.trim(),
    };
    if (expiresAt.trim()) {
      const localEnd = new Date(`${expiresAt.trim()}T23:59:59`);
      body.expiresAt = Number.isNaN(localEnd.getTime())
        ? new Date(expiresAt.trim()).toISOString()
        : localEnd.toISOString();
    } else if (id) body.expiresAt = null;
    if (maxUses.trim()) body.maxUses = parseInt(maxUses, 10);
    else if (id) body.maxUses = null;
    if (minOrderAmount.trim()) body.minOrderAmount = parseFloat(minOrderAmount);
    else if (id) body.minOrderAmount = null;
    return body;
  }

  async function save() {
    const next: Partial<Record<'code' | 'description' | 'discount', string>> = {};
    if (!code.trim()) next.code = 'Required';
    if (!description.trim()) next.description = 'Required';
    const amount = parseFloat(discount);
    if (Number.isNaN(amount) || amount <= 0) next.discount = 'Enter a valid discount';
    else if (discountType === 'percent' && amount > 100) next.discount = 'Cannot exceed 100%';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      haptic('error');
      Toast.show({ type: 'error', text1: 'Fix the highlighted fields' });
      return;
    }
    setSaving(true);
    try {
      const body = buildBody();
      if (id) {
        await api.patch(`/admin/offers/${id}`, body);
      } else {
        await api.post('/admin/offers', { ...body, active: true });
      }
      haptic('success');
      Toast.show({ type: 'success', text1: 'Saved' });
      adminGoBack(adminRoutes.offers);
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not save offer') });
    } finally {
      setSaving(false);
    }
  }

  /** Bookings that carry the code (cancelled ones too) — used offers are kept for the records. */
  const timesOnBookings = Math.max(useCount, (stats?.uses ?? 0) + (stats?.cancelled ?? 0));
  const neverUsed = Boolean(id) && timesOnBookings === 0;

  async function toggleActive() {
    if (!id || busy) return;
    const next = !active;
    if (!next) {
      const ok = await confirmAsync({
        title: `Turn off ${savedCode}?`,
        message: 'Customers can’t apply it at checkout until you turn it back on. Bookings that already used it keep their discount.',
        confirmLabel: 'Turn off',
        cancelLabel: 'Keep on',
        destructive: true,
      });
      if (!ok) return;
    }
    setBusy('toggle');
    try {
      await api.patch(`/admin/offers/${id}`, { active: next }, { skipErrorToast: true });
      haptic('success');
      setActive(next);
      Toast.show({ type: 'success', text1: next ? `${savedCode} is on` : `${savedCode} is off` });
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not update the offer') });
    } finally {
      setBusy(null);
    }
  }

  async function deleteForGood() {
    if (!id || busy) return;
    const ok = await confirmAsync({
      title: `Delete ${savedCode}?`,
      message: 'It has never been used, so it is removed completely. This can’t be undone.',
      confirmLabel: 'Delete offer',
      cancelLabel: 'Keep',
      destructive: true,
    });
    if (!ok) return;
    setBusy('delete');
    try {
      await api.delete(`/admin/offers/${id}/permanent`, { skipErrorToast: true });
      haptic('success');
      Toast.show({ type: 'success', text1: `${savedCode} deleted` });
      adminGoBack(adminRoutes.offers);
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not delete the offer') });
      // Someone may have used it meanwhile — show the latest numbers.
      void load().catch(() => undefined);
    } finally {
      setBusy(null);
    }
  }

  async function duplicate() {
    if (!id || busy) return;
    setBusy('copy');
    try {
      const { data } = await api.post<{ offer: { id: string; code: string } }>(`/admin/offers/${id}/duplicate`, {}, { skipErrorToast: true });
      haptic('success');
      Toast.show({ type: 'success', text1: `Copied as ${data.offer.code}`, text2: 'It is switched off — check it, then turn it on.' });
      appReplace({ pathname: adminRoutes.offerEdit, params: { id: data.offer.id } });
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not copy the offer') });
    } finally {
      setBusy(null);
    }
  }

  /** Web: Enter in a single-line field saves. */
  const submitOnEnter = IS_WEB ? { onSubmitEditing: () => void save() } : {};

  if (id && loading) {
    return (
      <AdminListShell title="Edit offer" subtitle="Coupon code · discount · limits" backFallback={adminRoutes.offers}>
        <AdminFormSkeleton preview cards={[2, 2]} />
      </AdminListShell>
    );
  }

  if (id && error) {
    return (
      <AdminListShell title="Offer" subtitle="Could not load" backFallback={adminRoutes.offers}>
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  const expirySelected = !expiresAt
    ? 'none'
    : [7, 30, 90].find((d) => expiresAt === addDays(d))?.toString() ?? 'custom';
  const expired = Boolean(expiresAt) && expiresAt < istTodayKey();

  return (
    <AdminListShell
      title={id ? 'Edit offer' : 'New offer'}
      subtitle={id ? `${active ? 'On' : 'Off'} · ${timesOnBookings ? `used on ${timesOnBookings} booking${timesOnBookings === 1 ? '' : 's'}` : 'not used yet'}` : 'Coupon code · discount · limits'}
      backFallback={adminRoutes.offers}
      keyboardAvoid
      rightAction={id ? <HeaderActionButton icon={Copy} onPress={() => void duplicate()} accessibilityLabel="Duplicate offer" /> : undefined}
      stickyFooter={
        <StickyActionBar row>
          {id && neverUsed ? (
            <Button
              title="Delete"
              variant="dangerOutline"
              onPress={() => void deleteForGood()}
              loading={busy === 'delete'}
              disabled={Boolean(busy) && busy !== 'delete'}
              fullWidth={false}
              style={styles.footerSecondary}
            />
          ) : null}
          {id ? (
            <Button
              title={active ? 'Turn off' : 'Turn on'}
              variant={active ? 'dangerOutline' : 'outline'}
              onPress={() => void toggleActive()}
              loading={busy === 'toggle'}
              disabled={Boolean(busy) && busy !== 'toggle'}
              fullWidth={false}
              style={styles.footerSecondary}
            />
          ) : null}
          <Button title="Save offer" variant="premium" onPress={() => void save()} loading={saving} fullWidth={false} style={styles.footerPrimary} />
        </StickyActionBar>
      }
    >
      <ScrollView
        contentContainerStyle={adminListShellStyles.form}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <FadeSlideIn delay={stagger(0)} slideFrom={14}>
          <View style={styles.previewWrap}>
            <LinearGradient
              colors={[colors.headerGreen, colors.forest, colors.forestDeep]}
              style={styles.preview}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <LinearGradient colors={[colors.limeBright, colors.green]} style={styles.previewAccent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Text style={styles.previewEyebrow}>CHECKOUT PREVIEW</Text>
              <Text style={styles.previewCode} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                {code.trim() ? code.trim().toUpperCase() : 'CODE'}
              </Text>
              <Text style={styles.previewDiscount} numberOfLines={1}>
                {previewDiscount}
              </Text>
              <Text style={styles.previewDesc} numberOfLines={2}>
                {description.trim() || 'Short description customers will see'}
              </Text>
            </LinearGradient>
          </View>
        </FadeSlideIn>

        {id && stats ? (
          <FadeSlideIn delay={stagger(1)} slideFrom={14}>
            <OfferStatsCard
              stats={stats}
              recent={recent}
              maxUses={maxUses.trim() ? parseInt(maxUses, 10) || undefined : undefined}
              onOpenBooking={(bookingId) => appPush(adminRoutes.booking(bookingId))}
              // The bookings search matches coupon codes, so this lists every booking that used this one.
              onViewAll={code.trim() ? () => appPush(adminRoutes.bookingsFiltered({ q: code.trim() })) : undefined}
            />
            <Text style={styles.statsNote}>
              {neverUsed
                ? 'Never used — you can delete it for good, or turn it off.'
                : `Used on ${timesOnBookings} booking${timesOnBookings === 1 ? '' : 's'}, so it stays for your records — turn it off to stop new uses.`}
            </Text>
          </FadeSlideIn>
        ) : null}

        <FadeSlideIn delay={stagger(1)} slideFrom={14}>
          <AdminFormCard>
            <Text style={styles.sectionTitle}>Basics</Text>
            <Text style={styles.sectionHint}>Code and message shown at checkout</Text>
            <IconInput
              label="Coupon code"
              value={code}
              onChangeText={(t) => {
                setCode(t);
                if (errors.code) setErrors((e) => ({ ...e, code: undefined }));
              }}
              autoCapitalize="characters"
              error={errors.code}
              {...submitOnEnter}
            />
            <IconInput
              label="Description"
              value={description}
              onChangeText={(t) => {
                setDescription(t);
                if (errors.description) setErrors((e) => ({ ...e, description: undefined }));
              }}
              placeholder="e.g. Flat ₹50 off first booking"
              error={errors.description}
              {...submitOnEnter}
            />
          </AdminFormCard>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(2)} slideFrom={14}>
          <AdminFormCard>
            <Text style={styles.sectionTitle}>Discount</Text>
            <Text style={styles.sectionHint}>Choose fixed amount or percent off</Text>
            <Text style={styles.label}>Type</Text>
            <AdminFilterChips
              chips={[
                { key: 'fixed', label: 'Fixed ₹' },
                { key: 'percent', label: 'Percent %' },
              ]}
              selected={discountType}
              onSelect={(key) => setDiscountType(key as OfferDiscountType)}
            />
            <IconInput
              label={discountType === 'percent' ? 'Discount (%)' : 'Discount (₹)'}
              value={discount}
              onChangeText={(t) => {
                setDiscount(t);
                if (errors.discount) setErrors((e) => ({ ...e, discount: undefined }));
              }}
              keyboardType="numeric"
              error={errors.discount}
              {...submitOnEnter}
            />
          </AdminFormCard>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(3)} slideFrom={14}>
          <AdminCollapsibleCard
            title="Limits & expiry"
            subtitle="Optional rules for usage and validity"
            defaultOpen={Boolean(expiresAt || maxUses || minOrderAmount)}
          >
            <Text style={styles.label}>Quick expiry</Text>
            <AdminFilterChips
              chips={[
                { key: 'none', label: 'No expiry' },
                ...[7, 30, 90].map((d) => ({ key: String(d), label: `+${d}d` })),
              ]}
              selected={expirySelected === 'custom' ? '' : expirySelected}
              onSelect={(key) => {
                if (key === 'none') setExpiresAt('');
                else setExpiresAt(addDays(Number(key)));
              }}
            />
            <DatePickerField
              label="Expiry date"
              value={expiresAt}
              onChange={setExpiresAt}
              placeholder="No expiry"
              min={istTodayKey()}
              sheetTitle="Valid until"
              hint={
                expired
                  ? 'This date has passed — customers can’t use the code. Pick a new date to bring it back.'
                  : 'Customers can use the code until the end of this day.'
              }
            />
            <IconInput
              label="Max uses"
              value={maxUses}
              onChangeText={setMaxUses}
              keyboardType="number-pad"
              placeholder="Unlimited if empty"
              {...submitOnEnter}
            />
            <IconInput
              label="Min order ₹"
              value={minOrderAmount}
              onChangeText={setMinOrderAmount}
              keyboardType="numeric"
              placeholder="No minimum if empty"
              {...submitOnEnter}
            />
          </AdminCollapsibleCard>
        </FadeSlideIn>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  footerSecondary: { flex: 1 },
  footerPrimary: { flex: 1.6 },
  statsNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    marginHorizontal: spacing.md + 4,
    marginTop: spacing.sm,
  },
  previewWrap: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  preview: {
    borderRadius: 22,
    padding: spacing.md,
    paddingTop: spacing.md + 6,
    overflow: 'hidden',
    minHeight: 128,
  },
  previewAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  previewEyebrow: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 8,
  },
  previewCode: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    letterSpacing: 1,
    color: colors.white,
  },
  previewDiscount: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.limeBright,
    marginTop: 4,
  },
  previewDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 16,
    color: colors.ink,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  sectionHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.muted,
    marginBottom: 8,
    marginTop: spacing.sm,
  },
});

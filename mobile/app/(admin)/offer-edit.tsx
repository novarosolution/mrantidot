import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminCollapsibleCard, AdminFilterChips, AdminFormCard } from '@/components/kit/AdminPageKit';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { IconInput } from '@/components/kit/IconInput';
import { Button } from '@/components/ui/Button';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { localDateKey } from '@/lib/dates';
import { paramString } from '@/lib/routeParams';
import { adminGoBack, adminRoutes } from '@/lib/routes';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { OfferDiscountType } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

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
  const { loading, error, runLoad, reload } = useScreenLoad(!!id);

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get<{
      offer: {
        id: string;
        code: string;
        discount: number;
        discountType?: OfferDiscountType;
        description: string;
        expiresAt?: string;
        maxUses?: number;
        minOrderAmount?: number;
      };
    }>(`/admin/offers/${id}`, screenLoadConfig);
    const o = data.offer;
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
    if (!code.trim() || !description.trim()) {
      Toast.show({ type: 'error', text1: 'Code and description are required' });
      return;
    }
    const amount = parseFloat(discount);
    if (Number.isNaN(amount) || amount <= 0) {
      Toast.show({ type: 'error', text1: 'Enter a valid discount' });
      return;
    }
    if (discountType === 'percent' && amount > 100) {
      Toast.show({ type: 'error', text1: 'Percent discount cannot exceed 100' });
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
      Toast.show({ type: 'success', text1: 'Saved' });
      adminGoBack(adminRoutes.offers);
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not save offer') });
    } finally {
      setSaving(false);
    }
  }

  function deactivate() {
    if (!id) return;
    Alert.alert('Deactivate offer?', 'Customers will no longer see this coupon at checkout.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await api.delete(`/admin/offers/${id}`);
              Toast.show({ type: 'success', text1: 'Offer deactivated' });
              adminGoBack(adminRoutes.offers);
            } catch (err) {
              Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not deactivate offer') });
            }
          })();
        },
      },
    ]);
  }

  if (id && loading) return <Spinner fullScreen />;

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

  return (
    <AdminListShell
      title={id ? 'Edit offer' : 'New offer'}
      subtitle="Coupon code · discount · limits"
      backFallback={adminRoutes.offers}
      keyboardAvoid
      stickyFooter={
        <StickyActionBar>
          <Button title="Save offer" variant="premium" onPress={() => void save()} loading={saving} />
          {id ? (
            <Button title="Deactivate" variant="danger" onPress={deactivate} style={{ marginTop: spacing.sm }} />
          ) : null}
        </StickyActionBar>
      }
    >
      <ScrollView
        contentContainerStyle={id ? adminListShellStyles.scrollWithFooterTall : adminListShellStyles.scrollWithFooter}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewWrap}>
          <LinearGradient
            colors={['#1B873E', '#0A6423', '#043813']}
            style={styles.preview}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <LinearGradient colors={['#8FD03C', '#27A747']} style={styles.previewAccent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Text style={styles.previewEyebrow}>CHECKOUT PREVIEW</Text>
            <Text style={styles.previewCode}>{code.trim() ? code.trim().toUpperCase() : 'CODE'}</Text>
            <Text style={styles.previewDiscount}>{previewDiscount}</Text>
            <Text style={styles.previewDesc} numberOfLines={2}>
              {description.trim() || 'Short description customers will see'}
            </Text>
          </LinearGradient>
        </View>

        <AdminFormCard>
          <Text style={styles.sectionTitle}>Basics</Text>
          <Text style={styles.sectionHint}>Code and message shown at checkout</Text>
          <IconInput label="Coupon code" value={code} onChangeText={setCode} autoCapitalize="characters" />
          <IconInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Flat ₹50 off first booking"
          />
        </AdminFormCard>

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
            onChangeText={setDiscount}
            keyboardType="numeric"
          />
        </AdminFormCard>

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
          <IconInput
            label="Expires (YYYY-MM-DD)"
            value={expiresAt}
            onChangeText={setExpiresAt}
            placeholder="2026-12-31"
          />
          <IconInput
            label="Max uses"
            value={maxUses}
            onChangeText={setMaxUses}
            keyboardType="number-pad"
            placeholder="Unlimited if empty"
          />
          <IconInput
            label="Min order ₹"
            value={minOrderAmount}
            onChangeText={setMinOrderAmount}
            keyboardType="numeric"
            placeholder="No minimum if empty"
          />
        </AdminCollapsibleCard>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
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
    color: '#8FD03C',
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
    color: '#0B2213',
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

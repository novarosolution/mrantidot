import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { paramString } from '@/lib/routeParams';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminListShell } from '@/components/kit/AdminListShell';
import { IconInput } from '@/components/kit/IconInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { OfferDiscountType } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

import { localDateKey } from '@/lib/dates';

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
  const { loading, error, runLoad } = useScreenLoad(!id);

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

  function buildBody() {
    const amount = parseFloat(discount);
    const body: Record<string, unknown> = {
      code: code.trim().toUpperCase(),
      discount: amount,
      discountType,
      description: description.trim(),
    };
    if (expiresAt.trim()) body.expiresAt = new Date(expiresAt.trim()).toISOString();
    else if (id) body.expiresAt = null;
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
      router.back();
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not save offer') });
    } finally {
      setSaving(false);
    }
  }

  function deactivate() {
    if (!id) return;
    Alert.alert('Deactivate offer?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: async () => {
          await api.delete(`/admin/offers/${id}`);
          Toast.show({ type: 'success', text1: 'Offer deactivated' });
          router.back();
        },
      },
    ]);
  }

  if (id && loading) return <Spinner fullScreen />;

  if (id && error) {
    return (
      <AdminListShell title="Offer" subtitle="Error">
        <ListEmptyRetry message={error} onRetry={() => void runLoad(load)} />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell title={id ? 'Edit Offer' : 'New Offer'} subtitle="Coupon rules">
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Card variant="premium" style={styles.form}>
          <IconInput label="Code" value={code} onChangeText={setCode} autoCapitalize="characters" />
          <Text style={styles.label}>Discount type</Text>
          <View style={styles.chips}>
            <Chip label="Fixed ₹" selected={discountType === 'fixed'} onPress={() => setDiscountType('fixed')} />
            <Chip label="Percent %" selected={discountType === 'percent'} onPress={() => setDiscountType('percent')} />
          </View>
          <IconInput
            label={discountType === 'percent' ? 'Discount (%)' : 'Discount (₹)'}
            value={discount}
            onChangeText={setDiscount}
            keyboardType="numeric"
          />
          <IconInput label="Description" value={description} onChangeText={setDescription} />
          <Text style={styles.label}>Expiry</Text>
          <View style={styles.chips}>
            <Chip label="No expiry" selected={!expiresAt} onPress={() => setExpiresAt('')} />
            {[7, 30, 90].map((d) => (
              <Chip key={d} label={`+${d}d`} selected={expiresAt === addDays(d)} onPress={() => setExpiresAt(addDays(d))} />
            ))}
          </View>
          <IconInput
            label="Expires (YYYY-MM-DD, optional)"
            value={expiresAt}
            onChangeText={setExpiresAt}
            placeholder="2026-12-31"
          />
          <IconInput
            label="Max uses (optional)"
            value={maxUses}
            onChangeText={setMaxUses}
            keyboardType="number-pad"
          />
          <IconInput
            label="Min order ₹ (optional)"
            value={minOrderAmount}
            onChangeText={setMinOrderAmount}
            keyboardType="numeric"
          />
        </Card>
      </ScrollView>
      <StickyActionBar>
        <Button title="Save" variant="premium" onPress={save} loading={saving} />
        {id ? <Button title="Deactivate" variant="danger" onPress={deactivate} style={{ marginTop: spacing.sm }} /> : null}
      </StickyActionBar>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: 120 },
  form: { padding: spacing.md },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, marginBottom: 8 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
});

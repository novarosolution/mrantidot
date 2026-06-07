import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { IconInput } from '@/components/kit/IconInput';
import { ServiceIconPicker } from '@/components/kit/ServiceIconPicker';
import { ServiceTypePicker } from '@/components/kit/ServiceTypePicker';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, screenLoadConfig } from '@/lib/api';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { ServiceCategory, ServiceTypeKey } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

const CATEGORIES: { key: ServiceCategory; label: string }[] = [
  { key: 'residential', label: 'Residential' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'cleaning', label: 'Cleaning' },
  { key: 'general', label: 'General' },
];

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
  const [saving, setSaving] = useState(false);
  const { loading, error, runLoad, reload } = useScreenLoad(!!id);

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get<{
      service: {
        name: string;
        iconKey: string;
        basePrice: number;
        shortDesc: string;
        stepTemplate?: string[];
        category?: ServiceCategory;
        rating?: number;
        serviceTypes?: ServiceTypeKey[];
      };
    }>(`/services/${id}`, screenLoadConfig);
    const s = data.service;
    setName(s.name);
    setIconKey(s.iconKey);
    setCategory(s.category ?? 'general');
    setServiceTypes(s.serviceTypes ?? []);
    setBasePrice(String(s.basePrice));
    setShortDesc(s.shortDesc);
    setRating(String(s.rating ?? 4.8));
    setSteps((s.stepTemplate ?? []).join(','));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void runLoad(load);
  }, [id, load, runLoad]);

  async function save() {
    if (!name.trim() || !shortDesc.trim()) {
      Toast.show({ type: 'error', text1: 'Name and description are required' });
      return;
    }
    if (serviceTypes.length === 0) {
      Toast.show({ type: 'error', text1: 'Select at least one pest type' });
      return;
    }
    const price = parseFloat(basePrice);
    if (Number.isNaN(price) || price <= 0) {
      Toast.show({ type: 'error', text1: 'Enter a valid base price' });
      return;
    }
    const ratingNum = parseFloat(rating);
    if (Number.isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      Toast.show({ type: 'error', text1: 'Rating must be between 0 and 5' });
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
      };
      if (id) {
        await api.patch(`/services/${id}`, body);
      } else {
        await api.post('/services', body);
      }
      Toast.show({ type: 'success', text1: 'Saved' });
      router.back();
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
              router.back();
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
      keyboardAvoid
      stickyFooter={
        <StickyActionBar>
          <Button title="Save" variant="premium" onPress={save} loading={saving} />
          {id ? <Button title="Deactivate" variant="danger" onPress={remove} style={{ marginTop: spacing.sm }} /> : null}
        </StickyActionBar>
      }
    >
      <ScrollView
        contentContainerStyle={id ? adminListShellStyles.scrollWithFooterTall : adminListShellStyles.scrollWithFooter}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <PremiumSectionHeader title="Icon" style={styles.sectionHead} />
        <Card variant="premium" style={styles.form}>
          <ServiceIconPicker value={iconKey} onChange={setIconKey} />
        </Card>

        <PremiumSectionHeader title="Pest control types" style={styles.sectionHead} />
        <Card variant="premium" style={styles.form}>
          <ServiceTypePicker value={serviceTypes} onChange={setServiceTypes} />
        </Card>

        <PremiumSectionHeader title="Details" style={styles.sectionHead} />
        <Card variant="premium" style={styles.form}>
          <IconInput label="Name" value={name} onChangeText={setName} />
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <Chip key={c.key} label={c.label} selected={category === c.key} onPress={() => setCategory(c.key)} />
            ))}
          </View>
          <IconInput label="Base price" value={basePrice} onChangeText={setBasePrice} keyboardType="numeric" />
          <IconInput label="Rating (0–5)" value={rating} onChangeText={setRating} keyboardType="decimal-pad" />
          <IconInput label="Short description" value={shortDesc} onChangeText={setShortDesc} />
          <IconInput label="Steps (comma-separated)" value={steps} onChangeText={setSteps} />
        </Card>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  sectionHead: { marginTop: 0, paddingHorizontal: 0, marginBottom: spacing.xs },
  form: { padding: spacing.md, marginBottom: spacing.md },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, marginTop: spacing.sm, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
});

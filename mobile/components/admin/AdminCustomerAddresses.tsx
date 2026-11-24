import { MapPin, Pencil, Plus, Star, Trash2, TriangleAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminFilterChips } from '@/components/kit/AdminPageKit';
import { IconInput } from '@/components/kit/IconInput';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { Button } from '@/components/ui/Button';
import { SheetModal } from '@/components/ui/SheetModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, fonts, spacing, typeScale, ui } from '@/constants/theme';
import { api, getApiErrorMessage } from '@/lib/api';
import { useBusinessSettings } from '@/lib/businessSettings';
import { confirmAsync } from '@/lib/confirm';
import { haptic } from '@/lib/motion';
import { IS_WEB } from '@/lib/webAdmin';
import type { BusinessSettings } from '@/types/api';
import type { AddressInput, AdminSavedAddress } from '@/types/adminManage';

const LABELS = ['Home', 'Office', 'Other'] as const;

type Draft = { label: string; line1: string; city: string; pincode: string; isDefault: boolean };
const EMPTY: Draft = { label: 'Home', line1: '', city: '', pincode: '', isDefault: false };

const words = (x: string) =>
  x
    .toLowerCase()
    .replace(/(\d{3})\s+(\d{3})/g, '$1$2')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Same idea as the server's service-area check (Business settings → Service area). */
function inServiceArea(s: BusinessSettings, d: Pick<Draft, 'city' | 'pincode' | 'line1'>): boolean {
  const { mode, cities, pincodes } = s.serviceArea;
  if (mode !== 'listed' || (cities.length === 0 && pincodes.length === 0)) return true;
  const pin = d.pincode.replace(/\D/g, '');
  const text = ` ${words(`${d.city} ${d.line1}`)} `;
  if (pin.length === 6 && pincodes.includes(pin)) return true;
  if (pincodes.some((p) => text.includes(` ${p} `))) return true;
  return cities.some((c) => {
    const name = words(c);
    return Boolean(name) && (name === words(d.city) || text.includes(` ${name} `));
  });
}

/**
 * A customer's saved addresses, managed on their behalf: add, edit, make default, delete (with confirm).
 * Addresses outside the service area are flagged — bookings there are refused.
 * Server: /admin/customers/:id/addresses (GET, POST, PATCH /:addressId, DELETE /:addressId) → { addresses }.
 */
export function AdminCustomerAddresses({
  customerId,
  customerName,
  addresses,
  onChange,
}: {
  customerId: string;
  customerName: string;
  /** null while loading. */
  addresses: AdminSavedAddress[] | null;
  onChange: (next: AdminSavedAddress[]) => void;
}) {
  const settings = useBusinessSettings();
  const [sheet, setSheet] = useState<{ open: boolean; editing: AdminSavedAddress | null }>({ open: false, editing: null });
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<'label' | 'line1' | 'city' | 'pincode', string>>>({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const editing = sheet.editing;
  const count = addresses?.length ?? 0;

  useEffect(() => {
    if (!sheet.open) return;
    const a = sheet.editing;
    setDraft(
      a
        ? { label: a.label || 'Home', line1: a.line1, city: a.city, pincode: a.pincode ?? '', isDefault: a.isDefault }
        : { ...EMPTY, isDefault: count === 0 },
    );
    setErrors({});
    // Reset when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.open]);

  const patch = (p: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...p }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(p)) delete next[k as keyof typeof next];
      return next;
    });
  };

  async function save() {
    if (saving) return;
    const next: typeof errors = {};
    if (!draft.label.trim()) next.label = 'Add a label';
    if (!draft.line1.trim()) next.line1 = 'Enter the house / street';
    if (!draft.city.trim()) next.city = 'Enter the city';
    if (draft.pincode.trim() && !/^\d{6}$/.test(draft.pincode.trim())) next.pincode = 'Pincode must be 6 digits';
    setErrors(next);
    if (Object.keys(next).length) {
      haptic('error');
      return;
    }
    const body: AddressInput = {
      label: draft.label.trim(),
      line1: draft.line1.trim(),
      city: draft.city.trim(),
      pincode: draft.pincode.trim(),
      ...(draft.isDefault ? { isDefault: true } : {}),
    };
    setSaving(true);
    try {
      const { data } = editing
        ? await api.patch<{ addresses: AdminSavedAddress[] }>(`/admin/customers/${customerId}/addresses/${editing.id}`, body, {
            skipErrorToast: true,
          })
        : await api.post<{ addresses: AdminSavedAddress[] }>(`/admin/customers/${customerId}/addresses`, body, { skipErrorToast: true });
      haptic('success');
      onChange(data.addresses);
      Toast.show({ type: 'success', text1: editing ? 'Address updated' : 'Address added', text2: customerName });
      setSheet({ open: false, editing: null });
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not save the address') });
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault(a: AdminSavedAddress) {
    setBusyId(a.id);
    try {
      const { data } = await api.patch<{ addresses: AdminSavedAddress[] }>(
        `/admin/customers/${customerId}/addresses/${a.id}`,
        { isDefault: true },
        { skipErrorToast: true },
      );
      haptic('success');
      onChange(data.addresses);
      Toast.show({ type: 'success', text1: `${a.label} is now the default address` });
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not change the default') });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(a: AdminSavedAddress) {
    const ok = await confirmAsync({
      title: `Delete the ${a.label} address?`,
      message: `${[a.line1, a.city, a.pincode].filter(Boolean).join(', ')}\n\n${customerName} won't see it in the app any more. Past bookings keep their address.${
        a.isDefault && count > 1 ? ' Their newest other address becomes the default.' : ''
      }`,
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      destructive: true,
    });
    if (!ok) return;
    setBusyId(a.id);
    try {
      const { data } = await api.delete<{ addresses: AdminSavedAddress[] }>(`/admin/customers/${customerId}/addresses/${a.id}`, {
        skipErrorToast: true,
      });
      haptic('success');
      onChange(data.addresses);
      Toast.show({ type: 'success', text1: 'Address deleted' });
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not delete the address') });
    } finally {
      setBusyId(null);
    }
  }

  const submitOnEnter = IS_WEB ? { onSubmitEditing: () => void save() } : {};
  const outside = (draft.line1.trim() || draft.city.trim()) && !inServiceArea(settings, draft);
  const labelChip = (LABELS as readonly string[]).includes(draft.label) ? draft.label : 'Other';

  return (
    <View style={styles.block}>
      <View style={styles.head}>
        <Text style={styles.title}>Saved addresses</Text>
        <Pressable
          onPress={() => setSheet({ open: true, editing: null })}
          hitSlop={6}
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Add an address for ${customerName}`}
        >
          <Plus size={14} color={ui.brand} strokeWidth={2.6} />
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>

      {addresses === null ? (
        <View style={styles.skeletons} accessibilityRole="progressbar" accessibilityLabel="Loading addresses">
          {[0, 1].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={15} height={15} radius={8} />
              <View style={styles.flex}>
                <Skeleton width="30%" height={12} />
                <Skeleton width="85%" height={11} style={styles.skelGap} />
              </View>
            </View>
          ))}
        </View>
      ) : addresses.length === 0 ? (
        <Text style={styles.empty}>No saved addresses yet. Add one to book visits faster.</Text>
      ) : (
        addresses.map((a) => (
          <View key={a.id} style={styles.row}>
            <MapPin size={15} color={colors.forest} strokeWidth={2.2} style={styles.pin} />
            <View style={styles.flex}>
              <View style={styles.labelRow}>
                <Text style={styles.label} numberOfLines={1}>
                  {a.label || 'Address'}
                </Text>
                {a.isDefault ? <Text style={styles.defaultTag}>Default</Text> : null}
                {a.inServiceArea === false ? (
                  <View style={styles.outsideTag}>
                    <TriangleAlert size={11} color={colors.amberInk} strokeWidth={2.6} />
                    <Text style={styles.outsideText}>Outside service area</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.line} selectable>
                {[a.line1, a.city, a.pincode].filter(Boolean).join(', ')}
              </Text>
              <View style={styles.actions}>
                {!a.isDefault ? (
                  <Pressable
                    onPress={() => void makeDefault(a)}
                    disabled={busyId === a.id}
                    hitSlop={6}
                    style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Make ${a.label} the default address`}
                  >
                    <Star size={13} color={ui.brand} strokeWidth={2.4} />
                    <Text style={styles.actionText}>Make default</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => setSheet({ open: true, editing: a })}
                  disabled={busyId === a.id}
                  hitSlop={6}
                  style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit the ${a.label} address`}
                >
                  <Pencil size={13} color={ui.brand} strokeWidth={2.4} />
                  <Text style={styles.actionText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => void remove(a)}
                  disabled={busyId === a.id}
                  hitSlop={6}
                  style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete the ${a.label} address`}
                >
                  <Trash2 size={13} color={colors.error} strokeWidth={2.4} />
                  <Text style={[styles.actionText, styles.danger]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))
      )}

      <SheetModal
        visible={sheet.open}
        onClose={() => (saving ? undefined : setSheet({ open: false, editing: null }))}
        dialogWidth={500}
        keyboardAvoiding
        header={
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{editing ? 'Edit address' : 'Add address'}</Text>
            <Text style={styles.sheetSub}>For {customerName} · they see it in their app</Text>
          </View>
        }
      >
        <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>Label</Text>
          <AdminFilterChips
            chips={LABELS.map((l) => ({ key: l, label: l }))}
            selected={labelChip}
            onSelect={(k) => patch({ label: k === 'Other' && labelChip === 'Other' ? draft.label : k })}
          />
          {labelChip === 'Other' ? (
            <IconInput
              label="Label name"
              value={draft.label === 'Other' ? '' : draft.label}
              onChangeText={(t) => patch({ label: t.slice(0, 30) || 'Other' })}
              placeholder="e.g. Shop, Parents' home"
              error={errors.label}
              {...submitOnEnter}
            />
          ) : null}
          <IconInput
            label="House / flat, street"
            value={draft.line1}
            onChangeText={(t) => patch({ line1: t.slice(0, 300) })}
            placeholder="e.g. A-302, Shanti Residency, SG Highway"
            error={errors.line1}
            {...submitOnEnter}
          />
          <IconInput
            label="City"
            value={draft.city}
            onChangeText={(t) => patch({ city: t.slice(0, 60) })}
            placeholder="e.g. Ahmedabad"
            error={errors.city}
            {...submitOnEnter}
          />
          {settings.serviceArea.mode === 'listed' && settings.serviceArea.cities.length ? (
            <View style={styles.cityChips}>
              <AdminFilterChips
                chips={settings.serviceArea.cities.map((c) => ({ key: c, label: c }))}
                selected={settings.serviceArea.cities.find((c) => c.toLowerCase() === draft.city.trim().toLowerCase()) ?? ''}
                onSelect={(c) => patch({ city: c })}
              />
            </View>
          ) : null}
          <IconInput
            label="Pincode (optional)"
            value={draft.pincode}
            onChangeText={(t) => patch({ pincode: t.replace(/\D/g, '').slice(0, 6) })}
            keyboardType="number-pad"
            placeholder="6 digits"
            error={errors.pincode}
            {...submitOnEnter}
          />
          {outside ? (
            <View style={styles.warn}>
              <TriangleAlert size={15} color={colors.amberInk} strokeWidth={2.4} />
              <Text style={styles.warnText}>Outside your service area — bookings to this address will be refused.</Text>
            </View>
          ) : null}
          {editing?.isDefault || (!editing && count === 0) ? (
            <Text style={styles.note}>{editing ? 'This is the default address.' : 'The first address becomes the default.'}</Text>
          ) : (
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Make this the default address</Text>
              <ToggleSwitch value={draft.isDefault} onToggle={() => patch({ isDefault: !draft.isDefault })} accessibilityLabel="Default address" />
            </View>
          )}
          <View style={styles.sheetActions}>
            <Button
              title="Cancel"
              variant="outline"
              size="md"
              fullWidth={false}
              style={styles.sheetBtn}
              disabled={saving}
              onPress={() => setSheet({ open: false, editing: null })}
            />
            <Button
              title={editing ? 'Save address' : 'Add address'}
              variant="premium"
              size="md"
              fullWidth={false}
              style={styles.sheetBtn}
              loading={saving}
              onPress={() => void save()}
            />
          </View>
        </ScrollView>
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textSecondary },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: ui.brandSoft,
  },
  addText: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.brand },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  skeletons: { gap: 12, paddingVertical: 6 },
  skeletonRow: { flexDirection: 'row', gap: 8 },
  skelGap: { marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 8 },
  pin: { marginTop: 2 },
  flex: { flex: 1, minWidth: 0 },
  labelRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  defaultTag: {
    fontFamily: fonts.bodySemi,
    fontSize: 10.5,
    color: colors.forest,
    backgroundColor: ui.brandSoft,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  outsideTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999, backgroundColor: colors.amberBg },
  outsideText: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.amberInk },
  line: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.muted, marginTop: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 6 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  actionText: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.brand },
  danger: { color: colors.error },
  pressed: { opacity: 0.6 },
  sheetHead: { paddingHorizontal: spacing.md + 4, paddingTop: 4, paddingBottom: 4 },
  sheetTitle: { ...typeScale.section, fontSize: 19, lineHeight: 25, color: ui.text },
  sheetSub: { ...typeScale.caption, marginTop: 4, color: ui.textSecondary },
  sheetScroll: { maxHeight: 600 },
  sheetBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, paddingTop: spacing.sm },
  fieldLabel: { ...typeScale.captionStrong, color: ui.text, marginBottom: 6 },
  cityChips: { marginTop: -spacing.xs, marginBottom: spacing.sm },
  warn: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.amberBg,
    marginBottom: spacing.sm,
  },
  warnText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12.5, lineHeight: 17, color: colors.amberInk },
  note: { ...typeScale.caption, color: ui.textSecondary, marginTop: spacing.xs },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: spacing.xs },
  toggleLabel: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text },
  sheetActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  sheetBtn: { minWidth: 120 },
});

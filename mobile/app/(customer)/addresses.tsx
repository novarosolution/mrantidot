import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { fillCopy } from '@/constants/customerUiCopy';
import { haptic, stagger } from '@/lib/motion';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListRowsSkeleton } from '@/components/kit/ScreenSkeletons';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Building2, House, MapPinned, type LucideIcon } from 'lucide-react-native';
import { ListAddRow, ListFootnote, ListGroup, ListGroupRow, ListSectionTitle } from '@/components/kit/ListGroup';
import Toast from 'react-native-toast-message';
import { AdminActionSheet, type ActionSheetOption } from '@/components/kit/AdminActionSheet';
import {
  AddressDetailsForm,
  EMPTY_ADDRESS_FORM,
  addressFormValid,
  composeStreetLine,
  type AddressFormValues,
  type AddressSaveAs,
} from '@/components/kit/AddressDetailsForm';
import { AddressLocateButton } from '@/components/kit/AddressLocateButton';
import { CustomerListShell, listShellStyles } from '@/components/kit/CustomerListShell';
import { TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenState } from '@/components/ui/ScreenState';
import { api, screenLoadConfig } from '@/lib/api';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { useLocation } from '@/context/LocationContext';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { CustomerUiCopy, SavedAddress } from '@/types/api';
import { spacing, ui as themeUi } from '@/constants/theme';

/**
 * Saved addresses only keep one street line ("Flat/House A-1, MG Road, Landmark: Park"). Split it back
 * into the form's fields for editing; anything unrecognised stays in the street field.
 */
function formFromAddress(a: SavedAddress, copy: Pick<CustomerUiCopy, 'addrHousePrefix' | 'addrLandmarkPrefix'>): AddressFormValues {
  const prefixOf = (template: string) => template.split('{')[0] ?? '';
  const housePrefix = prefixOf(copy.addrHousePrefix).trim();
  const landmarkPrefix = prefixOf(copy.addrLandmarkPrefix).trim();
  let house = '';
  let landmark = '';
  const rest: string[] = [];
  for (const part of a.line1.split(',').map((p) => p.trim()).filter(Boolean)) {
    if (!house && housePrefix && part.startsWith(housePrefix)) house = part.slice(housePrefix.length).trim();
    else if (!landmark && landmarkPrefix && part.startsWith(landmarkPrefix)) landmark = part.slice(landmarkPrefix.length).trim();
    else rest.push(part);
  }
  const saveAs: AddressSaveAs = a.label === 'Office' || a.label === 'Other' ? a.label : 'Home';
  return { house, street: rest.join(', '), landmark, city: a.city ?? '', pincode: a.pincode ?? '', saveAs };
}

export default function AddressesScreen() {
  const ui = useCustomerUiCopy();
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();
  const { locating, detectAddress } = useLocation();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AddressFormValues>(EMPTY_ADDRESS_FORM);
  const [saving, setSaving] = useState(false);
  const [menuFor, setMenuFor] = useState<SavedAddress | null>(null);
  const [deleteFor, setDeleteFor] = useState<SavedAddress | null>(null);
  /** Address being edited in the sheet (null = adding a new one). */
  const [editFor, setEditFor] = useState<SavedAddress | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const fetchAddresses = useCallback(async () => {
    const { data } = await api.get<{ addresses: SavedAddress[] }>('/addresses', screenLoadConfig);
    setAddresses(data.addresses);
  }, []);

  const load = useCallback(async () => {
    await fetchAddresses();
  }, [fetchAddresses]);

  useStaleFocusRefresh(() => load().catch(() => undefined), 20_000);

  useEffect(() => {
    void runLoad(load, ui.addressesLoadFailed);
  }, [load, runLoad]);

  function openAdd() {
    setEditFor(null);
    setShowErrors(false);
    setForm({ ...EMPTY_ADDRESS_FORM, saveAs: 'Home' });
    setModalOpen(true);
  }

  function openEdit(a: SavedAddress) {
    setEditFor(a);
    setShowErrors(false);
    setForm(formFromAddress(a, ui));
    setModalOpen(true);
  }

  async function useCurrentLocation() {
    const loc = await detectAddress();
    if (loc) {
      setForm((prev) => ({
        ...prev,
        street: loc.line1 || prev.street,
        city: loc.city && loc.city !== 'your area' ? loc.city : prev.city,
        pincode: loc.pincode || prev.pincode,
      }));
      Toast.show({ type: 'success', text1: ui.cartLocationFilled, text2: ui.cartLocationFilledSub });
    }
  }

  async function saveAddress() {
    // Editing an older address may have no separate house number — street + city are enough then.
    const valid = editFor ? Boolean(form.street.trim() && form.city.trim()) : addressFormValid(form);
    if (!valid) {
      setShowErrors(true);
      haptic('warning');
      return;
    }
    setSaving(true);
    try {
      const line1 = composeStreetLine(form, ui);
      if (editFor) {
        await api.patch(`/addresses/${editFor.id}`, {
          label: form.saveAs,
          line1,
          city: form.city.trim(),
          pincode: form.pincode.trim(),
        });
      } else {
        await api.post('/addresses', {
          label: form.saveAs,
          line1,
          city: form.city.trim(),
          pincode: form.pincode.trim() || undefined,
          isDefault: form.saveAs === 'Home' || addresses.length === 0,
        });
      }
      haptic('success');
      Toast.show({ type: 'success', text1: editFor ? ui.addressesUpdatedToast : ui.addressesSavedToast });
      setModalOpen(false);
      await load();
    } catch {
      // interceptor
    } finally {
      setSaving(false);
    }
  }

  async function deleteAddress(addr: SavedAddress) {
    try {
      await api.delete(`/addresses/${addr.id}`);
      haptic('warning');
      Toast.show({ type: 'success', text1: ui.addressesRemovedToast });
      await load();
    } catch {
      // interceptor
    }
  }

  async function setDefault(addr: SavedAddress) {
    try {
      await api.patch(`/addresses/${addr.id}`, { isDefault: true });
      haptic('success');
      Toast.show({ type: 'success', text1: ui.addressesDefaultToast });
      await load();
    } catch {
      // interceptor
    }
  }

  const menuOptions: ActionSheetOption[] = menuFor
    ? [
        { key: 'edit', label: ui.addressesEdit, subtitle: ui.addressesEditSub, onPress: () => openEdit(menuFor) },
        ...(menuFor.isDefault
          ? []
          : [{ key: 'default', label: ui.addressesSetDefault, subtitle: ui.addressesSetDefaultSub, onPress: () => void setDefault(menuFor) }]),
        { key: 'delete', label: ui.addressesDelete, destructive: true, onPress: () => setDeleteFor(menuFor) },
      ]
    : [];

  return (
    <CustomerListShell
      title={ui.addressesScreenTitle}
      subtitle={addresses.length ? fillCopy(ui.addressesSavedSub, { count: addresses.length }) : undefined}
    >
      <ScreenState
        embedded
        loading={loading}
        error={error && addresses.length === 0 ? error : null}
        onRetry={() => void reload(load, ui.addressesLoadFailed)}
        skeleton={<ListRowsSkeleton rows={3} tall />}
      >
        <ScrollView
          contentContainerStyle={addresses.length === 0 ? listShellStyles.empty : styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh(load, ui.homeRefreshFailed)}
              tintColor={themeUi.brand}
            />
          }
        >
          <FadeSlideIn delay={stagger(0)} slideFrom={12}>
            <ListAddRow label={ui.addressesAddButton} onPress={openAdd} />
          </FadeSlideIn>

          {addresses.length === 0 ? (
            <EmptyState title={ui.addressesEmptyTitle} message={ui.addressesEmptyMessage} />
          ) : (
            <FadeSlideIn delay={stagger(1)} slideFrom={14}>
              <ListSectionTitle title={ui.addressesSectionTitle} />
              <ListGroup>
                {addresses.map((a) => (
                  <ListGroupRow
                    key={a.id}
                    icon={labelIcon(a.label)}
                    highlighted={a.isDefault}
                    title={a.label}
                    badge={a.isDefault ? ui.addressesDefaultBadge : undefined}
                    lines={[a.line1, [a.city, a.pincode].filter(Boolean).join(' · ')]}
                    onPress={() => openEdit(a)}
                    onMore={() => setMenuFor(a)}
                  />
                ))}
              </ListGroup>
              <ListFootnote>{ui.addressesFootnote}</ListFootnote>
            </FadeSlideIn>
          )}
        </ScrollView>
      </ScreenState>

      <AdminActionSheet
        visible={menuFor !== null}
        title={menuFor?.label ?? ''}
        message={menuFor ? `${menuFor.line1}, ${menuFor.city}` : undefined}
        options={menuOptions}
        onClose={() => setMenuFor(null)}
      />
      <AdminActionSheet
        visible={deleteFor !== null}
        title={ui.addressesDeleteTitle}
        message={deleteFor ? `${deleteFor.line1}, ${deleteFor.city}` : undefined}
        options={
          deleteFor
            ? [{ key: 'confirm', label: ui.addressesDelete, destructive: true, onPress: () => void deleteAddress(deleteFor) }]
            : []
        }
        cancelLabel={ui.addressesKeep}
        onClose={() => setDeleteFor(null)}
      />

      <BottomSheet
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editFor ? ui.addressesEditSheetTitle : ui.addressesSheetTitle}
        hint={ui.addressesSheetHint}
        footer={
          <Button title={ui.addressesSaveButton} variant="premium" onPress={() => void saveAddress()} loading={saving} />
        }
      >
        <AddressLocateButton loading={locating} onPress={() => void useCurrentLocation()} />
        <View style={styles.formPad}>
          <AddressDetailsForm value={form} onChange={setForm} showErrors={showErrors && !editFor} />
        </View>
      </BottomSheet>
    </CustomerListShell>
  );
}

function labelIcon(label: string): LucideIcon {
  const l = label.trim().toLowerCase();
  if (l === 'home') return House;
  if (l === 'office' || l === 'work') return Building2;
  return MapPinned;
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: TAB_BAR_SCROLL_PAD },
  formPad: { marginTop: spacing.md },
});

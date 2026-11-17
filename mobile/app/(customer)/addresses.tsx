import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
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
  type AddressFormValues,
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
import type { SavedAddress } from '@/types/api';
import { spacing, ui as themeUi } from '@/constants/theme';

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

  const fetchAddresses = useCallback(async () => {
    const { data } = await api.get<{ addresses: SavedAddress[] }>('/addresses', screenLoadConfig);
    setAddresses(data.addresses);
  }, []);

  const load = useCallback(async () => {
    await fetchAddresses();
  }, [fetchAddresses]);

  useStaleFocusRefresh(() => load().catch(() => undefined), 20_000);

  useEffect(() => {
    void runLoad(load, 'Could not load addresses');
  }, [load, runLoad]);

  function openAdd() {
    setForm({ ...EMPTY_ADDRESS_FORM, saveAs: 'Home' });
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
      Toast.show({ type: 'success', text1: 'Location added', text2: 'Add house / flat number to finish' });
    }
  }

  async function saveAddress() {
    if (!addressFormValid(form)) {
      Toast.show({ type: 'error', text1: 'Fill house/flat, street, and city' });
      return;
    }
    setSaving(true);
    try {
      const line1 = [
        form.house.trim() ? `Flat/House ${form.house.trim()}` : '',
        form.street.trim(),
        form.landmark.trim() ? `Landmark: ${form.landmark.trim()}` : '',
      ]
        .filter(Boolean)
        .join(', ');
      await api.post('/addresses', {
        label: form.saveAs,
        line1,
        city: form.city.trim(),
        pincode: form.pincode.trim() || undefined,
        isDefault: form.saveAs === 'Home' || addresses.length === 0,
      });
      Toast.show({ type: 'success', text1: 'Address saved' });
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
      Toast.show({ type: 'success', text1: 'Address removed' });
      await load();
    } catch {
      // interceptor
    }
  }

  async function setDefault(addr: SavedAddress) {
    try {
      await api.patch(`/addresses/${addr.id}`, { isDefault: true });
      Toast.show({ type: 'success', text1: 'Default updated' });
      await load();
    } catch {
      // interceptor
    }
  }

  const menuOptions: ActionSheetOption[] = menuFor
    ? [
        ...(menuFor.isDefault
          ? []
          : [{ key: 'default', label: 'Set as default', subtitle: 'Used first when you book', onPress: () => void setDefault(menuFor) }]),
        { key: 'delete', label: 'Delete address', destructive: true, onPress: () => setDeleteFor(menuFor) },
      ]
    : [];

  return (
    <CustomerListShell
      title={ui.addressesScreenTitle}
      subtitle={addresses.length ? `${addresses.length} saved` : undefined}
    >
      <ScreenState
        embedded
        loading={loading}
        error={error && addresses.length === 0 ? error : null}
        onRetry={() => void reload(load, 'Could not load addresses')}
        loadingLabel="Loading addresses…"
      >
        <ScrollView
          contentContainerStyle={addresses.length === 0 ? listShellStyles.empty : styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh(load, 'Could not refresh')}
              tintColor={themeUi.brand}
            />
          }
        >
          <ListAddRow label={ui.addressesAddButton} onPress={openAdd} />

          {addresses.length === 0 ? (
            <EmptyState title={ui.addressesEmptyTitle} message={ui.addressesEmptyMessage} />
          ) : (
            <>
              <ListSectionTitle title="Saved addresses" />
              <ListGroup>
                {addresses.map((a) => (
                  <ListGroupRow
                    key={a.id}
                    icon={labelIcon(a.label)}
                    highlighted={a.isDefault}
                    title={a.label}
                    badge={a.isDefault ? 'Default' : undefined}
                    lines={[a.line1, [a.city, a.pincode].filter(Boolean).join(' · ')]}
                    onMore={() => setMenuFor(a)}
                  />
                ))}
              </ListGroup>
              <ListFootnote>Your saved addresses show up at checkout — pick one in a tap.</ListFootnote>
            </>
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
        title="Delete this address?"
        message={deleteFor ? `${deleteFor.line1}, ${deleteFor.city}` : undefined}
        options={
          deleteFor
            ? [{ key: 'confirm', label: 'Delete address', destructive: true, onPress: () => void deleteAddress(deleteFor) }]
            : []
        }
        cancelLabel="Keep it"
        onClose={() => setDeleteFor(null)}
      />

      <BottomSheet
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add address"
        hint="House / flat number is required · landmark optional"
        footer={
          <Button title="Save address" variant="premium" onPress={() => void saveAddress()} loading={saving} />
        }
      >
        <AddressLocateButton loading={locating} onPress={() => void useCurrentLocation()} />
        <View style={styles.formPad}>
          <AddressDetailsForm value={form} onChange={setForm} />
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

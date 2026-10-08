import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { AddressCard } from '@/components/kit/AddressCard';
import {
  AddressDetailsForm,
  EMPTY_ADDRESS_FORM,
  addressFormValid,
  type AddressFormValues,
} from '@/components/kit/AddressDetailsForm';
import { AddressLocateButton } from '@/components/kit/AddressLocateButton';
import { CardFooterActions } from '@/components/kit/CardFooterActions';
import { CustomerListShell, listShellStyles } from '@/components/kit/CustomerListShell';
import { FabButton } from '@/components/kit/FabButton';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenState } from '@/components/ui/ScreenState';
import { api, screenLoadConfig } from '@/lib/api';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { useLocation } from '@/context/LocationContext';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { SavedAddress } from '@/types/api';
import { colors, fonts, spacing, ui as themeUi } from '@/constants/theme';

export default function AddressesScreen() {
  const ui = useCustomerUiCopy();
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();
  const { locating, detectAddress } = useLocation();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AddressFormValues>(EMPTY_ADDRESS_FORM);
  const [saving, setSaving] = useState(false);

  const fetchAddresses = useCallback(async () => {
    const { data } = await api.get<{ addresses: SavedAddress[] }>('/addresses', screenLoadConfig);
    setAddresses(data.addresses);
  }, []);

  const load = useCallback(async () => {
    await fetchAddresses();
  }, [fetchAddresses]);

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

  function confirmDelete(addr: SavedAddress) {
    Alert.alert('Delete address?', addr.line1, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/addresses/${addr.id}`);
            Toast.show({ type: 'success', text1: 'Address removed' });
            await load();
          } catch {
            // interceptor
          }
        },
      },
    ]);
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

  const addFab = <FabButton onPress={openAdd} accessibilityLabel="Add address" />;

  return (
    <CustomerListShell
      title={ui.addressesScreenTitle}
      subtitle={addresses.length ? `${addresses.length} saved · tap + to add` : undefined}
      rightAction={addFab}
    >
      <ScreenState
        embedded
        loading={loading}
        error={error && addresses.length === 0 ? error : null}
        onRetry={() => void reload(load, 'Could not load addresses')}
        loadingLabel="Loading addresses…"
      >
        <FlatList
          data={addresses}
          keyExtractor={(a) => a.id}
          {...CUSTOMER_LIST_PERF}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh(load, 'Could not refresh')}
              tintColor={themeUi.brand}
            />
          }
          contentContainerStyle={addresses.length === 0 ? listShellStyles.empty : listShellStyles.list}
          ListEmptyComponent={<EmptyState title={ui.addressesEmptyTitle} message={ui.addressesEmptyMessage} />}
          renderItem={({ item }) => (
            <AddressCard
              address={item}
              footer={
                <CardFooterActions
                  note={item.isDefault ? 'Used by default when booking' : undefined}
                  actions={[
                    ...(item.isDefault ? [] : [{ label: 'Set default', onPress: () => void setDefault(item) }]),
                    { label: 'Delete', tone: 'danger' as const, onPress: () => confirmDelete(item) },
                  ]}
                />
              }
            />
          )}
        />
      </ScreenState>

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalOpen(false)}>
            <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
              <View style={styles.handle} />
              <Text style={styles.modalTitle}>Add address</Text>
              <Text style={styles.modalSub}>House / flat · landmark optional · save as Home or Other</Text>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <AddressLocateButton loading={locating} onPress={() => void useCurrentLocation()} />
                <View style={styles.formPad}>
                  <AddressDetailsForm value={form} onChange={setForm} />
                </View>
                <Button title="Save address" variant="premium" onPress={() => void saveAddress()} loading={saving} />
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setModalOpen(false)}
                  style={{ marginTop: spacing.sm }}
                />
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </CustomerListShell>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 34, 19, 0.48)',
    justifyContent: 'flex-end',
  },
  modal: {
    maxHeight: '88%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: themeUi.hairline,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: themeUi.hairline,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    letterSpacing: -0.4,
    color: themeUi.text,
  },
  modalSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: themeUi.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  formPad: { marginTop: spacing.md, marginBottom: spacing.md },
});

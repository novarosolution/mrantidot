import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LocateFixed, Plus } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { AddressCard } from '@/components/kit/AddressCard';
import { CustomerListShell, listShellStyles } from '@/components/kit/CustomerListShell';
import { IconInput } from '@/components/kit/IconInput';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, screenLoadConfig } from '@/lib/api';
import { getCurrentAddress } from '@/lib/location';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { SavedAddress } from '@/types/api';
import { colors, design, fonts, premium, radius, spacing } from '@/constants/theme';

export default function AddressesScreen() {
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [label, setLabel] = useState('Home');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

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
    setLabel('Home');
    setLine1('');
    setCity('');
    setPincode('');
    setIsDefault(addresses.length === 0);
    setModalOpen(true);
  }

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const addr = await getCurrentAddress();
      if (addr) {
        if (addr.line1) setLine1(addr.line1);
        if (addr.city) setCity(addr.city);
        if (addr.pincode) setPincode(addr.pincode);
        Toast.show({ type: 'success', text1: 'Location added', text2: 'Review and edit the details if needed' });
      }
    } finally {
      setLocating(false);
    }
  }

  async function saveAddress() {
    if (!label.trim() || !line1.trim() || !city.trim()) {
      Toast.show({ type: 'error', text1: 'Fill label, address line, and city' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/addresses', {
        label: label.trim(),
        line1: line1.trim(),
        city: city.trim(),
        pincode: pincode.trim() || undefined,
        isDefault,
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
      await load();
    } catch {
      // interceptor
    }
  }

  const addFab = (
    <Pressable style={styles.fab} onPress={openAdd}>
      <Plus size={22} color={colors.white} />
    </Pressable>
  );

  return (
    <CustomerListShell
      title="Saved Addresses"
      subtitle="Delivery locations for bookings"
      accountStrip
      rightAction={addFab}
    >
      {loading ? (
        <Spinner />
      ) : error ? (
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(a) => a.id}
          {...CUSTOMER_LIST_PERF}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh(load)}
              tintColor={colors.green}
            />
          }
          contentContainerStyle={addresses.length === 0 ? listShellStyles.empty : listShellStyles.list}
          ListEmptyComponent={
            <EmptyState title="No saved addresses" message="Tap + to add your first address" />
          }
          renderItem={({ item }) => (
            <View>
              <AddressCard address={item} onPress={() => !item.isDefault && void setDefault(item)} />
              <View style={styles.actions}>
                {!item.isDefault ? (
                  <Pressable onPress={() => void setDefault(item)}>
                    <Text style={styles.actionText}>Set as default</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => confirmDelete(item)}>
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setModalOpen(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Add address</Text>
            <Pressable
              style={({ pressed }) => [styles.locateBtn, pressed && styles.locatePressed]}
              onPress={() => void useCurrentLocation()}
              disabled={locating}
            >
              <LocateFixed size={17} color={colors.green} />
              <Text style={styles.locateText}>
                {locating ? 'Getting your location…' : 'Use my current location'}
              </Text>
            </Pressable>
            <IconInput label="Label" value={label} onChangeText={setLabel} placeholder="Home, Office…" />
            <IconInput label="Address line" value={line1} onChangeText={setLine1} />
            <IconInput label="City" value={city} onChangeText={setCity} />
            <IconInput label="Pincode (optional)" value={pincode} onChangeText={setPincode} keyboardType="numeric" />
            <View style={styles.defaultRow}>
              <Text style={styles.defaultLabel}>Set as default address</Text>
              <ToggleSwitch value={isDefault} onToggle={() => setIsDefault((v) => !v)} />
            </View>
            <Button title="Save address" variant="premium" onPress={saveAddress} loading={saving} />
            <Button title="Cancel" variant="secondary" onPress={() => setModalOpen(false)} style={{ marginTop: spacing.sm }} />
          </Pressable>
        </Pressable>
      </Modal>
    </CustomerListShell>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: -4, marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  actionText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.green },
  deleteText: { color: colors.error },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modal: {
    ...design.modalCard,
    borderTopLeftRadius: premium.radiusCard,
    borderTopRightRadius: premium.radiusCard,
    paddingBottom: spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  modalTitle: { fontFamily: fonts.display, fontSize: 18, marginBottom: spacing.md, color: colors.ink },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.green,
    backgroundColor: colors.soft,
    marginBottom: spacing.md,
  },
  locatePressed: { opacity: 0.7 },
  locateText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.green },
  defaultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  defaultLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
});

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
import { Plus } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { CustomerListShell, listShellStyles } from '@/components/kit/CustomerListShell';
import { PaymentMethodCard } from '@/components/kit/PaymentMethodCard';
import { IconInput } from '@/components/kit/IconInput';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, screenLoadConfig } from '@/lib/api';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { PaymentMethodRecord } from '@/types/api';
import { colors, design, fonts, premium, radius, spacing } from '@/constants/theme';

export default function PaymentMethodsScreen() {
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();
  const [methods, setMethods] = useState<PaymentMethodRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<'upi_card' | 'pay_after'>('upi_card');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get<{ paymentMethods: PaymentMethodRecord[] }>('/payment-methods', screenLoadConfig);
    setMethods(data.paymentMethods);
  }, []);

  useEffect(() => {
    void runLoad(load, 'Could not load payment methods');
  }, [load, runLoad]);

  function openAdd() {
    setType('upi_card');
    setLabel('');
    setModalOpen(true);
  }

  async function saveMethod() {
    if (!label.trim()) {
      Toast.show({ type: 'error', text1: 'Enter a label for this method' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/payment-methods', {
        type,
        label: label.trim(),
        isDefault: methods.length === 0,
      });
      Toast.show({ type: 'success', text1: 'Payment method added' });
      setModalOpen(false);
      await load();
    } catch {
      // interceptor
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(m: PaymentMethodRecord) {
    Alert.alert('Remove payment method?', m.label, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/payment-methods/${m.id}`);
            await load();
          } catch {
            // interceptor
          }
        },
      },
    ]);
  }

  async function setDefault(m: PaymentMethodRecord) {
    try {
      await api.patch(`/payment-methods/${m.id}`, { isDefault: true });
      await load();
    } catch {
      // interceptor
    }
  }

  return (
    <CustomerListShell
      title="Payment Methods"
      subtitle="How you pay for services"
      accountStrip
      rightAction={
        <Pressable style={styles.fab} onPress={openAdd}>
          <Plus size={22} color={colors.white} />
        </Pressable>
      }
    >
      {loading ? (
        <Spinner />
      ) : error ? (
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      ) : (
        <FlatList
          data={methods}
          keyExtractor={(m) => m.id}
          {...CUSTOMER_LIST_PERF}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh(load)}
              tintColor={colors.green}
            />
          }
          contentContainerStyle={methods.length === 0 ? listShellStyles.empty : listShellStyles.list}
          ListEmptyComponent={<EmptyState title="No payment methods" message="Tap + to add one" />}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <PaymentMethodCard method={item} />
              <View style={styles.actions}>
                {!item.isDefault ? (
                  <Pressable onPress={() => void setDefault(item)}>
                    <Text style={styles.actionText}>Set default</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.defaultHint}>Default</Text>
                )}
                <Pressable onPress={() => confirmDelete(item)}>
                  <Text style={[styles.actionText, styles.deleteText]}>Remove</Text>
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
            <Text style={styles.modalTitle}>Add payment method</Text>
            <View style={styles.chips}>
              <Chip label="UPI / Card" selected={type === 'upi_card'} onPress={() => setType('upi_card')} />
              <Chip label="Pay after service" selected={type === 'pay_after'} onPress={() => setType('pay_after')} />
            </View>
            <IconInput label="Label" value={label} onChangeText={setLabel} placeholder="e.g. Personal UPI" />
            <Button title="Save" variant="premium" onPress={saveMethod} loading={saving} style={{ marginTop: spacing.md }} />
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
  item: { marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs, paddingHorizontal: spacing.xs },
  actionText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.green },
  deleteText: { color: colors.error },
  defaultHint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
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
  modalTitle: { fontFamily: fonts.display, fontSize: 18, marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
});

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { CustomerListShell, listShellStyles } from '@/components/kit/CustomerListShell';
import { FabButton } from '@/components/kit/FabButton';
import { PaymentMethodCard } from '@/components/kit/PaymentMethodCard';
import { CardFooterActions } from '@/components/kit/CardFooterActions';
import { IconInput } from '@/components/kit/IconInput';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenState } from '@/components/ui/ScreenState';
import { api, screenLoadConfig } from '@/lib/api';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { PaymentMethodRecord } from '@/types/api';
import { colors, design, fonts, premium, spacing, ui as themeUi } from '@/constants/theme';

export default function PaymentMethodsScreen() {
  const ui = useCustomerUiCopy();
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
      title={ui.paymentsScreenTitle}
      subtitle="Pay at the visit · nothing is charged in the app"
      rightAction={<FabButton onPress={openAdd} accessibilityLabel="Add payment method" />}
    >
      <ScreenState
        embedded
        loading={loading}
        error={error}
        onRetry={() => void reload(load, error ?? undefined)}
        loadingLabel="Loading payments…"
      >
        <FlatList
          data={methods}
          keyExtractor={(m) => m.id}
          {...CUSTOMER_LIST_PERF}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh(load)}
              tintColor={themeUi.brand}
            />
          }
          contentContainerStyle={methods.length === 0 ? listShellStyles.empty : listShellStyles.list}
          ListEmptyComponent={<EmptyState title={ui.paymentsEmptyTitle} message={ui.paymentsEmptyMessage} />}
          renderItem={({ item }) => (
            <PaymentMethodCard
              method={item}
              footer={
                <CardFooterActions
                  note={item.isDefault ? 'Pre-selected at checkout' : undefined}
                  actions={[
                    ...(item.isDefault ? [] : [{ label: 'Set default', onPress: () => void setDefault(item) }]),
                    { label: 'Remove', tone: 'danger' as const, onPress: () => confirmDelete(item) },
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
        </KeyboardAvoidingView>
      </Modal>
    </CustomerListShell>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(11, 34, 19, 0.48)', justifyContent: 'flex-end' },
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
    backgroundColor: '#C8E0BE',
    marginBottom: spacing.md,
  },
  modalTitle: { fontFamily: fonts.display, fontSize: 18, marginBottom: spacing.md, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
});

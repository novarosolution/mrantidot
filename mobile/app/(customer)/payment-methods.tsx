import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Banknote, CircleCheck, Circle, CreditCard } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { CustomerListShell, listShellStyles } from '@/components/kit/CustomerListShell';
import { AdminActionSheet, type ActionSheetOption } from '@/components/kit/AdminActionSheet';
import { TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { ListAddRow, ListGroup, ListGroupRow, ListSectionTitle } from '@/components/kit/ListGroup';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { IconInput } from '@/components/kit/IconInput';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenState } from '@/components/ui/ScreenState';
import { api, screenLoadConfig } from '@/lib/api';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { PaymentMethodRecord } from '@/types/api';
import { colors, fonts, spacing, ui as themeUi } from '@/constants/theme';

export default function PaymentMethodsScreen() {
  const ui = useCustomerUiCopy();
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();
  const [methods, setMethods] = useState<PaymentMethodRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<'upi_card' | 'pay_after'>('upi_card');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [menuFor, setMenuFor] = useState<PaymentMethodRecord | null>(null);
  const [removeFor, setRemoveFor] = useState<PaymentMethodRecord | null>(null);

  const load = useCallback(async () => {
    const { data } = await api.get<{ paymentMethods: PaymentMethodRecord[] }>('/payment-methods', screenLoadConfig);
    setMethods(data.paymentMethods);
  }, []);

  useStaleFocusRefresh(() => load().catch(() => undefined), 20_000);

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

  async function removeMethod(m: PaymentMethodRecord) {
    try {
      await api.delete(`/payment-methods/${m.id}`);
      Toast.show({ type: 'success', text1: 'Payment method removed' });
      await load();
    } catch {
      // interceptor
    }
  }

  async function setDefault(m: PaymentMethodRecord) {
    try {
      await api.patch(`/payment-methods/${m.id}`, { isDefault: true });
      await load();
    } catch {
      // interceptor
    }
  }

  const menuOptions: ActionSheetOption[] = menuFor
    ? [
        ...(menuFor.isDefault
          ? []
          : [{ key: 'default', label: 'Set as default', subtitle: 'Pre-selected at checkout', onPress: () => void setDefault(menuFor) }]),
        { key: 'remove', label: 'Remove', destructive: true, onPress: () => setRemoveFor(menuFor) },
      ]
    : [];

  return (
    <CustomerListShell title={ui.paymentsScreenTitle} subtitle={ui.paymentsSubtitle}>
      <ScreenState
        embedded
        loading={loading}
        error={error}
        onRetry={() => void reload(load, error ?? undefined)}
        loadingLabel="Loading payments…"
      >
        <ScrollView
          contentContainerStyle={methods.length === 0 ? listShellStyles.empty : styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={themeUi.brand} />
          }
        >
          <ListAddRow label={ui.paymentsAddButton} onPress={openAdd} />
          {methods.length === 0 ? (
            <EmptyState title={ui.paymentsEmptyTitle} message={ui.paymentsEmptyMessage} />
          ) : (
            <>
              <ListSectionTitle title="Saved methods" />
              <ListGroup>
                {methods.map((m) => (
                  <ListGroupRow
                    key={m.id}
                    icon={m.type === 'pay_after' ? Banknote : CreditCard}
                    highlighted={m.isDefault}
                    title={m.label}
                    badge={m.isDefault ? 'Default' : undefined}
                    lines={[
                      m.label.trim().toLowerCase() === TYPE_META[m.type].title.toLowerCase() ? TYPE_META[m.type].sub : TYPE_META[m.type].title,
                      m.details,
                    ]}
                    onMore={() => setMenuFor(m)}
                  />
                ))}
              </ListGroup>
            </>
          )}
        </ScrollView>
      </ScreenState>

      <AdminActionSheet
        visible={menuFor !== null}
        title={menuFor?.label ?? ''}
        message={menuFor ? TYPE_META[menuFor.type].title : undefined}
        options={menuOptions}
        onClose={() => setMenuFor(null)}
      />
      <AdminActionSheet
        visible={removeFor !== null}
        title="Remove this payment method?"
        message={removeFor?.label}
        options={removeFor ? [{ key: 'confirm', label: 'Remove', destructive: true, onPress: () => void removeMethod(removeFor) }] : []}
        cancelLabel="Keep it"
        onClose={() => setRemoveFor(null)}
      />

      <BottomSheet
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title={ui.paymentsAddButton}
        hint="Choose how you'd like to pay at the visit."
        footer={<Button title="Save" variant="premium" onPress={saveMethod} loading={saving} />}
      >
        <View style={styles.options}>
          {(Object.keys(TYPE_META) as PaymentMethodRecord['type'][]).map((key) => {
            const on = type === key;
            const Icon = key === 'pay_after' ? Banknote : CreditCard;
            return (
              <Pressable
                key={key}
                style={[styles.option, on && styles.optionOn]}
                onPress={() => setType(key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
              >
                <View style={[styles.optionIcon, on && styles.optionIconOn]}>
                  <Icon size={19} color={on ? colors.white : themeUi.brand} strokeWidth={2.1} />
                </View>
                <View style={styles.optionBody}>
                  <Text style={styles.optionTitle}>{TYPE_META[key].title}</Text>
                  <Text style={styles.optionSub}>{TYPE_META[key].sub}</Text>
                </View>
                {on ? (
                  <CircleCheck size={22} color={themeUi.brand} strokeWidth={2.2} />
                ) : (
                  <Circle size={22} color={themeUi.border} strokeWidth={2} />
                )}
              </Pressable>
            );
          })}
        </View>
        <IconInput label="Label" value={label} onChangeText={setLabel} placeholder="e.g. Personal UPI" />
      </BottomSheet>
    </CustomerListShell>
  );
}

const TYPE_META: Record<PaymentMethodRecord['type'], { title: string; sub: string }> = {
  upi_card: { title: 'UPI / Card', sub: 'Pay the technician by UPI or card' },
  pay_after: { title: 'Pay after service', sub: 'Cash or UPI once the job is done' },
};

const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: TAB_BAR_SCROLL_PAD },
  options: { gap: 10, marginBottom: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: themeUi.border,
    backgroundColor: colors.white,
  },
  optionOn: { borderColor: themeUi.brand, backgroundColor: themeUi.brandSoft },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: themeUi.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconOn: { backgroundColor: themeUi.brand },
  optionBody: { flex: 1, minWidth: 0 },
  optionTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: themeUi.text },
  optionSub: { marginTop: 2, fontFamily: fonts.body, fontSize: 12.5, color: themeUi.textSecondary },
});

import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Banknote, CircleCheck, Circle, CreditCard } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { CustomerListShell, listShellStyles } from '@/components/kit/CustomerListShell';
import { AdminActionSheet, type ActionSheetOption } from '@/components/kit/AdminActionSheet';
import { TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { ListAddRow, ListGroup, ListGroupRow, ListSectionTitle } from '@/components/kit/ListGroup';
import { ListRowsSkeleton } from '@/components/kit/ScreenSkeletons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { IconInput } from '@/components/kit/IconInput';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenState } from '@/components/ui/ScreenState';
import { api, screenLoadConfig } from '@/lib/api';
import { useBusinessSettings } from '@/lib/businessSettings';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { haptic, stagger } from '@/lib/motion';
import { activePaymentMethods, paymentLabel } from '@/lib/settingsLabels';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { PaymentMethodRecord } from '@/types/api';
import { colors, radii, spacing, typeScale, ui as themeUi } from '@/constants/theme';

type MethodType = PaymentMethodRecord['type'];
const KNOWN: MethodType[] = ['upi_card', 'pay_after'];

export default function PaymentMethodsScreen() {
  const ui = useCustomerUiCopy();
  const settings = useBusinessSettings();
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();
  const [methods, setMethods] = useState<PaymentMethodRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<MethodType>('upi_card');
  const [label, setLabel] = useState('');
  const [labelError, setLabelError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [menuFor, setMenuFor] = useState<PaymentMethodRecord | null>(null);
  const [removeFor, setRemoveFor] = useState<PaymentMethodRecord | null>(null);

  /** Types the admin still offers (Business settings → Payments), in their order. */
  const offered = activePaymentMethods(settings)
    .map((m) => m.key)
    .filter((k): k is MethodType => (KNOWN as string[]).includes(k));
  const typeSub = (t: MethodType) => (t === 'pay_after' ? ui.payAfterSub : ui.payUpiCardSub);

  const load = useCallback(async () => {
    const { data } = await api.get<{ paymentMethods: PaymentMethodRecord[] }>('/payment-methods', screenLoadConfig);
    setMethods(data.paymentMethods);
  }, []);

  useStaleFocusRefresh(() => load().catch(() => undefined), 20_000);

  useEffect(() => {
    void runLoad(load, ui.paymentsLoadFailed);
    // First load only — copy edits must not refetch.
  }, [load, runLoad]);

  function openAdd() {
    setType(offered[0] ?? 'upi_card');
    setLabel('');
    setLabelError(undefined);
    setModalOpen(true);
  }

  async function saveMethod() {
    if (!label.trim()) {
      setLabelError(ui.paymentsLabelRequired);
      haptic('warning');
      return;
    }
    setSaving(true);
    try {
      await api.post('/payment-methods', { type, label: label.trim(), isDefault: methods.length === 0 });
      haptic('success');
      Toast.show({ type: 'success', text1: ui.paymentsAddedToast });
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
      haptic('warning');
      Toast.show({ type: 'success', text1: ui.paymentsRemovedToast });
      await load();
    } catch {
      // interceptor
    }
  }

  async function setDefault(m: PaymentMethodRecord) {
    try {
      await api.patch(`/payment-methods/${m.id}`, { isDefault: true });
      haptic('success');
      Toast.show({ type: 'success', text1: ui.paymentsDefaultToast });
      await load();
    } catch {
      // interceptor
    }
  }

  const menuOptions: ActionSheetOption[] = menuFor
    ? [
        ...(menuFor.isDefault
          ? []
          : [{ key: 'default', label: ui.paymentsSetDefault, subtitle: ui.paymentsSetDefaultSub, onPress: () => void setDefault(menuFor) }]),
        { key: 'remove', label: ui.paymentsRemove, destructive: true, onPress: () => setRemoveFor(menuFor) },
      ]
    : [];

  return (
    <CustomerListShell title={ui.paymentsScreenTitle} subtitle={ui.paymentsSubtitle}>
      <ScreenState
        embedded
        loading={loading}
        error={error}
        onRetry={() => void reload(load, error ?? undefined)}
        skeleton={<ListRowsSkeleton rows={2} tall />}
      >
        <ScrollView
          contentContainerStyle={methods.length === 0 ? listShellStyles.empty : styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={themeUi.brand} />}
        >
          <FadeSlideIn delay={stagger(0)}>
            <ListAddRow label={ui.paymentsAddButton} onPress={openAdd} />
          </FadeSlideIn>
          {methods.length === 0 ? (
            <EmptyState icon={CreditCard} title={ui.paymentsEmptyTitle} message={ui.paymentsEmptyMessage} />
          ) : (
            <FadeSlideIn delay={stagger(1)}>
              <ListSectionTitle title={ui.paymentsSavedTitle} />
              <ListGroup>
                {methods.map((m) => {
                  const typeName = paymentLabel(m.type, settings);
                  return (
                    <ListGroupRow
                      key={m.id}
                      icon={m.type === 'pay_after' ? Banknote : CreditCard}
                      highlighted={m.isDefault}
                      title={m.label}
                      badge={m.isDefault ? ui.paymentsDefaultBadge : undefined}
                      lines={[m.label.trim().toLowerCase() === typeName.toLowerCase() ? typeSub(m.type) : typeName, m.details]}
                      onMore={() => setMenuFor(m)}
                    />
                  );
                })}
              </ListGroup>
            </FadeSlideIn>
          )}
        </ScrollView>
      </ScreenState>

      <AdminActionSheet
        visible={menuFor !== null}
        title={menuFor?.label ?? ''}
        message={menuFor ? paymentLabel(menuFor.type, settings) : undefined}
        options={menuOptions}
        onClose={() => setMenuFor(null)}
      />
      <AdminActionSheet
        visible={removeFor !== null}
        title={ui.paymentsRemoveTitle}
        message={removeFor?.label}
        options={removeFor ? [{ key: 'confirm', label: ui.paymentsRemove, destructive: true, onPress: () => void removeMethod(removeFor) }] : []}
        cancelLabel={ui.paymentsKeep}
        onClose={() => setRemoveFor(null)}
      />

      <BottomSheet
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title={ui.paymentsAddButton}
        hint={ui.paymentsSheetHint}
        footer={<Button title={ui.paymentsSave} variant="premium" onPress={saveMethod} loading={saving} />}
      >
        <View style={styles.options} accessibilityRole="radiogroup">
          {(offered.length > 0 ? offered : KNOWN).map((key) => {
            const on = type === key;
            const Icon = key === 'pay_after' ? Banknote : CreditCard;
            return (
              <PressableScale
                key={key}
                style={[styles.option, on && styles.optionOn]}
                onPress={() => {
                  if (!on) haptic('select');
                  setType(key);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={paymentLabel(key, settings)}
              >
                <View style={[styles.optionIcon, on && styles.optionIconOn]}>
                  <Icon size={19} color={on ? colors.white : themeUi.brand} strokeWidth={2.1} />
                </View>
                <View style={styles.optionBody}>
                  <Text style={styles.optionTitle}>{paymentLabel(key, settings)}</Text>
                  <Text style={styles.optionSub}>{typeSub(key)}</Text>
                </View>
                {on ? (
                  <CircleCheck size={22} color={themeUi.brand} strokeWidth={2.2} />
                ) : (
                  <Circle size={22} color={themeUi.border} strokeWidth={2} />
                )}
              </PressableScale>
            );
          })}
        </View>
        <IconInput
          label={ui.paymentsLabelField}
          value={label}
          error={labelError}
          onChangeText={(v) => {
            setLabel(v);
            if (labelError) setLabelError(undefined);
          }}
          placeholder={ui.paymentsLabelPlaceholder}
        />
      </BottomSheet>
    </CustomerListShell>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: TAB_BAR_SCROLL_PAD },
  options: { gap: 10, marginBottom: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: themeUi.border,
    backgroundColor: colors.white,
  },
  optionOn: { borderColor: themeUi.brand, backgroundColor: themeUi.brandSoft },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.thumb,
    backgroundColor: themeUi.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconOn: { backgroundColor: themeUi.brand },
  optionBody: { flex: 1, minWidth: 0 },
  optionTitle: { ...typeScale.rowTitle, fontFamily: typeScale.button.fontFamily, color: themeUi.text },
  optionSub: { ...typeScale.caption, fontSize: 12.5, marginTop: 2, color: themeUi.textSecondary },
});

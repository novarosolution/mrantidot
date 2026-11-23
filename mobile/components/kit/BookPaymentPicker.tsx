import { StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { AppIcons } from '@/constants/appIcons';
import type { PaymentMethodRecord } from '@/types/api';
import { colors, radii, spacing, typeScale, ui } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';
import { useBusinessSettings } from '@/lib/businessSettings';
import { activePaymentMethods } from '@/lib/settingsLabels';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { haptic } from '@/lib/motion';

function PaymentIcon({ type }: { type: string }) {
  const icon = type === 'pay_after' ? AppIcons.payment.wallet : AppIcons.payment.upi;
  return <PremiumIcon icon={icon} variant="plain" size={22} color={ui.brand} strokeWidth={2.2} />;
}

/**
 * Payment choice for checkout — the methods the admin switched on (Business settings → Payments),
 * in their order and with their names. A saved record of the same type adds its details (UPI id…).
 */
export function BookPaymentPicker({
  methods,
  selected,
  onSelect,
  showManageLink,
}: {
  /** The customer's saved payment records (details only). */
  methods: PaymentMethodRecord[];
  selected: string | null;
  onSelect: (type: string) => void;
  showManageLink?: boolean;
}) {
  const settings = useBusinessSettings();
  const copy = useCustomerUiCopy();
  const options = activePaymentMethods(settings);

  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {options.map((opt) => {
        const record = methods.find((m) => m.type === opt.key);
        const on = selected === opt.key;
        const sub = opt.key === 'upi_card' ? copy.payUpiCardSub : opt.key === 'pay_after' ? copy.payAfterSub : copy.payOtherSub;
        return (
          <PressableScale
            key={opt.key}
            style={[styles.tile, on && styles.tileOn]}
            onPress={() => {
              if (!on) haptic('select');
              onSelect(opt.key);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${opt.label}. ${sub}`}
          >
            <View style={[styles.iconWrap, on && styles.iconWrapOn]}>
              <PaymentIcon type={opt.key} />
            </View>
            <View style={styles.body}>
              <Text style={styles.title}>{opt.label}</Text>
              <Text style={styles.sub} numberOfLines={2}>
                {sub}
              </Text>
              {record?.details ? (
                <View style={styles.detailsRow}>
                  <PremiumIcon icon={AppIcons.payment.card} variant="plain" size={11} color={ui.textTertiary} />
                  <Text style={styles.details}>{record.details}</Text>
                </View>
              ) : null}
            </View>
            <View style={[styles.radio, on && styles.radioOn]}>
              {on ? <PremiumIcon icon={AppIcons.ui.check} variant="plain" size={14} color={colors.white} strokeWidth={3} /> : null}
            </View>
          </PressableScale>
        );
      })}

      {showManageLink ? (
        <PressableScale style={styles.manage} onPress={() => appPush(customerRoutes.paymentMethods)} accessibilityRole="link">
          <Text style={styles.manageText}>{copy.payManageSaved}</Text>
          <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size={16} color={ui.brand} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.control,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  tileOn: { backgroundColor: ui.brandSoft, borderColor: ui.brand, borderWidth: 1.5 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapOn: { backgroundColor: colors.white },
  body: { flex: 1, minWidth: 0 },
  title: { ...typeScale.rowTitle, fontFamily: typeScale.button.fontFamily, color: ui.text },
  sub: { ...typeScale.caption, fontSize: 12.5, marginTop: 2, color: ui.textSecondary },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  details: { ...typeScale.caption, fontSize: 12, color: ui.textSecondary },
  radio: {
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  radioOn: { backgroundColor: ui.brand, borderColor: ui.brand },
  manage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 44,
    marginTop: spacing.xs,
  },
  manageText: { ...typeScale.captionStrong, color: ui.brand },
});

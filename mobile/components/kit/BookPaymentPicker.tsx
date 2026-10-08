import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { PAYMENT_TYPE_META } from '@/lib/bookingPayment';
import type { PaymentMethodRecord } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';

function PaymentIcon({ type, selected }: { type: 'upi_card' | 'pay_after'; selected: boolean }) {
  const color = ui.brand;
  if (type === 'pay_after') {
    return <PremiumIcon icon={AppIcons.payment.wallet} variant="plain" size={22} color={color} strokeWidth={2.2} />;
  }
  return <PremiumIcon icon={AppIcons.payment.upi} variant="plain" size={22} color={color} strokeWidth={2.2} />;
}

export function BookPaymentPicker({
  methods,
  selected,
  onSelect,
  showManageLink,
}: {
  methods: PaymentMethodRecord[];
  selected: 'upi_card' | 'pay_after' | null;
  onSelect: (type: 'upi_card' | 'pay_after') => void;
  showManageLink?: boolean;
}) {
  const types = Array.from(new Set(methods.map((m) => m.type))).filter(
    (t): t is 'upi_card' | 'pay_after' => t === 'upi_card' || t === 'pay_after',
  );

  return (
    <View style={styles.wrap}>
      {types.map((type) => {
        const meta = PAYMENT_TYPE_META[type];
        if (!meta) return null;
        const method = methods.find((m) => m.type === type);
        const on = selected === type;

        return (
          <Pressable
            key={type}
            style={({ pressed }) => [styles.tile, on && styles.tileOn, pressed && styles.pressed]}
            onPress={() => onSelect(type)}
          >
            <View style={[styles.iconWrap, on && styles.iconWrapOn]}>
              <PaymentIcon type={type} selected={on} />
            </View>
            <View style={styles.body}>
              <Text style={[styles.title, on && styles.titleOn]}>{method?.label ?? meta.title}</Text>
              {method?.details ? (
                <View style={styles.detailsRow}>
                  <PremiumIcon icon={AppIcons.payment.card} variant="plain" size={11} color={ui.textTertiary} />
                  <Text style={styles.details}>{method.details}</Text>
                </View>
              ) : null}
            </View>
            <View style={[styles.radio, on && styles.radioOn]}>
              {on ? (
                <PremiumIcon icon={AppIcons.ui.check} variant="plain" size={14} color={colors.white} strokeWidth={3} />
              ) : null}
            </View>
          </Pressable>
        );
      })}

      {showManageLink ? (
        <Pressable
          style={({ pressed }) => [styles.manage, pressed && styles.pressed]}
          onPress={() => appPush(customerRoutes.paymentMethods)}
        >
          <Text style={styles.manageText}>Manage saved payment methods</Text>
          <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size={16} color={ui.brand} />
        </Pressable>
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
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  tileOn: {
    backgroundColor: ui.brandSoft,
    borderColor: ui.brand,
    borderWidth: 1.5,
  },
  pressed: { opacity: 0.92 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapOn: { backgroundColor: colors.white },
  body: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: ui.text },
  titleOn: { color: ui.text },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  details: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ui.hairline,
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
    paddingVertical: 12,
    marginTop: spacing.xs,
  },
  manageText: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.brand },
});

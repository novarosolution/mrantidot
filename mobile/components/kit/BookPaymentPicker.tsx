import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { PAYMENT_TYPE_META } from '@/lib/bookingPayment';
import type { PaymentMethodRecord } from '@/types/api';
import { colors, fonts, premium, spacing, surfaces } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';

function PaymentIcon({ type, selected }: { type: 'upi_card' | 'pay_after'; selected: boolean }) {
  const color = selected ? colors.forest : colors.green;
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
  const types = Array.from(new Set(methods.map((m) => m.type))) as ('upi_card' | 'pay_after')[];

  return (
    <View style={styles.wrap}>
      {types.map((type) => {
        const meta = PAYMENT_TYPE_META[type];
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
                  <PremiumIcon icon={AppIcons.payment.card} variant="plain" size={11} color={colors.muted} />
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
          <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size={16} color={colors.green} />
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
    borderRadius: premium.radiusCard,
    backgroundColor: surfaces.glass,
    borderWidth: 1.5,
    borderColor: surfaces.glassBorderStrong,
  },
  tileOn: {
    backgroundColor: colors.soft,
    borderColor: colors.forest,
    ...premium.shadowSoft,
  },
  pressed: { opacity: 0.92 },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: surfaces.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  iconWrapOn: {
    backgroundColor: colors.soft,
    borderColor: 'rgba(143,208,60,0.45)',
  },
  body: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: colors.ink },
  titleOn: { color: colors.forest },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  details: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: surfaces.glass,
  },
  radioOn: { backgroundColor: colors.green, borderColor: colors.green },
  manage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    marginTop: spacing.xs,
  },
  manageText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.green },
});

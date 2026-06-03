import { router } from 'expo-router';
import { Check, CreditCard, Wallet } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PAYMENT_TYPE_META } from '@/lib/bookingPayment';
import type { PaymentMethodRecord } from '@/types/api';
import { colors, fonts, premium, spacing } from '@/constants/theme';

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
    <View>
      <View style={styles.badgeRow}>
        <Text style={styles.badge}>{types.length} ways to pay</Text>
      </View>
      {types.map((type) => {
        const meta = PAYMENT_TYPE_META[type];
        const method = methods.find((m) => m.type === type);
        const on = selected === type;
        const Icon = type === 'pay_after' ? Wallet : CreditCard;

        return (
          <Pressable
            key={type}
            style={[styles.tile, on && styles.tileOn]}
            onPress={() => onSelect(type)}
          >
            <View style={[styles.iconWrap, on && styles.iconWrapOn]}>
              <Icon size={22} color={on ? colors.lime : colors.green} />
            </View>
            <View style={styles.body}>
              <Text style={[styles.title, on && styles.titleOn]}>{method?.label ?? meta.title}</Text>
              <Text style={[styles.sub, on && styles.subOn]}>{meta.subtitle}</Text>
              {method?.details ? <Text style={styles.details}>{method.details}</Text> : null}
            </View>
            <View style={[styles.check, on && styles.checkOn]}>
              {on ? <Check size={16} color={colors.white} strokeWidth={3} /> : null}
            </View>
          </Pressable>
        );
      })}
      {showManageLink ? (
        <Pressable style={styles.manage} onPress={() => router.push('/(customer)/payment-methods')}>
          <Text style={styles.manageText}>Manage saved payment methods</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeRow: { marginBottom: spacing.md },
  badge: {
    alignSelf: 'flex-start',
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: premium.accentGold,
    backgroundColor: premium.accentGoldBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  tileOn: {
    borderColor: colors.forest,
    backgroundColor: colors.soft,
    ...premium.shadowSoft,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapOn: { backgroundColor: colors.forest },
  body: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  titleOn: { color: colors.forest },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 17 },
  subOn: { color: colors.forest },
  details: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 4 },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.green, borderColor: colors.green },
  manage: { marginTop: spacing.sm, paddingVertical: 10 },
  manageText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.green, textAlign: 'center' },
});

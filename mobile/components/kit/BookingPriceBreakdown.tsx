import { StyleSheet, Text, View } from 'react-native';
import type { BookingAmount } from '@/types/api';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function BookingPriceBreakdown({
  amount,
  compact,
}: {
  amount: Pick<BookingAmount, 'base' | 'gst' | 'coupon' | 'total'>;
  compact?: boolean;
}) {
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={styles.goldRule} />
      <Text style={styles.heading}>Price breakdown</Text>
      <Row label="Service charge" value={`₹${amount.base}`} />
      <Row label="GST (18%)" value={`₹${amount.gst}`} />
      {amount.coupon > 0 ? (
        <Row label="Coupon discount" value={`-₹${amount.coupon}`} valueStyle={styles.discount} />
      ) : null}
      <View style={styles.divider} />
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>You pay</Text>
        <Text style={styles.totalValue}>₹{amount.total}</Text>
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
    overflow: 'hidden',
    ...shadows.card,
  },
  goldRule: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    right: spacing.md,
    height: 2,
    backgroundColor: premium.accentGold,
    opacity: 0.55,
    borderRadius: 1,
  },
  compact: { padding: spacing.sm },
  heading: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.muted,
    marginBottom: spacing.sm,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  value: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  discount: { color: colors.green },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    backgroundColor: colors.soft,
    marginHorizontal: -spacing.sm,
    marginBottom: -spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 14,
  },
  totalLabel: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  totalValue: { fontFamily: fonts.displayExtra, fontSize: 22, color: premium.accentGold, letterSpacing: -0.3 },
});

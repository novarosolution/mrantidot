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
      <Text style={styles.heading}>Price breakdown</Text>
      <Row label="Service charge" value={`₹${amount.base}`} />
      <Row label="GST (18%)" value={`₹${amount.gst}`} />
      {amount.coupon > 0 ? (
        <Row label="Coupon discount" value={`-₹${amount.coupon}`} valueStyle={styles.discount} />
      ) : null}
      <View style={styles.divider} />
      <Row label="You pay" value={`₹${amount.total}`} bold gold />
    </View>
  );
}

function Row({
  label,
  value,
  bold,
  gold,
  valueStyle,
}: {
  label: string;
  value: string;
  bold?: boolean;
  gold?: boolean;
  valueStyle?: object;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, bold && styles.labelBold]}>{label}</Text>
      <Text style={[styles.value, bold && styles.valueBold, gold && styles.valueGold, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  compact: { padding: spacing.sm },
  heading: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted, marginBottom: spacing.sm, letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  labelBold: { fontFamily: fonts.bodySemi, color: colors.ink, fontSize: 14 },
  value: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  valueBold: { fontFamily: fonts.displayExtra, fontSize: 20 },
  valueGold: { color: premium.accentGold },
  discount: { color: colors.green },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
});

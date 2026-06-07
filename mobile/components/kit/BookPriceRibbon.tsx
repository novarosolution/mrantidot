import { StyleSheet, Text, View } from 'react-native';
import { IndianRupee, Tag } from 'lucide-react-native';
import { colors, fonts, premium, spacing } from '@/constants/theme';

/** Always-visible price strip — stays above scroll content so total is never hidden. */
export function BookPriceRibbon({
  total,
  savings,
  stepHint,
}: {
  total: number;
  savings?: number;
  stepHint?: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <Text style={styles.kicker}>Estimated total</Text>
        {stepHint ? <Text style={styles.hint} numberOfLines={1}>{stepHint}</Text> : null}
        {savings && savings > 0 ? (
          <View style={styles.saveRow}>
            <Tag size={11} color={colors.green} />
            <Text style={styles.saveText}>You save ₹{savings}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.amountWrap}>
        <IndianRupee size={16} color={premium.accentGold} strokeWidth={2.5} />
        <Text style={styles.amount}>{total}</Text>
      </View>
    </View>
  );
}

export function BookStepFieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      {hint ? <Text style={fieldStyles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(182,132,28,0.22)',
    ...premium.shadowSoft,
  },
  left: { flex: 1, minWidth: 0 },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.forest,
    marginTop: 2,
  },
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  saveText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.green },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: premium.accentGoldBg,
  },
  amount: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: premium.accentGold,
    letterSpacing: -0.3,
  },
});

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm, marginTop: spacing.xs },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.ink,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
});

import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function BookingActionBar({
  primaryTitle,
  onPrimary,
  primaryLoading,
  primaryDisabled,
  secondaryTitle,
  onSecondary,
  totalLabel,
  totalAmount,
  highlightTotal,
}: {
  primaryTitle: string;
  onPrimary: () => void;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  secondaryTitle?: string;
  onSecondary?: () => void;
  totalLabel?: string;
  totalAmount?: string;
  highlightTotal?: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      {totalAmount ? (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{totalLabel ?? 'Estimated total'}</Text>
          <Text style={[styles.totalAmount, highlightTotal && styles.totalGold]}>{totalAmount}</Text>
        </View>
      ) : null}
      <View style={styles.buttons}>
        {secondaryTitle && onSecondary ? (
          <Button title={secondaryTitle} variant="secondary" onPress={onSecondary} style={styles.secondary} />
        ) : null}
        <Button
          title={primaryTitle}
          variant="premium"
          onPress={onPrimary}
          loading={primaryLoading}
          disabled={primaryDisabled}
          style={secondaryTitle ? styles.primary : styles.primaryFull}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: premium.surfaceElevated,
    ...premium.shadowSoft,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  totalLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  totalAmount: { fontFamily: fonts.displayExtra, fontSize: 22, color: colors.green },
  totalGold: { color: premium.accentGold },
  buttons: { flexDirection: 'row', gap: spacing.sm },
  secondary: { flex: 1, minHeight: 52 },
  primary: { flex: 2, minHeight: 52 },
  primaryFull: { flex: 1 },
});

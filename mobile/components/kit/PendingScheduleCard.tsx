import { StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';

export function PendingScheduleCard({
  title,
  scheduleLabel,
  hint,
  modeLabel,
  notes,
  customerName,
  variant = 'customer',
  hintTone = 'info',
}: {
  title: string;
  scheduleLabel: string | null;
  hint?: string;
  modeLabel?: string;
  notes?: string;
  customerName?: string;
  variant?: 'customer' | 'admin';
  /** 'warning' when the hint needs action (e.g. the requested time has passed). */
  hintTone?: 'info' | 'warning';
}) {
  if (!scheduleLabel) return null;

  const isCustomer = variant === 'customer';

  return (
    <View style={[styles.wrap, isCustomer && styles.wrapCustomer]}>
      <View style={styles.card}>
        <View style={styles.head}>
          <View style={[styles.icon, !isCustomer && styles.iconAdmin]}>
            <PremiumIcon icon={AppIcons.ui.clock} variant="mint" size="md" color={colors.forest} boxSize={44} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.title}>{title}</Text>
            {modeLabel ? <Text style={styles.mode}>{modeLabel}</Text> : null}
          </View>
        </View>
        <Text style={styles.schedule}>{scheduleLabel}</Text>
        {notes ? <Text style={styles.notes}>“{notes}”</Text> : null}
        {customerName ? <Text style={styles.customer}>Customer: {customerName}</Text> : null}
        {hint ? (
          <View style={[styles.hintBox, hintTone === 'warning' && styles.hintBoxWarn]}>
            <Text style={[styles.hint, hintTone === 'warning' && styles.hintWarn]}>{hint}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xs },
  wrapCustomer: { marginHorizontal: 0 },
  card: {
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    overflow: 'hidden',
    ...ui.shadow,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEF2EF',
  },
  iconAdmin: { backgroundColor: colors.mint },
  flex: { flex: 1 },
  title: { fontFamily: fonts.display, fontSize: 14, color: colors.ink },
  mode: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, marginTop: 2 },
  schedule: { fontFamily: fonts.displayExtra, fontSize: 17, color: colors.forest, lineHeight: 24 },
  notes: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.ink,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  customer: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, marginTop: spacing.sm },
  hintBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: '#EEF2EF',
  },
  hint: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, lineHeight: 18 },
  hintBoxWarn: { backgroundColor: colors.amberBg, borderColor: 'rgba(154,111,18,0.18)' },
  hintWarn: { color: colors.warning, fontFamily: fonts.bodySemi },
});

import { StyleSheet, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function PendingScheduleCard({
  title,
  scheduleLabel,
  hint,
  modeLabel,
  notes,
  customerName,
  variant = 'customer',
}: {
  title: string;
  scheduleLabel: string | null;
  hint: string;
  modeLabel?: string;
  notes?: string;
  customerName?: string;
  variant?: 'customer' | 'admin';
}) {
  if (!scheduleLabel) return null;

  return (
    <Card
      variant="premium"
      style={variant === 'customer' ? styles.customerCard : styles.card}
    >
      <View style={styles.head}>
        <View style={[styles.icon, variant === 'admin' && styles.iconAdmin]}>
          <Clock size={18} color={variant === 'admin' ? colors.secondaryDark : colors.forest} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>{title}</Text>
          {modeLabel ? <Text style={styles.mode}>{modeLabel}</Text> : null}
        </View>
      </View>
      <Text style={styles.schedule}>{scheduleLabel}</Text>
      {notes ? <Text style={styles.notes}>“{notes}”</Text> : null}
      {customerName ? <Text style={styles.customer}>Customer: {customerName}</Text> : null}
      <Text style={styles.hint}>{hint}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.sm, padding: spacing.md },
  customerCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...premium.shadowSoft,
  },
  iconAdmin: { backgroundColor: colors.secondarySoft },
  flex: { flex: 1 },
  title: { fontFamily: fonts.display, fontSize: 13.5, color: colors.ink },
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
  hint: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: spacing.sm, lineHeight: 18 },
});

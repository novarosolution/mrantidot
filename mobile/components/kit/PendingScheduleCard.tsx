import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

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
  hint?: string;
  modeLabel?: string;
  notes?: string;
  customerName?: string;
  variant?: 'customer' | 'admin';
}) {
  if (!scheduleLabel) return null;

  const isCustomer = variant === 'customer';

  return (
    <View style={[styles.wrap, isCustomer && styles.wrapCustomer]}>
      <LinearGradient colors={['#FFFFFF', '#F6FAF7']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
        <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={styles.head}>
          <View style={[styles.icon, !isCustomer && styles.iconAdmin]}>
            <Clock size={18} color={isCustomer ? colors.forest : colors.secondaryDark} strokeWidth={2.2} />
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
          <View style={styles.hintBox}>
            <Text style={styles.hint}>{hint}</Text>
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xs },
  wrapCustomer: { marginHorizontal: 0 },
  card: {
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.08)',
    overflow: 'hidden',
    ...shadows.card,
  },
  goldBar: {
    height: 3,
    marginHorizontal: -spacing.md,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
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
    borderColor: 'rgba(20,83,45,0.08)',
  },
  iconAdmin: { backgroundColor: colors.secondarySoft },
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
    borderColor: 'rgba(20,83,45,0.06)',
  },
  hint: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, lineHeight: 18 },
});

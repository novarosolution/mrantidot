import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { formatRupeeFull } from '@/components/kit/format';
import { homeShadow } from '@/components/kit/homeUi';
import { PressableScale } from '@/components/ui/PressableScale';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import type { TechnicianStats } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

/** Jobs tab hero: this month's earnings plus active / done / rating, opens the profile. */
export function TechEarningsCard({
  stats,
  activeCount,
  onPress,
}: {
  stats: TechnicianStats;
  activeCount: number;
  onPress: () => void;
}) {
  const copy = useCustomerUiCopy();
  const rating = stats.rating > 0 ? `★ ${stats.rating.toFixed(1)}` : '—';
  const items = [
    { key: 'active', value: String(activeCount), label: copy.techStatActive },
    { key: 'done', value: String(stats.jobsDone ?? stats.completed), label: copy.techStatJobsDone },
    { key: 'rating', value: rating, label: copy.techStatRating },
  ];

  return (
    <PressableScale
      onPress={onPress}
      haptic="tap"
      containerStyle={styles.shell}
      style={styles.press}
      accessibilityRole="button"
      accessibilityLabel={`${copy.techEarningsA11y}. ${copy.techEarnedThisMonth} ${formatRupeeFull(stats.earnings)}`}
    >
      <LinearGradient
        colors={[colors.headerGreen, colors.forest, colors.forestDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.top}>
          <View style={styles.flex}>
            <Text style={styles.label}>{copy.techEarnedThisMonth}</Text>
            <Text style={styles.value}>{formatRupeeFull(stats.earnings)}</Text>
            {stats.paySummary ? <Text style={styles.hint}>{stats.paySummary}</Text> : null}
          </View>
          <View style={styles.chevron}>
            <ChevronRight size={18} color={colors.white} strokeWidth={2.4} />
          </View>
        </View>
        <View style={styles.stats}>
          {items.map((item, i) => (
            <View key={item.key} style={[styles.stat, i > 0 && styles.statDivided]}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  shell: { marginBottom: spacing.sm },
  press: { borderRadius: 22, ...homeShadow.card },
  card: { borderRadius: 22, padding: 18, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  flex: { flex: 1 },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.limeOnDark,
  },
  value: { marginTop: 4, fontFamily: fonts.displayExtra, fontSize: 30, letterSpacing: -0.6, color: colors.white },
  hint: { marginTop: 2, fontFamily: fonts.body, fontSize: 12.5, color: colors.limeOnDark },
  chevron: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.forestDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.forestDeep,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivided: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.forestMid },
  statValue: { fontFamily: fonts.displayExtra, fontSize: 16, color: colors.white },
  statLabel: { marginTop: 1, fontFamily: fonts.bodySemi, fontSize: 11, color: colors.limeOnDark },
});

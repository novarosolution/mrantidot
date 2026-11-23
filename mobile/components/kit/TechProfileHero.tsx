import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCheck, MapPin, Phone } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { PremiumAppHeader } from '@/components/kit/PremiumAppHeader';
import { TechDutyPill } from '@/components/tech/TechDutyPill';
import { formatRupee, formatRupeeFull } from '@/components/kit/format';
import { useLocation } from '@/context/LocationContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { useTechCopy } from '@/lib/tech-copy';
import { dutyState } from '@/lib/techLabels';
import type { DayAttendanceStatus, TechnicianStats } from '@/types/api';
import { colors, fonts, gradients, radii, spacing, ui } from '@/constants/theme';

/** Technician profile header + identity card: avatar, name, place / phone, duty and verified pills, key stats. */
export function TechProfileHero({
  name,
  phone,
  city,
  stats,
  todayStatus,
  onDuty = false,
}: {
  name: string;
  phone?: string;
  city?: string;
  /** Current-month stats (rating, jobs done, this month's earnings); null while loading. */
  stats: TechnicianStats | null;
  todayStatus: DayAttendanceStatus;
  /** Present + not checked out. */
  onDuty?: boolean;
}) {
  const booking = useTechCopy();
  const copy = useCustomerUiCopy();
  const { displayLabel } = useLocation();
  const placeLabel = displayLabel || city;
  const initial = name.trim()[0]?.toUpperCase() ?? 'T';
  const state = dutyState(todayStatus, onDuty);

  const statItems = stats
    ? [
        { key: 'rating', value: stats.rating > 0 ? `★ ${stats.rating.toFixed(1)}` : '—', label: copy.techStatRating },
        { key: 'done', value: String(stats.jobsDone ?? stats.completed), label: copy.techStatJobsDone },
        {
          key: 'month',
          // Full amount while it fits the cell; lakhs collapse to "₹1.23L".
          value: stats.earnings >= 100000 ? formatRupee(stats.earnings) : formatRupeeFull(stats.earnings),
          label: copy.techStatThisMonth,
        },
      ]
    : [];

  return (
    <View style={styles.root}>
      <PremiumAppHeader eyebrow={copy.techProfileEyebrow} title={booking.techProfileTitle} subtitle={copy.techProfileSubtitle} />

      <View style={styles.cardWrap}>
        <View style={styles.card}>
          <View style={styles.identity}>
            <LinearGradient colors={[...gradients.avatarRing]} style={styles.avatarRing}>
              <LinearGradient
                colors={[colors.greenBright, colors.forest]}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>{initial}</Text>
              </LinearGradient>
            </LinearGradient>

            <View style={styles.body}>
              <Text style={styles.name} numberOfLines={1} accessibilityRole="header">
                {name}
              </Text>
              {placeLabel ? (
                <View style={styles.metaRow}>
                  <MapPin size={13} color={ui.textTertiary} strokeWidth={2.2} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {placeLabel}
                  </Text>
                </View>
              ) : null}
              {phone ? (
                <View style={styles.metaRow}>
                  <Phone size={13} color={ui.textTertiary} strokeWidth={2.2} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {phone}
                  </Text>
                </View>
              ) : null}
              <View style={styles.pills}>
                <TechDutyPill state={state} size="sm" />
                <View style={[styles.pill, styles.verified]}>
                  <BadgeCheck size={13} color={ui.brand} strokeWidth={2.3} />
                  <Text style={[styles.pillText, styles.verifiedText]}>{copy.techVerifiedBadge}</Text>
                </View>
              </View>
            </View>
          </View>

          {statItems.length ? (
            <View style={styles.stats}>
              {statItems.map((item, i) => (
                <View
                  key={item.key}
                  style={[styles.stat, i > 0 && styles.statDivided]}
                  accessible
                  accessibilityLabel={`${item.label}, ${item.value}`}
                >
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginBottom: spacing.md },
  cardWrap: { paddingHorizontal: spacing.md, marginTop: 2 },
  card: {
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 24,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 26, color: colors.white },
  body: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.displayExtra, fontSize: 19, letterSpacing: -0.35, color: ui.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3, minWidth: 0 },
  metaText: { flexShrink: 1, fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  pillText: { fontFamily: fonts.bodySemi, fontSize: 11.5 },
  verified: { backgroundColor: ui.surfaceMuted },
  verifiedText: { color: ui.brand },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: ui.surfaceMuted,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivided: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: ui.border },
  statValue: { fontFamily: fonts.displayExtra, fontSize: 16, letterSpacing: -0.2, color: ui.brand },
  statLabel: {
    marginTop: 2,
    fontFamily: fonts.bodySemi,
    fontSize: 10.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: ui.textTertiary,
  },
});

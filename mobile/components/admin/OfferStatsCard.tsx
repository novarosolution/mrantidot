import { ChevronRight } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatINR, formatIndianNumber } from '@/components/charts/chartFormat';
import { formatDayKey } from '@/components/kit/format';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';
import { formatTimeAgo } from '@/lib/time-ago';
import type { OfferRecentUse, OfferStats } from '@/types/adminManage';

const STATUS_TONE: Record<string, BadgeTone> = {
  pending: 'warning',
  confirmed: 'info',
  in_progress: 'info',
  awaiting_verification: 'warning',
  completed: 'success',
  cancelled: 'neutral',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  awaiting_verification: 'To verify',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

/** Coupon performance on the offer screen: uses, discount given, revenue, last use and the latest bookings. */
export const OfferStatsCard = memo(function OfferStatsCard({
  stats,
  recent,
  maxUses,
  onOpenBooking,
  onViewAll,
}: {
  stats: OfferStats;
  recent: OfferRecentUse[];
  maxUses?: number;
  onOpenBooking: (bookingId: string) => void;
  onViewAll?: () => void;
}) {
  const used = stats.uses;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Performance</Text>
      <Text style={styles.hint}>
        {used + stats.cancelled === 0
          ? 'Not used yet — numbers appear after the first booking with this code.'
          : `From bookings with this code${stats.cancelled ? ` · ${stats.cancelled} cancelled not counted` : ''}`}
      </Text>
      <View style={styles.grid}>
        <Stat label="Times used" value={`${formatIndianNumber(used)}${maxUses ? ` / ${formatIndianNumber(maxUses)}` : ''}`} sub={stats.customers ? `${stats.customers} customer${stats.customers === 1 ? '' : 's'}` : undefined} />
        <Stat label="Discount given" value={formatINR(stats.discountGiven)} />
        <Stat label="Revenue" value={formatINR(stats.revenue)} sub={stats.completed ? `${stats.completed} completed` : 'No completed visits yet'} />
        <Stat label="Last used" value={stats.lastUsedAt ? formatTimeAgo(stats.lastUsedAt) : '—'} sub={stats.lastUsedAt ? formatDayKey(stats.lastUsedAt.slice(0, 10)) : undefined} />
      </View>

      {recent.length ? (
        <View style={styles.recent}>
          <Text style={styles.recentTitle}>Latest bookings</Text>
          {recent.map((r) => (
            <Pressable
              key={r.bookingId}
              onPress={() => onOpenBooking(r.bookingId)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Booking ${r.ref}, ${r.customerName}, ${STATUS_LABEL[r.status] ?? r.status}`}
            >
              <View style={styles.flex}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {r.customerName} · {r.serviceName}
                </Text>
                <Text style={styles.rowMeta}>
                  {r.ref} · {formatDayKey(r.createdAt.slice(0, 10))} · −{formatINR(r.discount)} on {formatINR(r.total)}
                </Text>
              </View>
              <StatusBadge label={STATUS_LABEL[r.status] ?? r.status} tone={STATUS_TONE[r.status] ?? 'neutral'} />
              <ChevronRight size={16} color={ui.textTertiary} strokeWidth={2.2} />
            </Pressable>
          ))}
          {onViewAll && used + stats.cancelled > recent.length ? (
            <Pressable onPress={onViewAll} hitSlop={6} accessibilityRole="button" style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}>
              <Text style={styles.viewAllText}>See all {formatIndianNumber(used + stats.cancelled)} bookings</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  title: { fontFamily: fonts.displayExtra, fontSize: 16, color: colors.ink, letterSpacing: -0.3 },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { flexGrow: 1, flexBasis: '45%', minWidth: 130, padding: 12, borderRadius: 14, backgroundColor: ui.surfaceMuted },
  statValue: { fontFamily: fonts.displayExtra, fontSize: 18, color: ui.text },
  statLabel: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: ui.textSecondary, marginTop: 2 },
  statSub: { fontFamily: fonts.body, fontSize: 11, color: ui.textTertiary, marginTop: 1 },
  recent: { marginTop: spacing.md },
  recentTitle: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.textSecondary, marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  flex: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text },
  rowMeta: { fontFamily: fonts.body, fontSize: 11.5, color: ui.textSecondary, marginTop: 1 },
  pressed: { opacity: 0.7 },
  viewAll: { paddingTop: 10 },
  viewAllText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
});

import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Star } from 'lucide-react-native';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { RevenueAreaChart } from '@/components/charts/RevenueAreaChart';
import { StatusDonut } from '@/components/charts/StatusDonut';
import { STATUS_CHART_COLORS, formatINR, formatINRCompact, formatIndianNumber, percentOf } from '@/components/charts/chartFormat';
import { initials } from '@/components/kit/format';
import { StatusPill } from '@/components/ui/StatusPill';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';
import { bookingCustomerName, bookingServiceName, bookingStatusLabel } from '@/lib/booking-helpers';
import { formatSlotLabel, formatTime12h } from '@/lib/dates';
import type { DashboardStats } from '@/types/adminLists';
import type { Booking, BookingStatus, User } from '@/types/api';

/** Shared blocks for the admin dashboard and reports (GET /stats/admin). */

/** White card used by the dashboard blocks (radius 20, hairline border). */
export function DashCard({
  title,
  hint,
  actionLabel,
  onAction,
  right,
  children,
  style,
}: {
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  right?: ReactNode;
  children: ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHead}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          {hint ? <Text style={styles.cardHint}>{hint}</Text> : null}
        </View>
        {right}
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            hitSlop={8}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`${actionLabel}, ${title}`}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
            <ChevronRight size={14} color={colors.forest} strokeWidth={2.6} />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/* ─── Revenue ───────────────────────────────────────────────────────── */

export function RevenueCard({ stats, onOpen }: { stats: DashboardStats; onOpen?: () => void }) {
  const { revenue, series, range } = stats;
  const monthly = range.bucket === 'month';
  return (
    <DashCard
      title="Revenue"
      hint={`Completed jobs by completion date · ${monthly ? 'per month' : 'per day'}`}
      actionLabel={onOpen ? 'Reports' : undefined}
      onAction={onOpen}
    >
      <View style={styles.revenueTop}>
        <View style={styles.revenueMain}>
          <Text style={styles.revenueValue} numberOfLines={1}>
            {formatINR(revenue.total)}
          </Text>
          <Text style={styles.revenueSub}>incl. GST · {formatIndianNumber(revenue.jobs)} jobs</Text>
        </View>
        <View style={styles.splitCol}>
          <Text style={styles.splitLine}>
            Net <Text style={styles.splitStrong}>{formatINR(revenue.net)}</Text>
          </Text>
          <Text style={styles.splitLine}>
            GST <Text style={styles.splitStrong}>{formatINR(revenue.gst)}</Text>
          </Text>
          {revenue.coupon > 0 ? (
            <Text style={styles.splitLine}>
              Coupons <Text style={styles.splitStrong}>−{formatINR(revenue.coupon)}</Text>
            </Text>
          ) : null}
        </View>
      </View>
      <RevenueAreaChart
        points={series.map((p) => ({ key: p.key, label: p.label, value: p.revenue }))}
        trigger={`${range.from}:${range.to}`}
        emptyLabel="No completed jobs in this range"
        tooltip={(i) => {
          const p = series[i];
          return {
            title: monthly ? p.label : `${p.label}`,
            lines: [
              `${formatINR(p.revenue)} · ${p.jobs} ${p.jobs === 1 ? 'job' : 'jobs'}`,
              `Net ${formatINR(p.net)} · GST ${formatINR(p.gst)}`,
              `${p.bookings} new ${p.bookings === 1 ? 'booking' : 'bookings'}`,
            ],
          };
        }}
      />
    </DashCard>
  );
}

/* ─── Status donut ───────────────────────────────────────────────────── */

export function StatusCard({
  stats,
  onStatusPress,
}: {
  stats: DashboardStats;
  onStatusPress?: (status: BookingStatus) => void;
}) {
  const segments = stats.bookings.byStatus.map((s) => ({
    key: s.status,
    label: bookingStatusLabel(s.status),
    value: s.count,
    color: STATUS_CHART_COLORS[s.status] ?? colors.muted,
  }));
  return (
    <DashCard
      title="Bookings by status"
      hint={`${formatIndianNumber(stats.bookings.created)} booked in this range · where they stand now`}
    >
      <StatusDonut
        segments={segments}
        centerLabel="Booked"
        trigger={`${stats.range.from}:${stats.range.to}`}
        onSegmentPress={onStatusPress ? (key) => onStatusPress(key as BookingStatus) : undefined}
      />
    </DashCard>
  );
}

/* ─── Top services ───────────────────────────────────────────────────── */

export function TopServicesCard({
  stats,
  onServicePress,
  limit = 5,
}: {
  stats: DashboardStats;
  onServicePress?: (serviceId: string) => void;
  limit?: number;
}) {
  return (
    <DashCard title="Top services" hint="By revenue from completed jobs">
      <HorizontalBars
        items={stats.topServices.slice(0, limit).map((s) => ({
          key: s.serviceId,
          label: s.name,
          sublabel: `${s.jobs} ${s.jobs === 1 ? 'job' : 'jobs'}`,
          value: s.revenue,
          valueLabel: formatINRCompact(s.revenue),
        }))}
        trigger={`${stats.range.from}:${stats.range.to}`}
        onItemPress={onServicePress}
        emptyLabel="No completed jobs in this range"
      />
    </DashCard>
  );
}

/* ─── Technician leaderboard ─────────────────────────────────────────── */

export function LeaderboardCard({
  stats,
  onTechPress,
  limit = 5,
  actionLabel,
  onAction,
}: {
  stats: DashboardStats;
  onTechPress?: (id: string) => void;
  limit?: number;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const rows = stats.leaderboard.slice(0, limit);
  return (
    <DashCard title="Technician leaderboard" hint="Completed jobs in this range" actionLabel={actionLabel} onAction={onAction}>
      {rows.length === 0 ? (
        <Text style={styles.empty}>No completed jobs in this range</Text>
      ) : (
        rows.map((t, i) => (
          <Pressable
            key={t.id}
            disabled={!onTechPress}
            onPress={onTechPress ? () => onTechPress(t.id) : undefined}
            style={({ pressed }) => [styles.leaderRow, i === rows.length - 1 && styles.leaderLast, pressed && styles.pressed]}
            accessibilityRole={onTechPress ? 'button' : 'text'}
            accessibilityLabel={`${i + 1}. ${t.name}: ${t.jobs} jobs, ${formatINR(t.revenue)}, rating ${t.rating || 'none'}`}
          >
            <Text style={[styles.rank, i === 0 && styles.rankFirst]}>{i + 1}</Text>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(t.name)}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.leaderName} numberOfLines={1}>
                {t.name}
              </Text>
              <View style={styles.leaderMetaRow}>
                <Star size={11} color={colors.amber} fill={colors.amber} strokeWidth={1.5} />
                <Text style={styles.leaderMeta}>
                  {t.rating > 0 ? t.rating.toFixed(1) : '—'}
                  {t.reviewsInRange > 0 ? ` · ${t.reviewsInRange} new ${t.reviewsInRange === 1 ? 'review' : 'reviews'}` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.leaderNums}>
              <Text style={styles.leaderJobs}>{t.jobs} jobs</Text>
              <Text style={styles.leaderRevenue}>{formatINRCompact(t.revenue)}</Text>
            </View>
          </Pressable>
        ))
      )}
    </DashCard>
  );
}

/* ─── Today's schedule ───────────────────────────────────────────────── */

function personName(value: Booking['technician']): string | null {
  return value && typeof value === 'object' ? (value as User).name : null;
}

function visitTime(b: Booking): string {
  if (b.schedule?.time) return formatTime12h(b.schedule.time);
  if (b.schedule?.slot) return formatSlotLabel(b.schedule.slot);
  return 'Time TBD';
}

export function TodayScheduleStrip({
  bookings,
  onOpen,
  onAll,
}: {
  bookings: Booking[];
  onOpen: (id: string) => void;
  onAll?: () => void;
}) {
  return (
    <DashCard
      title="Today's schedule"
      hint={bookings.length ? `${bookings.length} ${bookings.length === 1 ? 'visit' : 'visits'} today, by time slot` : 'No visits today'}
      actionLabel={onAll ? 'All' : undefined}
      onAction={onAll}
    >
      {bookings.length === 0 ? (
        <Text style={styles.empty}>Nothing scheduled for today.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
          {bookings.map((b) => {
            const tech = personName(b.technician);
            return (
              <Pressable
                key={b.id}
                onPress={() => onOpen(b.id)}
                style={({ pressed }) => [styles.visit, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`${visitTime(b)}, ${bookingServiceName(b)} for ${bookingCustomerName(b)}, ${tech ?? 'no technician'}. Open booking`}
              >
                <Text style={styles.visitTime} numberOfLines={1}>
                  {visitTime(b)}
                </Text>
                <Text style={styles.visitService} numberOfLines={1}>
                  {bookingServiceName(b)}
                </Text>
                <Text style={styles.visitMeta} numberOfLines={1}>
                  {bookingCustomerName(b)}
                </Text>
                <Text style={[styles.visitTech, !tech && styles.visitNoTech]} numberOfLines={1}>
                  {tech ?? 'No technician'}
                </Text>
                <View style={styles.visitPill}>
                  <StatusPill status={b.status} />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </DashCard>
  );
}

/* ─── Pending actions ────────────────────────────────────────────────── */

export type PendingAction = { key: string; count: number; label: string; tone?: 'warn' | 'info'; onPress: () => void };

export function PendingActionsCard({ actions, footer }: { actions: PendingAction[]; footer?: ReactNode }) {
  const due = actions.filter((a) => a.count > 0);
  return (
    <DashCard title="Needs attention" hint={due.length ? 'Right now, across all dates' : 'Right now'}>
      {due.length === 0 ? (
        <Text style={styles.allClear}>All caught up — nothing is waiting on you.</Text>
      ) : (
        due.map((a, i) => (
          <Pressable
            key={a.key}
            onPress={a.onPress}
            style={({ pressed }) => [styles.pendingRow, i === due.length - 1 && styles.leaderLast, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`${a.count} ${a.label}`}
          >
            <View style={[styles.countBubble, a.tone === 'warn' && styles.countWarn]}>
              <Text style={[styles.countText, a.tone === 'warn' && styles.countTextWarn]}>{formatIndianNumber(a.count)}</Text>
            </View>
            <Text style={styles.pendingLabel} numberOfLines={2}>
              {a.label}
            </Text>
            <ChevronRight size={16} color={ui.textTertiary} strokeWidth={2.2} />
          </Pressable>
        ))
      )}
      {footer}
    </DashCard>
  );
}

/* ─── Payment split ──────────────────────────────────────────────────── */

export function PaymentsCard({ stats }: { stats: DashboardStats }) {
  const { methods, statuses } = stats.payments;
  const total = methods.reduce((s, m) => s + m.count, 0);
  return (
    <DashCard title="Payments" hint="Completed jobs in this range">
      {total === 0 ? (
        <Text style={styles.empty}>No completed jobs in this range</Text>
      ) : (
        <View style={styles.payGrid}>
          {methods.map((m) => (
            <View key={m.key} style={styles.payCell}>
              <Text style={styles.payValue}>{percentOf(m.count, total)}</Text>
              <Text style={styles.payLabel} numberOfLines={1}>
                {m.label}
              </Text>
              <Text style={styles.paySub}>
                {m.count} · {formatINRCompact(m.amount)}
              </Text>
            </View>
          ))}
          {statuses
            .filter((s) => s.count > 0)
            .map((s) => (
              <View key={s.key} style={styles.payCell}>
                <Text style={[styles.payValue, s.key === 'unpaid' && styles.payWarn]}>{formatIndianNumber(s.count)}</Text>
                <Text style={styles.payLabel}>{s.label}</Text>
                <Text style={styles.paySub}>{formatINRCompact(s.amount)}</Text>
              </View>
            ))}
        </View>
      )}
    </DashCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },
  card: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: ui.hairline,
    padding: spacing.md,
    ...ui.shadow,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: spacing.sm },
  cardTitle: { fontFamily: fonts.display, fontSize: 16.5, letterSpacing: -0.3, color: ui.text },
  cardHint: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: ui.textSecondary, marginTop: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingTop: 2 },
  actionText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  empty: { fontFamily: fonts.bodyMedium, fontSize: 13, color: ui.textTertiary, paddingVertical: spacing.md, textAlign: 'center' },
  revenueTop: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: spacing.sm, flexWrap: 'wrap' },
  revenueMain: { flex: 1, minWidth: 150 },
  revenueValue: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.8, color: ui.text },
  revenueSub: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary },
  splitCol: { alignItems: 'flex-end', gap: 1 },
  splitLine: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  splitStrong: { fontFamily: fonts.bodySemi, color: ui.text },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  leaderLast: { borderBottomWidth: 0 },
  rank: { width: 18, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 13, color: ui.textTertiary },
  rankFirst: { color: colors.forest },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 12, color: colors.white },
  leaderName: { fontFamily: fonts.bodySemi, fontSize: 14, color: ui.text },
  leaderMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  leaderMeta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary },
  leaderNums: { alignItems: 'flex-end' },
  leaderJobs: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: ui.text },
  leaderRevenue: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.forest, marginTop: 1 },
  strip: { gap: 10, paddingRight: 4 },
  visit: {
    width: 188,
    padding: 12,
    borderRadius: 16,
    backgroundColor: ui.surfaceMuted,
    borderWidth: 1,
    borderColor: ui.hairline,
    gap: 2,
  },
  visitTime: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.forest },
  visitService: { fontFamily: fonts.bodySemi, fontSize: 14, color: ui.text, marginTop: 4 },
  visitMeta: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  visitTech: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.text, marginTop: 2 },
  visitNoTech: { color: colors.warning },
  visitPill: { marginTop: 8, alignSelf: 'flex-start' },
  allClear: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.forest, paddingVertical: spacing.sm },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  countBubble: {
    minWidth: 36,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.brandSoft,
  },
  countWarn: { backgroundColor: colors.amberBg },
  countText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.forest },
  countTextWarn: { color: colors.amberInk },
  pendingLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13.5, color: ui.text },
  payGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  payCell: {
    flexGrow: 1,
    flexBasis: 130,
    padding: 12,
    borderRadius: 14,
    backgroundColor: ui.surfaceMuted,
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  payValue: { fontFamily: fonts.display, fontSize: 20, letterSpacing: -0.4, color: ui.text },
  payWarn: { color: colors.warning },
  payLabel: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.text, marginTop: 2 },
  paySub: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 1 },
});

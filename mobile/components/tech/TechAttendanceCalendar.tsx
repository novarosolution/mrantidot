import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BookingListCard } from '@/components/kit/BookingListCard';
import { formatDayKey } from '@/components/kit/format';
import {
  TechMonthGrid,
  monthKeyOf,
  shiftMonthKey,
  type MonthDayMark,
} from '@/components/tech/TechMonthGrid';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { bookingVisitDate } from '@/lib/booking-helpers';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { localDateKey } from '@/lib/dates';
import { haptic, stagger } from '@/lib/motion';
import { jobCount } from '@/lib/techLabels';
import type { Booking, CustomerUiCopy, DayAttendanceStatus } from '@/types/api';
import { colors, fonts, radii, spacing, surfaces, ui } from '@/constants/theme';

const TONE: Partial<Record<DayAttendanceStatus, MonthDayMark['tone']>> = {
  came: 'present',
  not_came: 'absent',
  leave: 'leave',
  pending: 'pending',
};

function statusText(copy: CustomerUiCopy, status?: DayAttendanceStatus): string | null {
  switch (status) {
    case 'came':
      return copy.techCalPresent;
    case 'not_came':
      return copy.techDutyAbsent;
    case 'leave':
      return copy.techCalLeave;
    case 'pending':
      return copy.techCalPending;
    default:
      return null;
  }
}

/** Furthest month ahead the calendar opens (jobs can be booked a little in advance). */
const MONTHS_AHEAD = 3;

/**
 * Profile calendar: each day tinted by attendance, a counter for that day's jobs, and the picked day's
 * jobs listed underneath.
 */
export function TechAttendanceCalendar({
  month,
  onMonthChange,
  attendance,
  bookings,
  onPressJob,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  attendance: Record<string, DayAttendanceStatus>;
  bookings: Booking[];
  onPressJob: (id: string) => void;
}) {
  const copy = useCustomerUiCopy();
  const today = localDateKey();
  const [selected, setSelected] = useState(today);

  // Switching month picks today (when it is in that month) or the 1st.
  useEffect(() => {
    setSelected((cur) => (monthKeyOf(cur) === month ? cur : monthKeyOf(today) === month ? today : `${month}-01`));
  }, [month, today]);

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const b of bookings) {
      const d = bookingVisitDate(b);
      if (d) out[d] = (out[d] ?? 0) + 1;
    }
    return out;
  }, [bookings]);

  const dayJobs = useMemo(() => bookings.filter((b) => bookingVisitDate(b) === selected), [bookings, selected]);

  const mark = useCallback(
    (key: string): MonthDayMark => ({
      tone: TONE[attendance[key]],
      selected: key === selected,
      count: counts[key],
    }),
    [attendance, counts, selected],
  );

  const dayLabel = useCallback(
    (key: string) => {
      const parts = [key === today ? copy.techCalToday : formatDayKey(key)];
      const status = statusText(copy, attendance[key]);
      if (status) parts.push(status);
      if (counts[key]) parts.push(jobCount(copy, counts[key]));
      return parts.join(', ');
    },
    [attendance, copy, counts, today],
  );

  const selectedStatus = statusText(copy, attendance[selected]);
  const heading = [
    selected === today ? copy.techCalToday : formatDayKey(selected),
    selectedStatus,
    jobCount(copy, dayJobs.length),
  ]
    .filter(Boolean)
    .join(' · ');

  const legend: { key: string; label: string; color: string }[] = [
    { key: 'present', label: copy.techCalPresent, color: surfaces.tintSuccess },
    { key: 'absent', label: copy.techDutyAbsent, color: surfaces.tintDanger },
    { key: 'leave', label: copy.techCalLeave, color: colors.blueBg },
    { key: 'pending', label: copy.techCalPending, color: surfaces.tintWarning },
    { key: 'jobs', label: copy.techCalJobs, color: ui.brand },
  ];

  return (
    <View>
      <View style={styles.card}>
        <TechMonthGrid
          month={month}
          onMonthChange={(next) => {
            haptic('select');
            onMonthChange(next);
          }}
          canNext={month < shiftMonthKey(monthKeyOf(today), MONTHS_AHEAD)}
          mark={mark}
          onPressDay={(key) => {
            haptic('select');
            setSelected(key);
          }}
          dayLabel={dayLabel}
          prevLabel={copy.techCalendarPrevMonth}
          nextLabel={copy.techCalendarNextMonth}
        />
        <View style={styles.legend}>
          {legend.map((item) => (
            <View key={item.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }, item.key === 'jobs' && styles.legendJobs]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.dayTitle} accessibilityRole="header">
        {heading}
      </Text>
      {dayJobs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{copy.techCalNoJobs}</Text>
        </View>
      ) : (
        dayJobs.map((job, i) => (
          <FadeSlideIn key={job.id} delay={stagger(i)} slideFrom={10} trigger={selected}>
            <View style={styles.job}>
              <BookingListCard booking={job} compact hideAmount showCustomer onPress={() => onPressJob(job.id)} />
            </View>
          </FadeSlideIn>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    paddingTop: 10,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 14,
    rowGap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendJobs: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: ui.textSecondary },
  dayTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    marginLeft: 2,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: ui.text,
  },
  empty: {
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    alignItems: 'center',
  },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: ui.textSecondary },
  job: { marginBottom: spacing.sm },
});

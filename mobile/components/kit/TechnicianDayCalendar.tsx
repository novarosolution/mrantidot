import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { JobVisitCard } from '@/components/kit/JobVisitCard';
import type { Booking, DayAttendanceStatus } from '@/types/api';
import { colors, fonts, premium, shadows, spacing, surfaces } from '@/constants/theme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_LABELS: Record<DayAttendanceStatus, string> = {
  came: 'Came',
  not_came: 'Did not come',
  pending: 'Pending',
  future: 'Upcoming',
};

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split('-').map(Number);
  return { year: y, month: m - 1 };
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString('en', { month: 'long', year: 'numeric' });
}

type DayCell = { key: string; day: number; inMonth: boolean };

function buildMonthGrid(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startPad = first.getDay();
  const totalCells = Math.ceil((startPad + lastDay) / 7) * 7;
  const cells: DayCell[] = [];

  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - startPad + 1;
    const d = new Date(year, month, dayOffset);
    cells.push({
      key: toDateKey(d),
      day: d.getDate(),
      inMonth: d.getMonth() === month,
    });
  }

  return cells;
}

function cellStyle(status: DayAttendanceStatus | undefined, selected: boolean) {
  if (selected) return styles.dayCellSelected;
  switch (status) {
    case 'came':
      return styles.dayCellCame;
    case 'not_came':
      return styles.dayCellAbsent;
    case 'pending':
      return styles.dayCellPending;
    default:
      return undefined;
  }
}

export function TechnicianDayCalendar({
  calendar,
  attendance = {},
  bookings,
  onPressBooking,
  onPressDay,
  monthKey: controlledMonth,
  onMonthChange,
}: {
  calendar: Record<string, number>;
  attendance?: Record<string, DayAttendanceStatus>;
  bookings: Booking[];
  onPressBooking: (id: string) => void;
  onPressDay?: (date: string) => void;
  monthKey?: string;
  onMonthChange?: (monthKey: string) => void;
}) {
  const today = toDateKey(new Date());
  const initialMonth = controlledMonth ?? today.slice(0, 7);
  const [internalMonth, setInternalMonth] = useState(initialMonth);
  const monthKey = controlledMonth ?? internalMonth;

  const [selectedDate, setSelectedDate] = useState(today);

  const { year, month } = parseMonthKey(`${monthKey}-01`);
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const dayJobs = useMemo(
    () => bookings.filter((b) => b.schedule.date === selectedDate),
    [bookings, selectedDate],
  );

  const selectedStatus = attendance[selectedDate];

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (onMonthChange) onMonthChange(next);
    else setInternalMonth(next);
  }

  function handleDayPress(date: string) {
    setSelectedDate(date);
    onPressDay?.(date);
  }

  return (
    <View style={styles.wrap}>
      <Card variant="premium" style={styles.calendarCard}>
        <View style={styles.monthHead}>
          <Pressable onPress={() => shiftMonth(-1)} style={styles.navBtn} hitSlop={8}>
            <ChevronLeft size={20} color={colors.forest} />
          </Pressable>
          <Text style={styles.monthTitle}>{monthLabel(year, month)}</Text>
          <Pressable onPress={() => shiftMonth(1)} style={styles.navBtn} hitSlop={8}>
            <ChevronRight size={20} color={colors.forest} />
          </Pressable>
        </View>

        <View style={styles.legend}>
          {(['came', 'not_came', 'pending'] as DayAttendanceStatus[]).map((s) => (
            <View key={s} style={styles.legendItem}>
              <View style={[styles.legendDot, cellStyle(s, false)]} />
              <Text style={styles.legendText}>{STATUS_LABELS[s]}</Text>
            </View>
          ))}
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.jobDot]} />
            <Text style={styles.legendText}>Jobs</Text>
          </View>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={styles.weekLabel}>
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {grid.map((cell) => {
            const count = calendar[cell.key] ?? 0;
            const status = attendance[cell.key];
            const selected = cell.key === selectedDate;
            const isToday = cell.key === today;
            return (
              <Pressable
                key={cell.key}
                style={[
                  styles.dayCell,
                  !cell.inMonth && styles.dayCellMuted,
                  cellStyle(status, selected),
                  isToday && !selected && styles.dayCellToday,
                ]}
                onPress={() => handleDayPress(cell.key)}
              >
                <Text
                  style={[
                    styles.dayNum,
                    !cell.inMonth && styles.dayNumMuted,
                    selected && styles.dayNumSelected,
                  ]}
                >
                  {cell.day}
                </Text>
                {count > 0 ? (
                  <View style={[styles.dot, selected && styles.dotSelected]}>
                    <Text style={[styles.dotText, selected && styles.dotTextSelected]}>
                      {count > 9 ? '9+' : count}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.dotSpacer} />
                )}
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Text style={styles.dayTitle}>
        {selectedDate === today ? 'Today' : selectedDate}
        {selectedStatus ? ` · ${STATUS_LABELS[selectedStatus]}` : ''}
        {' · '}
        {dayJobs.length} job{dayJobs.length === 1 ? '' : 's'}
      </Text>

      {dayJobs.length === 0 ? (
        <Card variant="premium" style={styles.emptyDay}>
          <Text style={styles.emptyText}>No jobs on this day</Text>
        </Card>
      ) : (
        dayJobs.map((job) => (
          <JobVisitCard
            key={job.id}
            booking={job}
            today={today}
            onPress={() => onPressBooking(job.id)}
          />
        ))
      )}
    </View>
  );
}

/** @deprecated Use TechnicianDayCalendar */
export const AdminJobCalendar = TechnicianDayCalendar;

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  calendarCard: { padding: spacing.md },
  monthHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: { fontFamily: fonts.display, fontSize: 16, color: colors.forest },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: fonts.body, fontSize: 10, color: colors.muted },
  jobDot: { backgroundColor: colors.forest },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.muted,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 4,
  },
  dayCellMuted: { opacity: 0.35 },
  dayCellSelected: { backgroundColor: colors.forest },
  dayCellCame: { backgroundColor: surfaces.tintSuccess },
  dayCellAbsent: { backgroundColor: surfaces.tintDanger },
  dayCellPending: { backgroundColor: surfaces.tintWarning },
  dayCellToday: { borderWidth: 1.5, borderColor: colors.green },
  dayNum: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  dayNumMuted: { color: colors.muted },
  dayNumSelected: { color: colors.white },
  dot: {
    marginTop: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  dotSelected: { backgroundColor: colors.lime },
  dotText: { fontFamily: fonts.displayExtra, fontSize: 9, color: colors.white },
  dotTextSelected: { color: colors.forest },
  dotSpacer: { height: 16, marginTop: 2 },
  dayTitle: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.ink,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  emptyDay: { padding: spacing.md, alignItems: 'center' },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});

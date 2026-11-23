import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { localDateKey } from '@/lib/dates';
import { colors, fonts, surfaces, ui } from '@/constants/theme';

/** How one day looks in the grid. */
export type MonthDayMark = {
  disabled?: boolean;
  /** Attendance tint behind the number. */
  tone?: 'present' | 'absent' | 'leave' | 'pending';
  /** Solid brand circle (picked day, range ends). */
  selected?: boolean;
  /** Range band: start / end caps and the days between. */
  rangeStart?: boolean;
  rangeEnd?: boolean;
  inRange?: boolean;
  /** Small counter in the corner (jobs that day). */
  count?: number;
};

const TONE_BG: Record<NonNullable<MonthDayMark['tone']>, string> = {
  present: surfaces.tintSuccess,
  absent: surfaces.tintDanger,
  leave: colors.blueBg,
  pending: surfaces.tintWarning,
};

export function monthKeyOf(dateKey: string): string {
  return dateKey.slice(0, 7);
}

/** "2026-11" + n months → "2027-01". */
export function shiftMonthKey(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** "2026-10-08" + n days. */
export function addDaysKey(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return localDateKey(new Date(y, m - 1, d + n));
}

/** Whole days from `from` to `to`, both included. */
export function daysInclusive(from: string, to: string): number {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  const ms = Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1);
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export function monthTitle(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

/** Sunday-first short weekday names ("Sun", "Mon"…), same order as the attendance calendar always used. */
function weekdayLabels(): string[] {
  // 2023-01-01 was a Sunday.
  return Array.from({ length: 7 }, (_, i) =>
    new Date(2023, 0, 1 + i).toLocaleDateString('en-IN', { weekday: 'short' }),
  );
}

function monthCells(month: string): (string | null)[] {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const days = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let d = 1; d <= days; d++) cells.push(`${month}-${String(d).padStart(2, '0')}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const DayCell = memo(function DayCell({
  dateKey,
  mark,
  isToday,
  onPress,
  a11yLabel,
}: {
  dateKey: string;
  mark: MonthDayMark;
  isToday: boolean;
  onPress?: (key: string) => void;
  a11yLabel: string;
}) {
  const day = Number(dateKey.slice(8, 10));
  const filled = mark.selected || mark.rangeStart || mark.rangeEnd;
  const band = mark.inRange || (mark.rangeStart && !mark.rangeEnd) || (mark.rangeEnd && !mark.rangeStart);
  return (
    <Pressable
      style={styles.cell}
      onPress={onPress && !mark.disabled ? () => onPress(dateKey) : undefined}
      disabled={mark.disabled || !onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected: Boolean(filled), disabled: Boolean(mark.disabled) }}
    >
      {({ pressed }) => (
        <>
          {band ? (
            <View
              style={[
                styles.band,
                mark.rangeStart && !mark.rangeEnd && styles.bandStart,
                mark.rangeEnd && !mark.rangeStart && styles.bandEnd,
              ]}
            />
          ) : null}
          <View
            style={[
              styles.circle,
              mark.tone && !filled ? { backgroundColor: TONE_BG[mark.tone] } : null,
              isToday && !filled && styles.circleToday,
              filled && styles.circleFilled,
              pressed && !filled && styles.circlePressed,
            ]}
          >
            <Text
              style={[
                styles.dayNum,
                mark.disabled && styles.dayNumDisabled,
                filled && styles.dayNumFilled,
                isToday && !filled && styles.dayNumToday,
              ]}
            >
              {day}
            </Text>
          </View>
          {mark.count ? (
            <View style={[styles.count, filled && styles.countOnFilled]}>
              <Text style={[styles.countText, filled && styles.countTextOnFilled]}>
                {mark.count > 9 ? '9+' : mark.count}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
});

/**
 * Month calendar with prev / next controls — used for the leave date range and the attendance calendar.
 * Day cells are 44 pt tall; days outside the month are left blank.
 */
export function TechMonthGrid({
  month,
  onMonthChange,
  canPrev = true,
  canNext = true,
  mark,
  onPressDay,
  dayLabel,
  prevLabel,
  nextLabel,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  canPrev?: boolean;
  canNext?: boolean;
  mark: (dateKey: string) => MonthDayMark;
  onPressDay?: (dateKey: string) => void;
  /** Screen-reader text for a day (date plus its state). */
  dayLabel: (dateKey: string, mark: MonthDayMark) => string;
  prevLabel: string;
  nextLabel: string;
}) {
  const today = localDateKey();
  const cells = useMemo(() => monthCells(month), [month]);
  const weekdays = useMemo(weekdayLabels, []);
  const rows = useMemo(() => {
    const out: (string | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [cells]);

  return (
    <View>
      <View style={styles.head}>
        <Pressable
          onPress={() => onMonthChange(shiftMonthKey(month, -1))}
          disabled={!canPrev}
          style={({ pressed }) => [styles.nav, !canPrev && styles.navDisabled, pressed && styles.navPressed]}
          accessibilityRole="button"
          accessibilityLabel={prevLabel}
          accessibilityState={{ disabled: !canPrev }}
        >
          <ChevronLeft size={20} color={canPrev ? ui.brand : ui.textTertiary} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          {monthTitle(month)}
        </Text>
        <Pressable
          onPress={() => onMonthChange(shiftMonthKey(month, 1))}
          disabled={!canNext}
          style={({ pressed }) => [styles.nav, !canNext && styles.navDisabled, pressed && styles.navPressed]}
          accessibilityRole="button"
          accessibilityLabel={nextLabel}
          accessibilityState={{ disabled: !canNext }}
        >
          <ChevronRight size={20} color={canNext ? ui.brand : ui.textTertiary} strokeWidth={2.4} />
        </Pressable>
      </View>

      <View style={styles.weekRow} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {weekdays.map((w, i) => (
          <Text key={i} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>

      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((key, ci) => {
            if (!key) return <View key={`e-${ri}-${ci}`} style={styles.cell} />;
            const m = mark(key);
            return (
              <DayCell
                key={key}
                dateKey={key}
                mark={m}
                isToday={key === today}
                onPress={onPressDay}
                a11yLabel={dayLabel(key, m)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const CIRCLE = 38;

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontFamily: fonts.bodyBold, fontSize: 16, color: ui.text },
  nav: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.brandSoft,
  },
  navDisabled: { backgroundColor: ui.surfaceMuted },
  navPressed: { opacity: 0.75 },
  weekRow: { flexDirection: 'row', marginBottom: 2 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bodySemi,
    fontSize: 11.5,
    color: ui.textTertiary,
    paddingVertical: 6,
  },
  row: { flexDirection: 'row' },
  cell: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' },
  band: {
    position: 'absolute',
    top: (46 - CIRCLE) / 2,
    bottom: (46 - CIRCLE) / 2,
    left: 0,
    right: 0,
    backgroundColor: ui.brandSoft,
  },
  bandStart: { left: '50%' },
  bandEnd: { right: '50%' },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleToday: { borderWidth: 1.5, borderColor: ui.brand },
  circleFilled: { backgroundColor: ui.brand },
  circlePressed: { backgroundColor: ui.brandSoft },
  dayNum: { fontFamily: fonts.bodySemi, fontSize: 14, color: ui.text },
  dayNumDisabled: { color: ui.textTertiary, opacity: 0.55 },
  dayNumFilled: { color: colors.white, fontFamily: fonts.bodyBold },
  dayNumToday: { color: ui.brand, fontFamily: fonts.bodyBold },
  count: {
    position: 'absolute',
    top: 1,
    right: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  countOnFilled: { backgroundColor: colors.white, borderColor: ui.brand },
  countText: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.white },
  countTextOnFilled: { color: ui.brand },
});

import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDayKey, istTodayKey } from '@/components/admin/DateRangePicker';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { haptic } from '@/lib/motion';

/**
 * Month calendar drawn in place (no modal of its own, so it sits inside sheets and forms): pick one day, or a
 * range with two taps (first and last day). Dates are IST `YYYY-MM-DD`; `min` / `max` grey out other days.
 */

export type CalendarValue = { from?: string; to?: string };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

/** Monday-first weeks of a month (null = padding). */
function monthGrid(month: string): (string | null)[][] {
  const [y, m] = month.split('-').map(Number);
  const firstWeekday = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let d = 1; d <= days; d += 1) cells.push(`${month}-${String(d).padStart(2, '0')}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function InlineCalendar({
  mode,
  value,
  onChange,
  min,
  max,
}: {
  mode: 'single' | 'range';
  value: CalendarValue;
  onChange: (next: CalendarValue) => void;
  min?: string;
  max?: string;
}) {
  const today = istTodayKey();
  const [month, setMonth] = useState((value.from ?? (min && min > today ? min : today)).slice(0, 7));

  // Follow a value set from outside (quick chips) into its month.
  useEffect(() => {
    if (value.from && value.from.slice(0, 7) !== month && mode === 'single') setMonth(value.from.slice(0, 7));
    // Only when the picked day changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.from]);

  const weeks = useMemo(() => monthGrid(month), [month]);
  const [year, monthNum] = month.split('-').map(Number);
  const canPrev = !min || month > min.slice(0, 7);
  const canNext = !max || month < max.slice(0, 7);

  const pick = (key: string) => {
    haptic('select');
    if (mode === 'single') {
      onChange({ from: key, to: key });
      return;
    }
    if (!value.from || value.to) {
      onChange({ from: key, to: undefined });
      return;
    }
    if (key < value.from) {
      onChange({ from: key, to: undefined });
      return;
    }
    onChange({ from: value.from, to: key });
  };

  const start = value.from;
  const end = mode === 'single' ? value.from : value.to;

  return (
    <View style={styles.wrap}>
      <View style={styles.nav}>
        <Pressable
          onPress={() => canPrev && setMonth((m) => shiftMonth(m, -1))}
          disabled={!canPrev}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          accessibilityState={{ disabled: !canPrev }}
          style={({ pressed }) => [styles.navBtn, !canPrev && styles.navOff, pressed && styles.pressed]}
        >
          <ChevronLeft size={18} color={ui.text} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          {MONTHS[monthNum - 1]} {year}
        </Text>
        <Pressable
          onPress={() => canNext && setMonth((m) => shiftMonth(m, 1))}
          disabled={!canNext}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          accessibilityState={{ disabled: !canNext }}
          style={({ pressed }) => [styles.navBtn, !canNext && styles.navOff, pressed && styles.pressed]}
        >
          <ChevronRight size={18} color={ui.text} strokeWidth={2.4} />
        </Pressable>
      </View>

      <View style={styles.row}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={`w${wi}`} style={styles.row}>
          {week.map((key, di) => {
            if (!key) return <View key={`e${di}`} style={styles.cell} />;
            const disabled = Boolean((min && key < min) || (max && key > max));
            const isStart = key === start;
            const isEnd = Boolean(end) && key === end;
            const selected = isStart || isEnd;
            const inside = Boolean(start && end && key > start && key < end);
            const spans = Boolean(start && end && start !== end);
            return (
              <Pressable
                key={key}
                style={styles.cell}
                disabled={disabled}
                onPress={() => pick(key)}
                accessibilityRole="button"
                accessibilityLabel={formatDayKey(key, true)}
                accessibilityState={{ selected, disabled }}
              >
                {inside || (spans && selected) ? (
                  <View style={[styles.band, isStart && spans && styles.bandStart, isEnd && spans && styles.bandEnd]} />
                ) : null}
                <View style={[styles.day, selected && styles.daySelected, !selected && key === today && styles.dayToday]}>
                  <Text
                    style={[
                      styles.dayText,
                      inside && styles.dayTextInside,
                      selected && styles.dayTextSelected,
                      disabled && styles.dayTextDisabled,
                    ]}
                  >
                    {Number(key.slice(8))}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const CELL_H = 40;

const styles = StyleSheet.create({
  wrap: { paddingBottom: spacing.xs },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.surfaceMuted,
    borderWidth: 1,
    borderColor: ui.border,
  },
  navOff: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  title: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.text },
  row: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.4,
    color: ui.textTertiary,
    paddingVertical: 6,
  },
  cell: { flex: 1, height: CELL_H, alignItems: 'center', justifyContent: 'center' },
  band: { position: 'absolute', left: 0, right: 0, top: 4, bottom: 4, backgroundColor: ui.brandSoft },
  bandStart: { left: '50%' },
  bandEnd: { right: '50%' },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: colors.forest },
  dayToday: { borderWidth: 1.5, borderColor: colors.green },
  dayText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: ui.text },
  dayTextInside: { color: colors.forest, fontFamily: fonts.bodySemi },
  dayTextSelected: { color: colors.white, fontFamily: fonts.bodyBold },
  dayTextDisabled: { color: ui.textTertiary, opacity: 0.45 },
});

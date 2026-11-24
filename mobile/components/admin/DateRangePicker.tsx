import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { AdminFilterChips } from '@/components/kit/AdminPageKit';
import { Button } from '@/components/ui/Button';
import { SheetModal } from '@/components/ui/SheetModal';
import { colors, fonts, spacing, typeScale, ui } from '@/constants/theme';
import { haptic } from '@/lib/motion';

/* ─── Date keys (IST, YYYY-MM-DD) ─────────────────────────────────── */

export type DateRangePreset = 'all' | 'today' | '7d' | '30d' | 'thisMonth' | 'lastMonth' | 'custom';
export type DateRange = { from: string; to: string };
/** What the picker holds: a preset, or `custom` with both dates. `all` = no date filter. */
export type DateRangeValue = { preset: DateRangePreset; from?: string; to?: string };

export const DEFAULT_RANGE_PRESETS: DateRangePreset[] = ['today', '7d', '30d', 'thisMonth', 'lastMonth', 'custom'];
/** Filters that may also be switched off ("All time" first). */
export const FILTER_RANGE_PRESETS: DateRangePreset[] = ['all', 'today', '7d', '30d', 'thisMonth', 'lastMonth', 'custom'];

const PRESET_LABELS: Record<DateRangePreset, string> = {
  all: 'All time',
  today: 'Today',
  '7d': '7 days',
  '30d': '30 days',
  thisMonth: 'This month',
  lastMonth: 'Last month',
  custom: 'Custom',
};

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const DAY_MS = 86_400_000;
/** India has no daylight saving: IST is always UTC+05:30, so this works on any device clock / time zone. */
const IST_OFFSET_MS = 330 * 60_000;

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && DATE_KEY_RE.test(value);
}

/** Today's business date in India, whatever the device's time zone. */
export function istTodayKey(now: number = Date.now()): string {
  return new Date(now + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function keyToUtc(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function utcToKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDaysKey(key: string, days: number): string {
  return utcToKey(keyToUtc(key) + days * DAY_MS);
}

/** Days from `from` to `to`, both included. */
export function daysInclusive(from: string, to: string): number {
  return Math.round((keyToUtc(to) - keyToUtc(from)) / DAY_MS) + 1;
}

export function presetRange(preset: DateRangePreset, today: string = istTodayKey()): DateRange | null {
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case '7d':
      return { from: addDaysKey(today, -6), to: today };
    case '30d':
      return { from: addDaysKey(today, -29), to: today };
    case 'thisMonth':
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case 'lastMonth': {
      const [y, m] = today.split('-').map(Number);
      return { from: utcToKey(Date.UTC(y, m - 2, 1)), to: utcToKey(Date.UTC(y, m - 1, 0)) };
    }
    default:
      return null;
  }
}

/** The dates a picker value stands for (null = all time / incomplete custom). */
export function resolveDateRange(value: DateRangeValue, today: string = istTodayKey()): DateRange | null {
  if (value.preset === 'custom') {
    return isDateKey(value.from) && isDateKey(value.to) ? { from: value.from, to: value.to } : null;
  }
  if (value.preset === 'all') return null;
  return presetRange(value.preset, today);
}

/** Picker value for dates from a deep link: the matching preset when there is one, else custom. */
export function rangeValueFrom(
  from: unknown,
  to: unknown,
  presets: DateRangePreset[] = FILTER_RANGE_PRESETS,
  fallback: DateRangeValue = { preset: 'all' },
): DateRangeValue {
  const f = isDateKey(from) ? from : undefined;
  const t = isDateKey(to) ? to : undefined;
  if (!f && !t) return fallback;
  const range = { from: f ?? t!, to: t ?? f! };
  if (range.to < range.from) return fallback;
  const today = istTodayKey();
  const match = presets.find((p) => {
    const r = presetRange(p, today);
    return r && r.from === range.from && r.to === range.to;
  });
  return match ? { preset: match } : { preset: 'custom', ...range };
}

export function formatDayKey(key: string, withYear = false): string {
  const [y, m, d] = key.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}${withYear ? ` ${y}` : ''}`;
}

/** "Today", "12 Nov – 24 Nov", "28 Dec 2025 – 3 Jan 2026", "All time". */
export function formatRangeLabel(range: DateRange | null, today: string = istTodayKey()): string {
  if (!range) return 'All time';
  if (range.from === range.to) return range.from === today ? 'Today' : formatDayKey(range.from, range.from.slice(0, 4) !== today.slice(0, 4));
  const sameYear = range.from.slice(0, 4) === range.to.slice(0, 4);
  const thisYear = range.to.slice(0, 4) === today.slice(0, 4);
  return `${formatDayKey(range.from, !sameYear)} – ${formatDayKey(range.to, !sameYear || !thisYear)}`;
}

/** "23 Oct – 21 Nov · 30 days". */
export function formatRangeSummary(range: DateRange | null, today: string = istTodayKey()): string {
  if (!range) return 'All dates';
  const days = daysInclusive(range.from, range.to);
  return `${formatRangeLabel(range, today)} · ${days} ${days === 1 ? 'day' : 'days'}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** Monday-first weeks of a month: date keys, null for the padding cells. */
function monthGrid(month: string): (string | null)[][] {
  const [y, m] = month.split('-').map(Number);
  const firstWeekday = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(`${month}-${String(d).padStart(2, '0')}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/* ─── Calendar sheet ─────────────────────────────────────────────── */

function NavButton({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={({ pressed }) => [styles.navBtn, disabled && styles.navBtnDisabled, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

export function DateRangeCalendarSheet({
  visible,
  initial,
  allowFuture = false,
  maxDays,
  title = 'Pick dates',
  onClose,
  onApply,
}: {
  visible: boolean;
  initial: DateRange | null;
  allowFuture?: boolean;
  maxDays?: number;
  title?: string;
  onClose: () => void;
  onApply: (range: DateRange) => void;
}) {
  const today = istTodayKey();
  const [start, setStart] = useState<string | null>(initial?.from ?? null);
  const [end, setEnd] = useState<string | null>(initial?.to ?? null);
  const [month, setMonth] = useState((initial?.from ?? today).slice(0, 7));

  useEffect(() => {
    if (!visible) return;
    setStart(initial?.from ?? null);
    setEnd(initial?.to ?? null);
    setMonth((initial?.to ?? today).slice(0, 7));
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const weeks = useMemo(() => monthGrid(month), [month]);
  const [year, monthNum] = month.split('-').map(Number);
  const canGoNext = allowFuture || month < today.slice(0, 7);

  const pick = (key: string) => {
    haptic('select');
    if (!start || end) {
      setStart(key);
      setEnd(null);
      return;
    }
    if (key < start) {
      setStart(key);
      return;
    }
    setEnd(key);
  };

  const finalEnd = end ?? start;
  const days = start && finalEnd ? daysInclusive(start, finalEnd) : 0;
  const tooLong = Boolean(maxDays && days > maxDays);
  const summary = !start
    ? 'Tap the first day'
    : !end
      ? `${formatDayKey(start, true)} · now tap the last day (or Apply for one day)`
      : formatRangeSummary({ from: start, to: end }, today);

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      dialogWidth={420}
      header={
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <Text style={[styles.sheetSub, tooLong && styles.warn]} numberOfLines={2}>
            {tooLong ? `Pick at most ${maxDays} days` : summary}
          </Text>
        </View>
      }
    >
      <View style={styles.calendar}>
        <View style={styles.monthNav}>
          <NavButton label="Previous month" onPress={() => setMonth((m) => shiftMonth(m, -1))}>
            <ChevronLeft size={18} color={ui.text} strokeWidth={2.4} />
          </NavButton>
          <Text style={styles.monthTitle}>
            {MONTHS_LONG[monthNum - 1]} {year}
          </Text>
          <NavButton label="Next month" disabled={!canGoNext} onPress={() => setMonth((m) => shiftMonth(m, 1))}>
            <ChevronRight size={18} color={canGoNext ? ui.text : ui.textTertiary} strokeWidth={2.4} />
          </NavButton>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((d) => (
            <Text key={d} style={styles.weekday}>
              {d}
            </Text>
          ))}
        </View>

        {weeks.map((week, wi) => (
          <View key={`w${wi}`} style={styles.weekRow}>
            {week.map((key, di) => {
              if (!key) return <View key={`e${di}`} style={styles.cell} />;
              const disabled = !allowFuture && key > today;
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
                  {inside || (spans && (isStart || isEnd)) ? (
                    <View
                      style={[
                        styles.band,
                        isStart && spans && styles.bandStart,
                        isEnd && spans && styles.bandEnd,
                      ]}
                    />
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

        <View style={styles.actions}>
          <Button title="Cancel" variant="outline" size="md" fullWidth={false} style={styles.action} onPress={onClose} />
          <Button
            title="Apply"
            variant="primary"
            size="md"
            fullWidth={false}
            style={styles.action}
            disabled={!start || tooLong}
            onPress={() => {
              if (!start) return;
              onApply({ from: start, to: end ?? start });
            }}
          />
        </View>
      </View>
    </SheetModal>
  );
}

/* ─── Picker (chip row + calendar) ───────────────────────────────── */

/**
 * Date range picker for admin lists, dashboard and reports: a compact chip row (Today / 7 days / 30 days /
 * This month / Last month / Custom, optionally All time) and a calendar sheet for Custom. Dates are IST
 * `YYYY-MM-DD`; the caption under the chips spells out the resolved range.
 */
export function DateRangePicker({
  value,
  onChange,
  presets = DEFAULT_RANGE_PRESETS,
  allowFuture = false,
  maxDays,
  caption = true,
  inset = false,
  label,
}: {
  value: DateRangeValue;
  onChange: (next: DateRangeValue, range: DateRange | null) => void;
  presets?: DateRangePreset[];
  allowFuture?: boolean;
  maxDays?: number;
  /** Show "23 Oct – 21 Nov · 30 days" under the chips. */
  caption?: boolean;
  /** Pad the first chip (row spans the full screen width). */
  inset?: boolean;
  /** Small label before the caption, e.g. "Visit date". */
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const today = istTodayKey();
  const range = resolveDateRange(value, today);

  const chips = presets.map((p) => ({
    key: p,
    label: p === 'custom' && value.preset === 'custom' && range ? formatRangeLabel(range, today) : PRESET_LABELS[p],
  }));

  return (
    <View>
      <AdminFilterChips
        chips={chips}
        selected={value.preset}
        inset={inset}
        onSelect={(key) => {
          const preset = key as DateRangePreset;
          if (preset === 'custom') {
            setOpen(true);
            return;
          }
          onChange({ preset }, presetRange(preset, today));
        }}
      />
      {caption ? (
        <Text style={[styles.caption, inset && styles.captionInset]} numberOfLines={1}>
          {label ? <Text style={styles.captionLabel}>{label}: </Text> : null}
          {formatRangeSummary(range, today)}
        </Text>
      ) : null}
      <DateRangeCalendarSheet
        visible={open}
        initial={range}
        allowFuture={allowFuture}
        maxDays={maxDays}
        onClose={() => setOpen(false)}
        onApply={(next) => {
          setOpen(false);
          onChange({ preset: 'custom', ...next }, next);
        }}
      />
    </View>
  );
}

const CELL_H = 42;

const styles = StyleSheet.create({
  caption: { ...typeScale.caption, color: ui.textSecondary, marginTop: -2, marginBottom: spacing.sm },
  captionInset: { paddingHorizontal: spacing.md },
  captionLabel: { fontFamily: fonts.bodySemi, color: ui.text },
  sheetHead: { paddingHorizontal: spacing.md + 4, paddingTop: 4, paddingBottom: 6 },
  sheetTitle: { ...typeScale.section, fontSize: 19, lineHeight: 25, color: ui.text },
  sheetSub: { ...typeScale.caption, marginTop: 4, color: ui.textSecondary },
  warn: { color: colors.error },
  calendar: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacing.sm },
  monthTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.text },
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
  navBtnDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
  weekRow: { flexDirection: 'row' },
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
  dayTextDisabled: { color: ui.textTertiary, opacity: 0.5 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  action: { minWidth: 112 },
});

import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatDayKey } from '@/components/kit/format';
import {
  TechMonthGrid,
  daysInclusive,
  monthKeyOf,
  type MonthDayMark,
} from '@/components/tech/TechMonthGrid';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { haptic } from '@/lib/motion';
import { dayCount } from '@/lib/techLabels';
import { fonts, ui } from '@/constants/theme';

function rangeText(from: string, to: string): string {
  return from === to ? formatDayKey(from) : `${formatDayKey(from)} – ${formatDayKey(to)}`;
}

/**
 * Calendar sheet for picking a leave range: first tap = first day, second tap = last day
 * (the same day twice = a single day). Days outside `minDate`…`maxDate` can't be picked.
 */
export function TechDateRangeSheet({
  visible,
  from,
  to,
  minDate,
  maxDate,
  onClose,
  onApply,
}: {
  visible: boolean;
  from: string;
  to: string;
  minDate: string;
  maxDate: string;
  onClose: () => void;
  onApply: (from: string, to: string) => void;
}) {
  const copy = useCustomerUiCopy();
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState<string | null>(to);
  const [month, setMonth] = useState(monthKeyOf(from));

  // Each opening starts from the dates on the form.
  useEffect(() => {
    if (!visible) return;
    setStart(from);
    setEnd(to);
    setMonth(monthKeyOf(from));
  }, [visible, from, to]);

  const pickDay = useCallback(
    (key: string) => {
      haptic('select');
      if (end !== null) {
        setStart(key);
        setEnd(null);
      } else if (key < start) {
        setStart(key);
      } else {
        setEnd(key);
      }
    },
    [end, start],
  );

  const mark = useCallback(
    (key: string): MonthDayMark => {
      const disabled = key < minDate || key > maxDate;
      const last = end ?? start;
      const single = start === last;
      return {
        disabled,
        selected: key === start || key === end,
        rangeStart: !single && key === start,
        rangeEnd: !single && key === last,
        inRange: !single && key > start && key < last,
      };
    },
    [end, maxDate, minDate, start],
  );

  const last = end ?? start;
  const summary = `${rangeText(start, last)} · ${dayCount(copy, daysInclusive(start, last))}`;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={copy.techLeavePickTitle}
      hint={end === null ? copy.techLeavePickEnd : copy.techLeavePickHint}
      footer={
        <>
          <Text style={styles.summary} accessibilityLiveRegion="polite">
            {summary}
          </Text>
          <Button title={copy.techLeavePickApply} onPress={() => onApply(start, last)} />
        </>
      }
    >
      <View style={styles.calendar}>
        <TechMonthGrid
          month={month}
          onMonthChange={setMonth}
          canPrev={month > monthKeyOf(minDate)}
          canNext={month < monthKeyOf(maxDate)}
          mark={mark}
          onPressDay={pickDay}
          dayLabel={(key) => formatDayKey(key)}
          prevLabel={copy.techCalendarPrevMonth}
          nextLabel={copy.techCalendarNextMonth}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  calendar: { paddingBottom: 4 },
  summary: {
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: ui.brand,
  },
});

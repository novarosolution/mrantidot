import { StyleSheet, Text, View } from 'react-native';
import { BookTimePicker } from '@/components/kit/BookTimePicker';
import { ScheduleDayPicker } from '@/components/kit/ScheduleDayPicker';
import { ScheduleModeToggle } from '@/components/kit/ScheduleModeToggle';
import { ScheduleSelectionBanner } from '@/components/kit/ScheduleSelectionBanner';
import { ScheduleSlotPicker } from '@/components/kit/ScheduleSlotPicker';
import { BOOKING_SLOTS, formatScheduleLabel } from '@/lib/dates';
import type { ScheduleMode } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

export function ScheduleEditorForm({
  mode,
  onModeChange,
  date,
  onDateChange,
  slot,
  onSlotChange,
  hour,
  minute,
  onTimeChange,
  standardLabel,
  customLabel,
  dayCount = 14,
  showPreview = true,
}: {
  mode: ScheduleMode;
  onModeChange: (mode: ScheduleMode) => void;
  date: string;
  onDateChange: (date: string) => void;
  slot: string;
  onSlotChange: (slot: string) => void;
  hour: number;
  minute: number;
  onTimeChange: (hour: number, minute: number) => void;
  standardLabel?: string;
  customLabel?: string;
  dayCount?: number;
  showPreview?: boolean;
}) {
  const timeValue = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const preview =
    mode === 'standard'
      ? formatScheduleLabel({ date, slot }, 'standard')
      : formatScheduleLabel({ date, slot: 'custom', time: timeValue }, 'custom');

  return (
    <View>
      <ScheduleModeToggle
        mode={mode}
        onChange={onModeChange}
        standardLabel={standardLabel}
        customLabel={customLabel}
      />
      <ScheduleDayPicker
        selectedDate={date}
        count={dayCount}
        onSelect={(d) => onDateChange(d)}
      />
      {mode === 'standard' ? (
        <ScheduleSlotPicker
          selectedSlot={slot || BOOKING_SLOTS[0]}
          onSelect={onSlotChange}
        />
      ) : (
        <BookTimePicker hour={hour} minute={minute} onChange={onTimeChange} />
      )}
      {showPreview ? (
        <ScheduleSelectionBanner label={preview} />
      ) : (
        <Text style={styles.preview}>{preview}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest, marginTop: spacing.md },
});

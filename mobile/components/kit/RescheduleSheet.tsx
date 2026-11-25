import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScheduleDayPicker } from '@/components/kit/ScheduleDayPicker';
import { ScheduleSlotPicker, firstOpenSlot } from '@/components/kit/ScheduleSlotPicker';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { firstBookableSlot, localDateKey } from '@/lib/dates';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

/** Customer "pick a new time" sheet — same day / slot pickers and booking rules as checkout. */
export function RescheduleSheet({
  visible,
  loading,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (date: string, slot: string) => void;
}) {
  const copy = useCustomerUiCopy();
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');

  useEffect(() => {
    if (!visible) return;
    const first = firstBookableSlot();
    setDate(first?.date ?? localDateKey());
    setSlot(first?.slot ?? '');
  }, [visible]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={copy.rescheduleTitle}
      hint={copy.rescheduleHint}
      footer={
        <Button
          title={copy.rescheduleButton}
          variant="premium"
          disabled={!date || !slot}
          loading={loading}
          onPress={() => onConfirm(date, slot)}
        />
      }
    >
      <View style={styles.body}>
        <ScheduleDayPicker
          selectedDate={date}
          onSelect={(d) => {
            setDate(d);
            setSlot(firstOpenSlot(d, 'bookable') ?? '');
          }}
        />
        <ScheduleSlotPicker selectedSlot={slot} onSelect={setSlot} date={date} rules="bookable" />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 18, paddingTop: 6 },
});

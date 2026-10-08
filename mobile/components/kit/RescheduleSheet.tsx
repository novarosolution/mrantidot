import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScheduleDayPicker } from '@/components/kit/ScheduleDayPicker';
import { ScheduleSlotPicker, firstOpenSlot } from '@/components/kit/ScheduleSlotPicker';
import { Button } from '@/components/ui/Button';
import { localDateKey, nextBookableDays } from '@/lib/dates';
import { colors, fonts, spacing, ui } from '@/constants/theme';

function firstOpenDay(): { date: string; slot: string } {
  for (const d of nextBookableDays()) {
    const slot = firstOpenSlot(d.date);
    if (slot) return { date: d.date, slot };
  }
  return { date: localDateKey(), slot: '' };
}

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
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');

  useEffect(() => {
    if (!visible) return;
    const first = firstOpenDay();
    setDate(first.date);
    setSlot(first.slot);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Reschedule visit</Text>
        <Text style={styles.subtitle}>Pick a new day and time. Our team will confirm it shortly.</Text>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <ScheduleDayPicker
            selectedDate={date}
            onSelect={(d) => {
              setDate(d);
              setSlot(firstOpenSlot(d) ?? '');
            }}
          />
          <ScheduleSlotPicker selectedSlot={slot} onSelect={setSlot} date={date} />
        </ScrollView>
        <Button
          title="Request new time"
          variant="premium"
          disabled={!date || !slot}
          loading={loading}
          onPress={() => onConfirm(date, slot)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,20,15,0.45)' },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: ui.border,
    marginBottom: 14,
  },
  title: { fontFamily: fonts.displayExtra, fontSize: 20, color: ui.text },
  subtitle: { marginTop: 4, fontFamily: fonts.body, fontSize: 13.5, color: ui.textSecondary },
  body: { gap: 18, paddingVertical: 18 },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarClock, Clock3 } from 'lucide-react-native';
import { colors, fonts, ui } from '@/constants/theme';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { useBookingCopy } from '@/lib/schedule-copy';

/** Two side-by-side option cards — 2-hour window vs a specific time. */
export function ScheduleModeToggle({
  mode,
  onChange,
  standardLabel,
  customLabel,
}: {
  mode: 'standard' | 'custom';
  onChange: (mode: 'standard' | 'custom') => void;
  standardLabel?: string;
  customLabel?: string;
}) {
  const copy = useCustomerUiCopy();
  const bookingCopy = useBookingCopy();
  const options = [
    { key: 'standard' as const, label: standardLabel ?? bookingCopy.standardModeLabel, desc: copy.modeStandardDesc, Icon: CalendarClock },
    { key: 'custom' as const, label: customLabel ?? bookingCopy.customModeLabel, desc: copy.modeCustomDesc, Icon: Clock3 },
  ];
  return (
    <View style={styles.row}>
      {options.map(({ key, label, desc, Icon }) => {
        const on = mode === key;
        return (
          <Pressable
            key={key}
            style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && styles.pressed]}
            onPress={() => onChange(key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
          >
            <View style={styles.top}>
              <Icon size={18} color={on ? ui.brand : ui.textSecondary} strokeWidth={2.1} />
              <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
            </View>
            <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
              {label}
            </Text>
            <Text style={styles.desc} numberOfLines={1}>
              {desc}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  option: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  optionOn: { backgroundColor: ui.brandSoft, borderColor: ui.brand, borderWidth: 1.5 },
  pressed: { opacity: 0.8 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: ui.brand },
  radioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: ui.brand },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.text },
  labelOn: { color: ui.brand },
  desc: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary },
});

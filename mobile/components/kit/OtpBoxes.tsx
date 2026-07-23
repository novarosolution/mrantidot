import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, fonts, formField, premium, spacing } from '@/constants/theme';
import { textInputDefaults } from '@/components/ui/textInputDefaults';

function digitAt(value: string, index: number): string {
  return value[index] && /\d/.test(value[index]!) ? value[index]! : '';
}

export function OtpBoxes({
  value,
  onChange,
  length = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
}) {
  const inputs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  return (
    <View style={styles.row}>
      {Array.from({ length }, (_, i) => {
        const d = digitAt(value, i);
        const filled = d.length > 0;
        const focused = i === focusedIndex;
        return (
          <View
            key={i}
            style={[
              styles.boxWrap,
              filled && styles.boxWrapFilled,
              focused && styles.boxWrapFocus,
            ]}
          >
            <TextInput
              ref={(r) => {
                inputs.current[i] = r;
              }}
              style={styles.box}
              {...textInputDefaults}
              value={d}
              onChangeText={(t) => {
                const digitsOnly = t.replace(/\D/g, '');
                if (digitsOnly.length > 1) {
                  onChange(digitsOnly.slice(0, length));
                  const focusAt = Math.min(digitsOnly.length, length) - 1;
                  if (focusAt >= 0) inputs.current[focusAt]?.focus();
                  return;
                }

                const chars = Array.from({ length }, (_, idx) => digitAt(value, idx));
                chars[i] = digitsOnly.slice(-1);
                onChange(chars.join('').replace(/\s/g, '').slice(0, length));
                if (digitsOnly && i < length - 1) inputs.current[i + 1]?.focus();
              }}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !d && i > 0) {
                  const chars = Array.from({ length }, (_, idx) => digitAt(value, idx));
                  chars[i - 1] = '';
                  onChange(chars.join(''));
                  inputs.current[i - 1]?.focus();
                }
              }}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              keyboardType="number-pad"
              maxLength={length}
              selectTextOnFocus
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  boxWrap: {
    flex: 1,
    height: 64,
    borderRadius: formField.radius,
    borderWidth: formField.borderWidth,
    borderColor: formField.borderColor,
    backgroundColor: formField.bgMuted,
    overflow: 'hidden',
  },
  boxWrapFilled: {
    backgroundColor: '#E8F5EC',
    borderColor: 'rgba(30,142,78,0.35)',
  },
  boxWrapFocus: {
    borderColor: formField.borderFocus,
    backgroundColor: formField.bg,
    borderWidth: 2,
    ...premium.shadowFocus,
  },
  box: {
    flex: 1,
    textAlign: 'center',
    fontSize: 28,
    fontFamily: fonts.displaySemi,
    letterSpacing: 2,
    color: colors.ink,
    height: '100%',
  },
});

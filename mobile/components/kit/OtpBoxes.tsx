import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, fonts, ui } from '@/constants/theme';
import { textInputDefaults } from '@/components/ui/textInputDefaults';

function digitAt(value: string, index: number): string {
  return value[index] && /\d/.test(value[index]!) ? value[index]! : '';
}

export function OtpBoxes({
  value,
  onChange,
  length = 4,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
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
              autoFocus={autoFocus && i === 0}
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
    gap: 12,
  },
  boxWrap: {
    flex: 1,
    height: 62,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: ui.surfaceMuted,
    overflow: 'hidden',
  },
  boxWrapFilled: {
    backgroundColor: ui.brandSoft,
    borderColor: 'rgba(13,106,43,0.22)',
  },
  boxWrapFocus: {
    borderColor: ui.brand,
    backgroundColor: colors.white,
  },
  box: {
    flex: 1,
    textAlign: 'center',
    fontSize: 26,
    fontFamily: fonts.displayExtra,
    color: ui.text,
    height: '100%',
  },
});

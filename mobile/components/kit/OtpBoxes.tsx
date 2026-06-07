import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, formField, premium, spacing } from '@/constants/theme';
import { textInputDefaults } from '@/components/ui/textInputDefaults';

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
  const digits = value.padEnd(length, ' ').split('').slice(0, length);

  return (
    <View style={styles.row}>
      {digits.map((d, i) => {
        const filled = d.trim().length > 0;
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
              value={d.trim() ? d : ''}
              onChangeText={(t) => {
                const char = t.replace(/\D/g, '').slice(-1);
                const arr = value.split('');
                arr[i] = char;
                const next = arr.join('').slice(0, length);
                onChange(next);
                if (char && i < length - 1) inputs.current[i + 1]?.focus();
              }}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !d.trim() && i > 0) {
                  inputs.current[i - 1]?.focus();
                }
              }}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              keyboardType="number-pad"
              maxLength={1}
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
    fontWeight: '600',
    color: colors.ink,
    height: '100%',
  },
});

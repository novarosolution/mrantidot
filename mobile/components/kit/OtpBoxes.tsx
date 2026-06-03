import { StyleSheet, TextInput, View } from 'react-native';
import { colors, fonts, spacing } from '@/constants/theme';

export function OtpBoxes({
  value,
  onChange,
  length = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
}) {
  const digits = value.padEnd(length, ' ').split('').slice(0, length);
  const focusIndex = Math.min(value.length, length - 1);

  return (
    <View style={styles.row}>
      {digits.map((d, i) => {
        const filled = d.trim().length > 0;
        const focused = i === focusIndex && value.length < length;
        return (
          <TextInput
            key={i}
            style={[
              styles.box,
              filled && styles.boxFilled,
              focused && styles.boxFocus,
            ]}
            value={d.trim() ? d : ''}
            onChangeText={(t) => {
              const char = t.replace(/\D/g, '').slice(-1);
              const arr = value.split('');
              arr[i] = char;
              onChange(arr.join('').slice(0, length));
            }}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, marginTop: spacing.sm },
  box: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    textAlign: 'center',
    fontFamily: fonts.displayExtra,
    fontSize: 26,
    color: colors.ink,
  },
  boxFilled: {
    backgroundColor: colors.secondarySoft,
    borderColor: colors.secondaryDark,
  },
  boxFocus: {
    borderColor: colors.secondaryDark,
    backgroundColor: colors.white,
  },
});

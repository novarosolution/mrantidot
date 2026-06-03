import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

interface RatingStarsProps {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
}

export function RatingStars({ value, onChange, size = 28 }: RatingStarsProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange?.(n)} disabled={!onChange}>
          <Text style={{ fontSize: size, color: n <= value ? colors.warning : colors.border }}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
});

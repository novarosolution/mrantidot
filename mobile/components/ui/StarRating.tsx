import { Star } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';

/** Read-only star rating row. Shows 5 stars filled up to `rating`, with an optional numeric value and review count. */
export function StarRating({
  rating,
  size = 14,
  showValue = false,
  count,
}: {
  rating: number;
  size?: number;
  showValue?: boolean;
  count?: number;
}) {
  const rounded = Math.round(rating);
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          color={colors.amber}
          fill={i <= rounded ? colors.amber : 'transparent'}
        />
      ))}
      {showValue ? <Text style={styles.value}>{rating.toFixed(1)}</Text> : null}
      {count != null ? <Text style={styles.count}>({count})</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  value: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink, marginLeft: 4 },
  count: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginLeft: 2 },
});

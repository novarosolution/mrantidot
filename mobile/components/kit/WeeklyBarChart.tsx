import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors, fonts, gradients, spacing } from '@/constants/theme';

export type WeeklyBarBucket = {
  label: string;
  value: number;
  key?: string;
};

export function WeeklyBarChart({
  title,
  subtitle,
  data = [],
  valuePrefix = '',
  onBarPress,
}: {
  title: string;
  subtitle?: string;
  data?: WeeklyBarBucket[];
  valuePrefix?: string;
  onBarPress?: (index: number, bucket: WeeklyBarBucket) => void;
}) {
  const buckets = data.length > 0 ? data : [{ label: '-', value: 0 }];
  const max = Math.max(...buckets.map((b) => b.value), 1);

  return (
    <Card variant="premium" style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{buckets.length} weeks</Text>
        </View>
      </View>
      <View style={styles.bars}>
        {buckets.map((b, i) => {
          const pct = Math.max(8, Math.round((b.value / max) * 100));
          const isLast = i === buckets.length - 1;
          const bar = (
            <LinearGradient
              colors={isLast ? [colors.lime, colors.green] : [gradients.primary[0], gradients.primary[1]]}
              style={[styles.bar, { height: `${pct}%` }]}
            />
          );
          const col = (
            <View style={styles.col}>
              {bar}
              <Text style={styles.value} numberOfLines={1}>
                {b.value > 0 ? `${valuePrefix}${b.value}` : '—'}
              </Text>
              <Text style={styles.month}>{b.label}</Text>
            </View>
          );

          if (onBarPress) {
            return (
              <Pressable
                key={`${b.label}-${i}`}
                style={({ pressed }) => [styles.colPress, pressed && styles.pressed]}
                onPress={() => onBarPress(i, b)}
              >
                {col}
              </Pressable>
            );
          }

          return <View key={`${b.label}-${i}`}>{col}</View>;
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, padding: spacing.md },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  headText: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  chip: { backgroundColor: colors.secondarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.secondaryInk },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 130,
    paddingTop: 10,
    gap: 6,
  },
  colPress: { flex: 1 },
  pressed: { opacity: 0.75 },
  col: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  bar: {
    width: '64%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    minHeight: 8,
  },
  value: { fontFamily: fonts.bodySemi, fontSize: 9, color: colors.forest, marginTop: 6 },
  month: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.muted, marginTop: 4 },
});

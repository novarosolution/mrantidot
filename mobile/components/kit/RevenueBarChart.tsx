import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors, fonts, gradients, spacing } from '@/constants/theme';

export function RevenueBarChart({
  title = 'Revenue',
  data = [],
}: {
  title?: string;
  data?: { label: string; amount: number }[];
}) {
  const buckets = data.length > 0 ? data : [{ label: '-', amount: 0 }];
  const max = Math.max(...buckets.map((b) => b.amount), 1);

  return (
    <Card variant="premium" style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{buckets.length} months</Text>
        </View>
      </View>
      <View style={styles.bars}>
        {buckets.map((b, i) => {
          const pct = Math.max(8, Math.round((b.amount / max) * 100));
          const isLast = i === buckets.length - 1;
          const Bar = (
            <LinearGradient
              colors={isLast ? [colors.lime, colors.green] : [gradients.primary[0], gradients.primary[1]]}
              style={[styles.bar, { height: `${pct}%` }]}
            />
          );
          return (
            <View key={`${b.label}-${i}`} style={styles.col}>
              {Bar}
              <Text style={styles.month}>{b.label}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.md },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  chip: { backgroundColor: colors.secondarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.secondaryInk },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 10,
    gap: 9,
  },
  col: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  bar: {
    width: '64%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    minHeight: 8,
  },
  month: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.muted, marginTop: 8 },
});

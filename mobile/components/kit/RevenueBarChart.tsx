import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors, fonts, spacing } from '@/constants/theme';

export function RevenueBarChart({
  title = 'Revenue',
  data = [],
  flush = false,
}: {
  title?: string;
  data?: { label: string; amount: number }[];
  /** Skip outer card when already inside a glass panel. */
  flush?: boolean;
}) {
  const buckets = data.length > 0 ? data : [{ label: '-', amount: 0 }];
  const max = Math.max(...buckets.map((b) => b.amount), 1);

  const body = (
    <>
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
          return (
            <View key={`${b.label}-${i}`} style={styles.col}>
              <LinearGradient
                colors={isLast ? ['#8FD03C', '#27A747'] : ['#1B873E', '#0A6423']}
                style={[styles.bar, { height: `${pct}%` }]}
              />
              <Text style={styles.month}>{b.label}</Text>
            </View>
          );
        })}
      </View>
    </>
  );

  if (flush) {
    return <View>{body}</View>;
  }

  return (
    <Card variant="glass" style={styles.card}>
      {body}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.md },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  chip: {
    backgroundColor: '#EEF8E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8EDC8',
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.forest },
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

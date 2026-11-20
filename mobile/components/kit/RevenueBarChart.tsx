import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors, fonts, spacing, ui } from '@/constants/theme';

/**
 * Tallest bar in points. Bars used to be a % of the whole column, so the tallest one plus its
 * month label overflowed the chart and poked into the heading above it.
 */
const BAR_MAX = 92;
const BAR_MIN = 8;

export function RevenueBarChart({
  title = 'Revenue',
  data = [],
  flush = false,
  hideTitle = false,
}: {
  title?: string;
  data?: { label: string; amount: number }[];
  /** Skip outer card when already inside a glass panel. */
  flush?: boolean;
  /** Keep only the month-count chip when a section heading already names the chart. */
  hideTitle?: boolean;
}) {
  const buckets = data.length > 0 ? data : [{ label: '-', amount: 0 }];
  const max = Math.max(...buckets.map((b) => b.amount), 1);

  const body = (
    <>
      <View style={[styles.head, hideTitle && styles.headEnd]}>
        {hideTitle ? null : (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}
        <View style={styles.chip}>
          <Text style={styles.chipText}>
            {buckets.length} {buckets.length === 1 ? 'month' : 'months'}
          </Text>
        </View>
      </View>
      <View style={styles.bars}>
        {buckets.map((b, i) => {
          const h = Math.max(BAR_MIN, Math.round((b.amount / max) * BAR_MAX));
          const isLast = i === buckets.length - 1;
          return (
            <View key={`${b.label}-${i}`} style={styles.col}>
              <LinearGradient
                colors={isLast ? [colors.limeBright, colors.green] : [colors.headerGreen, colors.forest]}
                style={[styles.bar, { height: h }]}
              />
              <Text style={styles.month} numberOfLines={1}>
                {b.label}
              </Text>
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
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, gap: 8 },
  headEnd: { justifyContent: 'flex-end' },
  title: { flex: 1, fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  chip: {
    backgroundColor: colors.mint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ui.brandSoft,
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.forest },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10,
    gap: 9,
  },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
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

import { StyleSheet, Text, View } from 'react-native';
import { Activity } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function JobProgressCard({
  done,
  total,
  live,
  label = 'Treatment progress',
}: {
  done: number;
  total: number;
  live?: boolean;
  label?: string;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Card variant="premium" style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>{label}</Text>
        {live ? (
          <View style={styles.liveBadge}>
            <Activity size={12} color={colors.green} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>

      <Text style={styles.meta}>
        {done} of {total} steps completed · {pct}%
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.soft,
  },
  liveText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.green },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  fill: { height: '100%', backgroundColor: colors.green, borderRadius: 4 },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
});

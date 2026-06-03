import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import type { AttendanceTrendBucket } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

export function AttendanceTrendChart({
  title = 'Attendance trend',
  subtitle,
  data = [],
  onBarPress,
}: {
  title?: string;
  subtitle?: string;
  data?: AttendanceTrendBucket[];
  onBarPress?: (index: number, bucket: AttendanceTrendBucket) => void;
}) {
  const buckets = data.length > 0 ? data : [{ label: '-', present: 0, absent: 0 }];
  const max = Math.max(...buckets.map((b) => b.present + b.absent), 1);

  return (
    <Card variant="premium" style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.green }]} />
            <Text style={styles.legendText}>Present</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.muted }]} />
            <Text style={styles.legendText}>Absent</Text>
          </View>
        </View>
      </View>
      <View style={styles.bars}>
        {buckets.map((b, i) => {
          const total = b.present + b.absent;
          const pct = Math.max(8, Math.round((total / max) * 100));
          const presentPct = total > 0 ? (b.present / total) * 100 : 0;
          const bar = (
            <View style={[styles.stack, { height: `${pct}%` }]}>
              {b.present > 0 ? (
                <LinearGradient
                  colors={[colors.lime, colors.green]}
                  style={[styles.segment, { flex: presentPct }]}
                />
              ) : null}
              {b.absent > 0 ? (
                <View style={[styles.segment, styles.absent, { flex: 100 - presentPct }]} />
              ) : null}
              {total === 0 ? <View style={[styles.segment, styles.empty]} /> : null}
            </View>
          );

          const col = (
            <>
              {bar}
              <Text style={styles.counts}>
                {b.present}/{total || 0}
              </Text>
              <Text style={styles.label}>{b.label}</Text>
            </>
          );

          if (onBarPress) {
            return (
              <Pressable
                key={`${b.label}-${i}`}
                style={({ pressed }) => [styles.col, pressed && styles.pressed]}
                onPress={() => onBarPress(i, b)}
              >
                {col}
              </Pressable>
            );
          }

          return (
            <View key={`${b.label}-${i}`} style={styles.col}>
              {col}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, padding: spacing.md },
  head: { marginBottom: spacing.sm },
  headText: { marginBottom: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  legend: { flexDirection: 'row', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: fonts.body, fontSize: 10, color: colors.muted },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 130,
    paddingTop: 10,
    gap: 6,
  },
  col: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  pressed: { opacity: 0.75 },
  stack: {
    width: '64%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    overflow: 'hidden',
    flexDirection: 'column-reverse',
    minHeight: 8,
  },
  segment: { width: '100%', minHeight: 2 },
  absent: { backgroundColor: colors.border },
  empty: { flex: 1, backgroundColor: colors.soft },
  counts: { fontFamily: fonts.bodySemi, fontSize: 9, color: colors.forest, marginTop: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.muted, marginTop: 4 },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { bookingStatusLabel } from '@/lib/booking-helpers';
import type { BookingStatus, StatusBreakdownItem } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

const STATUS_COLORS: Partial<Record<BookingStatus, string>> = {
  pending: '#C15B31',
  confirmed: '#27A747',
  in_progress: '#0A6423',
  awaiting_verification: '#8FD03C',
  completed: colors.forest,
  cancelled: colors.muted,
};

export function StatusPipelineCard({
  items,
  onStatusPress,
  periodLabel,
  hideTitle,
  flush = false,
}: {
  items: StatusBreakdownItem[];
  onStatusPress: (status: string) => void;
  periodLabel?: string;
  hideTitle?: boolean;
  /** Skip outer card when already inside a glass panel. */
  flush?: boolean;
}) {
  const maxCount = Math.max(1, ...items.map((i) => i.count));

  const body = (
    <>
      {!hideTitle ? <Text style={styles.title}>Booking pipeline</Text> : null}
      {periodLabel ? <Text style={styles.sub}>{periodLabel}</Text> : null}
      {items.map((item) => {
        const label = bookingStatusLabel(item.status as BookingStatus);
        const color = STATUS_COLORS[item.status as BookingStatus] ?? colors.green;
        const width = `${Math.max(4, (item.count / maxCount) * 100)}%`;
        return (
          <Pressable
            key={item.status}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() => onStatusPress(item.status)}
          >
            <View style={styles.rowHead}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.count}>
                {item.count}
                {item.periodCount > 0 ? (
                  <Text style={styles.period}> · +{item.periodCount} this period</Text>
                ) : null}
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: width as `${number}%`, backgroundColor: color }]} />
            </View>
          </Pressable>
        );
      })}
    </>
  );

  if (flush) {
    return <View style={styles.flush}>{body}</View>;
  }

  return (
    <Card variant="glass" style={styles.card}>
      {body}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, marginBottom: 0 },
  flush: { marginBottom: 0 },
  title: { fontFamily: fonts.display, fontSize: 14, color: colors.ink, marginBottom: 4 },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginBottom: spacing.sm },
  row: { marginTop: spacing.sm },
  pressed: { opacity: 0.75 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.ink },
  count: { fontFamily: fonts.displayExtra, fontSize: 12, color: colors.forest },
  period: { fontFamily: fonts.body, fontSize: 10, color: colors.muted },
  track: {
    height: 8,
    backgroundColor: 'rgba(226,240,216,0.85)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
});

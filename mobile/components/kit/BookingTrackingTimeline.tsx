import { StyleSheet, Text, View } from 'react-native';
import {
  Check,
  Circle,
  KeyRound,
  MapPin,
  UserCheck,
  Wrench,
} from 'lucide-react-native';
import { trackingEventLabel } from '@/lib/booking-helpers';
import type { TrackingEvent } from '@/types/api';
import { colors, fonts, premium, spacing } from '@/constants/theme';

const EVENT_ICONS: Record<string, typeof Check> = {
  assigned: UserCheck,
  start_otp_sent: KeyRound,
  work_started: Wrench,
  step_done: MapPin,
  end_otp_sent: KeyRound,
  work_completed: Check,
  cancelled: Circle,
  admin_override: Check,
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function BookingTrackingTimeline({ events }: { events: TrackingEvent[] }) {
  if (events.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No activity yet</Text>
      </View>
    );
  }

  const sorted = [...events].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <View style={styles.wrap}>
      {sorted.map((item, i) => {
        const Icon = EVENT_ICONS[item.event] ?? Circle;
        const isLast = i === sorted.length - 1;
        const stepTitle =
          item.event === 'step_done' && item.meta?.title
            ? `${trackingEventLabel(item.event)}: ${String(item.meta.title)}`
            : trackingEventLabel(item.event);

        return (
          <View key={`${item.event}-${item.at}-${i}`} style={styles.row}>
            <View style={styles.col}>
              <View style={[styles.dot, isLast && styles.dotActive]}>
                <Icon size={12} color={isLast ? colors.white : colors.green} />
              </View>
              {!isLast ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.body}>
              <Text style={[styles.label, isLast && styles.labelActive]}>{stepTitle}</Text>
              <Text style={styles.time}>{formatTime(item.at)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...premium.shadowSoft,
  },
  empty: { padding: spacing.md, alignItems: 'center' },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 52 },
  col: { alignItems: 'center', width: 32, marginRight: spacing.sm },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.soft,
    borderWidth: 1.5,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  line: { flex: 1, width: 2, minHeight: 24, backgroundColor: colors.border, marginTop: 4 },
  body: { flex: 1, paddingBottom: spacing.md },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  labelActive: { fontFamily: fonts.display, color: colors.forest },
  time: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 3 },
});

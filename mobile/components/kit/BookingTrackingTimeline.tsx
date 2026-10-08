import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { trackingEventLabel } from '@/lib/booking-helpers';
import type { TrackingEvent } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

const EVENT_ICONS: Record<string, LucideIcon> = {
  assigned: AppIcons.ui.shieldCheck,
  start_otp_sent: AppIcons.ui.key,
  work_started: AppIcons.ui.brand,
  step_done: AppIcons.ui.mapPin,
  end_otp_sent: AppIcons.ui.key,
  work_completed: AppIcons.ui.check,
  cancelled: AppIcons.ui.alert,
  admin_override: AppIcons.ui.check,
  schedule_confirmed: AppIcons.ui.calendarCheck,
  rescheduled: AppIcons.ui.calendarClock,
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
        const icon = EVENT_ICONS[item.event] ?? AppIcons.ui.activity;
        const isLast = i === sorted.length - 1;
        const stepTitle =
          item.event === 'step_done' && item.meta?.title
            ? `${trackingEventLabel(item.event)}: ${String(item.meta.title)}`
            : trackingEventLabel(item.event);

        return (
          <View key={`${item.event}-${item.at}-${i}`} style={styles.row}>
            <View style={styles.col}>
              <View style={[styles.dot, isLast && styles.dotActive]}>
                <PremiumIcon
                  icon={icon}
                  variant="plain"
                  size={12}
                  color={isLast ? colors.white : ui.brand}
                />
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
    borderRadius: 18,
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderWidth: 1,
    borderColor: ui.hairline,
    overflow: 'hidden',
    ...ui.shadow,
  },
  empty: { padding: spacing.md, alignItems: 'center' },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: ui.textSecondary },
  row: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 52 },
  col: { alignItems: 'center', width: 32, marginRight: spacing.sm },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ui.brandSoft,
    borderWidth: 1.5,
    borderColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { backgroundColor: ui.brand, borderColor: ui.brand },
  line: { flex: 1, width: 2, minHeight: 24, backgroundColor: ui.hairline, marginTop: 4 },
  body: { flex: 1, paddingBottom: spacing.md },
  label: { fontFamily: fonts.display, fontSize: 13, color: ui.text },
  labelActive: { fontFamily: fonts.displayExtra, color: ui.brand },
  time: { fontFamily: fonts.body, fontSize: 11, color: ui.textSecondary, marginTop: 3 },
});

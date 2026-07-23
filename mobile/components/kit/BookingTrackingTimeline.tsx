import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { trackingEventLabel } from '@/lib/booking-helpers';
import type { TrackingEvent } from '@/types/api';
import { colors, fonts, premium, spacing, surfaces } from '@/constants/theme';

const EVENT_ICONS: Record<string, LucideIcon> = {
  assigned: AppIcons.ui.shieldCheck,
  start_otp_sent: AppIcons.ui.key,
  work_started: AppIcons.ui.brand,
  step_done: AppIcons.ui.mapPin,
  end_otp_sent: AppIcons.ui.key,
  work_completed: AppIcons.ui.check,
  cancelled: AppIcons.ui.alert,
  admin_override: AppIcons.ui.check,
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
      <LinearGradient colors={['#8FD03C', '#27A747']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
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
                  color={isLast ? colors.white : colors.green}
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
    backgroundColor: surfaces.glass,
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    overflow: 'hidden',
    ...premium.shadowSoft,
  },
  goldBar: { height: 3, marginHorizontal: -spacing.md, marginTop: -spacing.sm, marginBottom: spacing.sm },
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
  label: { fontFamily: fonts.display, fontSize: 13, color: colors.ink },
  labelActive: { fontFamily: fonts.displayExtra, color: colors.forest },
  time: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 3 },
});

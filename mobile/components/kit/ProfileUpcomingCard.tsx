import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcons } from '@/constants/appIcons';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import {
  bookingScheduleDisplay,
  bookingServiceName,
  bookingStatusLabel,
} from '@/lib/booking-helpers';
import type { Booking } from '@/types/api';
import { colors, fonts, statusColors } from '@/constants/theme';

/** Upcoming visit card — glass shell + real icons. */
export function ProfileUpcomingCard({
  booking,
  onPress,
  eyebrow,
}: {
  booking: Booking;
  onPress: () => void;
  eyebrow?: string;
}) {
  const statusColor = statusColors[booking.status]?.text ?? colors.muted;
  const statusBg = statusColors[booking.status]?.bg ?? colors.soft;
  const label =
    eyebrow ??
    (booking.status === 'in_progress'
      ? 'In progress'
      : booking.status === 'awaiting_verification'
        ? 'Needs review'
        : 'Next visit');

  return (
    <Pressable style={({ pressed }) => [styles.shell, pressed && styles.pressed]} onPress={onPress}>
      <GlassPanel style={styles.card} padded={false} tone="light" goldEdge>
        <View style={styles.row}>
          <PremiumIcon
            icon={AppIcons.profile.bookings}
            variant="premium"
            size={18}
            gradient={['#30B84F', '#1B873E', '#043813']}
            boxSize={46}
          />
          <View style={styles.info}>
            <Text style={styles.eyebrow}>{label}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {bookingServiceName(booking)}
            </Text>
            <Text style={styles.schedule} numberOfLines={1}>
              {bookingScheduleDisplay(booking)}
            </Text>
          </View>
          <View style={styles.right}>
            <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
              <Text style={[styles.status, { color: statusColor }]} numberOfLines={1}>
                {bookingStatusLabel(booking.status)}
              </Text>
            </View>
            <PremiumIcon icon={AppIcons.ui.chevronRight} variant="chevron" size={14} color={colors.forest} />
          </View>
        </View>
      </GlassPanel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: { borderRadius: 22 },
  card: { borderRadius: 22 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  info: { flex: 1, minWidth: 0, gap: 3 },
  eyebrow: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.forest,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    letterSpacing: -0.2,
    color: colors.ink,
  },
  schedule: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
  },
  right: { alignItems: 'flex-end', gap: 8 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  status: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
  },
});

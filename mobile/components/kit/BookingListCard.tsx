import { memo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, ChevronRight, MapPin } from 'lucide-react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  bookingCustomerName,
  bookingRef,
  bookingScheduleDisplay,
  bookingServiceIconKey,
  bookingServiceName,
  isSchedulePending,
} from '@/lib/booking-helpers';
import type { Booking } from '@/types/api';
import { colors, fonts, premium, shadows, spacing, statusColors, typography } from '@/constants/theme';

function stepProgress(booking: Booking): number | null {
  const steps = booking.steps ?? [];
  if (steps.length === 0) return null;
  return steps.filter((s) => s.status === 'done').length / steps.length;
}

export const BookingListCard = memo(function BookingListCard({
  booking,
  onPress,
  showCustomer,
  hideAmount,
  hint,
}: {
  booking: Booking;
  onPress?: () => void;
  showCustomer?: boolean;
  hideAmount?: boolean;
  hint?: string;
}) {
  const iconKey = bookingServiceIconKey(booking);
  const name = bookingServiceName(booking);
  const customer = showCustomer ? bookingCustomerName(booking) : null;
  const accent = statusColors[booking.status]?.text ?? colors.green;
  const accentBg = statusColors[booking.status]?.bg ?? colors.soft;
  const schedulePending = isSchedulePending(booking);
  const progress = stepProgress(booking);
  const isLive = booking.status === 'in_progress' || booking.status === 'awaiting_verification';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <View style={styles.card}>
        <View style={[styles.accent, { backgroundColor: accent }]} />

        <LinearGradient colors={['#E8F5EC', '#FFFFFF']} style={styles.iconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={[styles.icon, { backgroundColor: accent }]}>
            <ServiceIcon iconKey={iconKey} size={22} color={colors.lime} />
          </View>
          {isLive ? <View style={styles.pulse} /> : null}
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={2}>
                {name}
              </Text>
              <StatusPill status={booking.status} />
            </View>
            {customer ? <Text style={styles.customer}>{customer}</Text> : null}
          </View>

          <View style={styles.metaRow}>
            <Calendar size={12} color={colors.forest} />
            <Text style={styles.meta}>{bookingScheduleDisplay(booking)}</Text>
          </View>

          <View style={styles.metaRow}>
            <MapPin size={12} color={colors.muted} />
            <Text style={styles.addr} numberOfLines={1}>
              {booking.address}
            </Text>
          </View>

          {progress !== null && isLive ? (
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: accent }]} />
              </View>
              <Text style={styles.progressLabel}>{Math.round(progress * 100)}% complete</Text>
            </View>
          ) : null}

          {schedulePending ? (
            <View style={[styles.callout, { backgroundColor: accentBg }]}>
              <Text style={[styles.hint, { color: accent }]}>Awaiting schedule confirmation</Text>
            </View>
          ) : null}
          {hint ? (
            <View style={[styles.callout, { backgroundColor: accentBg }]}>
              <Text style={[styles.hint, { color: accent }]}>{hint}</Text>
            </View>
          ) : null}
          {booking.status === 'awaiting_verification' && !hint ? (
            <View style={[styles.callout, { backgroundColor: accentBg }]}>
              <Text style={[styles.hint, { color: accent }]}>Tap to enter completion code</Text>
            </View>
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.ref}>{bookingRef(booking.id)}</Text>
            {!hideAmount && booking.amount ? (
              <Text style={styles.total}>₹{booking.amount.total}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.chevron}>
          <ChevronRight size={18} color={colors.forest} strokeWidth={2.5} />
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  pressed: { opacity: 0.96, transform: [{ scale: 0.995 }] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    padding: spacing.sm + 2,
    paddingLeft: spacing.sm + 6,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
    overflow: 'hidden',
    ...shadows.floating,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: premium.radiusCard,
    borderBottomLeftRadius: premium.radiusCard,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.08)',
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lime,
    borderWidth: 2,
    borderColor: colors.white,
  },
  body: { flex: 1, minWidth: 0 },
  titleBlock: { marginBottom: 2 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 20,
  },
  customer: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest, marginTop: 2 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  meta: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest, flex: 1 },
  addr: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, flex: 1 },
  progressWrap: { marginTop: 8 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
  },
  callout: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  hint: { fontFamily: fonts.bodySemi, fontSize: 11 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ref: { fontFamily: fonts.body, fontSize: 10, color: colors.muted, letterSpacing: 0.3 },
  total: { ...typography.price, fontSize: 17 },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

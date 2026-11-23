import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { ArrowRight, CalendarClock, MapPin } from 'lucide-react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  bookingRef,
  bookingScheduleDisplay,
  bookingServiceIconKey,
  bookingServiceName,
  isBookingLive,
} from '@/lib/booking-helpers';
import { useBookingCopy } from '@/lib/schedule-copy';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import type { Booking } from '@/types/api';
import { colors, fonts, gradients, radii, spacing, ui } from '@/constants/theme';
import { localDateKey } from '@/lib/dates';

/** Premium next-visit hero — dark brand card with schedule, address, and CTA. */
export function BookingsNextHighlight({
  booking,
  onPress,
}: {
  booking: Booking;
  onPress?: () => void;
}) {
  const copy = useBookingCopy();
  const labels = useCustomerUiCopy();
  const live = isBookingLive(booking.status);
  // "Happening now" only for today's visit — an older job that is still open just reads "In progress".
  const liveLabel = booking.schedule?.date === localDateKey() ? copy.liveNowLabel : copy.liveOngoingLabel;
  const name = bookingServiceName(booking, labels);

  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.985}
      haptic="tap"
      containerStyle={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel={`${copy.listNextVisitLabel}: ${name}`}
    >
      <LinearGradient
        colors={[...gradients.premiumHero]}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.orbTop} pointerEvents="none" />
        <View style={styles.orbBottom} pointerEvents="none" />

        <View style={styles.top}>
          <View style={styles.badge}>
            {live ? <View style={styles.liveDot} /> : null}
            <Text style={styles.badgeText}>
              {live ? liveLabel : copy.listNextVisitLabel}
            </Text>
          </View>
          <StatusPill status={booking.status} />
        </View>

        <View style={styles.main}>
          <View style={styles.icon}>
            <ServiceIcon iconKey={bookingServiceIconKey(booking)} size={28} color={colors.white} />
          </View>
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={2}>
              {name}
            </Text>
            <Text style={styles.ref}>{bookingRef(booking.id)}</Text>
          </View>
        </View>

        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <CalendarClock size={14} color={colors.limeOnDark} strokeWidth={2.2} />
            <Text style={styles.metaText} numberOfLines={1}>
              {bookingScheduleDisplay(booking, labels)}
            </Text>
          </View>
          {booking.address ? (
            <View style={styles.metaRow}>
              <MapPin size={14} color="rgba(255,255,255,0.7)" strokeWidth={2.2} />
              <Text style={styles.metaAddr} numberOfLines={1}>
                {booking.address}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cta}>
          <Text style={styles.ctaText}>{live ? labels.bookingsTrackLive : labels.bookingsViewVisit}</Text>
          <View style={styles.ctaIcon}>
            <ArrowRight size={16} color={ui.brand} strokeWidth={2.5} />
          </View>
        </View>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: radii.card,
    padding: 18,
    overflow: 'hidden',
    shadowColor: colors.deep,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 10,
  },
  orbTop: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(185,229,138,0.12)',
  },
  orbBottom: {
    position: 'absolute',
    left: -60,
    bottom: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.limeBright,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.limeOnDark,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  name: {
    fontFamily: fonts.displayExtra,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.4,
    color: colors.white,
  },
  ref: {
    marginTop: 3,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.4,
  },
  metaCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.white,
  },
  metaAddr: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.72)',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 48,
  },
  ctaText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: ui.brand,
  },
  ctaIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

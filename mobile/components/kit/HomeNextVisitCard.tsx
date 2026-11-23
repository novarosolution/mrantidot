import { useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, CalendarClock, Navigation } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { ServiceThumb } from '@/components/kit/ServiceThumb';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  bookingScheduleDisplay,
  bookingServiceIconKey,
  bookingServiceName,
  bookingHasTechnician,
  isBookingLive,
} from '@/lib/booking-helpers';
import type { Booking } from '@/types/api';
import { colors, fonts, ui } from '@/constants/theme';
import { localDateKey } from '@/lib/dates';
import { getCustomerTrackingSteps, useBookingCopy } from '@/lib/schedule-copy';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { useAmbientLoop } from '@/lib/a11yPrefs';

/** Pulsing "live" dot while a technician is on site. */
function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useAmbientLoop(
    () =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.6, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
      ),
    [pulse],
  );
  return (
    <View style={styles.liveDotWrap}>
      <Animated.View
        style={[
          styles.liveHalo,
          { transform: [{ scale: pulse }], opacity: pulse.interpolate({ inputRange: [1, 1.6], outputRange: [0.5, 0] }) },
        ]}
      />
      <View style={styles.liveDot} />
    </View>
  );
}

/** "Your next visit" — the customer's soonest active booking, one tap from home. */
export function HomeNextVisitCard({ booking, onPress }: { booking: Booking; onPress: () => void }) {
  const service =
    booking.service && typeof booking.service === 'object'
      ? booking.service
      : { iconKey: bookingServiceIconKey(booking), serviceTypes: undefined };
  const live = isBookingLive(booking.status);
  // "Happening now" only for today's visit — an older job that is still open just reads "In progress".
  const copy = useBookingCopy();
  const uiCopy = useCustomerUiCopy();
  const kicker = live
    ? booking.schedule?.date === localDateKey()
      ? copy.liveNowLabel
      : copy.liveOngoingLabel
    : copy.listNextVisitLabel;

  const steps = getCustomerTrackingSteps(booking.status, bookingHasTechnician(booking), copy);
  const doneCount = steps.filter((st) => st.done).length;
  // While a job is live the latest finished step IS the customer's action (start / completion code),
  // so show it; before that, show the next pending step.
  const nowLabel = live
    ? steps[Math.max(0, doneCount - 1)]?.title
    : (steps.find((st) => !st.done)?.title ?? steps[steps.length - 1]?.title);

  return (
    <PressableScale
      onPress={onPress}
      style={[styles.card, live && styles.cardLive]}
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityLabel={`${uiCopy.profileNextVisitTitle}: ${bookingServiceName(booking, uiCopy)}, ${bookingScheduleDisplay(booking, uiCopy)}`}
    >
      <View style={styles.top}>
        <ServiceThumb service={service} width={56} radius={17} iconSize={30} />
        <View style={styles.body}>
          <View style={styles.eyebrowRow}>
            {live ? <LiveDot /> : null}
            <Text style={[styles.eyebrow, live && styles.eyebrowLive]} numberOfLines={1}>
              {kicker}
            </Text>
            <View style={styles.flex} />
            <StatusPill status={booking.status} />
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {bookingServiceName(booking)}
          </Text>
          <View style={styles.whenRow}>
            <CalendarClock size={13} color={ui.textSecondary} strokeWidth={2.1} />
            <Text style={styles.when} numberOfLines={1}>
              {bookingScheduleDisplay(booking)}
            </Text>
          </View>
        </View>
      </View>

      {/* Journey progress — the same steps as the booking's tracking timeline. */}
      <View style={styles.progressBlock}>
        <View style={styles.segments}>
          {steps.map((st, i) => (
            <View key={i} style={[styles.segment, st.done && styles.segmentDone, !st.done && i === doneCount && styles.segmentNow]} />
          ))}
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressText} numberOfLines={1}>
            {nowLabel}
          </Text>
          <Text style={styles.progressCount}>
            {doneCount}/{steps.length}
          </Text>
        </View>
      </View>

      <View style={[styles.cta, live && styles.ctaLive]}>
        {live ? <Navigation size={15} color={colors.white} strokeWidth={2.4} /> : null}
        <Text style={[styles.ctaText, live && styles.ctaTextLive]}>{live ? uiCopy.homeTrackLive : uiCopy.homeViewVisit}</Text>
        <ArrowRight size={16} color={live ? colors.white : ui.brand} strokeWidth={2.4} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadowFloat,
  },
  /** A visit in progress gets a mint wash and emerald edge so it reads as the one thing happening now. */
  cardLive: { backgroundColor: '#F4FBF6', borderColor: 'rgba(21,148,71,0.3)' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1, minWidth: 0 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: ui.textTertiary,
  },
  eyebrowLive: { color: ui.brand },
  name: {
    marginTop: 3,
    fontFamily: fonts.displayExtra,
    fontSize: 16.5,
    lineHeight: 21,
    letterSpacing: -0.3,
    color: ui.text,
  },
  whenRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  when: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary },
  progressBlock: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: ui.hairline },
  segmentDone: { backgroundColor: ui.brandBright },
  segmentNow: { backgroundColor: 'rgba(21,148,71,0.32)' },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 10 },
  progressText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.textSecondary },
  progressCount: { fontFamily: fonts.bodyBold, fontSize: 12, color: ui.text },
  cta: {
    marginTop: 12,
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: ui.brandSoft,
  },
  ctaLive: { backgroundColor: ui.brand },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.brand },
  ctaTextLive: { color: colors.white },
  liveDotWrap: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  liveHalo: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.green },
});

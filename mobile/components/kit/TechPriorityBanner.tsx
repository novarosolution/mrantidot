import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { homeShadow } from '@/components/kit/homeUi';
import { AppIcons, IconGradients } from '@/constants/appIcons';
import type { Booking } from '@/types/api';
import { bookingServiceName, bookingScheduleDisplay } from '@/lib/booking-helpers';
import { adminType, colors, spacing } from '@/constants/theme';
import { techRoutes, appPush } from '@/lib/routes';

export function TechPriorityBanner({
  overdueJobs,
  verifyJob,
  flush,
}: {
  overdueJobs: Booking[];
  verifyJob?: Booking;
  flush?: boolean;
}) {
  if (verifyJob) {
    return (
      <Pressable
        style={({ pressed }) => [styles.wrap, flush && styles.wrapFlush, pressed && styles.pressed]}
        onPress={() => appPush(techRoutes.job(verifyJob.id))}
      >
        <View style={styles.shell}>
          <LinearGradient colors={[...IconGradients.verify]} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.rim} pointerEvents="none" />
            <View style={styles.iconWrap}>
              <PremiumIcon
                icon={AppIcons.techAlert.verify}
                variant="plain"
                size="md"
                color="#FFFFFF"
                strokeWidth={2.3}
                fill="rgba(255,255,255,0.28)"
              />
            </View>
            <View style={styles.body}>
              <Text style={styles.kicker}>Action needed</Text>
              <Text style={styles.title}>Enter customer completion code</Text>
              <Text style={styles.sub} numberOfLines={1}>
                {bookingServiceName(verifyJob)} · {bookingScheduleDisplay(verifyJob)}
              </Text>
            </View>
            <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size="sm" color="#FFFFFF" strokeWidth={2.5} />
          </LinearGradient>
        </View>
      </Pressable>
    );
  }

  if (overdueJobs.length === 0) return null;

  const job = overdueJobs[0];
  return (
    <Pressable
      style={({ pressed }) => [styles.wrap, flush && styles.wrapFlush, pressed && styles.pressed]}
      onPress={() => appPush(techRoutes.job(job.id))}
    >
      <View style={styles.shell}>
        <LinearGradient colors={[...IconGradients.danger]} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.rim} pointerEvents="none" />
          <View style={[styles.iconWrap, styles.iconWarn]}>
            <PremiumIcon
              icon={AppIcons.techAlert.overdue}
              variant="plain"
              size="md"
              color="#FFFFFF"
              strokeWidth={2.3}
              fill="rgba(255,255,255,0.28)"
            />
          </View>
          <View style={styles.body}>
            <Text style={styles.kicker}>Overdue · {overdueJobs.length}</Text>
            <Text style={styles.title}>Past visit date — action needed</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {bookingServiceName(job)} · {bookingScheduleDisplay(job)}
            </Text>
          </View>
          <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size="sm" color="#FFFFFF" strokeWidth={2.5} />
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  wrapFlush: { marginHorizontal: 0 },
  pressed: { opacity: 0.96, transform: [{ scale: 0.99 }] },
  shell: {
    borderRadius: 20,
    ...homeShadow.promo,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 20,
    overflow: 'hidden',
  },
  rim: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  body: { flex: 1, minWidth: 0 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWarn: { backgroundColor: 'rgba(255,255,255,0.2)' },
  kicker: {
    ...adminType.statLabel,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.65,
  },
  title: { ...adminType.hubLabel, color: colors.white, marginTop: 1 },
  sub: { ...adminType.hubDesc, color: 'rgba(255,255,255,0.86)', marginTop: 2 },
});

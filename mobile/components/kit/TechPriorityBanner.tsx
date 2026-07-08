import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons, IconGradients } from '@/constants/appIcons';
import type { Booking } from '@/types/api';
import { bookingServiceName, bookingScheduleDisplay } from '@/lib/booking-helpers';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

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
        onPress={() => router.push(`/(tech)/job/${verifyJob.id}`)}
      >
        <LinearGradient colors={[...IconGradients.verify]} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.iconWrap}>
            <PremiumIcon icon={AppIcons.techAlert.verify} variant="plain" size="lg" color={colors.lime} strokeWidth={2.2} />
          </View>
          <View style={styles.body}>
            <Text style={styles.kicker}>Action needed</Text>
            <Text style={styles.title}>Enter customer completion code</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {bookingServiceName(verifyJob)} · {bookingScheduleDisplay(verifyJob)}
            </Text>
          </View>
          <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size="md" color={colors.lime} strokeWidth={2.5} />
        </LinearGradient>
      </Pressable>
    );
  }

  if (overdueJobs.length === 0) return null;

  const job = overdueJobs[0];
  return (
    <Pressable
      style={({ pressed }) => [styles.wrap, flush && styles.wrapFlush, pressed && styles.pressed]}
      onPress={() => router.push(`/(tech)/job/${job.id}`)}
    >
      <LinearGradient colors={[...IconGradients.danger]} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={[styles.iconWrap, styles.iconWarn]}>
          <PremiumIcon icon={AppIcons.techAlert.overdue} variant="plain" size="lg" color={colors.white} strokeWidth={2.2} />
        </View>
        <View style={styles.body}>
          <Text style={styles.kicker}>Overdue · {overdueJobs.length}</Text>
          <Text style={styles.title}>Past visit date — action needed</Text>
          <Text style={styles.sub} numberOfLines={1}>
            {bookingServiceName(job)} · {bookingScheduleDisplay(job)}
          </Text>
        </View>
        <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size="md" color={colors.white} strokeWidth={2.5} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  wrapFlush: { marginHorizontal: 0 },
  pressed: { opacity: 0.96, transform: [{ scale: 0.99 }] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    ...shadows.hero,
  },
  body: { flex: 1, minWidth: 0 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWarn: { backgroundColor: 'rgba(255,255,255,0.18)' },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: { fontFamily: fonts.display, fontSize: 15, color: colors.white, marginTop: 2 },
  sub: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3 },
});

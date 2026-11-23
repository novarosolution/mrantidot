import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { homeShadow } from '@/components/kit/homeUi';
import { PressableScale } from '@/components/ui/PressableScale';
import { fillCopy } from '@/constants/customerUiCopy';
import { AppIcons, IconGradients } from '@/constants/appIcons';
import type { Booking } from '@/types/api';
import { bookingServiceName, bookingScheduleDisplay } from '@/lib/booking-helpers';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { adminType, colors, spacing } from '@/constants/theme';
import { techRoutes, appPush } from '@/lib/routes';

/** The one thing to do first on the jobs tab: a job waiting for its completion code, else the oldest overdue job. */
export function TechPriorityBanner({
  overdueJobs,
  verifyJob,
  flush,
}: {
  overdueJobs: Booking[];
  verifyJob?: Booking;
  flush?: boolean;
}) {
  const copy = useCustomerUiCopy();
  const job = verifyJob ?? overdueJobs[0];
  if (!job) return null;

  const verify = Boolean(verifyJob);
  const kicker = verify ? copy.techBannerActionNeeded : fillCopy(copy.techBannerOverdue, { count: overdueJobs.length });
  const title = verify ? copy.techBannerVerifyTitle : copy.techOverdueHint;
  const sub = `${bookingServiceName(job)} · ${bookingScheduleDisplay(job)}`;

  return (
    <PressableScale
      haptic="tap"
      onPress={() => appPush(techRoutes.job(job.id))}
      containerStyle={[styles.wrap, flush && styles.wrapFlush]}
      style={styles.shell}
      accessibilityRole="button"
      accessibilityLabel={`${kicker}. ${title}. ${sub}`}
    >
      <LinearGradient
        colors={[...(verify ? IconGradients.verify : IconGradients.danger)]}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.rim} pointerEvents="none" />
        <View style={[styles.iconWrap, !verify && styles.iconWarn]}>
          <PremiumIcon
            icon={verify ? AppIcons.techAlert.verify : AppIcons.techAlert.overdue}
            variant="plain"
            size="md"
            color={colors.white}
            strokeWidth={2.3}
            fill="rgba(255,255,255,0.28)"
          />
        </View>
        <View style={styles.body}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub} numberOfLines={1}>
            {sub}
          </Text>
        </View>
        <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size="sm" color={colors.white} strokeWidth={2.5} />
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  wrapFlush: { marginHorizontal: 0 },
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

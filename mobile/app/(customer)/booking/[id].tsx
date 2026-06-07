import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { BookingDetailHero } from '@/components/kit/BookingDetailHero';
import { BookingFactsCard } from '@/components/kit/BookingFactsCard';
import { PendingScheduleCard } from '@/components/kit/PendingScheduleCard';
import { BookingPriceBreakdown } from '@/components/kit/BookingPriceBreakdown';
import { BookingTrackingTimeline } from '@/components/kit/BookingTrackingTimeline';
import { JobProgressCard } from '@/components/kit/JobProgressCard';
import { OtpEntrySheet } from '@/components/kit/OtpEntrySheet';
import { getActiveCustomerOtp, WorkOtpCard } from '@/components/kit/WorkOtpCard';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { StepTimeline } from '@/components/ui/StepTimeline';
import { Spinner } from '@/components/ui/Spinner';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import {
  bookingRequestedScheduleDisplay,
  canCancelBooking,
  isSchedulePending,
  isTerminalBookingStatus,
  isVerificationPhase,
} from '@/lib/booking-helpers';
import { useBookingCopy } from '@/lib/schedule-copy';
import { mediaUrl } from '@/lib/images';
import type { Booking, BookingStatus, WorkOtpView } from '@/types/api';
import { colors, design, fonts, premium, spacing } from '@/constants/theme';

function customerTrackingSteps(status: BookingStatus, expertAssigned: boolean) {
  const steps = [
    { title: 'Booking received', done: true },
    { title: 'Schedule confirmed', done: false },
    { title: expertAssigned ? 'Share start code' : 'Assigning service expert', done: false },
    { title: 'Treatment in progress', done: false },
    { title: 'Share completion code', done: false },
    { title: 'Completed', done: false },
  ];
  if (status === 'pending') return steps.map((s, i) => ({ ...s, done: i === 0 }));
  if (status === 'confirmed') {
    return steps.map((s, i) => ({
      ...s,
      done: i <= 1 || (i === 2 && expertAssigned),
    }));
  }
  if (status === 'in_progress') return steps.map((s, i) => ({ ...s, done: i <= 3 }));
  if (status === 'awaiting_verification') return steps.map((s, i) => ({ ...s, done: i <= 4 }));
  if (status === 'completed') return steps.map((s) => ({ ...s, done: true }));
  return steps;
}

export default function CustomerBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingCopy = useBookingCopy();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [hasReview, setHasReview] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [regenerating, setRegenerating] = useState<'start' | 'end' | null>(null);
  const [endOtpOpen, setEndOtpOpen] = useState(false);
  const focusedRef = useRef(false);
  const lastRefresh = useRef(0);

  const load = useCallback(async (opts?: { skipCache?: boolean }) => {
    if (!id) return;
    setLoadError(null);
    const cacheOpts = opts?.skipCache
      ? { skipCache: true as const }
      : { cacheTtlMs: CACHE_TTL.bookingDetail };
    const [bookingRes, reviewRes] = await Promise.allSettled([
      api.get<{ booking: Booking }>(`/bookings/${id}`, { ...screenLoadConfig, ...cacheOpts }),
      api.get(`/reviews/booking/${id}`, { ...screenLoadConfig, ...cacheOpts }),
    ]);
    if (bookingRes.status !== 'fulfilled') throw bookingRes.reason;
    setBooking(bookingRes.value.data.booking);
    setHasReview(reviewRes.status === 'fulfilled');
  }, [id]);

  useEffect(() => {
    safeAsync(async () => {
      try {
        await load();
      } catch (err) {
        setLoadError(getApiErrorMessage(err, 'Could not load booking'));
      }
    });
  }, [load]);

  const refresh = useCallback(
    (force = false) => {
      const now = Date.now();
      if (!force && now - lastRefresh.current < CACHE_TTL.bookingDetail) return;
      lastRefresh.current = now;
      safeAsync(async () => {
        try {
          await load();
        } catch {
          // keep showing the last successful data on a silent refresh
        }
      });
    },
    [load],
  );

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      lastRefresh.current = 0;
      await load({ skipCache: true });
    } catch {
      // keep last successful data
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      refresh();
      return () => {
        focusedRef.current = false;
      };
    }, [refresh]),
  );

  const liveStatus = booking ? !isTerminalBookingStatus(booking.status) : false;
  useEffect(() => {
    if (!liveStatus) return;
    const timer = setInterval(() => {
      if (focusedRef.current) refresh();
    }, 45000);
    return () => clearInterval(timer);
  }, [liveStatus, refresh]);

  async function completeWithOtp(otp: string) {
    setVerifying(true);
    try {
      await api.post(`/bookings/${id}/complete-work`, { otp });
      Toast.show({ type: 'success', text1: 'Job completed!' });
      setEndOtpOpen(false);
      await load({ skipCache: true });
    } finally {
      setVerifying(false);
    }
  }

  async function regenerateOtp(type: 'start' | 'end') {
    setRegenerating(type);
    try {
      await api.post(`/bookings/${id}/regenerate-otp`, { type });
      Toast.show({ type: 'success', text1: 'New code generated' });
      await load({ skipCache: true });
    } finally {
      setRegenerating(null);
    }
  }

  function confirmCancel() {
    Alert.alert('Cancel booking?', 'This cannot be undone.', [
      { text: 'Keep booking', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: () => void doCancel(),
      },
    ]);
  }

  async function doCancel() {
    setCancelling(true);
    try {
      await api.patch(`/bookings/${id}/cancel`);
      Toast.show({ type: 'success', text1: 'Booking cancelled' });
      await load();
    } finally {
      setCancelling(false);
    }
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <CustomerPageHeader variant="premium" title="Booking" showBack />
        <ListEmptyRetry message={loadError} onRetry={() => safeAsync(load)} />
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <CustomerPageHeader variant="premium" title="Your booking" showBack />
        <Spinner />
      </SafeAreaView>
    );
  }

  const workOtp = booking.workOtp as WorkOtpView | undefined;
  const startOtp = getActiveCustomerOtp(workOtp, 'start');
  const endOtp = getActiveCustomerOtp(workOtp, 'end');
  const expertAssigned =
    Boolean(startOtp) ||
    Boolean(booking.workStartedAt) ||
    Boolean(booking.tracking?.some((e) => e.event === 'assigned' || e.event === 'start_otp_sent'));
  const isLive = !isTerminalBookingStatus(booking.status);
  const timeline = customerTrackingSteps(booking.status, expertAssigned);
  const steps = booking.steps ?? [];
  const problemPhotos = booking.problemPhotos ?? [];
  const doneCount = steps.filter((s) => s.status === 'done').length;
  const activeIndex = steps.findIndex((s) => s.status !== 'done');
  const progress = steps.length ? doneCount / steps.length : 0;
  const showStageTimeline = booking.status === 'pending' || booking.status === 'confirmed';
  const showLiveProgress =
    booking.status === 'in_progress' || booking.status === 'awaiting_verification';
  const showStepHistory = booking.status === 'completed' && steps.some((s) => s.photoUrl);

  const stepStatusBadge = (status: string, index: number): { label: string; tone: BadgeTone } => {
    if (status === 'done') return { label: 'Completed', tone: 'success' };
    if (showLiveProgress && index === activeIndex) return { label: 'In progress', tone: 'info' };
    return { label: 'Upcoming', tone: 'neutral' };
  };

  const renderStepCard = (step: (typeof steps)[number], index: number) => {
    const isStepActive = showLiveProgress && index === activeIndex && step.status !== 'done';
    const badge = stepStatusBadge(step.status, index);
    return (
      <Card
        variant="premium"
        key={`${step.title}-${index}`}
        style={isStepActive ? { ...styles.step, ...styles.stepActive } : styles.step}
      >
        <View style={styles.stepHead}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <StatusBadge label={badge.label} tone={badge.tone} />
        </View>
        {step.photoUrl ? (
          <Image source={{ uri: mediaUrl(step.photoUrl) }} style={styles.photo} />
        ) : null}
        {step.geo?.address ? <Text style={styles.stepGeo}>{step.geo.address}</Text> : null}
      </Card>
    );
  };

  const headerRight = isLive ? (
    <StatusBadge label="● Live" tone="success" />
  ) : null;

  const svcId =
    booking.service && typeof booking.service === 'object' ? booking.service.id : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <CustomerPageHeader variant="premium" title="Your booking" showBack rightAction={headerRight} />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={colors.green} />
        }
      >
        <BookingDetailHero booking={booking} live={isLive} />

        {showLiveProgress && steps.length > 0 ? (
          <FadeSlideIn delay={60} style={styles.sectionWrap}>
            <JobProgressCard done={doneCount} total={steps.length} live={isLive} label="Live progress" />
          </FadeSlideIn>
        ) : null}

        {isSchedulePending(booking) ? (
          <FadeSlideIn delay={80} style={styles.sectionWrap}>
            <PendingScheduleCard
              variant="customer"
              title={bookingCopy.pendingCustomerTitle}
              scheduleLabel={bookingRequestedScheduleDisplay(booking)}
              modeLabel={
                booking.scheduleMode === 'custom'
                  ? bookingCopy.customModeLabel
                  : bookingCopy.standardModeLabel
              }
              notes={booking.scheduleRequest?.notes}
            />
          </FadeSlideIn>
        ) : null}
        <FadeSlideIn delay={100}>
        <PremiumSectionHeader title="Booking details" />
        <View style={styles.factsWrap}>
        <BookingFactsCard
          booking={booking}
          audience="customer"
          showTechnician={false}
          showPayment
          showPhotos={false}
        />
        </View>
        <View style={styles.priceCard}>
          <BookingPriceBreakdown amount={booking.amount} />
        </View>
        </FadeSlideIn>

        {startOtp && booking.status === 'confirmed' ? (
          <FadeSlideIn delay={120} style={styles.sectionWrap}>
            <WorkOtpCard
              title="Start code"
              otp={startOtp}
              onRegenerate={() => void regenerateOtp('start')}
              regenerating={regenerating === 'start'}
            />
          </FadeSlideIn>
        ) : null}

        {endOtp && isVerificationPhase(booking.status) ? (
          <FadeSlideIn delay={140} style={styles.sectionWrap}>
            <WorkOtpCard
              title="Completion code"
              otp={endOtp}
              onRegenerate={() => void regenerateOtp('end')}
              regenerating={regenerating === 'end'}
            />
          </FadeSlideIn>
        ) : null}

        {(booking.tracking?.length ?? 0) > 0 ? (
          <FadeSlideIn delay={160}>
          <>
            <PremiumSectionHeader title="Activity" />
            <View style={styles.sectionWrap}>
              <BookingTrackingTimeline events={booking.tracking ?? []} />
            </View>
          </>
          </FadeSlideIn>
        ) : null}

        {showStageTimeline ? (
          <FadeSlideIn delay={180}>
          <Card variant="premium" style={styles.track}>
            <PremiumSectionHeader title="Tracking" style={styles.sectionInline} />
            <StepTimeline steps={timeline} />
          </Card>
          </FadeSlideIn>
        ) : null}

        {problemPhotos.length > 0 ? (
          <>
            <PremiumSectionHeader title="Problem photos" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
              {problemPhotos.map((url) => (
                <Image key={url} source={{ uri: mediaUrl(url) }} style={styles.problemPhoto} />
              ))}
            </ScrollView>
          </>
        ) : null}

        {showLiveProgress || showStepHistory ? (
          <>
            <PremiumSectionHeader title="Treatment steps" />
            {steps.map((step, index) => renderStepCard(step, index))}
          </>
        ) : null}
      </ScrollView>

      {(isVerificationPhase(booking.status) ||
        (booking.status === 'completed' && !hasReview) ||
        canCancelBooking(booking.status) ||
        (booking.status === 'cancelled' && svcId)) && (
        <StickyActionBar>
          {isVerificationPhase(booking.status) && (
            <Button
              title="Enter completion code"
              variant="premium"
              onPress={() => setEndOtpOpen(true)}
              loading={verifying}
            />
          )}
          {booking.status === 'completed' && !hasReview && (
            <Button title="Leave a review" variant="premium" onPress={() => router.push(`/review/${booking.id}`)} />
          )}
          {canCancelBooking(booking.status) && (
            <Button
              title="Cancel booking"
              variant="secondary"
              onPress={confirmCancel}
              loading={cancelling}
              style={styles.ctaSecondary}
            />
          )}
          {booking.status === 'cancelled' && svcId ? (
            <Button title="Book again" variant="premium" onPress={() => router.push(`/book/${svcId}`)} />
          ) : null}
        </StickyActionBar>
      )}

      <OtpEntrySheet
        visible={endOtpOpen}
        title="Confirm completion"
        loading={verifying}
        onClose={() => setEndOtpOpen(false)}
        onSubmit={(otp) => void completeWithOtp(otp)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  container: { paddingBottom: 120 },
  sectionWrap: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  sectionInline: { marginTop: 0, paddingHorizontal: 0 },
  factsWrap: { marginHorizontal: spacing.md },
  priceCard: { marginHorizontal: spacing.md, marginTop: spacing.sm },
  track: { marginHorizontal: spacing.md, marginTop: spacing.sm, backgroundColor: colors.soft },
  progressHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  progressChip: {
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  progressChipText: { fontFamily: fonts.displayExtra, fontSize: 12, color: colors.forest },
  progressHint: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, lineHeight: 18 },
  progressTrack: {
    height: 7,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: { height: '100%', backgroundColor: colors.green, borderRadius: 5 },
  photoRow: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  problemPhoto: { width: 128, height: 96, borderRadius: 14, marginRight: spacing.sm },
  step: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  stepActive: { borderWidth: 1.6, borderColor: colors.green },
  stepHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  stepTitle: { fontFamily: fonts.bodySemi, fontSize: 14, flex: 1 },
  stepGeo: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 6 },
  photo: { width: '100%', height: 160, borderRadius: 12, marginTop: spacing.sm },
  ctaSecondary: { marginTop: spacing.sm },
});

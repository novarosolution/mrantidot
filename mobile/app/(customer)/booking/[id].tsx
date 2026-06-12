import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { BookingDetailHero } from '@/components/kit/BookingDetailHero';
import {
  BookingDetailSection,
  BookingPhotoGallery,
  BookingStageTracker,
  BookingTreatmentStepCard,
} from '@/components/kit/BookingDetailKit';
import { BookingFactsCard } from '@/components/kit/BookingFactsCard';
import { PendingScheduleCard } from '@/components/kit/PendingScheduleCard';
import { BookingPriceBreakdown } from '@/components/kit/BookingPriceBreakdown';
import { BookingTrackingTimeline } from '@/components/kit/BookingTrackingTimeline';
import { JobProgressCard } from '@/components/kit/JobProgressCard';
import { OtpEntrySheet } from '@/components/kit/OtpEntrySheet';
import { getActiveCustomerOtp, WorkOtpCard } from '@/components/kit/WorkOtpCard';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { Button } from '@/components/ui/Button';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { type BadgeTone } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import {
  bookingHasTechnician,
  bookingRef,
  bookingRequestedScheduleDisplay,
  bookingServiceName,
  canCancelBooking,
  isBookingLive,
  isSchedulePending,
  isVerificationPhase,
} from '@/lib/booking-helpers';
import { getCustomerTrackingSteps, getStatusGuidance, useBookingCopy } from '@/lib/schedule-copy';
import type { Booking, WorkOtpView } from '@/types/api';
import { colors, design, fonts, spacing } from '@/constants/theme';

function customerTrackingSteps(
  booking: Booking,
  expertAssigned: boolean,
  copy: ReturnType<typeof useBookingCopy>,
) {
  return getCustomerTrackingSteps(booking.status, expertAssigned, copy);
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

  const liveStatus = booking ? isBookingLive(booking.status) : false;
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
    Alert.alert(bookingCopy.cancelConfirmTitle, bookingCopy.cancelConfirmMessage, [
      { text: bookingCopy.cancelConfirmKeep, style: 'cancel' },
      {
        text: bookingCopy.cancelConfirmAction,
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
  const isLive = isBookingLive(booking.status);
  const statusGuidance = getStatusGuidance(booking.status, bookingCopy);
  const timeline = customerTrackingSteps(booking, expertAssigned, bookingCopy);
  const steps = booking.steps ?? [];
  const problemPhotos = booking.problemPhotos ?? [];
  const doneCount = steps.filter((s) => s.status === 'done').length;
  const activeIndex = steps.findIndex((s) => s.status !== 'done');
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
      <BookingTreatmentStepCard
        key={`${step.title}-${index}`}
        index={index}
        title={step.title}
        status={step.status}
        badge={badge}
        photoUrl={step.photoUrl}
        geoAddress={step.geo?.address}
        active={isStepActive}
      />
    );
  };

  const headerSubtitle = bookingRef(booking.id);
  const headerRight = isLive ? (
    <View style={styles.livePill}>
      <View style={styles.liveDot} />
      <Text style={styles.livePillText}>{bookingCopy.detailLiveBadge}</Text>
    </View>
  ) : null;

  const svcId =
    booking.service && typeof booking.service === 'object' ? booking.service.id : undefined;

  const hasStickyActions =
    isVerificationPhase(booking.status) ||
    (booking.status === 'completed' && !hasReview) ||
    canCancelBooking(booking.status) ||
    (booking.status === 'cancelled' && Boolean(svcId));

  const stickyActionCount = [
    isVerificationPhase(booking.status),
    booking.status === 'completed' && !hasReview,
    canCancelBooking(booking.status),
    booking.status === 'cancelled' && Boolean(svcId),
  ].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <CustomerPageHeader
        variant="premium"
        title={bookingCopy.detailScreenTitle}
        subtitle={`${bookingServiceName(booking)} · ${headerSubtitle}`}
        showBack
        rightAction={headerRight}
        overlapReserve
      />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          hasStickyActions && { paddingBottom: 56 + stickyActionCount * 52 + spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={colors.green} />
        }
      >
        <BookingDetailHero
          booking={booking}
          live={isLive}
          overlap
          guidance={isSchedulePending(booking) ? undefined : statusGuidance}
        />

        {showLiveProgress && steps.length > 0 ? (
          <FadeSlideIn delay={60} style={styles.sectionWrap}>
            <JobProgressCard done={doneCount} total={steps.length} live label={bookingCopy.detailLiveProgressLabel} />
          </FadeSlideIn>
        ) : null}

        {isSchedulePending(booking) ? (
          <FadeSlideIn delay={80} style={styles.sectionWrap}>
            <PendingScheduleCard
              variant="customer"
              title={bookingCopy.pendingCustomerTitle}
              scheduleLabel={bookingRequestedScheduleDisplay(booking)}
              hint={bookingCopy.pendingCustomerHint}
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
          <BookingDetailSection title={bookingCopy.detailDetailsTitle} subtitle={bookingCopy.detailDetailsSubtitle}>
            <BookingFactsCard
              booking={booking}
              audience="customer"
              hideHead
              embedded
              showTechnician={bookingHasTechnician(booking)}
              showPayment
              showPhotos={false}
            />
            <View style={styles.priceInset}>
              <BookingPriceBreakdown amount={booking.amount} compact />
            </View>
          </BookingDetailSection>
        </FadeSlideIn>

        {startOtp && booking.status === 'confirmed' ? (
          <FadeSlideIn delay={120} style={styles.sectionWrap}>
            <WorkOtpCard
              title={bookingCopy.otpStartTitle}
              subtitle={bookingCopy.otpStartSubtitle}
              otp={startOtp}
              onRegenerate={() => void regenerateOtp('start')}
              regenerating={regenerating === 'start'}
            />
          </FadeSlideIn>
        ) : null}

        {endOtp && isVerificationPhase(booking.status) ? (
          <FadeSlideIn delay={140} style={styles.sectionWrap}>
            <WorkOtpCard
              title={bookingCopy.otpEndTitle}
              subtitle={bookingCopy.otpEndSubtitle}
              otp={endOtp}
              onRegenerate={() => void regenerateOtp('end')}
              regenerating={regenerating === 'end'}
            />
          </FadeSlideIn>
        ) : null}

        {showStageTimeline ? (
          <FadeSlideIn delay={160}>
            <BookingDetailSection title={bookingCopy.trackingSectionTitle} subtitle={bookingCopy.trackingSectionSubtitle}>
              <BookingStageTracker steps={timeline} />
            </BookingDetailSection>
          </FadeSlideIn>
        ) : null}

        {(booking.tracking?.length ?? 0) > 0 ? (
          <FadeSlideIn delay={180}>
            <PremiumSectionHeader title={bookingCopy.activitySectionTitle} subtitle={bookingCopy.activitySectionSubtitle} compact />
            <View style={styles.sectionWrap}>
              <BookingTrackingTimeline events={booking.tracking ?? []} />
            </View>
          </FadeSlideIn>
        ) : null}

        {problemPhotos.length > 0 ? (
          <FadeSlideIn delay={200}>
            <BookingPhotoGallery photos={problemPhotos} />
          </FadeSlideIn>
        ) : null}

        {showLiveProgress || showStepHistory ? (
          <FadeSlideIn delay={220}>
            <PremiumSectionHeader
              title={bookingCopy.treatmentStepsTitle}
              subtitle={showLiveProgress ? bookingCopy.treatmentStepsLiveSubtitle : bookingCopy.treatmentStepsDoneSubtitle}
              compact
            />
            {steps.map((step, index) => renderStepCard(step, index))}
          </FadeSlideIn>
        ) : null}
      </ScrollView>

      {hasStickyActions && (
        <StickyActionBar>
          {isVerificationPhase(booking.status) && (
            <Button
              title={bookingCopy.detailActionEnterCode}
              variant="premium"
              onPress={() => setEndOtpOpen(true)}
              loading={verifying}
            />
          )}
          {booking.status === 'completed' && !hasReview && (
            <Button title={bookingCopy.detailActionReview} variant="premium" onPress={() => router.push(`/review/${booking.id}`)} />
          )}
          {canCancelBooking(booking.status) && (
            <Button
              title={bookingCopy.detailActionCancel}
              variant="secondary"
              onPress={confirmCancel}
              loading={cancelling}
              style={styles.ctaSecondary}
            />
          )}
          {booking.status === 'cancelled' && svcId ? (
            <Button title={bookingCopy.detailActionBookAgain} variant="premium" onPress={() => router.push(`/book/${svcId}`)} />
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
  priceInset: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(168,224,78,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(168,224,78,0.35)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.lime,
  },
  livePillText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.lime,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  ctaSecondary: { marginTop: spacing.sm },
});

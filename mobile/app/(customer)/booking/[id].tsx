import { useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { paramString } from '@/lib/routeParams';
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
import { BookingInvoiceCard } from '@/components/kit/BookingInvoiceCard';
import { BookingTrackingTimeline } from '@/components/kit/BookingTrackingTimeline';
import { RescheduleSheet } from '@/components/kit/RescheduleSheet';
import { getActiveCustomerOtp, WorkOtpCard } from '@/components/kit/WorkOtpCard';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { useDockTabBarStyle } from '@/components/kit/GlassScreenKit';
import { Button } from '@/components/ui/Button';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { type BadgeTone } from '@/components/ui/StatusBadge';
import { BookingDetailSkeleton } from '@/components/kit/ScreenSkeletons';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { haptic, stagger } from '@/lib/motion';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { stepPhotoUrls } from '@/lib/stepPhotos';
import { CACHE_TTL } from '@/lib/apiCache';
import {
  bookingHasTechnician,
  bookingRef,
  bookingRequestedScheduleDisplay,
  bookingServiceName,
  canCancelBooking,
  isBookingLive,
  isRequestedTimePast,
  isSchedulePending,
  isVerificationPhase,
} from '@/lib/booking-helpers';
import { getCustomerTrackingSteps, getStatusGuidance, useBookingCopy } from '@/lib/schedule-copy';
import type { Booking, Review, WorkOtpView } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { sharedRoutes, appPush } from '@/lib/routes';

function customerTrackingSteps(
  booking: Booking,
  expertAssigned: boolean,
  copy: ReturnType<typeof useBookingCopy>,
) {
  return getCustomerTrackingSteps(booking.status, expertAssigned, copy);
}

export default function CustomerBookingDetailScreen() {
  const navigation = useNavigation();
  const id = paramString(useLocalSearchParams<{ id: string | string[] }>().id);
  const bookingCopy = useBookingCopy();
  const labels = useCustomerUiCopy();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [hasReview, setHasReview] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [regenerating, setRegenerating] = useState<'start' | 'end' | null>(null);
  const focusedRef = useRef(false);
  const lastRefresh = useRef(0);

  const load = useCallback(async (opts?: { skipCache?: boolean }) => {
    if (!id) {
      setLoadError('Booking not found');
      return;
    }
    setLoadError(null);
    const cacheOpts = opts?.skipCache
      ? { skipCache: true as const }
      : { cacheTtlMs: CACHE_TTL.bookingDetail };
    const [bookingRes, reviewRes] = await Promise.allSettled([
      api.get<{ booking: Booking }>(`/bookings/${id}`, { ...screenLoadConfig, ...cacheOpts }),
      api.get<{ review: Review | null }>(`/reviews/booking/${id}`, { ...screenLoadConfig, ...cacheOpts }),
    ]);
    if (bookingRes.status !== 'fulfilled') throw bookingRes.reason;
    setBooking(bookingRes.value.data.booking);
    setHasReview(reviewRes.status === 'fulfilled' && Boolean(reviewRes.value.data.review));
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

  const dockStyle = useDockTabBarStyle();
  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      // Hide the tab bar so sticky CTAs stay tappable (same as tech job).
      // Parent = the customer Tabs route that owns this booking stack; its parent is the root stack.
      const tabsNav = navigation.getParent();
      tabsNav?.setOptions({ tabBarStyle: { display: 'none' } });
      refresh();
      return () => {
        focusedRef.current = false;
        tabsNav?.setOptions({ tabBarStyle: dockStyle });
      };
    }, [navigation, refresh, dockStyle]),
  );

  const liveStatus = booking ? isBookingLive(booking.status) : false;
  useEffect(() => {
    if (!liveStatus) return;
    const timer = setInterval(() => {
      if (focusedRef.current) refresh();
    }, 45000);
    return () => clearInterval(timer);
  }, [liveStatus, refresh]);

  async function regenerateOtp(type: 'start' | 'end') {
    setRegenerating(type);
    try {
      await api.post(`/bookings/${id}/regenerate-otp`, { type });
      Toast.show({ type: 'success', text1: labels.bookingDetailCodeToast });
      await load({ skipCache: true });
    } catch {
      // error toast shown by the api interceptor
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
      haptic('success');
      Toast.show({ type: 'success', text1: labels.bookingDetailCancelledToast });
      await load();
    } catch {
      // error toast shown by the api interceptor
    } finally {
      setCancelling(false);
    }
  }

  async function doReschedule(date: string, slot: string) {
    setRescheduling(true);
    try {
      await api.patch(`/bookings/${id}/reschedule`, { scheduleRequest: { date, slot } });
      setRescheduleOpen(false);
      haptic('success');
      Toast.show({
        type: 'success',
        text1: labels.bookingDetailRescheduledToast,
        text2: labels.bookingDetailRescheduledToastSub,
      });
      await load({ skipCache: true });
    } catch {
      // error toast shown by the api interceptor
    } finally {
      setRescheduling(false);
    }
  }

  if (loadError) {
    return (
      <View style={styles.rootShell}><SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <CustomerPageHeader variant="premium" title={bookingCopy.detailScreenTitle} showBack />
        <ListEmptyRetry
          message={loadError}
          onRetry={() => safeAsync(load, undefined, (msg) => setLoadError(msg))}
        />
      </SafeAreaView></View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.rootShell}><SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <CustomerPageHeader variant="premium" title={bookingCopy.detailScreenTitle} showBack />
        <BookingDetailSkeleton />
      </SafeAreaView></View>
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
  const showStepHistory =
    booking.status === 'completed' && steps.some((s) => stepPhotoUrls(s).length > 0);

  const stepStatusBadge = (status: string, index: number): { label: string; tone: BadgeTone } => {
    if (status === 'done') return { label: labels.bookingDetailStepCompleted, tone: 'success' };
    if (showLiveProgress && index === activeIndex) return { label: labels.bookingDetailStepInProgress, tone: 'info' };
    return { label: labels.bookingDetailStepUpcoming, tone: 'neutral' };
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
        photoUrls={stepPhotoUrls(step)}
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

  const canBookAgain =
    (booking.status === 'cancelled' || booking.status === 'completed') && Boolean(svcId);
  const canReview = booking.status === 'completed' && !hasReview;

  const stickyActionCount = [
    canReview,
    canCancelBooking(booking.status),
    canCancelBooking(booking.status),
    canBookAgain,
  ].filter(Boolean).length;
  const hasStickyActions = stickyActionCount > 0;

  return (
    <View style={styles.rootShell}><SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <CustomerPageHeader
        variant="premium"
        title={bookingCopy.detailScreenTitle}
        subtitle={headerSubtitle}
        showBack
        rightAction={headerRight}
      />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          hasStickyActions && { paddingBottom: 56 + stickyActionCount * 52 + spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={ui.brand} />
        }
      >
        <BookingDetailHero
          booking={booking}
          live={isLive}
          guidance={isSchedulePending(booking) ? undefined : statusGuidance}
          progress={showLiveProgress && steps.length > 0 ? { done: doneCount, total: steps.length } : null}
        />

        {isSchedulePending(booking) ? (
          <FadeSlideIn delay={stagger(1)} style={styles.sectionWrap}>
            <PendingScheduleCard
              variant="customer"
              title={bookingCopy.pendingCustomerTitle}
              scheduleLabel={bookingRequestedScheduleDisplay(booking)}
              hint={isRequestedTimePast(booking) ? bookingCopy.pendingPastHint : bookingCopy.pendingCustomerHint}
              hintTone={isRequestedTimePast(booking) ? 'warning' : 'info'}
              modeLabel={
                booking.scheduleMode === 'custom'
                  ? bookingCopy.customModeLabel
                  : bookingCopy.standardModeLabel
              }
              notes={booking.scheduleRequest?.notes}
            />
          </FadeSlideIn>
        ) : null}

        {/* Codes are the customer's main action during a visit — keep them right under the status. */}
        {startOtp && booking.status === 'confirmed' ? (
          <FadeSlideIn delay={stagger(1)} style={styles.sectionWrap}>
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
          <FadeSlideIn delay={stagger(1)} style={styles.sectionWrap}>
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
          <FadeSlideIn delay={stagger(2)}>
            <BookingDetailSection title={bookingCopy.trackingSectionTitle} subtitle={bookingCopy.trackingSectionSubtitle}>
              <BookingStageTracker steps={timeline} />
            </BookingDetailSection>
          </FadeSlideIn>
        ) : null}

        {showLiveProgress && steps.length > 0 ? (
          <FadeSlideIn delay={stagger(2)}>
            <PremiumSectionHeader
              title={bookingCopy.treatmentStepsTitle}
              subtitle={bookingCopy.treatmentStepsLiveSubtitle}
              compact
            />
            {steps.map((step, index) => renderStepCard(step, index))}
          </FadeSlideIn>
        ) : null}

        <FadeSlideIn delay={stagger(3)}>
          <BookingDetailSection title={bookingCopy.detailDetailsTitle} subtitle={bookingCopy.detailDetailsSubtitle}>
            <BookingFactsCard
              booking={booking}
              audience="customer"
              hideHead
              hideSchedule
              embedded
              showTechnician={bookingHasTechnician(booking)}
              showPayment
              showPhotos={false}
            />
            <View style={styles.priceInset}>
              <BookingPriceBreakdown
                amount={booking.amount}
                compact
                serviceName={bookingServiceName(booking)}
                serviceDesc={
                  booking.service && typeof booking.service === 'object'
                    ? booking.service.shortDesc
                    : undefined
                }
              />
            </View>
          </BookingDetailSection>
        </FadeSlideIn>

        {showStepHistory ? (
          <FadeSlideIn delay={stagger(4)}>
            <PremiumSectionHeader
              title={bookingCopy.treatmentStepsTitle}
              subtitle={bookingCopy.treatmentStepsDoneSubtitle}
              compact
            />
            {steps.map((step, index) => renderStepCard(step, index))}
          </FadeSlideIn>
        ) : null}

        {problemPhotos.length > 0 ? (
          <FadeSlideIn delay={stagger(4)}>
            <BookingPhotoGallery photos={problemPhotos} />
          </FadeSlideIn>
        ) : null}

        {(booking.tracking?.length ?? 0) > 0 ? (
          <FadeSlideIn delay={stagger(5)}>
            <PremiumSectionHeader title={bookingCopy.activitySectionTitle} subtitle={bookingCopy.activitySectionSubtitle} compact />
            <View style={styles.sectionWrap}>
              <BookingTrackingTimeline events={booking.tracking ?? []} />
            </View>
          </FadeSlideIn>
        ) : null}

        {booking.status !== 'cancelled' ? (
          <FadeSlideIn delay={stagger(6)}>
            <PremiumSectionHeader title={labels.bookingDetailInvoiceTitle} compact />
            <BookingInvoiceCard bookingId={booking.id}
            refreshKey={`${booking.status}|${booking.schedule.date}|${booking.schedule.slot}|${booking.schedule.time ?? ''}`} summaryOnly />
          </FadeSlideIn>
        ) : null}
      </ScrollView>

      {hasStickyActions && (
        <StickyActionBar>
          <View style={styles.ctaRow}>
            {canCancelBooking(booking.status) && (
              <Button
                title={labels.bookingDetailCancel}
                variant="secondary"
                onPress={confirmCancel}
                loading={cancelling}
                style={styles.ctaHalf}
              />
            )}
            {canBookAgain && svcId ? (
              <Button
                title={bookingCopy.detailActionBookAgain}
                variant={canReview ? 'secondary' : 'premium'}
                onPress={() => appPush(sharedRoutes.bookPath(svcId))}
                style={styles.ctaHalf}
              />
            ) : null}
            {canReview && (
              <Button
                title={bookingCopy.detailActionReview}
                variant="premium"
                onPress={() => appPush(sharedRoutes.review(booking.id))}
                style={styles.ctaHalf}
              />
            )}
            {canCancelBooking(booking.status) && (
              <Button
                title={labels.bookingDetailReschedule}
                variant="premium"
                onPress={() => setRescheduleOpen(true)}
                style={styles.ctaHalf}
              />
            )}
          </View>
        </StickyActionBar>
      )}

      <RescheduleSheet
        visible={rescheduleOpen}
        loading={rescheduling}
        onClose={() => setRescheduleOpen(false)}
        onConfirm={(d, s) => void doReschedule(d, s)}
      />
    </SafeAreaView></View>
  );
}

const styles = StyleSheet.create({
  rootShell: { flex: 1, backgroundColor: ui.surfaceMuted },
  safe: { flex: 1, backgroundColor: 'transparent' },
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
    backgroundColor: ui.brandSoft,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ui.brand,
  },
  livePillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.forest,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  ctaRow: { flexDirection: 'row', gap: spacing.sm },
  ctaHalf: { flex: 1 },
});

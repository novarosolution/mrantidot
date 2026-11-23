import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { AdminActionSheet } from '@/components/kit/AdminActionSheet';
import { Button } from '@/components/ui/Button';
import { LiveBadge } from '@/components/ui/LiveBadge';
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
import { colors, radii, spacing, typeScale, ui } from '@/constants/theme';
import { useBusinessSettings } from '@/lib/businessSettings';
import { canCancelVisit, canRescheduleVisit } from '@/lib/dates';
import { fillCopy } from '@/constants/customerUiCopy';
import { formatDuration } from '@/lib/serviceDisplay';
import { Info } from 'lucide-react-native';
import { sharedRoutes, appPush } from '@/lib/routes';

function customerTrackingSteps(
  booking: Booking,
  expertAssigned: boolean,
  copy: ReturnType<typeof useBookingCopy>,
) {
  return getCustomerTrackingSteps(booking.status, expertAssigned, copy);
}

export default function CustomerBookingDetailScreen() {
  const id = paramString(useLocalSearchParams<{ id: string | string[] }>().id);
  const insets = useSafeAreaInsets();
  const settings = useBusinessSettings();
  const bookingCopy = useBookingCopy();
  const labels = useCustomerUiCopy();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [hasReview, setHasReview] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelAsk, setCancelAsk] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [regenerating, setRegenerating] = useState<'start' | 'end' | null>(null);
  const focusedRef = useRef(false);
  const lastRefresh = useRef(0);

  const load = useCallback(async (opts?: { skipCache?: boolean }) => {
    if (!id) {
      setLoadError(labels.bookingNotFound);
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
        setLoadError(getApiErrorMessage(err, labels.bookingLoadFailed));
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

  // The tab bar is hidden for this route in the customer tab layout (no show/hide flash on focus changes).
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
    haptic('warning');
    setCancelAsk(true);
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
  const headerRight = isLive ? <LiveBadge tone="light" label={bookingCopy.detailLiveBadge} /> : null;

  const svcId =
    booking.service && typeof booking.service === 'object' ? booking.service.id : undefined;

  const canBookAgain =
    (booking.status === 'cancelled' || booking.status === 'completed') && Boolean(svcId);
  const canReview = booking.status === 'completed' && !hasReview;
  // Admin cut-offs (Business settings → Booking rules) decide whether the visit can still change.
  const canCancel = canCancelBooking(booking.status) && canCancelVisit(booking, settings);
  const canReschedule = canCancelBooking(booking.status) && canRescheduleVisit(booking, settings);
  const hasStickyActions = canReview || canCancel || canReschedule || canBookAgain;
  // Why a change isn't offered any more (admin cut-off / reschedule limit) — said once, under the status.
  const rules = settings.booking;
  const changeNotes: string[] = [];
  if (canCancelBooking(booking.status)) {
    if (!canReschedule) {
      const limitHit = rules.maxReschedules > 0 && (booking.rescheduleCount ?? 0) >= rules.maxReschedules;
      changeNotes.push(
        limitHit
          ? fillCopy(labels.bookingDetailRescheduleLimit, { count: rules.maxReschedules })
          : fillCopy(labels.bookingDetailRescheduleCutoff, { window: formatDuration(rules.rescheduleCutoffHours * 60) }),
      );
    }
    if (!canCancel) {
      changeNotes.push(fillCopy(labels.bookingDetailCancelCutoff, { window: formatDuration(rules.cancelCutoffHours * 60) }));
    }
  }
  // One row of buttons: 52 pt button + bar padding + home indicator, plus breathing room.
  const stickyPad = 52 + spacing.md + Math.max(insets.bottom, spacing.md) + spacing.lg;

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
        contentContainerStyle={[styles.container, { paddingBottom: hasStickyActions ? stickyPad : insets.bottom + spacing.xl }]}
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

        {changeNotes.length > 0 ? (
          <FadeSlideIn delay={stagger(1)} style={styles.sectionWrap}>
            <View style={styles.ruleNote} accessibilityRole="text">
              <Info size={16} color={colors.amberInk} strokeWidth={2.2} />
              <View style={styles.ruleNoteBody}>
                {changeNotes.map((n) => (
                  <Text key={n} style={styles.ruleNoteText}>
                    {n}
                  </Text>
                ))}
              </View>
            </View>
          </FadeSlideIn>
        ) : null}

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
                serviceName={bookingServiceName(booking, labels)}
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
            {canCancel && (
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
            {canReschedule && (
              <Button
                title={labels.bookingDetailReschedule}
                variant="premium"
                onPress={() => {
                  haptic('tap');
                  setRescheduleOpen(true);
                }}
                style={styles.ctaHalf}
              />
            )}
          </View>
        </StickyActionBar>
      )}

      <AdminActionSheet
        visible={cancelAsk}
        title={bookingCopy.cancelConfirmTitle}
        message={bookingCopy.cancelConfirmMessage}
        cancelLabel={bookingCopy.cancelConfirmKeep || labels.cancelSheetKeep}
        onClose={() => setCancelAsk(false)}
        options={[
          {
            key: 'cancel',
            label: bookingCopy.cancelConfirmAction,
            destructive: true,
            onPress: () => void doCancel(),
          },
        ]}
      />

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
  rootShell: { flex: 1, backgroundColor: ui.canvas },
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: {},
  sectionWrap: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  priceInset: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  ruleNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: radii.card,
    backgroundColor: colors.amberBg,
  },
  ruleNoteBody: { flex: 1, gap: 4 },
  ruleNoteText: { ...typeScale.caption, color: colors.amberInk },
  ctaRow: { flexDirection: 'row', gap: spacing.sm },
  ctaHalf: { flex: 1 },
});

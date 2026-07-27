import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import Toast from 'react-native-toast-message';
import { paramString } from '@/lib/routeParams';
import { AddressPhotoGrid } from '@/components/kit/AddressPhotoGrid';
import { BookingFactsCard } from '@/components/kit/BookingFactsCard';
import { BookingStatusBanner } from '@/components/kit/BookingStatusBanner';
import { BookingTrackingTimeline } from '@/components/kit/BookingTrackingTimeline';
import { JobProgressCard } from '@/components/kit/JobProgressCard';
import { OtpEntrySheet } from '@/components/kit/OtpEntrySheet';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { homeShadow } from '@/components/kit/homeUi';
import { TechScreen, TechScreenScroll } from '@/components/kit/TechScreenKit';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { Input } from '@/components/ui/Input';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { Spinner } from '@/components/ui/Spinner';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { useScreenLoad } from '@/lib/useScreenLoad';
import {
  formatBookingDuration,
  formatVisitTime,
  jobVisitStatus,
  visitBadgeTone,
  visitStatusLabel,
} from '@/lib/job-visit-helpers';
import {
  bookingScheduleDisplay,
  bookingServiceName,
  bookingStepsDone,
  isTerminalBookingStatus,
} from '@/lib/booking-helpers';
import { useTechCopy } from '@/lib/tech-copy';
import { localDateKey } from '@/lib/dates';
import { mediaUrl } from '@/lib/images';
import { MAX_STEP_PHOTOS, stepPhotoUrls } from '@/lib/stepPhotos';
import { uploadImages, type PickedImage } from '@/lib/upload';
import type { Booking, BookingStep } from '@/types/api';
import { colors, fonts, spacing, surfaces } from '@/constants/theme';

export default function TechJobScreen() {
  const copy = useTechCopy();
  const id = paramString(useLocalSearchParams<{ id: string | string[] }>().id);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [otpSheet, setOtpSheet] = useState<'start' | 'end' | null>(null);
  const [otpErrorTrigger, setOtpErrorTrigger] = useState(0);
  const [stepDrafts, setStepDrafts] = useState<Record<number, PickedImage[]>>({});
  const focusedRef = useRef(true);
  const lastPoll = useRef(0);
  const { loading, error, runLoad } = useScreenLoad();

  const load = useCallback(async (opts?: { skipCache?: boolean }) => {
    if (!id) {
      throw new Error('Job not found');
    }
    const cacheOpts = opts?.skipCache
      ? { skipCache: true as const }
      : { cacheTtlMs: CACHE_TTL.bookingDetail };
    const { data } = await api.get<{ booking: Booking }>(`/bookings/${id}`, {
      ...screenLoadConfig,
      ...cacheOpts,
    });
    setBooking(data.booking);
  }, [id]);

  useEffect(() => {
    void runLoad(load);
  }, [load, runLoad]);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      return () => {
        focusedRef.current = false;
      };
    }, []),
  );

  useEffect(() => {
    if (!booking || isTerminalBookingStatus(booking.status)) return;
    const timer = setInterval(() => {
      if (!focusedRef.current) return;
      const now = Date.now();
      if (now - lastPoll.current < CACHE_TTL.bookingDetail) return;
      lastPoll.current = now;
      void load().catch(() => undefined);
    }, 45000);
    return () => clearInterval(timer);
  }, [booking?.status, booking?.id, load]);

  async function onPullRefresh() {
    setRefreshing(true);
    try {
      await load({ skipCache: true });
    } finally {
      setRefreshing(false);
    }
  }

  async function submitOtp(otp: string) {
    if (!otpSheet) return;
    setBusy(otpSheet);
    try {
      const path = otpSheet === 'start' ? 'start-work' : 'complete-work';
      const { data } = await api.post<{ booking: Booking }>(
        `/bookings/${id}/${path}`,
        { otp },
        { skipErrorToast: true },
      );
      const nextStatus = data.booking.status;
      if (otpSheet === 'start') {
        Toast.show({
          type: 'success',
          text1: nextStatus === 'awaiting_verification' ? 'Start verified' : 'Work started',
          text2:
            nextStatus === 'awaiting_verification'
              ? 'Ask the customer for their completion code'
              : undefined,
        });
      } else {
        Toast.show({ type: 'success', text1: 'Job completed' });
      }
      setOtpSheet(null);
      await load({ skipCache: true });
    } catch (err) {
      setOtpErrorTrigger((n) => n + 1);
      Toast.show({
        type: 'error',
        text1: 'Invalid code',
        text2: getApiErrorMessage(err, 'Check the code with the customer and try again'),
      });
    } finally {
      setBusy(null);
    }
  }

  async function readJobGeo(): Promise<{ lat: number; lng: number; address: string } | null> {
    if (!booking) return null;
    const { status: loc } = await Location.requestForegroundPermissionsAsync();
    if (loc !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Location permission required',
        text2: 'Enable GPS to capture geotagged step photos',
      });
      return null;
    }

    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    let address = note.trim() || booking.address?.trim() || 'On-site location';
    try {
      const [place] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (place) {
        address = [place.street, place.city, place.region].filter(Boolean).join(', ') || address;
      }
    } catch {
      /* use fallback address */
    }
    return { lat: pos.coords.latitude, lng: pos.coords.longitude, address };
  }

  async function completeStep(index: number, step: BookingStep) {
    if (!booking) return;
    const drafts = stepDrafts[index] ?? [];
    if (drafts.length === 0) {
      Toast.show({ type: 'error', text1: 'Add at least one photo' });
      return;
    }
    setBusy(`step-${index}`);
    try {
      const geo = await readJobGeo();
      if (!geo) return;

      const photoUrls = await uploadImages(drafts);
      await api.patch(`/bookings/${id}/steps/${index}`, {
        status: 'done',
        photoUrls,
        photoUrl: photoUrls[0],
        geo,
      });
      setStepDrafts((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      await load({ skipCache: true });
      Toast.show({
        type: 'success',
        text1: `${step.title} completed`,
        text2: `${photoUrls.length} photo${photoUrls.length === 1 ? '' : 's'} saved`,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2: getApiErrorMessage(err, 'Check connection and try again'),
      });
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Spinner fullScreen />;

  if (error || !booking) {
    return (
      <TechScreen
        header={<CustomerPageHeader variant="premium" title="Job" showBack />}
      >
        <ListEmptyRetry message={error ?? 'Job not found'} onRetry={() => void runLoad(load)} />
      </TechScreen>
    );
  }

  const steps = booking.steps ?? [];
  const doneCount = bookingStepsDone(booking);
  const activeIndex = steps.findIndex((s) => s.status !== 'done');
  const allDone = steps.length > 0 && steps.every((s) => s.status === 'done');
  const readOnly = isTerminalBookingStatus(booking.status);
  const canWork = !readOnly && ['confirmed', 'in_progress', 'awaiting_verification'].includes(booking.status);
  const today = localDateKey();
  const visitStatus = jobVisitStatus(booking, today);
  const visitTone = visitBadgeTone(visitStatus) as BadgeTone;
  const visitDuration = formatBookingDuration(booking);
  const showProgress =
    (booking.status === 'in_progress' || booking.status === 'awaiting_verification') && steps.length > 0;
  const needsStartCode = booking.status === 'confirmed' && canWork;
  const needsEndCode = booking.status === 'awaiting_verification' && canWork;
  const canEnterEndCode = needsEndCode && (allDone || steps.length === 0);
  const headerLive = booking.status === 'in_progress';

  return (
    <TechScreen
      header={
        <CustomerPageHeader
          variant="premium"
          title={bookingServiceName(booking)}
          subtitle={`Field job · ${bookingScheduleDisplay(booking)}`}
          showBack
          rightAction={headerLive ? <StatusBadge label="● Live" tone="success" /> : null}
        />
      }
    >
      <TechScreenScroll
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onPullRefresh()} tintColor={colors.green} />
        }
      >
        <FadeSlideIn>
          <BookingStatusBanner status={booking.status} audience="technician" />

          {needsStartCode ? (
            <View style={styles.calloutOuter}>
              <View style={styles.surfaceShell}>
                <GlassPanel style={styles.startCallout} padded={false} tone="mint" intensity={42} goldEdge>
                  <View style={styles.calloutInner}>
                    <Text style={styles.startCalloutTitle}>Ready to start</Text>
                    <Text style={styles.startCalloutBody}>
                      Ask the customer for their start code, then enter it below to begin the visit.
                    </Text>
                  </View>
                </GlassPanel>
              </View>
            </View>
          ) : null}

          {booking.techEarning != null || booking.jobValue != null ? (
            <View style={styles.calloutOuter}>
              <View style={styles.surfaceShell}>
                <GlassPanel style={styles.jobValueCard} padded={false} tone="light" intensity={42} goldEdge>
                  <View style={styles.jobValueInner}>
                    {booking.techEarning != null ? (
                      <>
                        <Text style={styles.jobValueLabel}>{copy.techEarningLabel}</Text>
                        <Text style={styles.jobValueAmount}>₹{booking.techEarning}</Text>
                      </>
                    ) : null}
                    {booking.jobValue != null ? (
                      <Text style={styles.jobValueHint}>
                        {copy.techJobValueLabel}: ₹{booking.jobValue}
                        {booking.status !== 'completed' ? ' · estimate until complete' : ''}
                      </Text>
                    ) : null}
                  </View>
                </GlassPanel>
              </View>
            </View>
          ) : null}

          {showProgress ? (
            <View style={styles.inset}>
              <JobProgressCard
                done={doneCount}
                total={steps.length}
                live={booking.status === 'in_progress'}
                label={booking.status === 'awaiting_verification' ? 'Steps complete' : 'Job progress'}
              />
            </View>
          ) : null}

          {steps.length > 0 ? (
            <>
              <PremiumSectionHeader title={copy.techTreatmentStepsTitle} style={styles.sectionHeader} />
              {steps.map((step, index) => {
                const isActive = index === activeIndex && step.status !== 'done';
                const isDone = step.status === 'done';
                const photos = stepPhotoUrls(step);
                const drafts = stepDrafts[index] ?? [];
                return (
                  <View key={`${step.title}-${index}`} style={styles.stepOuter}>
                    <View style={[styles.surfaceShell, isActive && styles.stepActiveShell]}>
                      <GlassPanel
                        style={isActive ? styles.stepActive : styles.step}
                        padded={false}
                        tone={isActive ? 'mint' : 'light'}
                        intensity={42}
                        goldEdge={isActive}
                      >
                        <View style={styles.stepInner}>
                          <View style={styles.stepRow}>
                            {isDone && photos[0] ? (
                              <View>
                                <Image source={{ uri: mediaUrl(photos[0]) }} style={styles.thumb} />
                                <View style={styles.checkOverlay}>
                                  <PremiumIcon icon={AppIcons.ui.check} variant="plain" size="sm" color="#fff" strokeWidth={3} />
                                </View>
                                {photos.length > 1 ? (
                                  <View style={styles.photoCountBadge}>
                                    <Text style={styles.photoCountText}>{photos.length}</Text>
                                  </View>
                                ) : null}
                              </View>
                            ) : isActive ? (
                              <View style={styles.camThumb}>
                                <PremiumIcon icon={AppIcons.ui.camera} variant="plain" size="xl" color="#fff" />
                              </View>
                            ) : (
                              <View style={styles.numThumb}>
                                <Text style={styles.num}>{index + 1}</Text>
                              </View>
                            )}
                            <View style={styles.stepBody}>
                              <Text style={[styles.stepTitle, !isDone && !isActive && styles.muted]}>{step.title}</Text>
                              {isDone ? (
                                <Text style={styles.doneTag}>
                                  Done · {photos.length} photo{photos.length === 1 ? '' : 's'}
                                </Text>
                              ) : null}
                              {isActive ? (
                                <Text style={styles.activeTag}>
                                  Add up to {MAX_STEP_PHOTOS} photos
                                </Text>
                              ) : null}
                              {step.geo?.address ? <Text style={styles.geo}>{step.geo.address}</Text> : null}
                            </View>
                          </View>

                          {isDone && photos.length > 0 ? (
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              contentContainerStyle={styles.donePhotoRow}
                            >
                              {photos.map((url, i) => (
                                <Image
                                  key={`${url}-${i}`}
                                  source={{ uri: mediaUrl(url) }}
                                  style={styles.donePhoto}
                                />
                              ))}
                            </ScrollView>
                          ) : null}

                          {isActive && booking.status === 'in_progress' && canWork ? (
                            <View style={styles.captureBlock}>
                              <AddressPhotoGrid
                                photos={drafts}
                                onChange={(next) =>
                                  setStepDrafts((prev) => ({ ...prev, [index]: next }))
                                }
                                max={MAX_STEP_PHOTOS}
                              />
                              <Button
                                title={
                                  drafts.length === 0
                                    ? 'Add photos to complete'
                                    : `Complete with ${drafts.length} photo${drafts.length === 1 ? '' : 's'}`
                                }
                                variant="premium"
                                onPress={() => void completeStep(index, step)}
                                loading={busy === `step-${index}`}
                                disabled={drafts.length === 0 || busy === `step-${index}`}
                                style={styles.captureBtnFull}
                              />
                            </View>
                          ) : null}
                        </View>
                      </GlassPanel>
                    </View>
                  </View>
                );
              })}
            </>
          ) : canWork && booking.status === 'in_progress' ? (
            <View style={styles.calloutOuter}>
              <View style={styles.surfaceShell}>
                <GlassPanel style={styles.emptySteps} padded={false} tone="light" intensity={42}>
                  <View style={styles.emptyStepsInner}>
                    <PremiumIcon icon={AppIcons.ui.image} variant="mint" size="md" color={colors.forest} boxSize={44} />
                    <Text style={styles.emptyStepsText}>{copy.techNoStepsHint}</Text>
                  </View>
                </GlassPanel>
              </View>
            </View>
          ) : null}

          <PremiumSectionHeader title={copy.techVisitTimesTitle} style={styles.sectionHeader} />
          <View style={styles.calloutOuter}>
            <View style={styles.surfaceShell}>
              <GlassPanel style={styles.visitCard} padded={false} tone="light" intensity={42} goldEdge>
                <View style={styles.visitInner}>
                  <View style={styles.visitHead}>
                    <Text style={styles.visitHeadLabel}>Visit status</Text>
                    <StatusBadge label={visitStatusLabel(visitStatus)} tone={visitTone} />
                  </View>
                  <View style={styles.visitRow}>
                    <Text style={styles.visitLabel}>Started</Text>
                    <Text style={styles.visitVal}>
                      {booking.workStartedAt ? formatVisitTime(booking.workStartedAt) : 'Not started'}
                    </Text>
                  </View>
                  <View style={styles.visitRow}>
                    <Text style={styles.visitLabel}>Completed</Text>
                    <Text style={styles.visitVal}>
                      {booking.workCompletedAt
                        ? formatVisitTime(booking.workCompletedAt)
                        : visitStatus === 'in_progress'
                          ? 'In progress'
                          : '—'}
                    </Text>
                  </View>
                  {visitDuration ? (
                    <View style={styles.visitRow}>
                      <Text style={styles.visitLabel}>Duration</Text>
                      <Text style={styles.visitVal}>{visitDuration}</Text>
                    </View>
                  ) : null}
                </View>
              </GlassPanel>
            </View>
          </View>

          <PremiumSectionHeader title={copy.techJobDetailsTitle} style={styles.sectionHeader} />
          <View style={styles.inset}>
            <BookingFactsCard booking={booking} audience="technician" showCustomer showPayment={false} hideHead />
          </View>

          {canWork && booking.status === 'in_progress' ? (
            <Input
              label={copy.techLocationNoteLabel}
              value={note}
              onChangeText={setNote}
              placeholder={copy.techLocationNotePlaceholder}
              containerStyle={styles.inset}
            />
          ) : null}

          {(booking.tracking?.length ?? 0) > 0 ? (
            <>
              <PremiumSectionHeader title={copy.techActivityTitle} style={styles.sectionHeader} />
              <View style={styles.inset}>
                <BookingTrackingTimeline events={booking.tracking ?? []} />
              </View>
            </>
          ) : null}
        </FadeSlideIn>
      </TechScreenScroll>

      {(needsStartCode || needsEndCode) && (
        <StickyActionBar>
          {needsStartCode ? (
            <Button
              title={copy.techEnterStartCode}
              variant="premium"
              onPress={() => setOtpSheet('start')}
              loading={busy === 'start'}
            />
          ) : null}
          {needsEndCode && canEnterEndCode ? (
            <Button
              title={copy.techEnterCompletionCode}
              variant="premium"
              onPress={() => setOtpSheet('end')}
              loading={busy === 'end'}
            />
          ) : null}
          {needsEndCode && !canEnterEndCode && steps.length > 0 ? (
            <Button title={copy.techCompleteStepsFirst} variant="secondary" disabled />
          ) : null}
        </StickyActionBar>
      )}

      <OtpEntrySheet
        visible={otpSheet !== null}
        title={otpSheet === 'start' ? copy.techStartOtpTitle : copy.techEndOtpTitle}
        loading={busy === 'start' || busy === 'end'}
        errorTrigger={otpErrorTrigger}
        onClose={() => setOtpSheet(null)}
        onSubmit={(otp) => void submitOtp(otp)}
      />
    </TechScreen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 120 },
  inset: { marginHorizontal: spacing.md },
  sectionHeader: { marginTop: spacing.sm },
  calloutOuter: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  surfaceShell: {
    borderRadius: 20,
    ...homeShadow.card,
  },
  startCallout: { borderRadius: 20 },
  calloutInner: { padding: spacing.md },
  startCalloutTitle: { fontFamily: fonts.displayExtra, fontSize: 16, color: colors.ink, letterSpacing: -0.3 },
  startCalloutBody: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 19 },
  jobValueCard: { borderRadius: 20 },
  jobValueInner: { padding: spacing.md },
  jobValueLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted },
  jobValueAmount: { fontFamily: fonts.displayExtra, fontSize: 22, color: colors.forest },
  jobValueHint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4 },
  visitCard: { borderRadius: 20 },
  visitInner: { padding: spacing.md },
  visitHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  visitHeadLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted },
  visitRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 6 },
  visitLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  visitVal: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink, flex: 1, textAlign: 'right' },
  stepOuter: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  step: { borderRadius: 20 },
  stepActive: { borderRadius: 20 },
  stepActiveShell: {
    borderRadius: 20,
    borderWidth: 1.6,
    borderColor: '#27A747',
  },
  stepInner: { padding: spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 58, height: 58, borderRadius: 13 },
  checkOverlay: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  camThumb: {
    width: 58,
    height: 58,
    borderRadius: 13,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numThumb: {
    width: 58,
    height: 58,
    borderRadius: 13,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: { fontFamily: fonts.displayExtra, fontSize: 16, color: colors.muted },
  stepBody: { flex: 1 },
  stepTitle: { fontFamily: fonts.display, fontSize: 14, color: colors.ink },
  muted: { color: colors.muted },
  doneTag: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.green, marginTop: 4 },
  activeTag: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.forest, marginTop: 4 },
  geo: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  photoCountBadge: {
    position: 'absolute',
    left: -4,
    top: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  photoCountText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.white },
  donePhotoRow: { gap: 8, marginTop: spacing.md, paddingRight: 4 },
  donePhoto: { width: 88, height: 88, borderRadius: 12, backgroundColor: colors.card },
  captureBlock: { marginTop: spacing.md, gap: spacing.sm },
  captureBtnFull: { minHeight: 46 },
  emptySteps: { borderRadius: 20 },
  emptyStepsInner: {
    padding: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyStepsText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.muted, lineHeight: 18 },
});

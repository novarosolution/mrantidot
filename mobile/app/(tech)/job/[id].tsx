import { useLocalSearchParams } from 'expo-router';
import { Camera, Check } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddressPhotoGrid } from '@/components/kit/AddressPhotoGrid';
import { BookingFactsCard } from '@/components/kit/BookingFactsCard';
import { BookingTrackingTimeline } from '@/components/kit/BookingTrackingTimeline';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { formatRupeeFull } from '@/components/kit/format';
import { JobProgressCard } from '@/components/kit/JobProgressCard';
import { OtpEntrySheet } from '@/components/kit/OtpEntrySheet';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { TechScreen, TechScreenScroll } from '@/components/kit/TechScreenKit';
import { TechInlineNotice } from '@/components/tech/TechInlineNotice';
import { TechLocationSheet, type LocationChoice, type LocationPhase } from '@/components/tech/TechLocationSheet';
import { TechJobDetailSkeleton } from '@/components/tech/TechSkeletons';
import { TechStatusBanner } from '@/components/tech/TechStatusBanner';
import { AppImage } from '@/components/ui/AppImage';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { Input } from '@/components/ui/Input';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { PhotoViewer } from '@/components/ui/PhotoViewer';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { PressableScale } from '@/components/ui/PressableScale';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { AppIcons } from '@/constants/appIcons';
import { fillCopy } from '@/constants/customerUiCopy';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  bookingScheduleDisplay,
  bookingServiceName,
  bookingStepsDone,
  isTerminalBookingStatus,
} from '@/lib/booking-helpers';
import { useBusinessSettings } from '@/lib/businessSettings';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { localDateKey } from '@/lib/dates';
import { mediaUrl } from '@/lib/images';
import { formatBookingDuration, formatVisitTime, jobVisitStatus, visitBadgeTone } from '@/lib/job-visit-helpers';
import { haptic, stagger } from '@/lib/motion';
import { paramString } from '@/lib/routeParams';
import { techGoBack, techRoutes } from '@/lib/routes';
import { paymentLabel } from '@/lib/settingsLabels';
import { MAX_STEP_PHOTOS, stepPhotoUrls } from '@/lib/stepPhotos';
import { useTechCopy } from '@/lib/tech-copy';
import { invalidateTechStats, storeTechJob, useTechJob } from '@/lib/techData';
import { photoCount, techErrorText, visitStateLabel } from '@/lib/techLabels';
import { currentFix, ensureLocationAccess, lastKnownFix, placeName, type GeoFix } from '@/lib/techLocation';
import { useLiveInterval } from '@/lib/techPolling';
import { appToast } from '@/lib/toast';
import { uploadImages, type PickedImage } from '@/lib/upload';
import type { Booking, BookingStep } from '@/types/api';
import { colors, fonts, radii, spacing, ui } from '@/constants/theme';

/** How long to wait for a fresh GPS fix before falling back to the last known position. */
const GPS_TIMEOUT_MS = 15_000;
/** The "Getting your location…" sheet appears only if the fix takes longer than this. */
const GPS_SHEET_DELAY_MS = 700;
/** Live jobs refresh this often while the screen is open and the app is in front. */
const POLL_MS = 45_000;

export default function TechJobScreen() {
  const tc = useTechCopy();
  const copy = useCustomerUiCopy();
  const settings = useBusinessSettings();
  const { user } = useAuth();
  const id = paramString(useLocalSearchParams<{ id: string | string[] }>().id);
  const job = useTechJob(id ?? '');
  const booking = job.data;
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [otpSheet, setOtpSheet] = useState<'start' | 'end' | null>(null);
  const [otpErrorTrigger, setOtpErrorTrigger] = useState(0);
  const [stepDrafts, setStepDrafts] = useState<Record<number, PickedImage[]>>({});
  const [gps, setGps] = useState<LocationPhase | null>(null);
  const gpsChoice = useRef<((choice: LocationChoice) => void) | null>(null);
  const [viewer, setViewer] = useState<{ photos: string[]; index: number } | null>(null);

  useEffect(() => {
    setStepDrafts({});
    setNote('');
    setOtpSheet(null);
    setViewer(null);
  }, [id]);

  // Live jobs stay current, but never poll from the background or another tab.
  useLiveInterval(() => void job.reload(false), POLL_MS, Boolean(booking && !isTerminalBookingStatus(booking.status)));

  function applyBooking(next: Booking) {
    if (user) storeTechJob(user.id, next);
  }

  async function submitOtp(otp: string) {
    if (!otpSheet || busy) return;
    const phase = otpSheet;
    setBusy(phase);
    try {
      const path = phase === 'start' ? 'start-work' : 'complete-work';
      const { data } = await api.post<{ booking: Booking }>(`/bookings/${id}/${path}`, { otp }, { skipErrorToast: true });
      haptic('success');
      applyBooking(data.booking);
      if (user) invalidateTechStats(user.id);
      setOtpSheet(null);
      if (phase === 'end') {
        appToast.success(copy.techToastJobCompleted);
      } else if (data.booking.status === 'awaiting_verification') {
        appToast.success(copy.techToastStartVerified, copy.techToastAskCompletionCode);
      } else {
        appToast.success(copy.techToastWorkStarted);
      }
    } catch (err) {
      // The sheet shakes and plays the error haptic.
      setOtpErrorTrigger((n) => n + 1);
      appToast.error(copy.techOtpErrorTitle, techErrorText(copy, err, copy.techOtpErrorText));
    } finally {
      setBusy(null);
    }
  }

  /* ─── Step photos need a GPS point: permission → fresh fix (cancel / use last known) → retry ─── */

  function waitForChoice(): Promise<LocationChoice> {
    return new Promise((resolve) => {
      gpsChoice.current = resolve;
    });
  }

  function choose(choice: LocationChoice) {
    const resolve = gpsChoice.current;
    gpsChoice.current = null;
    resolve?.(choice);
  }

  async function resolveStepGeo(): Promise<GeoFix | null> {
    const access = await ensureLocationAccess();
    if (access !== 'ok') {
      haptic('warning');
      setGps(access);
      const choice = await waitForChoice();
      setGps(null);
      if (choice === 'settings') void Linking.openSettings();
      return null;
    }
    for (let attempt = 0; ; attempt++) {
      // A quick fix never flashes the sheet; it only slides up when GPS takes a moment (retries show at once).
      const reveal = attempt === 0 ? setTimeout(() => setGps('locating'), GPS_SHEET_DELAY_MS) : undefined;
      if (attempt > 0) setGps('locating');
      const outcome = await Promise.race([
        currentFix(GPS_TIMEOUT_MS).then((fix) => ({ kind: 'fix' as const, fix })),
        waitForChoice().then((choice) => ({ kind: 'choice' as const, choice })),
      ]);
      if (reveal) clearTimeout(reveal);
      if (outcome.kind === 'choice' && outcome.choice === 'cancel') {
        setGps(null);
        return null;
      }
      // Timed out, or the technician chose not to wait: the phone's last known position will do.
      const fix = (outcome.kind === 'fix' ? outcome.fix : null) ?? (await lastKnownFix());
      if (fix) {
        gpsChoice.current = null;
        setGps(null);
        return fix;
      }
      haptic('warning');
      setGps('failed');
      if ((await waitForChoice()) !== 'retry') {
        setGps(null);
        return null;
      }
    }
  }

  async function completeStep(index: number, step: BookingStep) {
    if (!booking || busy) return;
    const drafts = stepDrafts[index] ?? [];
    if (drafts.length === 0) {
      haptic('warning');
      appToast.error(copy.techStepNeedPhoto);
      return;
    }
    setBusy(`step-${index}`);
    try {
      const fix = await resolveStepGeo();
      if (!fix) return;
      const geocoded = await placeName(fix);
      const address = note.trim() || geocoded || booking.address?.trim() || copy.techGpsFallbackAddress;
      const photoUrls = await uploadImages(drafts);
      const { data } = await api.patch<{ booking: Booking }>(
        `/bookings/${id}/steps/${index}`,
        { status: 'done', photoUrls, photoUrl: photoUrls[0], geo: { lat: fix.lat, lng: fix.lng, address } },
        { skipErrorToast: true },
      );
      setStepDrafts((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      applyBooking(data.booking);
      haptic('success');
      appToast.success(
        fillCopy(copy.techToastStepDone, { step: step.title }),
        fillCopy(copy.techToastPhotosSaved, { photos: photoCount(copy, photoUrls.length) }),
      );
    } catch (err) {
      haptic('error');
      appToast.error(copy.techStepSaveError, techErrorText(copy, err));
    } finally {
      setBusy(null);
    }
  }

  const backHeader = (
    <CustomerPageHeader variant="premium" title={copy.techJobTitle} showBack onBack={() => techGoBack(techRoutes.home)} />
  );

  if (!id || (!booking && !job.loading)) {
    return (
      <TechScreen header={backHeader}>
        <ListEmptyRetry
          title={id ? copy.techJobLoadError : copy.techJobNotFound}
          message={id ? (job.error ?? undefined) : undefined}
          retryLabel={copy.techRetry}
          onRetry={id ? () => void job.refresh() : undefined}
        />
      </TechScreen>
    );
  }

  if (!booking) {
    return (
      <TechScreen header={backHeader}>
        <TechJobDetailSkeleton />
      </TechScreen>
    );
  }

  const steps = booking.steps ?? [];
  const doneCount = bookingStepsDone(booking);
  const activeIndex = steps.findIndex((s) => s.status !== 'done');
  const allDone = steps.length > 0 && steps.every((s) => s.status === 'done');
  const readOnly = isTerminalBookingStatus(booking.status);
  const canWork = !readOnly && ['confirmed', 'in_progress', 'awaiting_verification'].includes(booking.status);
  const visitStatus = jobVisitStatus(booking, localDateKey());
  const visitTone = visitBadgeTone(visitStatus) as BadgeTone;
  const visitDuration = formatBookingDuration(booking);
  const showProgress =
    (booking.status === 'in_progress' || booking.status === 'awaiting_verification') && steps.length > 0;
  const needsStartCode = booking.status === 'confirmed' && canWork;
  const needsEndCode = booking.status === 'awaiting_verification' && canWork;
  const canEnterEndCode = needsEndCode && (allDone || steps.length === 0);
  const capturing = booking.status === 'in_progress' && canWork;
  const hasDock = needsStartCode || needsEndCode;

  let section = 0;
  const enter = () => stagger(section++);

  return (
    <TechScreen
      header={
        <CustomerPageHeader
          variant="premium"
          title={bookingServiceName(booking)}
          subtitle={fillCopy(copy.techJobSubtitle, { schedule: bookingScheduleDisplay(booking) })}
          showBack
          onBack={() => techGoBack(techRoutes.home)}
          rightAction={booking.status === 'in_progress' ? <LiveBadge label={copy.techLiveBadge} /> : null}
        />
      }
    >
      <TechScreenScroll
        contentContainerStyle={[styles.container, hasDock && styles.containerDock]}
        refreshControl={
          <RefreshControl refreshing={job.refreshing} onRefresh={() => void job.refresh()} tintColor={ui.brand} />
        }
      >
        {job.error ? (
          <View style={styles.noticeInset}>
            <TechInlineNotice
              message={copy.techRefreshError}
              actionLabel={copy.techRetry}
              onAction={() => void job.refresh()}
              busy={job.refreshing}
            />
          </View>
        ) : null}

        <FadeSlideIn delay={enter()} slideFrom={14} style={styles.inset}>
          <TechStatusBanner status={booking.status} />
        </FadeSlideIn>

        {needsStartCode ? (
          <FadeSlideIn delay={enter()} slideFrom={14} style={styles.inset}>
            <View style={[styles.card, styles.readyCard]}>
              <Text style={styles.cardTitle}>{copy.techReadyTitle}</Text>
              <Text style={styles.cardBody}>{copy.techReadyText}</Text>
            </View>
          </FadeSlideIn>
        ) : null}

        {booking.techEarning != null || booking.jobValue != null ? (
          <FadeSlideIn delay={enter()} slideFrom={14} style={styles.inset}>
            <View style={styles.card}>
              {booking.techEarning != null ? (
                <>
                  <Text style={styles.kicker}>{tc.techEarningLabel}</Text>
                  <Text style={styles.amount}>{formatRupeeFull(booking.techEarning)}</Text>
                </>
              ) : null}
              {booking.jobValue != null ? (
                <Text style={styles.amountHint}>
                  {`${tc.techJobValueLabel}: ${formatRupeeFull(booking.jobValue)}`}
                  {booking.status !== 'completed' ? ` · ${copy.techEstimateNote}` : ''}
                </Text>
              ) : null}
            </View>
          </FadeSlideIn>
        ) : null}

        {showProgress ? (
          <FadeSlideIn delay={enter()} slideFrom={14} style={styles.inset}>
            <JobProgressCard
              done={doneCount}
              total={steps.length}
              live={booking.status === 'in_progress'}
              label={booking.status === 'awaiting_verification' ? copy.techProgressStepsComplete : copy.techProgressJob}
            />
          </FadeSlideIn>
        ) : null}

        {steps.length > 0 ? (
          <FadeSlideIn delay={enter()} slideFrom={14}>
            <PremiumSectionHeader title={tc.techTreatmentStepsTitle} style={styles.sectionHeader} />
            {steps.map((step, index) => (
              <StepCard
                key={`${step.title}-${index}`}
                step={step}
                index={index}
                active={index === activeIndex && step.status !== 'done'}
                capturing={capturing}
                drafts={stepDrafts[index] ?? []}
                saving={busy === `step-${index}`}
                locked={busy !== null && busy !== `step-${index}`}
                onDraftsChange={(next) => setStepDrafts((prev) => ({ ...prev, [index]: next }))}
                onComplete={() => void completeStep(index, step)}
                onOpenPhoto={(photos, i) => setViewer({ photos, index: i })}
              />
            ))}
          </FadeSlideIn>
        ) : capturing ? (
          <FadeSlideIn delay={enter()} slideFrom={14} style={styles.inset}>
            <View style={[styles.card, styles.row]}>
              <PremiumIcon icon={AppIcons.ui.image} variant="mint" size="md" color={colors.forest} boxSize={44} />
              <Text style={[styles.cardBody, styles.flex]}>{tc.techNoStepsHint}</Text>
            </View>
          </FadeSlideIn>
        ) : null}

        <FadeSlideIn delay={enter()} slideFrom={14}>
          <PremiumSectionHeader title={tc.techVisitTimesTitle} style={styles.sectionHeader} />
          <View style={[styles.card, styles.inset]}>
            <View style={styles.visitHead}>
              <Text style={styles.visitHeadLabel}>{copy.techVisitStatus}</Text>
              <StatusBadge label={visitStateLabel(copy, visitStatus)} tone={visitTone} />
            </View>
            <VisitRow
              label={copy.techVisitStarted}
              value={booking.workStartedAt ? formatVisitTime(booking.workStartedAt) : copy.techVisitNotStarted}
            />
            <VisitRow
              label={copy.techVisitCompleted}
              value={
                booking.workCompletedAt
                  ? formatVisitTime(booking.workCompletedAt)
                  : visitStatus === 'in_progress'
                    ? copy.techVisitInProgress
                    : '—'
              }
            />
            {visitDuration ? <VisitRow label={copy.techVisitDuration} value={visitDuration} /> : null}
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={enter()} slideFrom={14}>
          <PremiumSectionHeader title={tc.techJobDetailsTitle} style={styles.sectionHeader} />
          <View style={styles.inset}>
            <BookingFactsCard booking={booking} audience="technician" showCustomer showPayment hideHead />
          </View>
        </FadeSlideIn>

        {booking.paymentMethod || booking.address ? (
          <FadeSlideIn delay={enter()} slideFrom={14} style={styles.inset}>
            <View style={styles.card}>
              {booking.paymentMethod ? (
                <>
                  <Text style={styles.kicker}>{copy.techCollectPayment}</Text>
                  <Text style={styles.collect}>{paymentLabel(booking.paymentMethod, settings)}</Text>
                </>
              ) : null}
              {booking.address ? (
                <Button
                  title={copy.techOpenDirections}
                  variant="secondary"
                  onPress={() => {
                    haptic('tap');
                    void Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(booking.address)}`);
                  }}
                  style={booking.paymentMethod ? styles.directions : undefined}
                />
              ) : null}
            </View>
          </FadeSlideIn>
        ) : null}

        {capturing ? (
          <FadeSlideIn delay={enter()} slideFrom={14} style={styles.inset}>
            <Input
              label={tc.techLocationNoteLabel}
              value={note}
              onChangeText={setNote}
              placeholder={tc.techLocationNotePlaceholder}
            />
          </FadeSlideIn>
        ) : null}

        {(booking.tracking?.length ?? 0) > 0 ? (
          <FadeSlideIn delay={enter()} slideFrom={14}>
            <PremiumSectionHeader title={tc.techActivityTitle} style={styles.sectionHeader} />
            <View style={styles.inset}>
              <BookingTrackingTimeline events={booking.tracking ?? []} />
            </View>
          </FadeSlideIn>
        ) : null}
      </TechScreenScroll>

      {hasDock ? (
        <StickyActionBar>
          {needsStartCode ? (
            <Button title={tc.techEnterStartCode} onPress={() => setOtpSheet('start')} loading={busy === 'start'} />
          ) : null}
          {needsEndCode && canEnterEndCode ? (
            <Button title={tc.techEnterCompletionCode} onPress={() => setOtpSheet('end')} loading={busy === 'end'} />
          ) : null}
          {needsEndCode && !canEnterEndCode && steps.length > 0 ? (
            <Button title={tc.techCompleteStepsFirst} variant="secondary" disabled />
          ) : null}
        </StickyActionBar>
      ) : null}

      <OtpEntrySheet
        visible={otpSheet !== null}
        title={otpSheet === 'end' ? tc.techEndOtpTitle : tc.techStartOtpTitle}
        subtitle={otpSheet === 'end' ? copy.techOtpEndHint : copy.techOtpStartHint}
        loading={busy === 'start' || busy === 'end'}
        errorTrigger={otpErrorTrigger}
        onClose={() => setOtpSheet(null)}
        onSubmit={(otp) => void submitOtp(otp)}
      />

      <TechLocationSheet phase={gps} onChoose={choose} />

      <PhotoViewer photos={viewer?.photos ?? []} index={viewer ? viewer.index : null} onClose={() => setViewer(null)} />
    </TechScreen>
  );
}

function VisitRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.visitRow}>
      <Text style={styles.visitLabel}>{label}</Text>
      <Text style={styles.visitValue}>{value}</Text>
    </View>
  );
}

/** One treatment step: done (photos open in the viewer), active (capture + complete) or upcoming. */
function StepCard({
  step,
  index,
  active,
  capturing,
  drafts,
  saving,
  locked,
  onDraftsChange,
  onComplete,
  onOpenPhoto,
}: {
  step: BookingStep;
  index: number;
  active: boolean;
  capturing: boolean;
  drafts: PickedImage[];
  saving: boolean;
  /** Another step or code is being saved. */
  locked: boolean;
  onDraftsChange: (next: PickedImage[]) => void;
  onComplete: () => void;
  onOpenPhoto: (photos: string[], index: number) => void;
}) {
  const copy = useCustomerUiCopy();
  const done = step.status === 'done';
  const photos = stepPhotoUrls(step).map(mediaUrl);

  return (
    <View style={[styles.card, styles.inset, styles.step, active && styles.stepActive]}>
      <View style={styles.row}>
        {done ? (
          <View style={[styles.stepThumb, styles.stepThumbDone]}>
            <Check size={22} color={colors.white} strokeWidth={3} />
          </View>
        ) : active ? (
          <View style={[styles.stepThumb, styles.stepThumbActive]}>
            <Camera size={22} color={colors.white} strokeWidth={2.2} />
          </View>
        ) : (
          <View style={styles.stepThumb}>
            <Text style={styles.stepNum}>{index + 1}</Text>
          </View>
        )}
        <View style={styles.flex}>
          <Text style={[styles.stepTitle, !done && !active && styles.stepTitleMuted]}>{step.title}</Text>
          {done ? (
            <Text style={styles.stepDone}>{fillCopy(copy.techStepDoneTag, { photos: photoCount(copy, photos.length) })}</Text>
          ) : active ? (
            <Text style={styles.stepHint}>{fillCopy(copy.techStepAddPhotos, { max: MAX_STEP_PHOTOS })}</Text>
          ) : null}
          {step.geo?.address ? <Text style={styles.stepGeo}>{step.geo.address}</Text> : null}
        </View>
      </View>

      {done && photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
          {photos.map((uri, i) => (
            <PressableScale
              key={`${uri}-${i}`}
              onPress={() => onOpenPhoto(photos, i)}
              accessibilityRole="imagebutton"
              accessibilityLabel={fillCopy(copy.techStepPhotoA11y, { index: i + 1, total: photos.length })}
            >
              <AppImage uri={uri} style={styles.photo} recyclingKey={uri} />
            </PressableScale>
          ))}
        </ScrollView>
      ) : null}

      {active && capturing ? (
        <View style={styles.capture}>
          <AddressPhotoGrid photos={drafts} onChange={onDraftsChange} max={MAX_STEP_PHOTOS} />
          <Button
            title={
              drafts.length === 0
                ? copy.techStepAddToComplete
                : fillCopy(copy.techStepCompleteWith, { photos: photoCount(copy, drafts.length) })
            }
            onPress={onComplete}
            loading={saving}
            disabled={drafts.length === 0 || saving || locked}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.xs, paddingBottom: spacing.xl },
  containerDock: { paddingBottom: 128 },
  inset: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  noticeInset: { marginHorizontal: spacing.md },
  sectionHeader: { marginTop: spacing.md },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  card: {
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  readyCard: { backgroundColor: ui.brandSoft, borderColor: ui.brandSoft },
  cardTitle: { fontFamily: fonts.displayExtra, fontSize: 16, letterSpacing: -0.3, color: ui.text },
  cardBody: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: ui.textSecondary },
  kicker: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.textSecondary },
  amount: { marginTop: 2, fontFamily: fonts.displayExtra, fontSize: 24, letterSpacing: -0.4, color: ui.brand },
  amountHint: { marginTop: 4, fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  collect: { marginTop: 4, fontFamily: fonts.displayExtra, fontSize: 18, letterSpacing: -0.3, color: ui.brand },
  directions: { marginTop: spacing.sm },
  visitHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  visitHeadLabel: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.textSecondary },
  visitRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  visitLabel: { fontFamily: fonts.body, fontSize: 13.5, color: ui.textSecondary },
  visitValue: { flex: 1, textAlign: 'right', fontFamily: fonts.bodySemi, fontSize: 13.5, color: ui.text },
  step: { padding: 14 },
  stepActive: { borderColor: colors.green, borderWidth: 1.5 },
  stepThumb: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: ui.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepThumbDone: { backgroundColor: colors.green },
  stepThumbActive: { backgroundColor: ui.brand },
  stepNum: { fontFamily: fonts.displayExtra, fontSize: 16, color: ui.textSecondary },
  stepTitle: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: ui.text },
  stepTitleMuted: { color: ui.textSecondary },
  stepDone: { marginTop: 3, fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.green },
  stepHint: { marginTop: 3, fontFamily: fonts.bodySemi, fontSize: 11.5, color: ui.brand },
  stepGeo: { marginTop: 2, fontFamily: fonts.body, fontSize: 11.5, color: ui.textSecondary },
  photoRow: { gap: 8, marginTop: spacing.md, paddingRight: 4 },
  photo: { width: 76, height: 76, borderRadius: radii.thumb },
  capture: { marginTop: spacing.md, gap: spacing.sm },
});

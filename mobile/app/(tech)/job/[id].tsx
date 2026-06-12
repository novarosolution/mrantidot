import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Check, ImageIcon } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { BookingFactsCard } from '@/components/kit/BookingFactsCard';
import { BookingStatusBanner } from '@/components/kit/BookingStatusBanner';
import { BookingTrackingTimeline } from '@/components/kit/BookingTrackingTimeline';
import { JobProgressCard } from '@/components/kit/JobProgressCard';
import { OtpEntrySheet } from '@/components/kit/OtpEntrySheet';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
import { uploadImage } from '@/lib/upload';
import type { Booking, BookingStep } from '@/types/api';
import { colors, design, fonts, spacing } from '@/constants/theme';

export default function TechJobScreen() {
  const copy = useTechCopy();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [otpSheet, setOtpSheet] = useState<'start' | 'end' | null>(null);
  const [otpErrorTrigger, setOtpErrorTrigger] = useState(0);
  const focusedRef = useRef(true);
  const lastPoll = useRef(0);
  const { loading, error, runLoad } = useScreenLoad();

  const load = useCallback(async (opts?: { skipCache?: boolean }) => {
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

  async function pickPhoto(source: 'camera' | 'library') {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Camera permission required' });
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.55,
        allowsEditing: true,
      });
      if (result.canceled || !result.assets[0]) return null;
      return result.assets[0];
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Photo library permission required' });
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.55,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0];
  }

  function showPhotoOptions(index: number, step: BookingStep) {
    const run = (source: 'camera' | 'library') => void captureStep(index, step, source);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take photo', 'Choose from gallery'],
          cancelButtonIndex: 0,
        },
        (i) => {
          if (i === 1) void run('camera');
          if (i === 2) void run('library');
        },
      );
      return;
    }

    Alert.alert('Add step photo', 'Capture proof of treatment at this step', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take photo', onPress: () => void run('camera') },
      { text: 'Gallery', onPress: () => void run('library') },
    ]);
  }

  async function captureStep(index: number, step: BookingStep, source: 'camera' | 'library') {
    if (!booking) return;
    setBusy(`step-${index}`);
    try {
      const asset = await pickPhoto(source);
      if (!asset) return;

      let geo: { lat: number; lng: number; address: string } | undefined;
      const { status: loc } = await Location.requestForegroundPermissionsAsync();
      if (loc === 'granted') {
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
        geo = { lat: pos.coords.latitude, lng: pos.coords.longitude, address };
      } else if (note.trim()) {
        geo = { lat: 0, lng: 0, address: note.trim() };
      } else if (booking.address?.trim()) {
        geo = { lat: 0, lng: 0, address: booking.address.trim() };
      } else {
        Toast.show({
          type: 'info',
          text1: 'Location needed',
          text2: 'Enable GPS or add a location note before uploading',
        });
        return;
      }

      const photoUrl = await uploadImage(asset.uri, undefined, asset.mimeType);
      await api.patch(`/bookings/${id}/steps/${index}`, {
        status: 'done',
        photoUrl,
        geo,
      });
      await load({ skipCache: true });
      Toast.show({ type: 'success', text1: `${step.title} completed` });
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
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <CustomerPageHeader variant="premium" title="Job" showBack />
        <ListEmptyRetry message={error ?? 'Job not found'} onRetry={() => void runLoad(load)} />
      </SafeAreaView>
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
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <CustomerPageHeader
        variant="premium"
        title={bookingServiceName(booking)}
        subtitle={bookingScheduleDisplay(booking)}
        showBack
        rightAction={headerLive ? <StatusBadge label="● Live" tone="success" /> : null}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onPullRefresh()} tintColor={colors.green} />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeSlideIn>
          <BookingStatusBanner status={booking.status} audience="technician" />

          {booking.jobValue != null ? (
            <Card variant="premium" style={styles.jobValueCard}>
              <Text style={styles.jobValueLabel}>{copy.techJobValueLabel}</Text>
              <Text style={styles.jobValueAmount}>₹{booking.jobValue}</Text>
            </Card>
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

          <PremiumSectionHeader title={copy.techVisitTimesTitle} style={styles.sectionHeader} />
          <Card variant="premium" style={styles.visitCard}>
            <View style={styles.visitHead}>
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
          </Card>

          <PremiumSectionHeader title={copy.techJobDetailsTitle} style={styles.sectionHeader} />
          <View style={styles.inset}>
            <BookingFactsCard booking={booking} audience="technician" showCustomer showPayment={false} />
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

          {steps.length > 0 ? (
            <>
              <PremiumSectionHeader title={copy.techTreatmentStepsTitle} style={styles.sectionHeader} />
              {steps.map((step, index) => {
                const isActive = index === activeIndex && step.status !== 'done';
                const isDone = step.status === 'done';
                return (
                  <Card
                    key={`${step.title}-${index}`}
                    variant="premium"
                    style={isActive ? { ...styles.step, ...styles.stepActive } : styles.step}
                  >
                    <View style={styles.stepRow}>
                      {isDone && step.photoUrl ? (
                        <View>
                          <Image source={{ uri: mediaUrl(step.photoUrl) }} style={styles.thumb} />
                          <View style={styles.checkOverlay}>
                            <Check color="#fff" size={16} strokeWidth={3} />
                          </View>
                        </View>
                      ) : isActive ? (
                        <View style={styles.camThumb}>
                          <Camera color="#fff" size={24} />
                        </View>
                      ) : (
                        <View style={styles.numThumb}>
                          <Text style={styles.num}>{index + 1}</Text>
                        </View>
                      )}
                      <View style={styles.stepBody}>
                        <Text style={[styles.stepTitle, !isDone && !isActive && styles.muted]}>{step.title}</Text>
                        {isDone ? <Text style={styles.doneTag}>Done</Text> : null}
                        {isActive ? <Text style={styles.activeTag}>Add photo</Text> : null}
                        {step.geo?.address ? <Text style={styles.geo}>{step.geo.address}</Text> : null}
                      </View>
                    </View>
                    {isActive && booking.status === 'in_progress' && canWork ? (
                      <View style={styles.captureRow}>
                        <Button
                          title="Take photo"
                          variant="premium"
                          onPress={() => showPhotoOptions(index, step)}
                          loading={busy === `step-${index}`}
                          style={styles.captureBtn}
                        />
                        <Button
                          title="Gallery"
                          variant="secondary"
                          onPress={() => void captureStep(index, step, 'library')}
                          disabled={busy === `step-${index}`}
                          style={styles.captureBtn}
                        />
                      </View>
                    ) : null}
                  </Card>
                );
              })}
            </>
          ) : canWork && booking.status === 'in_progress' ? (
            <Card variant="premium" style={styles.emptySteps}>
              <ImageIcon size={22} color={colors.forest} />
              <Text style={styles.emptyStepsText}>{copy.techNoStepsHint}</Text>
            </Card>
          ) : null}

          {(booking.tracking?.length ?? 0) > 0 ? (
            <>
              <PremiumSectionHeader title={copy.techActivityTitle} style={styles.sectionHeader} />
              <BookingTrackingTimeline events={booking.tracking ?? []} />
            </>
          ) : null}
        </FadeSlideIn>
      </ScrollView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  container: { paddingBottom: 120 },
  inset: { marginHorizontal: spacing.md },
  sectionHeader: { marginTop: spacing.sm },
  jobValueCard: {
    marginHorizontal: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.soft,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobValueLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted },
  jobValueAmount: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.green },
  visitCard: { marginHorizontal: spacing.md, marginBottom: spacing.sm, padding: spacing.md },
  visitHead: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.sm },
  visitRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 6 },
  visitLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  visitVal: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink, flex: 1, textAlign: 'right' },
  step: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  stepActive: { borderWidth: 1.6, borderColor: colors.green },
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
  captureRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  captureBtn: { flex: 1, minHeight: 44 },
  emptySteps: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.soft,
  },
  emptyStepsText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.forest,
    lineHeight: 19,
    textAlign: 'center',
  },
});

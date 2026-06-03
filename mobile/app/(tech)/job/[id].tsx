import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingFactsCard } from '@/components/kit/BookingFactsCard';
import { BookingStatusBanner } from '@/components/kit/BookingStatusBanner';
import { BookingTrackingTimeline } from '@/components/kit/BookingTrackingTimeline';
import { JobProgressCard } from '@/components/kit/JobProgressCard';
import { OtpEntrySheet } from '@/components/kit/OtpEntrySheet';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Check, MapPin, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, screenLoadConfig } from '@/lib/api';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import {
  formatBookingDuration,
  formatVisitTime,
  jobVisitStatus,
  visitBadgeTone,
  visitStatusLabel,
} from '@/lib/job-visit-helpers';
import { bookingScheduleDisplay, bookingServiceName, bookingStepsDone, isTerminalBookingStatus } from '@/lib/booking-helpers';
import { localDateKey } from '@/lib/dates';
import { mediaUrl } from '@/lib/images';
import { uploadImage } from '@/lib/upload';
import type { Booking, BookingStep } from '@/types/api';
import { colors, design, fonts, gradients, spacing, surfaces } from '@/constants/theme';

export default function TechJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cameraStep, setCameraStep] = useState<{ index: number; step: BookingStep } | null>(null);
  const [otpSheet, setOtpSheet] = useState<'start' | 'end' | null>(null);
  const { loading, error, runLoad } = useScreenLoad();

  const load = useCallback(async () => {
    const { data } = await api.get<{ booking: Booking }>(`/bookings/${id}`, screenLoadConfig);
    setBooking(data.booking);
  }, [id]);

  useEffect(() => {
    void runLoad(load);
  }, [load, runLoad]);

  useEffect(() => {
    if (!booking || isTerminalBookingStatus(booking.status)) return;
    const timer = setInterval(() => {
      void load().catch(() => undefined);
    }, 20000);
    return () => clearInterval(timer);
  }, [booking?.status, booking?.id, load]);

  async function onPullRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function submitOtp(otp: string) {
    if (!otpSheet) return;
    setBusy(otpSheet);
    try {
      const path = otpSheet === 'start' ? 'start-work' : 'complete-work';
      await api.post(`/bookings/${id}/${path}`, { otp });
      Toast.show({
        type: 'success',
        text1: otpSheet === 'start' ? 'Work started' : 'Job completed',
      });
      setOtpSheet(null);
      await load();
    } catch {
      // interceptor toast
    } finally {
      setBusy(null);
    }
  }

  async function captureStep(index: number, step: BookingStep) {
    setBusy(`step-${index}`);
    try {
      const { status: cam } = await ImagePicker.requestCameraPermissionsAsync();
      if (cam !== 'granted') {
        Toast.show({ type: 'error', text1: 'Camera permission required' });
        return;
      }

      const photo = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (photo.canceled || !photo.assets[0]) return;

      let geo: { lat: number; lng: number; address: string } | undefined;
      const { status: loc } = await Location.requestForegroundPermissionsAsync();
      if (loc === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        let address = note || 'On-site location';
        try {
          const [place] = await Location.reverseGeocodeAsync({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          if (place) {
            address = [place.street, place.city, place.region].filter(Boolean).join(', ') || address;
          }
        } catch {
          /* use default */
        }
        geo = { lat: pos.coords.latitude, lng: pos.coords.longitude, address };
      } else if (note.trim()) {
        geo = { lat: 0, lng: 0, address: note.trim() };
      } else {
        Toast.show({ type: 'info', text1: 'No GPS — add a location note below' });
        return;
      }

      const asset = photo.assets[0];
      const photoUrl = await uploadImage(asset.uri, undefined, asset.mimeType);
      await api.patch(`/bookings/${id}/steps/${index}`, {
        status: 'done',
        photoUrl,
        geo,
      });
      await load();
      setCameraStep(null);
      Toast.show({ type: 'success', text1: `${step.title} completed` });
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

  const doneCount = bookingStepsDone(booking);
  const progress = booking.steps.length ? doneCount / booking.steps.length : 0;
  const activeIndex = booking.steps.findIndex((s) => s.status !== 'done');
  const allDone = booking.steps.every((s) => s.status === 'done');
  const readOnly = isTerminalBookingStatus(booking.status);
  const canWork = !readOnly && ['confirmed', 'in_progress', 'awaiting_verification'].includes(booking.status);
  const today = localDateKey();
  const visitStatus = jobVisitStatus(booking, today);
  const visitTone = visitBadgeTone(visitStatus) as BadgeTone;
  const visitDuration = formatBookingDuration(booking);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <CustomerPageHeader
        variant="premium"
        title={bookingServiceName(booking)}
        subtitle={bookingScheduleDisplay(booking)}
        showBack
      />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onPullRefresh()} tintColor={colors.green} />
        }
      >
        <BookingStatusBanner status={booking.status} />

        {booking.jobValue != null ? (
          <Card variant="premium" style={styles.jobValueCard}>
            <Text style={styles.jobValueLabel}>Job value</Text>
            <Text style={styles.jobValueAmount}>₹{booking.jobValue}</Text>
          </Card>
        ) : null}

        {booking.assignmentMode ? (
          <Card variant="premium" style={styles.assignCard}>
            <Text style={styles.assignLabel}>Assignment</Text>
            <Text style={styles.assignValue}>
              {booking.assignmentMode === 'customer_pick'
                ? 'Customer requested you for this job'
                : booking.assignmentMode === 'auto'
                  ? 'Assigned by operations team'
                  : 'Manual assignment'}
            </Text>
          </Card>
        ) : null}

        <Card variant="premium" style={styles.visitCard}>
          <View style={styles.visitHead}>
            <Text style={styles.sectionTitle}>Visit times</Text>
            <StatusBadge label={visitStatusLabel(visitStatus)} tone={visitTone} />
          </View>
          <View style={styles.visitRow}>
            <Text style={styles.visitLabel}>Came to job</Text>
            <Text style={styles.visitVal}>
              {booking.workStartedAt ? formatVisitTime(booking.workStartedAt) : 'Not started'}
            </Text>
          </View>
          <View style={styles.visitRow}>
            <Text style={styles.visitLabel}>Stopped job</Text>
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

        <BookingFactsCard booking={booking} audience="technician" showCustomer showPayment={false} />

        {(booking.tracking?.length ?? 0) > 0 ? (
          <View style={{ marginBottom: spacing.md }}>
            <Text style={styles.sectionTitle}>Activity</Text>
            <BookingTrackingTimeline events={booking.tracking ?? []} />
          </View>
        ) : null}

        {booking.status === 'in_progress' ? (
          <JobProgressCard done={doneCount} total={booking.steps.length} live label="Job progress" />
        ) : null}

        {booking.status === 'confirmed' && canWork && (
          <Button
            title="Enter customer start code"
            variant="premium"
            onPress={() => setOtpSheet('start')}
            loading={busy === 'start'}
            style={{ marginVertical: spacing.md }}
          />
        )}

        {canWork && booking.status === 'in_progress' ? (
          <Input label="Location note (if GPS denied)" value={note} onChangeText={setNote} placeholder="e.g. Satellite Rd" />
        ) : null}

        {booking.steps.map((step, index) => {
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
                  {isDone && <Text style={styles.doneTag}>✓ Photo uploaded</Text>}
                  {isActive && <Text style={styles.activeTag}>● Tap camera to capture</Text>}
                  {step.geo && <Text style={styles.geo}>{step.geo.address}</Text>}
                </View>
                {isActive && booking.status === 'in_progress' && canWork && (
                  <Button
                    title="Capture"
                    variant="sky"
                    onPress={() => setCameraStep({ index, step })}
                    loading={busy === `step-${index}`}
                    style={styles.captureBtn}
                  />
                )}
              </View>
            </Card>
          );
        })}

        {allDone && booking.status === 'awaiting_verification' && (
          <>
            <Card variant="premium" style={styles.successBanner}>
              <Text style={styles.successTitle}>Ask for completion code</Text>
              <Text style={styles.successBody}>
                All step photos are uploaded. Ask the customer for their end code to complete this job.
              </Text>
            </Card>
            <Button
              title="Enter customer end code"
              variant="premium"
              onPress={() => setOtpSheet('end')}
              loading={busy === 'end'}
              style={{ marginTop: spacing.sm }}
            />
          </>
        )}

        {readOnly && (
          <Card variant="premium" style={styles.readOnlyCard}>
            <Text style={styles.readOnlyText}>
              This job is {booking.status}. No further action is required.
            </Text>
          </Card>
        )}
      </ScrollView>

      <Modal visible={cameraStep !== null} animationType="slide">
        <LinearGradient colors={[...gradients.headerDark]} style={styles.camRoot}>
          <View style={styles.camTop}>
            <Pressable onPress={() => setCameraStep(null)} style={styles.camBtn}>
              <X color="#fff" size={20} />
            </Pressable>
            <View style={styles.camCenter}>
              <Text style={styles.camTitle}>
                Step {(cameraStep?.index ?? 0) + 1} of {booking.steps.length}
              </Text>
              <Text style={styles.camSub}>{cameraStep?.step.title}</Text>
            </View>
            <View style={styles.camBtn} />
          </View>

          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            <Text style={styles.liveTag}>● LIVE · Geotagged</Text>
            <View style={styles.geoBar}>
              <MapPin size={15} color={colors.sky} />
              <Text style={styles.geoText}>{note || booking.address}</Text>
            </View>
          </View>

          <Text style={styles.camHint}>Capture where the treatment is applied</Text>

          <View style={styles.camControls}>
            <View style={styles.preview} />
            <Pressable
              style={styles.shutter}
              onPress={() => cameraStep && void captureStep(cameraStep.index, cameraStep.step)}
            >
              <View style={styles.shutterInner} />
            </Pressable>
            <View style={styles.preview} />
          </View>
        </LinearGradient>
      </Modal>

      <OtpEntrySheet
        visible={otpSheet !== null}
        title={otpSheet === 'start' ? 'Start work' : 'Complete job'}
        subtitle={
          otpSheet === 'start'
            ? 'Enter the 6-digit start code from the customer.'
            : 'Enter the 6-digit completion code from the customer.'
        }
        loading={busy === 'start' || busy === 'end'}
        onClose={() => setOtpSheet(null)}
        onSubmit={(otp) => void submitOtp(otp)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  jobValueCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.soft,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobValueLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted },
  jobValueAmount: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.green },
  assignCard: { padding: spacing.md, marginBottom: spacing.sm },
  assignLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  assignValue: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink, marginTop: 4 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, marginBottom: spacing.sm },
  visitCard: { padding: spacing.md, marginBottom: spacing.md },
  visitHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  visitRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 6 },
  visitLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  visitVal: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink, flex: 1, textAlign: 'right' },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressChip: {
    backgroundColor: colors.skySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  progressChipText: { fontFamily: fonts.displayExtra, fontSize: 12, color: colors.skyInk },
  live: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.blue },
  progressTrack: { height: 7, backgroundColor: colors.card, borderRadius: 5, overflow: 'hidden', marginBottom: spacing.md },
  progressFill: { height: '100%', backgroundColor: colors.skyDeep },
  step: { marginBottom: spacing.sm },
  stepActive: { borderWidth: 1.6, borderColor: colors.skyDeep },
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
    backgroundColor: colors.skyDeep,
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
  num: { fontFamily: fonts.displayExtra, fontSize: 16, color: '#c2d0c6' },
  stepBody: { flex: 1 },
  stepTitle: { fontFamily: fonts.display, fontSize: 13.5, color: colors.ink },
  muted: { color: colors.muted },
  doneTag: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.green, marginTop: 4 },
  activeTag: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.skyDeep, marginTop: 4 },
  geo: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  captureBtn: { width: 90, minHeight: 40 },
  successBanner: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.soft },
  successTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.forest },
  successBody: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 18 },
  readOnlyCard: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.greyBg },
  readOnlyText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: 'center' },
  camRoot: { flex: 1 },
  camTop: { flexDirection: 'row', alignItems: 'center', paddingTop: 54, paddingHorizontal: 20 },
  camBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camCenter: { flex: 1, alignItems: 'center' },
  camTitle: { fontFamily: fonts.display, fontSize: 13, color: colors.white },
  camSub: { fontFamily: fonts.body, fontSize: 10, color: '#9fc0a8', marginTop: 2 },
  viewfinder: {
    marginHorizontal: 18,
    marginTop: 20,
    flex: 1,
    borderRadius: 24,
    backgroundColor: surfaces.cameraBg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: colors.sky },
  tl: { top: 14, left: 14, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  tr: { top: 14, right: 14, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  bl: { bottom: 14, left: 14, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
  br: { bottom: 14, right: 14, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
  liveTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: colors.skyDeep,
    color: colors.white,
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  geoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 14,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  geoText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.white, flex: 1 },
  camHint: { textAlign: 'center', fontFamily: fonts.body, fontSize: 11.5, color: '#cfe3d3', marginVertical: 16 },
  camControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  preview: { width: 48, height: 48 },
  shutter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.white,
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.green,
  },
});

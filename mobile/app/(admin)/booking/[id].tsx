import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Check } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { AdminBookingActions } from '@/components/kit/AdminBookingActions';
import { PendingScheduleCard } from '@/components/kit/PendingScheduleCard';
import { ScheduleEditorForm } from '@/components/kit/ScheduleEditorForm';
import { BookingFactsCard } from '@/components/kit/BookingFactsCard';
import { BookingPriceBreakdown } from '@/components/kit/BookingPriceBreakdown';
import { BookingStatusBanner } from '@/components/kit/BookingStatusBanner';
import { BookingTrackingTimeline } from '@/components/kit/BookingTrackingTimeline';
import { JobProgressCard } from '@/components/kit/JobProgressCard';
import { OtpStatusCard } from '@/components/kit/OtpStatusCard';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminActionSheet, type ActionSheetOption } from '@/components/kit/AdminActionSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { BOOKING_SLOTS } from '@/lib/dates';
import {
  bookingCustomerName,
  bookingRequestedScheduleDisplay,
  bookingScheduleDisplay,
  bookingStepsDone,
  bookingTechnicianName,
  isOperationsPhase,
  isSchedulePending,
  isTerminalBookingStatus,
  isVerificationPhase,
} from '@/lib/booking-helpers';
import { assignableTechnicians } from '@/lib/user-helpers';
import { useBookingCopy } from '@/lib/schedule-copy';
import { mediaUrl } from '@/lib/images';
import type { Booking, ScheduleMode, User, WorkOtpAdminView } from '@/types/api';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export default function AdminBookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingCopy = useBookingCopy();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [techs, setTechs] = useState<User[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<ScheduleMode>('standard');
  const [editorDate, setEditorDate] = useState('');
  const [editorSlot, setEditorSlot] = useState<string>(BOOKING_SLOTS[0]);
  const [editorHour, setEditorHour] = useState(10);
  const [editorMinute, setEditorMinute] = useState(0);
  const [rescheduleAddress, setRescheduleAddress] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    const [bookingRes, techsRes] = await Promise.allSettled([
      api.get<{ booking: Booking }>(`/bookings/${id}`, screenLoadConfig),
      api.get<{ technicians: User[] }>('/admin/technicians', {
        ...screenLoadConfig,
        params: { available: 'true' },
      }),
    ]);
    if (bookingRes.status !== 'fulfilled') throw bookingRes.reason;
    setBooking(bookingRes.value.data.booking);
    if (techsRes.status === 'fulfilled') {
      setTechs(assignableTechnicians(techsRes.value.data.technicians));
    } else {
      setTechs([]);
    }
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

  useEffect(() => {
    if (!booking || isTerminalBookingStatus(booking.status)) return;
    const timer = setInterval(() => {
      void load().catch(() => undefined);
    }, 20000);
    return () => clearInterval(timer);
  }, [booking?.status, booking?.id, load]);

  function assignTech() {
    if (!booking) return;
    if (techs.length === 0) {
      Alert.alert('No technicians', 'Add technicians first.');
      return;
    }
    setAssignOpen(true);
  }

  const assignOptions: ActionSheetOption[] = booking
    ? techs.map((t) => ({
        key: t.id,
        label: t.name,
        subtitle: t.phone || t.email || undefined,
        onPress: () =>
          safeAsync(async () => {
            await api.patch(`/bookings/${booking.id}/assign`, { technicianId: t.id });
            Toast.show({ type: 'success', text1: 'Technician assigned' });
            await load();
          }),
      }))
    : [];

  function parseTimeParts(time?: string): [number, number] {
    if (!time) return [10, 0];
    const [h, m] = time.split(':');
    return [parseInt(h ?? '10', 10), parseInt(m ?? '0', 10)];
  }

  function loadEditorFromBooking(b: Booking) {
    const req = b.scheduleRequest ?? b.schedule;
    const mode = b.scheduleMode ?? (req.time || b.schedule.time ? 'custom' : 'standard');
    setEditorMode(mode);
    setEditorDate(req.date ?? b.schedule.date);
    if (mode === 'custom') {
      const [h, m] = parseTimeParts(req.time ?? b.schedule.time);
      setEditorHour(h);
      setEditorMinute(m);
      setEditorSlot('custom');
    } else {
      setEditorSlot(req.slot ?? b.schedule.slot ?? BOOKING_SLOTS[0]);
    }
    setRescheduleAddress(b.address);
  }

  function buildSchedulePayload() {
    if (editorMode === 'custom') {
      const time = `${String(editorHour).padStart(2, '0')}:${String(editorMinute).padStart(2, '0')}`;
      return { date: editorDate, slot: 'custom' as const, time };
    }
    return { date: editorDate, slot: editorSlot };
  }

  function openConfirmSchedule() {
    if (!booking) return;
    loadEditorFromBooking(booking);
    setConfirmOpen(true);
  }

  function openReschedule() {
    if (!booking) return;
    loadEditorFromBooking(booking);
    setRescheduleOpen(true);
  }

  async function saveConfirmSchedule() {
    if (!booking) return;
    setBusy('confirm');
    try {
      await api.patch(`/bookings/${booking.id}/confirm-schedule`, {
        schedule: buildSchedulePayload(),
      });
      Toast.show({ type: 'success', text1: 'Schedule confirmed' });
      setConfirmOpen(false);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function saveReschedule() {
    if (!booking) return;
    setBusy('reschedule');
    try {
      await api.patch(`/bookings/${booking.id}`, {
        schedule: buildSchedulePayload(),
        address: rescheduleAddress.trim(),
      });
      Toast.show({ type: 'success', text1: 'Booking updated' });
      setRescheduleOpen(false);
      await load();
    } finally {
      setBusy(null);
    }
  }

  const cancelOptions: ActionSheetOption[] = [
    {
      key: 'cancel',
      label: 'Cancel booking',
      subtitle: 'The customer will be notified',
      destructive: true,
      onPress: () =>
        safeAsync(async () => {
          await api.patch(`/bookings/${id}/cancel`);
          Toast.show({ type: 'success', text1: 'Booking cancelled' });
          router.back();
        }),
    },
  ];

  if (loadError) {
    return (
      <AdminListShell title="Booking" subtitle="Error">
        <ListEmptyRetry message={loadError} onRetry={() => safeAsync(load)} />
      </AdminListShell>
    );
  }

  if (!booking) return <Spinner fullScreen />;

  const steps = booking.steps ?? [];
  const doneCount = bookingStepsDone(booking);
  const terminal = isTerminalBookingStatus(booking.status);
  const adminOtp = booking.workOtp as WorkOtpAdminView | undefined;
  const customerId =
    booking.customer && typeof booking.customer === 'object' ? booking.customer.id : undefined;

  function formatWhen(iso?: string): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  const title = isVerificationPhase(booking.status)
    ? 'Job verification'
    : isOperationsPhase(booking.status)
      ? 'Assign & dispatch'
      : terminal
        ? 'Booking summary'
        : 'Booking details';

  const subtitle = isVerificationPhase(booking.status)
    ? `${doneCount} / ${steps.length} photos`
    : booking.status.replace(/_/g, ' ');

  return (
    <AdminListShell
      title={title}
      subtitle={subtitle}
      stickyFooter={
        !terminal ? (
          <StickyActionBar>
            {isSchedulePending(booking) ? (
              <Button
                title="Confirm schedule"
                variant="premium"
                onPress={openConfirmSchedule}
                loading={busy === 'confirm'}
                style={styles.footerBtn}
              />
            ) : (
              <Button
                title="Cancel booking"
                variant="secondary"
                onPress={() => setCancelOpen(true)}
                style={styles.footerBtn}
              />
            )}
          </StickyActionBar>
        ) : undefined
      }
    >
      <ScrollView
        contentContainerStyle={[
          adminListShellStyles.list,
          !terminal ? adminListShellStyles.scrollWithFooter : undefined,
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }} tintColor={colors.green} />
        }
      >
        <BookingStatusBanner status={booking.status} />

        {isSchedulePending(booking) ? (
          <PendingScheduleCard
            variant="admin"
            title={bookingCopy.adminRequestTitle}
            scheduleLabel={bookingRequestedScheduleDisplay(booking)}
            hint={bookingCopy.adminConfirmHint}
            modeLabel={
              booking.scheduleMode === 'custom'
                ? bookingCopy.customModeLabel
                : bookingCopy.standardModeLabel
            }
            notes={booking.scheduleRequest?.notes}
            customerName={bookingCustomerName(booking)}
          />
        ) : null}

        <BookingFactsCard booking={booking} showCustomer showTechnician showPayment />

        {(booking.createdAt || booking.scheduleConfirmedAt) ? (
          <Card variant="premium" style={styles.timelineCard}>
            <Text style={styles.section}>Timeline</Text>
            {booking.createdAt ? (
              <Text style={styles.opsHint}>Requested: {formatWhen(booking.createdAt)}</Text>
            ) : null}
            {booking.scheduleConfirmedAt ? (
              <Text style={[styles.opsHint, { marginTop: 4 }]}>
                Schedule confirmed: {formatWhen(booking.scheduleConfirmedAt)}
              </Text>
            ) : isSchedulePending(booking) ? (
              <Text style={[styles.opsHint, { marginTop: 4 }]}>Schedule confirmed: Awaiting admin</Text>
            ) : null}
          </Card>
        ) : null}

        <Card variant="premium" style={styles.priceCard}>
          <Text style={styles.section}>Payment</Text>
          <BookingPriceBreakdown amount={booking.amount} />
        </Card>

        <OtpStatusCard workOtp={adminOtp} />

        {(booking.tracking?.length ?? 0) > 0 ? (
          <>
            <Text style={styles.section}>Live tracking</Text>
            <BookingTrackingTimeline events={booking.tracking ?? []} />
          </>
        ) : null}

        {isOperationsPhase(booking.status) && booking.status !== 'pending' && (
          <Card variant="premium" style={styles.opsCard}>
            <Text style={styles.section}>Dispatch</Text>
            <Text style={styles.opsHint}>
              Confirmed visit: {bookingScheduleDisplay(booking)}.{' '}
              {booking.assignmentMode === 'customer_pick' && booking.technician
                ? `Customer requested ${bookingTechnicianName(booking)}. `
                : booking.assignmentMode === 'auto'
                  ? 'Pick the best technician. '
                  : ''}
              Customer: {bookingCustomerName(booking)}
            </Text>
            {customerId ? (
              <Pressable onPress={() => router.push(`/(admin)/customer/${customerId}`)}>
                <Text style={styles.link}>View customer profile →</Text>
              </Pressable>
            ) : null}
            <Button title="Assign technician" onPress={assignTech} style={{ marginTop: spacing.md }} />
            <AdminBookingActions booking={booking} onUpdated={load} busy={busy} setBusy={setBusy} />
          </Card>
        )}

        {booking.status === 'in_progress' && (
          <>
            <JobProgressCard done={doneCount} total={steps.length} live label="Job progress" />
            <Card variant="premium" style={styles.opsCard}>
              <Text style={styles.section}>On site</Text>
              <Text style={styles.opsHint}>
                Technician verified the start code. {doneCount} of {steps.length} treatment steps captured.
              </Text>
              <AdminBookingActions booking={booking} onUpdated={load} busy={busy} setBusy={setBusy} />
            </Card>
          </>
        )}

        {isVerificationPhase(booking.status) && (
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>Awaiting completion code</Text>
            <Text style={styles.infoBody}>
              Treatment steps are done. Customer and technician must verify with the end code.
            </Text>
            <AdminBookingActions booking={booking} onUpdated={load} busy={busy} setBusy={setBusy} />
          </Card>
        )}

        {!terminal && (
          <Button title="Reschedule / edit address" variant="secondary" onPress={openReschedule} style={{ marginTop: spacing.md }} />
        )}

        {(isVerificationPhase(booking.status) || doneCount > 0) && (
          <>
            <Text style={styles.section}>Step photos</Text>
            <View style={styles.grid}>
              {steps.map((step, i) => (
                <Card key={`${step.title}-${i}`} variant="premium" style={styles.photoCard}>
                  <View style={styles.thumb}>
                    {step.photoUrl ? (
                      <>
                        <Image source={{ uri: mediaUrl(step.photoUrl) }} style={styles.img} />
                        <View style={styles.ok}>
                          <Check size={12} color="#fff" strokeWidth={3} />
                        </View>
                      </>
                    ) : (
                      <Text style={styles.pending}>Pending</Text>
                    )}
                  </View>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepMeta}>{step.status === 'done' ? 'Captured' : 'Pending'}</Text>
                </Card>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <AdminActionSheet
        visible={assignOpen}
        title="Assign technician"
        message={booking ? bookingCustomerName(booking) : undefined}
        options={assignOptions}
        onClose={() => setAssignOpen(false)}
      />

      <AdminActionSheet
        visible={cancelOpen}
        title="Cancel booking?"
        message="This cannot be undone."
        options={cancelOptions}
        onClose={() => setCancelOpen(false)}
      />

      <Modal visible={confirmOpen} animationType="slide" transparent onRequestClose={() => setConfirmOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.section}>{bookingCopy.adminConfirmTitle}</Text>
            <Text style={styles.opsHint}>{bookingCopy.adminConfirmHint}</Text>
            <ScheduleEditorForm
              mode={editorMode}
              onModeChange={setEditorMode}
              date={editorDate}
              onDateChange={setEditorDate}
              slot={editorSlot}
              onSlotChange={setEditorSlot}
              hour={editorHour}
              minute={editorMinute}
              onTimeChange={(h, m) => {
                setEditorHour(h);
                setEditorMinute(m);
              }}
              standardLabel={bookingCopy.standardModeLabel}
              customLabel={bookingCopy.customModeLabel}
            />
            <Button
              title={bookingCopy.adminConfirmButton}
              variant="premium"
              onPress={() => void saveConfirmSchedule()}
              loading={busy === 'confirm'}
              style={{ marginTop: spacing.md }}
            />
            <Button title="Close" variant="secondary" onPress={() => setConfirmOpen(false)} style={{ marginTop: spacing.sm }} />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={rescheduleOpen} animationType="slide" transparent onRequestClose={() => setRescheduleOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRescheduleOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.section}>Reschedule</Text>
            <ScheduleEditorForm
              mode={editorMode}
              onModeChange={setEditorMode}
              date={editorDate}
              onDateChange={setEditorDate}
              slot={editorSlot}
              onSlotChange={setEditorSlot}
              hour={editorHour}
              minute={editorMinute}
              onTimeChange={(h, m) => {
                setEditorHour(h);
                setEditorMinute(m);
              }}
              standardLabel={bookingCopy.standardModeLabel}
              customLabel={bookingCopy.customModeLabel}
            />
            <Input label="Address" value={rescheduleAddress} onChangeText={setRescheduleAddress} />
            <Button title="Save" onPress={() => void saveReschedule()} loading={busy === 'reschedule'} style={{ marginTop: spacing.md }} />
            <Button title="Close" variant="secondary" onPress={() => setRescheduleOpen(false)} style={{ marginTop: spacing.sm }} />
          </Pressable>
        </Pressable>
      </Modal>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: fonts.display, fontSize: 14, marginBottom: spacing.sm, color: colors.ink },
  timelineCard: { marginTop: spacing.sm, padding: spacing.md },
  priceCard: { marginTop: spacing.md, padding: spacing.md },
  opsCard: { marginTop: spacing.md, padding: spacing.md },
  opsHint: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, lineHeight: 20 },
  link: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.secondaryDark, marginTop: spacing.sm },
  infoCard: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.skySoft },
  infoTitle: { fontFamily: fonts.display, fontSize: 14, color: colors.skyInk },
  infoBody: { fontFamily: fonts.body, fontSize: 12, color: colors.skyInk, marginTop: 6, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  photoCard: { width: '47%', padding: 8 },
  thumb: {
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: { width: '100%', height: '100%' },
  ok: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  pending: { fontFamily: fonts.body, color: colors.white, fontSize: 12 },
  stepTitle: { fontFamily: fonts.display, fontSize: 11.5, marginTop: 8 },
  stepMeta: { fontFamily: fonts.body, fontSize: 10, color: colors.muted },
  footerBtn: { width: '100%' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: premium.radiusCard,
    borderTopRightRadius: premium.radiusCard,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    ...premium.shadowSoft,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  modalLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, marginTop: spacing.sm, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
});

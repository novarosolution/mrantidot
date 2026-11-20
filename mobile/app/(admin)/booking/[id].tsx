import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { adminGoBack, adminRoutes, appPush } from '@/lib/routes';
import { paramString } from '@/lib/routeParams';
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import Toast from 'react-native-toast-message';
import { AdminBookingActions } from '@/components/kit/AdminBookingActions';
import { AdminProcessTracker } from '@/components/kit/AdminProcessTracker';
import { PendingScheduleCard } from '@/components/kit/PendingScheduleCard';
import { ScheduleEditorForm } from '@/components/kit/ScheduleEditorForm';
import { BookingFactsCard } from '@/components/kit/BookingFactsCard';
import { BookingPriceBreakdown } from '@/components/kit/BookingPriceBreakdown';
import { BookingInvoiceCard } from '@/components/kit/BookingInvoiceCard';
import { BookingStatusBanner } from '@/components/kit/BookingStatusBanner';
import { BookingTrackingTimeline } from '@/components/kit/BookingTrackingTimeline';
import { JobProgressCard } from '@/components/kit/JobProgressCard';
import { OtpStatusCard } from '@/components/kit/OtpStatusCard';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminActionSheet, type ActionSheetOption } from '@/components/kit/AdminActionSheet';
import { AdminBottomSheet } from '@/components/kit/AdminBottomSheet';
import { AdminBookingDetailSkeleton } from '@/components/kit/AdminSkeletons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Input } from '@/components/ui/Input';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { haptic, stagger } from '@/lib/motion';
import { stepPhotoUrls } from '@/lib/stepPhotos';
import { DEFAULT_BOOKING_SLOT, isSlotStarted, isTimeStarted, localDateKey } from '@/lib/dates';
import { firstOpenSlot } from '@/components/kit/ScheduleSlotPicker';
import {
  bookingCustomerName,
  bookingRef,
  bookingStatusLabel,
  bookingRequestedScheduleDisplay,
  bookingScheduleDisplay,
  bookingServiceName,
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
import { colors, fonts, spacing, surfaces, ui } from '@/constants/theme';

export default function AdminBookingDetailScreen() {
  const id = paramString(useLocalSearchParams<{ id: string | string[] }>().id);
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
  const [editorSlot, setEditorSlot] = useState<string>(DEFAULT_BOOKING_SLOT);
  const [editorHour, setEditorHour] = useState(10);
  const [editorMinute, setEditorMinute] = useState(0);
  const [rescheduleAddress, setRescheduleAddress] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setLoadError('Booking not found');
      return;
    }
    setLoadError(null);
    const [bookingRes, techsRes] = await Promise.allSettled([
      api.get<{ booking: Booking }>(`/bookings/${id}`, screenLoadConfig),
      api.get<{ technicians: User[] }>('/admin/technicians', screenLoadConfig),
    ]);
    if (bookingRes.status !== 'fulfilled') throw bookingRes.reason;
    setBooking(bookingRes.value.data.booking);
    if (techsRes.status === 'fulfilled') {
      setTechs(techsRes.value.data.technicians);
    } else {
      setTechs([]);
    }
  }, [id]);

  useStaleFocusRefresh(() => load().catch(() => undefined), 15_000);

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

  const assignable = booking ? assignableTechnicians(techs, booking.schedule?.date) : [];

  function assignTech() {
    if (!booking) return;
    if (assignable.length === 0) {
      Alert.alert('No technicians', 'Add technicians first.');
      return;
    }
    setAssignOpen(true);
  }

  const assignOptions: ActionSheetOption[] = booking
    ? assignable.map((t) => ({
        key: t.id,
        label: t.name,
        subtitle: [t.available === false ? 'Off duty today' : '', t.phone || t.email].filter(Boolean).join(' · ') || undefined,
        onPress: () =>
          safeAsync(
            async () => {
              await api.patch(`/bookings/${booking.id}/assign`, { technicianId: t.id });
              haptic('success');
              Toast.show({ type: 'success', text1: 'Technician assigned' });
              await load();
            },
            undefined,
            () => haptic('error'),
          ),
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
    const requestedDate = req.date ?? b.schedule.date;
    const today = localDateKey();
    setEditorMode(mode);
    if (mode === 'custom') {
      const [h, m] = parseTimeParts(req.time ?? b.schedule.time);
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      if (isTimeStarted(requestedDate, time)) {
        // The customer's time has already gone — start the editor on the next open half-hour.
        const next = new Date(Date.now() + 30 * 60_000);
        const rounded = next.getMinutes() < 30 ? 30 : 60;
        next.setMinutes(rounded, 0, 0);
        setEditorDate(localDateKey(next));
        setEditorHour(next.getHours());
        setEditorMinute(next.getMinutes());
      } else {
        setEditorDate(requestedDate);
        setEditorHour(h);
        setEditorMinute(m);
      }
      setEditorSlot('custom');
    } else {
      const slot = req.slot ?? b.schedule.slot ?? DEFAULT_BOOKING_SLOT;
      if (isSlotStarted(requestedDate, slot)) {
        // Requested window is in the past — default to the next open window today, else tomorrow.
        const todaySlot = firstOpenSlot(today);
        const tomorrow = localDateKey(new Date(Date.now() + 864e5));
        setEditorDate(todaySlot ? today : tomorrow);
        setEditorSlot(todaySlot ?? firstOpenSlot(tomorrow) ?? DEFAULT_BOOKING_SLOT);
      } else {
        setEditorDate(requestedDate);
        setEditorSlot(slot);
      }
    }
    setRescheduleAddress(b.address);
  }

  /** True (and warns) when the chosen visit time has already started. */
  function editorTimeHasPassed(): boolean {
    const payload = buildSchedulePayload();
    const gone =
      payload.slot === 'custom' ? isTimeStarted(payload.date, payload.time ?? '00:00') : isSlotStarted(payload.date, payload.slot);
    if (gone) {
      haptic('error');
      Toast.show({ type: 'error', text1: 'That time has already passed', text2: 'Pick a later day or time.' });
    }
    return gone;
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
    if (!booking || editorTimeHasPassed()) return;
    setBusy('confirm');
    try {
      await api.patch(`/bookings/${booking.id}/confirm-schedule`, {
        schedule: buildSchedulePayload(),
      });
      haptic('success');
      Toast.show({ type: 'success', text1: 'Schedule confirmed' });
      setConfirmOpen(false);
      await load();
    } catch {
      // error toast shown by the api interceptor
      haptic('error');
    } finally {
      setBusy(null);
    }
  }

  async function saveReschedule() {
    if (!booking) return;
    const current = booking.schedule;
    const payload = buildSchedulePayload();
    const changed =
      current.date !== payload.date || current.slot !== payload.slot || ('time' in payload && current.time !== payload.time);
    // Address-only edits keep the existing (possibly past) time; a new time must be in the future.
    if (changed && editorTimeHasPassed()) return;
    setBusy('reschedule');
    try {
      await api.patch(`/bookings/${booking.id}`, {
        schedule: buildSchedulePayload(),
        ...(rescheduleAddress.trim() && rescheduleAddress.trim() !== booking.address
          ? { address: rescheduleAddress.trim() }
          : {}),
      });
      haptic('success');
      Toast.show({ type: 'success', text1: 'Booking updated' });
      setRescheduleOpen(false);
      await load();
    } catch {
      // error toast shown by the api interceptor
      haptic('error');
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
        safeAsync(
          async () => {
            await api.patch(`/bookings/${id}/cancel`);
            haptic('success');
            Toast.show({ type: 'success', text1: 'Booking cancelled' });
            adminGoBack(adminRoutes.bookings);
          },
          undefined,
          () => haptic('error'),
        ),
    },
  ];

  if (loadError) {
    return (
      <AdminListShell title="Booking" subtitle="Error" backFallback={adminRoutes.bookings}>
        <ListEmptyRetry
          message={loadError}
          onRetry={() => safeAsync(load, undefined, (msg) => setLoadError(msg))}
        />
      </AdminListShell>
    );
  }

  if (!booking) {
    return (
      <AdminListShell
        title="Booking details"
        subtitle={id ? bookingRef(id) : 'Loading…'}
        backFallback={adminRoutes.bookings}
      >
        <AdminBookingDetailSkeleton />
      </AdminListShell>
    );
  }

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
    : `${bookingRef(booking.id)} · ${bookingStatusLabel(booking.status)}`;

  return (
    <AdminListShell
      title={title}
      subtitle={subtitle}
      backFallback={adminRoutes.bookings}
      stickyFooter={
        !terminal ? (
          <StickyActionBar row>
            <Button
              title="Cancel"
              variant="dangerOutline"
              onPress={() => setCancelOpen(true)}
              fullWidth={false}
              style={styles.footerSecondary}
            />
            {isSchedulePending(booking) ? (
              <Button
                title="Confirm schedule"
                variant="premium"
                onPress={openConfirmSchedule}
                loading={busy === 'confirm'}
                fullWidth={false}
                style={styles.footerPrimary}
              />
            ) : booking.status === 'confirmed' && !booking.technician ? (
              <Button
                title="Assign technician"
                variant="premium"
                onPress={assignTech}
                fullWidth={false}
                style={styles.footerPrimary}
              />
            ) : (
              <Button
                title="Reschedule"
                variant="secondary"
                onPress={openReschedule}
                fullWidth={false}
                style={styles.footerPrimary}
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await load();
              } catch {
                Toast.show({ type: 'error', text1: 'Could not refresh booking' });
              } finally {
                setRefreshing(false);
              }
            }}
            tintColor={colors.green}
          />
        }
      >
        <FadeSlideIn delay={stagger(0)} slideFrom={14}>
          <BookingStatusBanner
            status={booking.status}
            audience="staff"
            flush
            message={
              booking.status === 'confirmed' && !booking.technician
                ? 'Schedule confirmed. Assign a technician so they can start the visit.'
                : undefined
            }
          />
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(1)} slideFrom={14}>
          <AdminProcessTracker
            status={booking.status}
            assigned={Boolean(
              booking.technician &&
                (typeof booking.technician === 'string'
                  ? booking.technician
                  : booking.technician.id),
            )}
          />
        </FadeSlideIn>

        {isSchedulePending(booking) ? (
          <FadeSlideIn delay={stagger(2)} slideFrom={14}>
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
          </FadeSlideIn>
        ) : null}

        <FadeSlideIn delay={stagger(3)} slideFrom={14}>
          <BookingFactsCard booking={booking} showCustomer showTechnician showPayment />
        </FadeSlideIn>

        {isSchedulePending(booking) ? (
          <FadeSlideIn delay={stagger(4)} slideFrom={14}>
            <Card variant="premium" style={styles.opsCard}>
              <Text style={styles.section}>Update process</Text>
              <Text style={styles.opsHint}>Confirm the visit schedule to unlock technician assignment.</Text>
              <Button
                title="Confirm schedule"
                variant="premium"
                onPress={openConfirmSchedule}
                loading={busy === 'confirm'}
                style={{ marginTop: spacing.md }}
              />
              <AdminBookingActions booking={booking} onUpdated={load} busy={busy} setBusy={setBusy} />
            </Card>
          </FadeSlideIn>
        ) : null}

        {isOperationsPhase(booking.status) && booking.status !== 'pending' && (
          <FadeSlideIn delay={stagger(4)} slideFrom={14}>
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
                <Pressable
                  onPress={() => appPush(adminRoutes.customer(customerId))}
                  hitSlop={8}
                  style={({ pressed }) => pressed && styles.linkPressed}
                  accessibilityRole="link"
                >
                  <Text style={styles.link}>View customer profile →</Text>
                </Pressable>
              ) : null}
              <AdminBookingActions
                booking={booking}
                onUpdated={load}
                busy={busy}
                setBusy={setBusy}
                onAssign={assignTech}
              />
            </Card>
          </FadeSlideIn>
        )}

        {booking.status === 'in_progress' && (
          <>
            <FadeSlideIn delay={stagger(4)} slideFrom={14}>
              <JobProgressCard done={doneCount} total={steps.length} live label="Job progress" />
            </FadeSlideIn>
            <FadeSlideIn delay={stagger(4)} slideFrom={14}>
              <Card variant="premium" style={styles.opsCard}>
                <Text style={styles.section}>On site</Text>
                <Text style={styles.opsHint}>
                  Technician verified the start code. {doneCount} of {steps.length} treatment steps captured.
                </Text>
                <AdminBookingActions booking={booking} onUpdated={load} busy={busy} setBusy={setBusy} />
              </Card>
            </FadeSlideIn>
          </>
        )}

        {isVerificationPhase(booking.status) && (
          <FadeSlideIn delay={stagger(4)} slideFrom={14}>
            <Card variant="glass" style={styles.infoCard}>
              <Text style={styles.infoTitle}>Awaiting completion code</Text>
              <Text style={styles.infoBody}>
                Treatment steps are done. Reveal or regenerate the end code, or force-complete if needed.
              </Text>
              <AdminBookingActions booking={booking} onUpdated={load} busy={busy} setBusy={setBusy} />
            </Card>
          </FadeSlideIn>
        )}

        {(booking.createdAt || booking.scheduleConfirmedAt) ? (
          <FadeSlideIn delay={stagger(5)} slideFrom={14}>
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
          </FadeSlideIn>
        ) : null}

        <FadeSlideIn delay={stagger(5)} slideFrom={14}>
          <Card variant="premium" style={styles.priceCard}>
            <Text style={styles.section}>Payment</Text>
            <BookingPriceBreakdown
              amount={booking.amount}
              serviceName={bookingServiceName(booking)}
              serviceDesc={
                booking.service && typeof booking.service === 'object'
                  ? booking.service.shortDesc
                  : undefined
              }
            />
          </Card>
        </FadeSlideIn>

        {booking.status !== 'cancelled' ? (
          <FadeSlideIn delay={stagger(6)} slideFrom={14}>
            <BookingInvoiceCard bookingId={booking.id}
              refreshKey={`${booking.status}|${booking.schedule.date}|${booking.schedule.slot}|${booking.schedule.time ?? ''}`} />
          </FadeSlideIn>
        ) : null}

        <FadeSlideIn delay={stagger(6)} slideFrom={14}>
          <OtpStatusCard workOtp={adminOtp} bookingId={booking.id} onUpdated={load} />
        </FadeSlideIn>

        {(booking.tracking?.length ?? 0) > 0 ? (
          <FadeSlideIn delay={stagger(6)} slideFrom={14}>
            <Text style={styles.section}>Live tracking</Text>
            <BookingTrackingTimeline events={booking.tracking ?? []} />
          </FadeSlideIn>
        ) : null}

        {!terminal && (
          <FadeSlideIn delay={stagger(6)} slideFrom={14}>
            <Button title="Reschedule / edit address" variant="secondary" onPress={openReschedule} style={{ marginTop: spacing.md }} />
          </FadeSlideIn>
        )}

        {(isVerificationPhase(booking.status) || doneCount > 0) && (
          <FadeSlideIn delay={stagger(6)} slideFrom={14}>
            <Text style={styles.section}>Step photos</Text>
            <View style={styles.grid}>
              {steps.map((step, i) => {
                const photos = stepPhotoUrls(step);
                return (
                  <Card key={`${step.title}-${i}`} variant="premium" style={styles.photoCard}>
                    <View style={styles.thumb}>
                      {photos[0] ? (
                        <>
                          <Image source={{ uri: mediaUrl(photos[0]) }} style={styles.img} />
                          <View style={styles.ok}>
                            <PremiumIcon icon={AppIcons.ui.check} variant="plain" size="xs" color={colors.white} strokeWidth={3} />
                          </View>
                          {photos.length > 1 ? (
                            <View style={styles.countBadge}>
                              <Text style={styles.countBadgeText}>{photos.length}</Text>
                            </View>
                          ) : null}
                        </>
                      ) : (
                        <Text style={styles.pending}>Pending</Text>
                      )}
                    </View>
                    <Text style={styles.stepTitle} numberOfLines={2}>
                      {step.title}
                    </Text>
                    <Text style={styles.stepMeta}>
                      {step.status === 'done'
                        ? photos.length > 1
                          ? `${photos.length} photos`
                          : 'Captured'
                        : 'Pending'}
                    </Text>
                    {photos.length > 1 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.stepPhotoRow}
                      >
                        {photos.map((url, pi) => (
                          <Image
                            key={`${url}-${pi}`}
                            source={{ uri: mediaUrl(url) }}
                            style={styles.stepPhotoThumb}
                          />
                        ))}
                      </ScrollView>
                    ) : null}
                  </Card>
                );
              })}
            </View>
          </FadeSlideIn>
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

      <AdminBottomSheet
        visible={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={bookingCopy.adminConfirmTitle}
        hint={bookingCopy.adminConfirmHint}
        footer={
          <>
            <Button
              title={bookingCopy.adminConfirmButton}
              variant="premium"
              onPress={() => void saveConfirmSchedule()}
              loading={busy === 'confirm'}
            />
            <Button title="Close" variant="secondary" onPress={() => setConfirmOpen(false)} />
          </>
        }
      >
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
      </AdminBottomSheet>

      <AdminBottomSheet
        visible={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        title="Reschedule"
        hint="Pick a new day and time — the customer and technician are notified."
        footer={
          <>
            <Button title="Save" variant="premium" onPress={() => void saveReschedule()} loading={busy === 'reschedule'} />
            <Button title="Close" variant="secondary" onPress={() => setRescheduleOpen(false)} />
          </>
        }
      >
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
      </AdminBottomSheet>
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
  linkPressed: { opacity: 0.6 },
  infoCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: surfaces.glass,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  infoTitle: { fontFamily: fonts.display, fontSize: 14, color: colors.forest },
  infoBody: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  photoCard: { width: '100%', padding: 8 },
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
  countBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(11,34,19,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.white },
  stepPhotoRow: { gap: 8, marginTop: 8 },
  stepPhotoThumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: colors.soft },
  pending: { fontFamily: fonts.body, color: colors.white, fontSize: 12 },
  stepTitle: { fontFamily: fonts.display, fontSize: 11.5, marginTop: 8, color: ui.text },
  stepMeta: { fontFamily: fonts.body, fontSize: 10, color: ui.textSecondary },
  footerSecondary: { flex: 1 },
  footerPrimary: { flex: 1.8 },
  modalLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, marginTop: spacing.sm, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
});

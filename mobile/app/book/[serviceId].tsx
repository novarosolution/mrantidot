import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Camera,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  LocateFixed,
  MapPin,
  Plus,
  Sparkles,
  Tag,
  X,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { BookTimePicker } from '@/components/kit/BookTimePicker';
import { ScheduleDayPicker } from '@/components/kit/ScheduleDayPicker';
import { ScheduleModeToggle } from '@/components/kit/ScheduleModeToggle';
import { ScheduleSelectionBanner } from '@/components/kit/ScheduleSelectionBanner';
import { ScheduleSlotPicker } from '@/components/kit/ScheduleSlotPicker';
import { AddressCard } from '@/components/kit/AddressCard';
import { BookSectionCard } from '@/components/kit/BookSectionCard';
import { BookServiceStrip } from '@/components/kit/BookServiceStrip';
import { BookingActionBar } from '@/components/kit/BookingActionBar';
import { BookPaymentPicker } from '@/components/kit/BookPaymentPicker';
import { BookingPriceBreakdown } from '@/components/kit/BookingPriceBreakdown';
import { WizardStepBar } from '@/components/kit/WizardStepBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { bookingDetailPath } from '@/lib/routes';
import { getCurrentAddress } from '@/lib/location';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { defaultPaymentType, resolvePaymentMethods } from '@/lib/bookingPayment';
import { paymentMethodLabel } from '@/lib/booking-helpers';
import { computePricing, isValidCoupon } from '@/lib/pricing';
import { useBookingCopy } from '@/lib/schedule-copy';
import { uploadImages, type PickedImage } from '@/lib/upload';
import {
  BOOKING_SLOTS,
  formatScheduleLabel,
  nextBookableDays,
} from '@/lib/dates';
import type { Offer, PaymentMethodRecord, SavedAddress, ScheduleMode, Service } from '@/types/api';
import { colors, design, fonts, gradients, headerTopPad, premium, radius, spacing } from '@/constants/theme';

const DAY_OPTIONS = nextBookableDays(7);
const BOOK_STEP_LABELS = ['Schedule', 'Address', 'Payment', 'Confirm'];
const STEP_HINTS = [
  'Pick a convenient date and time window',
  'Where should our service expert visit?',
  'Apply offers and choose how to pay',
  'Double-check everything before confirming',
];

export default function BookWizardScreen() {
  const { user } = useAuth();
  const { content } = useAppContent();
  const bookingCopy = useBookingCopy();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { serviceId, coupon: couponParam } = useLocalSearchParams<{ serviceId: string; coupon?: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('standard');
  const [date, setDate] = useState(DAY_OPTIONS[0]!.date);
  const [slot, setSlot] = useState<string>(BOOKING_SLOTS[0]);
  const [customHour, setCustomHour] = useState(10);
  const [customMinute, setCustomMinute] = useState(0);
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [dayIdx, setDayIdx] = useState(0);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [coupon, setCoupon] = useState(couponParam ?? '');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'upi_card' | 'pay_after' | null>(null);
  const [photoUris, setPhotoUris] = useState<PickedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSavedPaymentMethods, setHasSavedPaymentMethods] = useState(false);
  const [locating, setLocating] = useState(false);

  const loadData = async () => {
    setLoadError(null);
    const results = await Promise.allSettled([
      api.get<{ service: Service }>(`/services/${serviceId}`, screenLoadConfig),
      api.get<{ addresses: SavedAddress[] }>('/addresses', screenLoadConfig),
      api.get<{ paymentMethods: PaymentMethodRecord[] }>('/payment-methods', screenLoadConfig),
      api.get<{ offers: Offer[] }>('/offers', screenLoadConfig),
    ]);

    const svc = results[0];
    if (svc.status === 'rejected') {
      throw svc.reason;
    }
    setService(svc.value.data.service);

    const addr = results[1];
    if (addr.status === 'fulfilled') {
      setAddresses(addr.value.data.addresses);
      const def = addr.value.data.addresses.find((a) => a.isDefault) ?? addr.value.data.addresses[0];
      if (def) {
        setSelectedAddressId(def.id);
        setAddress(`${def.line1}, ${def.city}`);
      }
    }

    const pay = results[2];
    let resolved: PaymentMethodRecord[] = [];
    if (pay.status === 'fulfilled') {
      resolved = resolvePaymentMethods(pay.value.data.paymentMethods);
      setHasSavedPaymentMethods(pay.value.data.paymentMethods.length > 0);
    } else {
      resolved = resolvePaymentMethods([]);
      setHasSavedPaymentMethods(false);
    }
    setPaymentMethods(resolved);
    setPaymentMethod(defaultPaymentType(resolved));

    const off = results[3];
    if (off.status === 'fulfilled') {
      setOffers(off.value.data.offers);
    }
  };

  useEffect(() => {
    safeAsync(async () => {
      try {
        await loadData();
      } catch (err) {
        setLoadError(getApiErrorMessage(err, 'Could not load booking details'));
      }
    });
  }, [serviceId]);

  useEffect(() => {
    if (couponParam) setCoupon(couponParam);
  }, [couponParam]);

  useEffect(() => {
    const picked = DAY_OPTIONS[dayIdx];
    if (picked) setDate(picked.date);
  }, [dayIdx]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [step]);

  const pricing = useMemo(
    () => (service ? computePricing(service.basePrice, coupon, offers) : null),
    [service, coupon, offers],
  );

  const couponInvalid = coupon.trim().length > 0 && !isValidCoupon(coupon, offers);
  const couponApplied = coupon.trim().length > 0 && isValidCoupon(coupon, offers);
  const durationLabel =
    service?.stepTemplate?.length
      ? `~${Math.max(30, service.stepTemplate.length * 15)} min`
      : '45–60 min';

  const customTime = `${String(customHour).padStart(2, '0')}:${String(customMinute).padStart(2, '0')}`;

  const scheduleSummary =
    scheduleMode === 'standard'
      ? formatScheduleLabel({ date, slot }, 'standard')
      : formatScheduleLabel({ date, slot: 'custom', time: customTime }, 'custom');

  function validateStep(s: number): boolean {
    if (s === 0) {
      if (!date) {
        Toast.show({ type: 'error', text1: 'Select a date' });
        return false;
      }
      if (scheduleMode === 'standard' && !slot) {
        Toast.show({ type: 'error', text1: 'Select a time slot' });
        return false;
      }
      return true;
    }
    if (s === 1) {
      if (!address.trim() && !selectedAddressId) {
        Toast.show({ type: 'error', text1: 'Add or select a service address' });
        return false;
      }
      return true;
    }
    if (s === 2) {
      if (!paymentMethod) {
        Toast.show({ type: 'error', text1: 'Choose a payment method' });
        return false;
      }
      if (couponInvalid) {
        Toast.show({ type: 'error', text1: 'Invalid coupon code' });
        return false;
      }
      return true;
    }
    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => s + 1);
  }

  async function fillAddressFromLocation() {
    setLocating(true);
    try {
      const addr = await getCurrentAddress();
      if (addr) {
        const composed = [addr.line1, addr.city, addr.pincode].filter(Boolean).join(', ');
        if (composed) {
          setAddress(composed);
          setSelectedAddressId(null);
        }
      }
    } finally {
      setLocating(false);
    }
  }

  async function pickPhotos() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!res.canceled) {
      setPhotoUris((prev) =>
        [
          ...prev,
          ...res.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType })),
        ].slice(0, 6),
      );
    }
  }

  function removePhoto(uri: string) {
    setPhotoUris((prev) => prev.filter((p) => p.uri !== uri));
  }

  async function confirm() {
    if (!service || (!address.trim() && !selectedAddressId)) {
      Toast.show({ type: 'error', text1: 'Address is required' });
      return;
    }
    if (!paymentMethod) {
      Toast.show({ type: 'error', text1: 'Choose a payment method' });
      return;
    }
    if (couponInvalid) {
      Toast.show({ type: 'error', text1: 'Invalid coupon code' });
      return;
    }
    setLoading(true);
    try {
      const problemPhotos = photoUris.length > 0 ? await uploadImages(photoUris) : [];
      const scheduleRequest =
        scheduleMode === 'standard'
          ? { date, slot, notes: scheduleNotes.trim() || undefined }
          : { date, time: customTime, notes: scheduleNotes.trim() || undefined };
      const { data } = await api.post<{ booking: { id: string } }>('/bookings', {
        serviceId: service.id,
        scheduleMode,
        scheduleRequest,
        ...(selectedAddressId ? { addressId: selectedAddressId } : { address: address.trim() }),
        paymentMethod,
        couponCode: coupon.trim() || undefined,
        problemPhotos,
        assignmentMode: 'auto',
      });
      Toast.show({ type: 'success', text1: bookingCopy.requestSubmittedToast });
      router.replace(bookingDetailPath(user?.role, data.booking.id) as never);
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not confirm booking') });
    } finally {
      setLoading(false);
    }
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <LinearGradient
          colors={[...gradients.bookHero]}
          style={[styles.errorHeader, { paddingTop: headerTopPad(insets.top) }]}
        >
          <Pressable style={styles.errorBack} onPress={() => router.back()} hitSlop={8}>
            <ChevronLeft size={22} color={colors.white} />
          </Pressable>
          <Text style={styles.errorTitle}>Book service</Text>
        </LinearGradient>
        <ListEmptyRetry message={loadError} onRetry={() => safeAsync(loadData)} />
      </SafeAreaView>
    );
  }

  if (!service) return <Spinner fullScreen />;

  const activeOffers = offers.filter((o) => o.active);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <BookServiceStrip
        service={service}
        durationLabel={durationLabel}
        onBack={() => (step > 0 ? setStep((s) => s - 1) : router.back())}
        title="Book service"
        subtitle={`Step ${step + 1} of ${BOOK_STEP_LABELS.length} · ${STEP_HINTS[step]}`}
      />
      <WizardStepBar step={step} labels={BOOK_STEP_LABELS} onStepPress={(i) => setStep(i)} />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <BookSectionCard title={bookingCopy.scheduleStepTitle} subtitle={bookingCopy.scheduleStepSubtitle}>
            <ScheduleModeToggle
              mode={scheduleMode}
              onChange={setScheduleMode}
              standardLabel={bookingCopy.standardModeLabel}
              customLabel={bookingCopy.customModeLabel}
            />

            <ScheduleDayPicker
              selectedDate={date}
              onSelect={(d, i) => {
                setDate(d);
                setDayIdx(i);
              }}
            />

            {scheduleMode === 'standard' ? (
              <ScheduleSlotPicker selectedSlot={slot} onSelect={setSlot} />
            ) : (
              <>
                <BookTimePicker
                  hour={customHour}
                  minute={customMinute}
                  onChange={(h, m) => {
                    setCustomHour(h);
                    setCustomMinute(m);
                  }}
                />
                <Input
                  label="Notes (optional)"
                  value={scheduleNotes}
                  onChangeText={setScheduleNotes}
                  placeholder={bookingCopy.customNotesPlaceholder}
                />
              </>
            )}

            {(scheduleMode === 'standard' ? slot : customTime) ? (
              <ScheduleSelectionBanner label={scheduleSummary} />
            ) : null}
          </BookSectionCard>
        )}

        {step === 1 && (
          <>
            <BookSectionCard title="Service address" subtitle="Select a saved address or type one below">
              <Pressable
                style={({ pressed }) => [styles.locateBtn, pressed && styles.locatePressed]}
                onPress={() => void fillAddressFromLocation()}
                disabled={locating}
              >
                <LocateFixed size={17} color={colors.green} />
                <Text style={styles.locateText}>
                  {locating ? 'Getting your location…' : 'Use my current location'}
                </Text>
              </Pressable>
              {addresses.length === 0 ? (
                <EmptyState title="No saved addresses" message="Enter your full address for this visit" />
              ) : (
                addresses.map((a) => (
                  <AddressCard
                    key={a.id}
                    address={a}
                    selected={selectedAddressId === a.id}
                    onPress={() => {
                      setSelectedAddressId(a.id);
                      setAddress(`${a.line1}, ${a.city}`);
                    }}
                  />
                ))
              )}
              <View style={styles.manualAddress}>
                <MapPin size={16} color={colors.muted} />
                <View style={styles.manualFlex}>
                  <Input
                    label="Address for this visit"
                    value={address}
                    onChangeText={(t) => {
                      setAddress(t);
                      setSelectedAddressId(null);
                    }}
                    multiline
                    placeholder="House no., street, area, city"
                  />
                </View>
              </View>
            </BookSectionCard>

            <BookSectionCard
              title="Problem photos"
              subtitle="Optional — helps our team prepare (max 6)"
            >
              <View style={styles.photos}>
                <Pressable style={styles.camBox} onPress={pickPhotos}>
                  <Camera color={colors.white} size={24} />
                  <Text style={styles.camLabel}>Add</Text>
                </Pressable>
                {photoUris.map((photo) => (
                  <View key={photo.uri} style={styles.thumbWrap}>
                    <Image source={{ uri: photo.uri }} style={styles.thumb} />
                    <Pressable style={styles.removePhoto} onPress={() => removePhoto(photo.uri)}>
                      <X size={12} color={colors.white} />
                    </Pressable>
                  </View>
                ))}
                {photoUris.length < 6 ? (
                  <Pressable style={styles.addBox} onPress={pickPhotos}>
                    <Plus color={colors.green} size={22} />
                  </Pressable>
                ) : null}
              </View>
            </BookSectionCard>
          </>
        )}

        {step === 2 && (
          <BookSectionCard title="Payment & offers" subtitle="Review pricing and choose how to pay">
            {activeOffers.length > 0 ? (
              <View style={styles.offerBlock}>
                <View style={styles.offerHead}>
                  <Sparkles size={16} color={colors.green} />
                  <Text style={styles.offerHeadText}>Available offers</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offerRow}>
                  {activeOffers.map((o) => {
                    const on = coupon.trim().toUpperCase() === o.code;
                    return (
                      <Pressable
                        key={o.id}
                        style={[styles.offerChip, on && styles.offerChipOn]}
                        onPress={() => setCoupon(on ? '' : o.code)}
                      >
                        <Tag size={14} color={on ? colors.white : colors.green} />
                        <Text style={[styles.offerCode, on && styles.offerCodeOn]}>{o.code}</Text>
                        <Text style={[styles.offerOff, on && styles.offerCodeOn]}>₹{o.discount} off</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            <Input label="Coupon code" value={coupon} onChangeText={setCoupon} autoCapitalize="characters" />
            {couponInvalid ? <Text style={styles.couponError}>This coupon is not valid</Text> : null}
            {couponApplied ? (
              <View style={styles.couponOk}>
                <CheckCircle2 size={16} color={colors.green} />
                <Text style={styles.couponOkText}>Coupon applied successfully</Text>
              </View>
            ) : null}

            {pricing ? (
              <View style={styles.pricingBox}>
                <BookingPriceBreakdown amount={pricing} />
              </View>
            ) : null}

            <BookPaymentPicker
              methods={paymentMethods}
              selected={paymentMethod}
              onSelect={setPaymentMethod}
              showManageLink={hasSavedPaymentMethods}
            />
          </BookSectionCard>
        )}

        {step === 3 && pricing && (
          <BookSectionCard title="Review & confirm" subtitle="Submit your request — our team will confirm your visit time">
            <View style={styles.reviewGrid}>
              <ReviewBlock icon={Calendar} label="Requested schedule" value={scheduleSummary} />
              <ReviewBlock icon={MapPin} label="Address" value={address} />
              <ReviewBlock
                icon={CreditCard}
                label="Payment"
                value={paymentMethod ? paymentMethodLabel(paymentMethod) : '—'}
              />
              {coupon.trim() ? (
                <ReviewBlock icon={Tag} label="Coupon" value={coupon.trim().toUpperCase()} />
              ) : null}
              <ReviewBlock icon={Camera} label="Photos" value={photoUris.length ? `${photoUris.length} attached` : 'None'} />
            </View>
            <View style={styles.pricingBox}>
              <BookingPriceBreakdown amount={pricing} />
            </View>
            <View style={styles.guarantee}>
              <CheckCircle2 size={18} color={colors.green} />
              <Text style={styles.guaranteeText}>{bookingCopy.pendingReviewNote}</Text>
            </View>
          </BookSectionCard>
        )}
      </ScrollView>

      <BookingActionBar
        primaryTitle={step === 3 ? 'Submit request' : 'Continue'}
        onPrimary={step === 3 ? confirm : goNext}
        primaryLoading={loading}
        primaryDisabled={(step === 2 && couponInvalid) || (step >= 2 && !paymentMethod)}
        secondaryTitle={step > 0 ? 'Back' : undefined}
        onSecondary={step > 0 ? () => setStep((s) => s - 1) : undefined}
        totalLabel="Total"
        totalAmount={pricing ? `₹${pricing.total}` : undefined}
        highlightTotal={step === 3}
      />
    </SafeAreaView>
  );
}

function ReviewBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
}) {
  return (
    <View style={reviewStyles.block}>
      <View style={reviewStyles.iconWrap}>
        <Icon size={16} color={colors.green} />
      </View>
      <View style={reviewStyles.body}>
        <Text style={reviewStyles.label}>{label}</Text>
        <Text style={reviewStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  block: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  label: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  value: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ink, marginTop: 3, lineHeight: 20 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  scroll: { flex: 1 },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  errorBack: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.white },
  container: { padding: spacing.md, paddingBottom: spacing.xl + 24 },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  techOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: premium.radiusCard,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  techOptionOn: { borderColor: colors.green, backgroundColor: colors.soft },
  techIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  techIconOn: { backgroundColor: colors.forest },
  techBody: { flex: 1, minWidth: 0 },
  techName: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  techMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },
  techEmpty: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: spacing.xs },
  daysRow: { gap: 10, paddingBottom: spacing.sm },
  dayCard: {
    width: 76,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: 10,
    ...premium.shadowSoft,
  },
  dayCardOn: { backgroundColor: colors.forest, borderColor: colors.lime, borderWidth: 2, transform: [{ scale: 1.02 }] },
  dayWeek: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted, textTransform: 'uppercase' },
  dayNum: { fontFamily: fonts.displayExtra, fontSize: 22, color: colors.ink, marginTop: 4 },
  dayMonth: { fontFamily: fonts.body, fontSize: 10, color: colors.muted, marginTop: 2 },
  dayMonthOn: { color: colors.lime },
  dayTextOn: { color: colors.white },
  todayTag: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.soft,
  },
  todayTagOn: { backgroundColor: 'rgba(255,255,255,0.2)' },
  todayText: { fontFamily: fonts.bodySemi, fontSize: 9, color: colors.green },
  todayTextOn: { color: colors.lime },
  slotGroup: { marginTop: spacing.md },
  slotGroupTitle: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, marginBottom: spacing.sm },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: {
    flexGrow: 1,
    minWidth: '46%',
    paddingVertical: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...premium.shadowSoft,
  },
  slotOn: { backgroundColor: colors.secondarySoft, borderColor: colors.secondaryDark, borderWidth: 2 },
  slotText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.ink },
  slotTextOn: { color: colors.secondaryInk },
  selectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.md,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.soft,
  },
  selectionText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest, flex: 1 },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.green,
    backgroundColor: colors.soft,
    marginBottom: spacing.md,
  },
  locatePressed: { opacity: 0.7 },
  locateText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.green },
  manualAddress: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  manualFlex: { flex: 1 },
  photos: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  camBox: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: colors.skyDeep,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  camLabel: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.white },
  thumbWrap: { position: 'relative' },
  thumb: { width: 80, height: 80, borderRadius: 18 },
  removePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBox: {
    width: 80,
    height: 80,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  offerBlock: { marginBottom: spacing.md },
  offerHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  offerHeadText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  offerRow: { gap: 10 },
  offerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.soft,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: 8,
  },
  offerChipOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  offerCode: { fontFamily: fonts.displayExtra, fontSize: 13, color: colors.forest },
  offerOff: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  offerCodeOn: { color: colors.lime },
  couponError: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.error, marginTop: 4, marginBottom: spacing.sm },
  couponOk: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  couponOkText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.green },
  pricingBox: { marginTop: spacing.md, marginBottom: spacing.sm },
  reviewGrid: { marginBottom: spacing.sm },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.md,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.soft,
  },
  guaranteeText: { fontFamily: fonts.body, fontSize: 12, color: colors.forest, flex: 1, lineHeight: 18 },
});

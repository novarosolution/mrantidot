import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  MapPin,
  Tag,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { BookTimePicker } from '@/components/kit/BookTimePicker';
import { ScheduleDayPicker } from '@/components/kit/ScheduleDayPicker';
import { ScheduleModeToggle } from '@/components/kit/ScheduleModeToggle';
import { ScheduleSelectionBanner } from '@/components/kit/ScheduleSelectionBanner';
import { ScheduleSection, ScheduleStepPanel } from '@/components/kit/ScheduleStepPanel';
import { ScheduleSlotPicker } from '@/components/kit/ScheduleSlotPicker';
import { AddressCard } from '@/components/kit/AddressCard';
import { AddressConfirmBanner, AddressPhotoGrid } from '@/components/kit/AddressPhotoGrid';
import { AddressLocateButton } from '@/components/kit/AddressLocateButton';
import { LocationBanner } from '@/components/kit/LocationChip';
import { AddressManualField } from '@/components/kit/AddressManualField';
import { BookWizardSection, BookWizardStepPanel } from '@/components/kit/BookWizardStepPanel';
import {
  ConfirmDetailsList,
  ConfirmPhotoStrip,
  ConfirmTotalCard,
} from '@/components/kit/ConfirmStepKit';
import { PropertyTypePicker } from '@/components/kit/PropertyTypePicker';
import { BookServiceStrip } from '@/components/kit/BookServiceStrip';
import { BookingActionBar } from '@/components/kit/BookingActionBar';
import { BookPaymentPicker } from '@/components/kit/BookPaymentPicker';
import {
  PaymentCouponField,
  PaymentOfferList,
  PaymentPriceHero,
} from '@/components/kit/PaymentStepKit';
import { BookPriceRibbon } from '@/components/kit/BookPriceRibbon';
import { WizardStepBar } from '@/components/kit/WizardStepBar';
import { FadeSlideHorizontal } from '@/components/ui/FadeSlideIn';
import { Input } from '@/components/ui/Input';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { useLocation } from '@/context/LocationContext';
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
import type { Offer, PaymentMethodRecord, PropertyTypeKey, SavedAddress, ScheduleMode, Service } from '@/types/api';
import { propertyTypeLabel } from '@/constants/propertyTypes';
import { colors, design, fonts, gradients, headerTopPad, premium, radius, spacing } from '@/constants/theme';

const DAY_OPTIONS = nextBookableDays(7);
const BOOK_STEP_LABELS = ['Schedule', 'Property', 'Address', 'Payment', 'Confirm'];

export default function BookWizardScreen() {
  const { content } = useAppContent();
  const bookingCopy = useBookingCopy();
  const insets = useSafeAreaInsets();
  const { location, locating, detectAddress, displayLabel } = useLocation();
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
  const [propertyType, setPropertyType] = useState<PropertyTypeKey | null>(null);
  const [coupon, setCoupon] = useState(couponParam ?? '');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'upi_card' | 'pay_after' | null>(null);
  const [photoUris, setPhotoUris] = useState<PickedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSavedPaymentMethods, setHasSavedPaymentMethods] = useState(false);

  const loadData = async (skipCache = false) => {
    setLoadError(null);
    const cache = skipCache ? { skipCache: true as const } : {};
    const results = await Promise.allSettled([
      api.get<{ service: Service }>(`/services/${serviceId}`, {
        ...screenLoadConfig,
        cacheTtlMs: CACHE_TTL.services,
        ...cache,
      }),
      api.get<{ addresses: SavedAddress[] }>('/addresses', {
        ...screenLoadConfig,
        cacheTtlMs: CACHE_TTL.addresses,
        ...cache,
      }),
      api.get<{ paymentMethods: PaymentMethodRecord[] }>('/payment-methods', {
        ...screenLoadConfig,
        cacheTtlMs: CACHE_TTL.paymentMethods,
        ...cache,
      }),
      api.get<{ offers: Offer[] }>('/offers', {
        ...screenLoadConfig,
        cacheTtlMs: CACHE_TTL.offers,
        ...cache,
      }),
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
    if (selectedAddressId || address.trim()) return;
    if (!location?.line1 && (!location?.city || location.city === 'your area')) return;
    const composed = [location.line1, location.city, location.pincode].filter(Boolean).join(', ');
    if (composed) setAddress(composed);
  }, [address, location, selectedAddressId]);

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

  const addressSummary = useMemo(() => {
    if (address.trim()) return address.trim();
    const saved = addresses.find((a) => a.id === selectedAddressId);
    if (saved) {
      return [saved.line1, saved.city, saved.pincode].filter(Boolean).join(', ');
    }
    return '—';
  }, [address, selectedAddressId, addresses]);

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
      if (!propertyType) {
        Toast.show({ type: 'error', text1: 'Select property type' });
        return false;
      }
      return true;
    }
    if (s === 2) {
      if (!address.trim() && !selectedAddressId) {
        Toast.show({ type: 'error', text1: 'Add or select a service address' });
        return false;
      }
      return true;
    }
    if (s === 3) {
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
    const loc = await detectAddress();
    if (loc) {
      const composed = [loc.line1, loc.city, loc.pincode].filter(Boolean).join(', ');
      if (composed) {
        setAddress(composed);
        setSelectedAddressId(null);
      }
    }
  }

  async function confirm() {
    if (!service || !propertyType) {
      Toast.show({ type: 'error', text1: 'Property type is required' });
      return;
    }
    if (!address.trim() && !selectedAddressId) {
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
        propertyType,
        ...(selectedAddressId ? { addressId: selectedAddressId } : { address: address.trim() }),
        paymentMethod,
        couponCode: coupon.trim() || undefined,
        problemPhotos,
        assignmentMode: 'auto',
      });
      router.replace({
        pathname: '/book/success',
        params: {
          bookingId: data.booking.id,
          serviceName: service.name,
          schedule: scheduleSummary,
          total: String(pricing?.total ?? 0),
          payment: paymentMethod ? paymentMethodLabel(paymentMethod) : '',
        },
      } as never);
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
        <ListEmptyRetry message={loadError} onRetry={() => safeAsync(() => loadData(true))} />
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
        subtitle={`Step ${step + 1} of ${BOOK_STEP_LABELS.length}`}
      />
      <WizardStepBar step={step} labels={BOOK_STEP_LABELS} onStepPress={(i) => setStep(i)} />

      {pricing ? (
        <BookPriceRibbon total={pricing.total} savings={pricing.coupon > 0 ? pricing.coupon : undefined} />
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <FadeSlideHorizontal step={step}>
        {step === 0 && (
          <ScheduleStepPanel title={bookingCopy.scheduleStepTitle} animTrigger={step}>
            <ScheduleSection step={1} title="Visit type">
              <ScheduleModeToggle
                mode={scheduleMode}
                onChange={setScheduleMode}
                standardLabel={bookingCopy.standardModeLabel}
                customLabel={bookingCopy.customModeLabel}
              />
            </ScheduleSection>

            <ScheduleSection step={2} title="Select date">
              <ScheduleDayPicker
                selectedDate={date}
                onSelect={(d, i) => {
                  setDate(d);
                  setDayIdx(i);
                }}
              />
            </ScheduleSection>

            <ScheduleSection
              step={3}
              title={scheduleMode === 'standard' ? 'Pick a time slot' : 'Set your time'}
            >
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
                  <View style={styles.notesWrap}>
                    <Input
                      label="Notes"
                      value={scheduleNotes}
                      onChangeText={setScheduleNotes}
                      placeholder={bookingCopy.customNotesPlaceholder}
                    />
                  </View>
                </>
              )}
            </ScheduleSection>

            {(scheduleMode === 'standard' ? slot : customTime) ? (
              <ScheduleSelectionBanner label={scheduleSummary} />
            ) : null}
          </ScheduleStepPanel>
        )}

        {step === 1 && (
          <FadeSlideHorizontal step={step}>
            <BookWizardStepPanel icon={Building2} title="Property type" animTrigger={step}>
              <BookWizardSection step={1} title="What type of premises?">
                <Text style={styles.propertyHint}>
                  Select your home or business type so we can tailor the treatment plan.
                </Text>
                <PropertyTypePicker value={propertyType} onChange={setPropertyType} />
              </BookWizardSection>
            </BookWizardStepPanel>
          </FadeSlideHorizontal>
        )}

        {step === 2 && (
          <FadeSlideHorizontal step={step}>
            <BookWizardStepPanel icon={MapPin} title="Service address" animTrigger={step}>
              {displayLabel ? (
                <LocationBanner label={displayLabel} hint="Your detected service area" loading={locating} />
              ) : null}
              <BookWizardSection step={1} title="Quick fill">
                <AddressLocateButton loading={locating} onPress={() => void fillAddressFromLocation()} />
              </BookWizardSection>

              {addresses.length > 0 ? (
                <BookWizardSection step={2} title="Saved addresses">
                  {addresses.map((a) => (
                    <AddressCard
                      key={a.id}
                      address={a}
                      selected={selectedAddressId === a.id}
                      onPress={() => {
                        setSelectedAddressId(a.id);
                        setAddress(`${a.line1}, ${a.city}`);
                      }}
                    />
                  ))}
                </BookWizardSection>
              ) : null}

              <BookWizardSection step={addresses.length > 0 ? 3 : 2} title="Enter address">
                <AddressManualField
                  value={address}
                  onChangeText={(t) => {
                    setAddress(t);
                    setSelectedAddressId(null);
                  }}
                />
              </BookWizardSection>

              {address.trim() ? <AddressConfirmBanner address={address} /> : null}

              <BookWizardSection step={addresses.length > 0 ? 4 : 3} title="Problem photos">
                <AddressPhotoGrid photos={photoUris} onChange={setPhotoUris} max={6} />
              </BookWizardSection>
            </BookWizardStepPanel>
          </FadeSlideHorizontal>
        )}

        {step === 3 && pricing && (
          <FadeSlideHorizontal step={step}>
            <BookWizardStepPanel icon={CreditCard} title="Payment & offers" animTrigger={step}>
              <BookWizardSection step={1} title="Price summary">
                <PaymentPriceHero amount={pricing} />
              </BookWizardSection>

              {activeOffers.length > 0 ? (
                <BookWizardSection step={2} title="Available offers">
                  <PaymentOfferList
                    offers={activeOffers}
                    selectedCode={coupon}
                    onSelect={setCoupon}
                  />
                </BookWizardSection>
              ) : null}

              <BookWizardSection step={activeOffers.length > 0 ? 3 : 2} title="Coupon code">
                <PaymentCouponField
                  value={coupon}
                  onChangeText={setCoupon}
                  invalid={couponInvalid}
                  applied={couponApplied}
                />
              </BookWizardSection>

              <BookWizardSection step={activeOffers.length > 0 ? 4 : 3} title="Payment method">
                <BookPaymentPicker
                  methods={paymentMethods}
                  selected={paymentMethod}
                  onSelect={setPaymentMethod}
                  showManageLink={hasSavedPaymentMethods}
                />
              </BookWizardSection>
            </BookWizardStepPanel>
          </FadeSlideHorizontal>
        )}

        {step === 4 && pricing && (
          <FadeSlideHorizontal step={step}>
            <BookWizardStepPanel icon={CheckCircle2} title="Review & confirm" animTrigger={step}>
              <BookWizardSection step={1} title="Your booking">
                <ConfirmDetailsList
                  items={[
                    { icon: Calendar, label: 'Requested schedule', value: scheduleSummary },
                    {
                      icon: Building2,
                      label: 'Property type',
                      value: propertyType ? propertyTypeLabel(propertyType) : '—',
                    },
                    { icon: MapPin, label: 'Service address', value: addressSummary },
                    {
                      icon: CreditCard,
                      label: 'Payment method',
                      value: paymentMethod ? paymentMethodLabel(paymentMethod) : '—',
                    },
                    ...(coupon.trim()
                      ? [{ icon: Tag, label: 'Coupon applied', value: coupon.trim().toUpperCase() }]
                      : []),
                    {
                      icon: Camera,
                      label: 'Photos',
                      value: photoUris.length ? `${photoUris.length} attached` : 'None',
                    },
                  ]}
                />
              </BookWizardSection>

              {photoUris.length > 0 ? (
                <BookWizardSection step={2} title="Attached photos">
                  <ConfirmPhotoStrip photos={photoUris} />
                </BookWizardSection>
              ) : null}

              <BookWizardSection step={photoUris.length > 0 ? 3 : 2} title="Estimated total">
                <ConfirmTotalCard
                  amount={pricing}
                  paymentLabel={paymentMethod ? paymentMethodLabel(paymentMethod) : '—'}
                />
              </BookWizardSection>
            </BookWizardStepPanel>
          </FadeSlideHorizontal>
        )}
        </FadeSlideHorizontal>
      </ScrollView>

      <BookingActionBar
        primaryTitle={step === 4 ? 'Submit request' : 'Continue'}
        onPrimary={step === 4 ? confirm : goNext}
        primaryLoading={loading}
        primaryDisabled={(step === 3 && couponInvalid) || (step >= 3 && !paymentMethod) || (step === 1 && !propertyType)}
        secondaryTitle={step > 0 ? 'Back' : undefined}
        onSecondary={step > 0 ? () => setStep((s) => s - 1) : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
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
  scroll: { flex: 1 },
  container: { padding: spacing.md, paddingBottom: 110 },
  notesWrap: { marginTop: spacing.md },
  propertyHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
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
});

import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Building2, CalendarClock, Camera, CircleCheck, CreditCard, MapPin, Tag } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { paramString } from '@/lib/routeParams';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { BookTimePicker } from '@/components/kit/BookTimePicker';
import { ScheduleDayPicker } from '@/components/kit/ScheduleDayPicker';
import { ScheduleModeToggle } from '@/components/kit/ScheduleModeToggle';
import { ScheduleSlotPicker, firstOpenSlot } from '@/components/kit/ScheduleSlotPicker';
import { AddressCard } from '@/components/kit/AddressCard';
import {
  AddressDetailsForm,
  EMPTY_ADDRESS_FORM,
  addressFormValid,
  composeAddressLine,
  type AddressFormValues,
} from '@/components/kit/AddressDetailsForm';
import { AddressConfirmBanner, AddressPhotoGrid } from '@/components/kit/AddressPhotoGrid';
import { AddressLocateButton } from '@/components/kit/AddressLocateButton';
import { LocationBanner } from '@/components/kit/LocationChip';
import { ConfirmPhotoStrip } from '@/components/kit/ConfirmStepKit';
import {
  BookBillSummary,
  BookCheckoutBar,
  BookFlowHeader,
  BookInfoNote,
  BookOfferList,
  BookReviewRow,
  BookSection,
  BookServiceSummary,
} from '@/components/kit/BookFlowKit';
import { PropertyTypePicker } from '@/components/kit/PropertyTypePicker';
import { BookPaymentPicker } from '@/components/kit/BookPaymentPicker';
import { PaymentCouponField } from '@/components/kit/PaymentStepKit';
import { FadeSlideHorizontal } from '@/components/ui/FadeSlideIn';
import { Input } from '@/components/ui/Input';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { useLocation } from '@/context/LocationContext';
import { defaultPaymentType, resolvePaymentMethods } from '@/lib/bookingPayment';
import { paymentMethodLabel } from '@/lib/booking-helpers';
import { computePricing } from '@/lib/pricing';
import { useBookingCopy, getWizardStepLabels } from '@/lib/schedule-copy';
import { safeGoBack, customerRoutes, sharedRoutes, appReplace } from '@/lib/routes';
import { uploadImages, type PickedImage } from '@/lib/upload';
import {
  DEFAULT_BOOKING_SLOT,
  formatBookableDate,
  formatSlotShort12h,
  formatTime12h,
  isSlotStarted,
  isTimeStarted,
  nextBookableDays,
} from '@/lib/dates';
import type { Offer, PaymentMethodRecord, PropertyTypeKey, SavedAddress, ScheduleMode, Service } from '@/types/api';
import { propertyTypeLabel } from '@/constants/propertyTypes';
import { fonts, spacing, ui } from '@/constants/theme';

export default function BookWizardScreen() {
  const bookingCopy = useBookingCopy();
  const bookStepLabels = useMemo(() => getWizardStepLabels(bookingCopy), [bookingCopy]);
  const { location, locating, detectAddress, displayLabel } = useLocation();
  const scrollRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams<{ serviceId: string | string[]; coupon?: string | string[] }>();
  const serviceId = paramString(params.serviceId);
  const couponParam = paramString(params.coupon);
  const [service, setService] = useState<Service | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('standard');
  const [date, setDate] = useState(() => nextBookableDays(1)[0]!.date);
  const [slot, setSlot] = useState<string>(DEFAULT_BOOKING_SLOT);
  const [customHour, setCustomHour] = useState(10);
  const [customMinute, setCustomMinute] = useState(0);
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormValues>(EMPTY_ADDRESS_FORM);
  const [propertyType, setPropertyType] = useState<PropertyTypeKey | null>(null);
  const [coupon, setCoupon] = useState(couponParam ?? '');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'upi_card' | 'pay_after' | null>(null);
  const [photoUris, setPhotoUris] = useState<PickedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSavedPaymentMethods, setHasSavedPaymentMethods] = useState(false);

  const goToStep = useCallback((target: number) => {
    if (target < step) setStep(target);
  }, [step]);

  const loadData = async (skipCache = false) => {
    if (!serviceId) {
      setLoadError('Service not found');
      return;
    }
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
      // Don't auto-select — user must tap a saved place or fill the form.
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
    if (selectedAddressId) return;
    if (!location?.line1 && (!location?.city || location.city === 'your area')) return;
    setAddressForm((prev) => {
      if (prev.street.trim() || prev.house.trim()) return prev;
      return {
        ...prev,
        street: location.line1 || '',
        city: location.city && location.city !== 'your area' ? location.city : '',
        pincode: location.pincode || '',
      };
    });
  }, [location, selectedAddressId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  // A slot that already started today can't be requested — move to the next open one.
  useEffect(() => {
    if (scheduleMode !== 'standard' || !isSlotStarted(date, slot)) return;
    const next = firstOpenSlot(date);
    if (next) {
      setSlot(next);
    } else {
      // The picked day has no open slots left — jump to the next day.
      const days = nextBookableDays(7);
      const nextDay = days[days.findIndex((d) => d.date === date) + 1] ?? days[1];
      if (nextDay) setDate(nextDay.date);
    }
  }, [date, slot, scheduleMode]);

  const pricing = useMemo(
    () => (service ? computePricing(service.basePrice, coupon, offers) : null),
    [service, coupon, offers],
  );

  // Validate against the real order amount — isValidCoupon defaults to ₹0, where every discount is 0.
  const couponApplied = coupon.trim().length > 0 && (pricing?.coupon ?? 0) > 0;
  const couponInvalid = coupon.trim().length > 0 && !couponApplied;
  const durationLabel =
    service?.stepTemplate?.length
      ? `~${Math.max(30, service.stepTemplate.length * 15)} min`
      : '45–60 min';

  const customTime = `${String(customHour).padStart(2, '0')}:${String(customMinute).padStart(2, '0')}`;

  // 12-hour, matching the slot chips — "Today · Oct 5 · 8 PM – 10 PM".
  const scheduleSummary =
    scheduleMode === 'standard'
      ? `${formatBookableDate(date)} · ${formatSlotShort12h(slot)}`
      : `${formatBookableDate(date)} · ${formatTime12h(customTime)}`;

  const address = useMemo(() => composeAddressLine(addressForm), [addressForm]);

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
      if (scheduleMode === 'standard' && (!slot || isSlotStarted(date, slot))) {
        Toast.show({ type: 'error', text1: 'Select a time slot that hasn’t started yet' });
        return false;
      }
      if (scheduleMode === 'custom' && isTimeStarted(date, customTime)) {
        Toast.show({ type: 'error', text1: 'Pick a time later than now' });
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
      if (!selectedAddressId && !addressFormValid(addressForm)) {
        Toast.show({ type: 'error', text1: 'Add house/flat, street, and city — or pick a saved place' });
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
    if (!loc) return;
    setSelectedAddressId(null);
    setAddressForm((prev) => ({
      ...prev,
      street: loc.line1 || prev.street,
      city: loc.city && loc.city !== 'your area' ? loc.city : prev.city,
      pincode: loc.pincode || prev.pincode,
    }));
    Toast.show({
      type: 'success',
      text1: 'Location filled',
      text2: 'Add your house / flat number to finish',
    });
  }

  function onAddressFormChange(next: AddressFormValues) {
    setSelectedAddressId(null);
    setAddressForm(next);
  }

  async function confirm() {
    if (!service) {
      Toast.show({ type: 'error', text1: 'Service unavailable' });
      return;
    }
    if (!validateStep(0) || !validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }
    setLoading(true);
    try {
      const problemPhotos = photoUris.length > 0 ? await uploadImages(photoUris) : [];
      const scheduleRequest =
        scheduleMode === 'standard'
          ? { date, slot, notes: scheduleNotes.trim() || undefined }
          : { date, time: customTime, notes: scheduleNotes.trim() || undefined };

      let addressId = selectedAddressId;
      if (!addressId && addressFormValid(addressForm)) {
        const line1 = [
          addressForm.house.trim() ? `Flat/House ${addressForm.house.trim()}` : '',
          addressForm.street.trim(),
          addressForm.landmark.trim() ? `Landmark: ${addressForm.landmark.trim()}` : '',
        ]
          .filter(Boolean)
          .join(', ');
        try {
          const saved = await api.post<{ address: SavedAddress }>('/addresses', {
            label: addressForm.saveAs,
            line1,
            city: addressForm.city.trim(),
            pincode: addressForm.pincode.trim() || undefined,
            isDefault: addresses.length === 0,
          });
          addressId = saved.data.address.id;
          setAddresses((prev) => [...prev, saved.data.address]);
          setSelectedAddressId(addressId);
        } catch {
          Toast.show({
            type: 'info',
            text1: 'Address not saved for later',
            text2: 'Booking will still use the details you entered',
          });
        }
      }

      const { data } = await api.post<{ booking: { id: string; amount?: { total?: number } } }>('/bookings', {
        serviceId: service.id,
        scheduleMode,
        scheduleRequest,
        propertyType,
        ...(addressId ? { addressId } : { address: address.trim() }),
        paymentMethod,
        couponCode: coupon.trim() || undefined,
        problemPhotos,
        assignmentMode: 'auto',
      });
      appReplace({
        pathname: sharedRoutes.bookSuccess,
        params: {
          bookingId: data.booking.id,
          serviceName: service.name,
          schedule: scheduleSummary,
          total: String(data.booking.amount?.total ?? pricing?.total ?? 0),
          payment: paymentMethod ? paymentMethodLabel(paymentMethod) : '',
        },
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not confirm booking') });
    } finally {
      setLoading(false);
    }
  }

  if (loadError) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
          <CustomerPageHeader
            variant="premium"
            title={bookingCopy.wizardScreenTitle}
            showBack
            onBack={() => safeGoBack(customerRoutes.services)}
          />
          <ListEmptyRetry
            message={loadError}
            onRetry={() => safeAsync(() => loadData(true), undefined, (msg) => setLoadError(msg))}
          />
        </SafeAreaView>
      </View>
    );
  }

  if (!service) return <Spinner fullScreen />;

  const activeOffers = offers.filter((o) => o.active);
  const included = (service.stepTemplate ?? []).slice(0, 5);
  const stepTitles = [
    'Select date & time',
    'Property type',
    'Service address',
    'Payment & offers',
    bookingCopy.wizardReviewSectionTitle,
  ];
  const goBack = () => (step > 0 ? setStep((s) => s - 1) : safeGoBack(customerRoutes.services));

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <BookFlowHeader
          title={stepTitles[step] ?? bookingCopy.wizardScreenTitle}
          subtitle={`${service.name} · ${durationLabel}`}
          step={step}
          totalSteps={bookStepLabels.length}
          stepLabels={bookStepLabels}
          onBack={goBack}
          onStepPress={goToStep}
        />

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          <FadeSlideHorizontal step={step}>
            {step === 0 ? (
              <>
                <BookSection>
                  <BookServiceSummary service={service} durationLabel={durationLabel} />
                </BookSection>

                <BookSection
                  title={bookingCopy.scheduleStepTitle}
                  subtitle="Pick a day — our team confirms the visit time after you book"
                >
                  <ScheduleDayPicker
                    selectedDate={date}
                    onSelect={(d) => setDate(d)}
                  />
                </BookSection>

                <BookSection title="Select a time">
                  <ScheduleModeToggle
                    mode={scheduleMode}
                    onChange={setScheduleMode}
                    standardLabel={bookingCopy.standardModeLabel}
                    customLabel={bookingCopy.customModeLabel}
                  />
                  <View style={styles.timeBody}>
                    {scheduleMode === 'standard' ? (
                      <ScheduleSlotPicker selectedSlot={slot} onSelect={setSlot} date={date} />
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
                  </View>
                </BookSection>

                {included.length > 0 ? (
                  <BookSection title="What's included">
                    {included.map((item) => (
                      <View key={item} style={styles.includedRow}>
                        <CircleCheck size={17} color={ui.brand} strokeWidth={2.1} />
                        <Text style={styles.includedText}>{item}</Text>
                      </View>
                    ))}
                  </BookSection>
                ) : null}
              </>
            ) : null}

            {step === 1 ? (
              <BookSection title="What type of property?" subtitle="So the technician can plan the treatment for your space">
                <PropertyTypePicker value={propertyType} onChange={setPropertyType} contentInset={32} />
              </BookSection>
            ) : null}

            {step === 2 ? (
              <>
                <BookSection title="Where should we come?" subtitle="Use your location to fill the address in seconds">
                  <AddressLocateButton loading={locating} onPress={() => void fillAddressFromLocation()} />
                  {displayLabel ? (
                    <View style={styles.areaChip}>
                      <LocationBanner
                        label={displayLabel}
                        loading={locating}
                        hint="Detected area · tap refresh to update"
                        onRefresh={() => void detectAddress()}
                        embedded
                      />
                    </View>
                  ) : null}
                </BookSection>

                {addresses.length > 0 ? (
                  <BookSection title="Saved addresses">
                    {addresses.map((a) => (
                      <AddressCard
                        key={a.id}
                        address={a}
                        selected={selectedAddressId === a.id}
                        onPress={() => {
                          setSelectedAddressId(a.id);
                          setAddressForm(EMPTY_ADDRESS_FORM);
                        }}
                      />
                    ))}
                  </BookSection>
                ) : null}

                <BookSection
                  title={addresses.length > 0 ? 'Or add a new address' : 'Address details'}
                  subtitle="House / flat number is required · landmark optional"
                >
                  <AddressDetailsForm value={addressForm} onChange={onAddressFormChange} />
                  {addressSummary !== '—' ? (
                    <View style={styles.confirmWrap}>
                      <AddressConfirmBanner address={addressSummary} />
                    </View>
                  ) : null}
                </BookSection>

                <BookSection title="Problem photos" subtitle="Optional — helps the technician prepare">
                  <AddressPhotoGrid photos={photoUris} onChange={setPhotoUris} max={6} />
                </BookSection>
              </>
            ) : null}

            {step === 3 && pricing ? (
              <>
                <BookSection title={activeOffers.length > 0 ? 'Coupons & offers' : 'Coupon code'}>
                  {activeOffers.length > 0 ? (
                    <View style={styles.offersWrap}>
                      <BookOfferList offers={activeOffers} appliedCode={coupon} onApply={setCoupon} />
                    </View>
                  ) : null}
                  <PaymentCouponField
                    value={coupon}
                    onChangeText={setCoupon}
                    invalid={couponInvalid}
                    applied={couponApplied}
                  />
                </BookSection>

                <BookSection title="Payment method">
                  <BookPaymentPicker
                    methods={paymentMethods}
                    selected={paymentMethod}
                    onSelect={setPaymentMethod}
                    showManageLink={hasSavedPaymentMethods}
                  />
                </BookSection>

                <BookSection title="Payment summary">
                  <BookBillSummary amount={pricing} />
                </BookSection>
              </>
            ) : null}

            {step === 4 && pricing ? (
              <>
                <BookSection>
                  <BookServiceSummary service={service} durationLabel={durationLabel} />
                </BookSection>

                <BookSection title="Booking details">
                  <BookReviewRow
                    icon={CalendarClock}
                    label="Requested schedule"
                    value={scheduleSummary}
                    onChange={() => setStep(0)}
                  />
                  <BookReviewRow
                    icon={Building2}
                    label="Property type"
                    value={propertyType ? propertyTypeLabel(propertyType) : '—'}
                    onChange={() => setStep(1)}
                  />
                  <BookReviewRow
                    icon={MapPin}
                    label="Service address"
                    value={addressSummary}
                    onChange={() => setStep(2)}
                  />
                  <BookReviewRow
                    icon={CreditCard}
                    label="Payment method"
                    value={paymentMethod ? paymentMethodLabel(paymentMethod) : '—'}
                    onChange={() => setStep(3)}
                  />
                  {coupon.trim() ? (
                    <BookReviewRow
                      icon={Tag}
                      label="Coupon applied"
                      value={coupon.trim().toUpperCase()}
                      onChange={() => setStep(3)}
                    />
                  ) : null}
                  <BookReviewRow
                    icon={Camera}
                    label="Photos"
                    value={photoUris.length ? `${photoUris.length} attached` : 'None added'}
                    onChange={() => setStep(2)}
                    last
                  />
                  {photoUris.length > 0 ? (
                    <View style={styles.photoStrip}>
                      <ConfirmPhotoStrip photos={photoUris} />
                    </View>
                  ) : null}
                </BookSection>

                <BookSection title="Payment summary">
                  <BookBillSummary amount={pricing} totalLabel="Estimated total" />
                </BookSection>

                <BookSection>
                  <View style={styles.notes}>
                    <BookInfoNote title="What happens next">{bookingCopy.pendingReviewNote}</BookInfoNote>
                    <BookInfoNote title="Cancellation">
                      You can cancel from My Bookings any time before the technician starts work.
                    </BookInfoNote>
                  </View>
                </BookSection>
              </>
            ) : null}
          </FadeSlideHorizontal>
        </ScrollView>

        {pricing ? (
          <BookCheckoutBar
            total={pricing.total}
            savings={pricing.coupon}
            caption={step === 4 ? 'Estimated total · incl. taxes' : 'incl. taxes'}
            actionTitle={step === 4 ? bookingCopy.wizardSubmitButton : bookingCopy.wizardContinueButton}
            onAction={step === 4 ? confirm : goNext}
            loading={loading}
            disabled={(step === 3 && couponInvalid) || (step >= 3 && !paymentMethod) || (step === 1 && !propertyType)}
          />
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ui.surfaceMuted },
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  container: { paddingTop: 8, paddingBottom: 40 },
  timeBody: { marginTop: 18 },
  notesWrap: { marginTop: spacing.md },
  includedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  includedText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: ui.text },
  areaChip: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.hairline,
  },
  confirmWrap: { marginTop: spacing.md },
  offersWrap: { marginBottom: 14 },
  photoStrip: { marginTop: 10 },
  notes: { gap: 10 },
});

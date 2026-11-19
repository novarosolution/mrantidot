import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LucideIcon } from 'lucide-react-native';
import {
  BadgePercent,
  Building2,
  Camera,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  CreditCard,
  House,
  Pencil,
  Phone,
  Plus,
  ReceiptText,
} from 'lucide-react-native';
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
import { AddressPhotoGrid } from '@/components/kit/AddressPhotoGrid';
import { AddressLocateButton } from '@/components/kit/AddressLocateButton';
import { BookBillSummary, BookOfferList } from '@/components/kit/BookFlowKit';
import { PropertyTypePicker } from '@/components/kit/PropertyTypePicker';
import { BookPaymentPicker } from '@/components/kit/BookPaymentPicker';
import { PaymentCouponField } from '@/components/kit/PaymentStepKit';
import { PestImage } from '@/components/kit/ServiceThumb';
import { formatRupeeFull } from '@/components/kit/format';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { stagger } from '@/lib/motion';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { defaultPaymentType, resolvePaymentMethods } from '@/lib/bookingPayment';
import { paymentMethodLabel } from '@/lib/booking-helpers';
import { computePricing } from '@/lib/pricing';
import { useBookingCopy } from '@/lib/schedule-copy';
import { findOption, formatDuration, serviceDurationMins, servicePriceFor } from '@/lib/serviceDisplay';
import { safeGoBack, customerRoutes, sharedRoutes, appPush, appReplace } from '@/lib/routes';
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
import type { Offer, PaymentMethodRecord, PropertyTypeKey, SavedAddress, ScheduleMode, Service, ServiceTypeKey } from '@/types/api';
import { isPropertyTypeKey, propertyTypeLabel } from '@/constants/propertyTypes';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { CartSkeleton } from '@/components/kit/ScreenSkeletons';

type Sheet = 'slot' | 'address' | 'property' | 'payment' | 'coupon' | 'photos' | null;

/** One tappable line of the cart — icon, title, optional detail, action on the right. */
function CartRow({
  icon: Icon,
  title,
  sub,
  action,
  onPress,
  last,
  missing,
}: {
  icon: LucideIcon;
  title: string;
  sub?: string;
  action?: string;
  onPress: () => void;
  last?: boolean;
  missing?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={sub ? `${title}. ${sub}` : title}
    >
      <Icon size={20} color={missing ? ui.brand : ui.text} strokeWidth={2} />
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, missing && styles.rowTitleMissing]} numberOfLines={2}>
          {title}
        </Text>
        {sub ? (
          <Text style={styles.rowSub} numberOfLines={2}>
            {sub}
          </Text>
        ) : null}
      </View>
      {action ? <Text style={styles.rowAction}>{action}</Text> : <ChevronRight size={18} color={ui.textTertiary} />}
    </Pressable>
  );
}

function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export default function BookCartScreen() {
  const bookingCopy = useBookingCopy();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { location, locating, detectAddress } = useLocation();
  const params = useLocalSearchParams<{ serviceId: string | string[]; coupon?: string | string[]; option?: string | string[] }>();
  const serviceId = paramString(params.serviceId);
  const couponParam = paramString(params.coupon);
  const optionParam = paramString(params.option);
  const [service, setService] = useState<Service | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [optionKey, setOptionKey] = useState<string | null>(optionParam ?? null);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('standard');
  const [date, setDate] = useState(() => nextBookableDays(1)[0]!.date);
  const [slot, setSlot] = useState<string>(DEFAULT_BOOKING_SLOT);
  const [slotConfirmed, setSlotConfirmed] = useState(false);
  const [customHour, setCustomHour] = useState(10);
  const [customMinute, setCustomMinute] = useState(0);
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormValues>(EMPTY_ADDRESS_FORM);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [propertyType, setPropertyType] = useState<PropertyTypeKey | null>(null);
  const [coupon, setCoupon] = useState(couponParam ?? '');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'upi_card' | 'pay_after' | null>(null);
  const [photoUris, setPhotoUris] = useState<PickedImage[]>([]);
  const [billOpen, setBillOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSavedPaymentMethods, setHasSavedPaymentMethods] = useState(false);

  const loadData = async (skipCache = false) => {
    if (!serviceId) {
      setLoadError('Service not found');
      return;
    }
    setLoadError(null);
    const cache = skipCache ? { skipCache: true as const } : {};
    const results = await Promise.allSettled([
      api.get<{ service: Service }>(`/services/${serviceId}`, { ...screenLoadConfig, cacheTtlMs: CACHE_TTL.services, ...cache }),
      api.get<{ addresses: SavedAddress[] }>('/addresses', { ...screenLoadConfig, cacheTtlMs: CACHE_TTL.addresses, ...cache }),
      api.get<{ paymentMethods: PaymentMethodRecord[] }>('/payment-methods', {
        ...screenLoadConfig,
        cacheTtlMs: CACHE_TTL.paymentMethods,
        ...cache,
      }),
      api.get<{ offers: Offer[] }>('/offers', { ...screenLoadConfig, cacheTtlMs: CACHE_TTL.offers, ...cache }),
    ]);

    const svc = results[0];
    if (svc.status === 'rejected') throw svc.reason;
    const s = svc.value.data.service;
    setService(s);
    // Keep the size picked on the detail page; otherwise start on the cheapest one.
    setOptionKey((prev) => (prev && s.options?.some((o) => o.key === prev) ? prev : (s.options?.[0]?.key ?? null)));

    const addr = results[1];
    if (addr.status === 'fulfilled') {
      const list = addr.value.data.addresses;
      setAddresses(list);
      // The default saved place is pre-picked, like a real cart — the customer can change it.
      setSelectedAddressId((prev) => prev ?? list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? null);
    }

    const pay = results[2];
    const resolved = resolvePaymentMethods(pay.status === 'fulfilled' ? pay.value.data.paymentMethods : []);
    setHasSavedPaymentMethods(pay.status === 'fulfilled' && pay.value.data.paymentMethods.length > 0);
    setPaymentMethods(resolved);
    setPaymentMethod(defaultPaymentType(resolved));

    const off = results[3];
    if (off.status === 'fulfilled') setOffers(off.value.data.offers);
  };

  useEffect(() => {
    safeAsync(async () => {
      try {
        await loadData();
      } catch (err) {
        setLoadError(getApiErrorMessage(err, 'Could not load booking details'));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  useEffect(() => {
    if (couponParam) setCoupon(couponParam);
  }, [couponParam]);

  // Fill a fresh address form from the detected location (never over what the customer typed).
  useEffect(() => {
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
  }, [location]);

  // A slot that already started today can't be requested — move to the next open one.
  useEffect(() => {
    if (scheduleMode !== 'standard' || !isSlotStarted(date, slot)) return;
    const next = firstOpenSlot(date);
    if (next) {
      setSlot(next);
    } else {
      const days = nextBookableDays(7);
      const nextDay = days[days.findIndex((d) => d.date === date) + 1] ?? days[1];
      if (nextDay) setDate(nextDay.date);
    }
  }, [date, slot, scheduleMode]);

  // A home-size package ("2 BHK") already answers the property question — pre-pick it, still changeable.
  useEffect(() => {
    if (!optionKey || propertyType) return;
    const guess = optionKey.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (isPropertyTypeKey(guess)) setPropertyType(guess);
  }, [optionKey, propertyType]);

  const option = service ? findOption(service, optionKey) : undefined;
  const basePrice = service ? servicePriceFor(service, optionKey) : 0;
  const pricing = useMemo(() => (service ? computePricing(basePrice, coupon, offers) : null), [service, basePrice, coupon, offers]);
  const couponApplied = coupon.trim().length > 0 && (pricing?.coupon ?? 0) > 0;
  const couponInvalid = coupon.trim().length > 0 && !couponApplied;
  const customTime = `${String(customHour).padStart(2, '0')}:${String(customMinute).padStart(2, '0')}`;
  const scheduleSummary =
    scheduleMode === 'standard'
      ? `${formatBookableDate(date)} · ${formatSlotShort12h(slot)}`
      : `${formatBookableDate(date)} · ${formatTime12h(customTime)}`;

  const typedAddress = useMemo(() => composeAddressLine(addressForm), [addressForm]);
  const savedAddress = addresses.find((a) => a.id === selectedAddressId);
  const addressReady = Boolean(savedAddress) || addressFormValid(addressForm);
  const addressSummary = savedAddress
    ? [savedAddress.line1, savedAddress.city, savedAddress.pincode].filter(Boolean).join(', ')
    : typedAddress.trim();

  function scheduleValid(): boolean {
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

  async function fillAddressFromLocation() {
    const loc = await detectAddress();
    if (!loc) return;
    setSelectedAddressId(null);
    setShowNewAddress(true);
    setAddressForm((prev) => ({
      ...prev,
      street: loc.line1 || prev.street,
      city: loc.city && loc.city !== 'your area' ? loc.city : prev.city,
      pincode: loc.pincode || prev.pincode,
    }));
    Toast.show({ type: 'success', text1: 'Location filled', text2: 'Add your house / flat number to finish' });
  }

  /** The bar's one button walks the customer through whatever is still missing, then submits. */
  const nextStep: { label: string; run: () => void } = !addressReady
    ? { label: 'Add address', run: () => setSheet('address') }
    : !slotConfirmed
      ? { label: 'Select slot', run: () => setSheet('slot') }
      : !propertyType
        ? { label: 'Select property type', run: () => setSheet('property') }
        : !paymentMethod
          ? { label: 'Choose payment', run: () => setSheet('payment') }
          : { label: bookingCopy.wizardSubmitButton, run: () => void confirm() };

  async function confirm() {
    if (!service || !pricing) return;
    if (!addressReady || !propertyType || !paymentMethod || !scheduleValid()) return;
    if (couponInvalid) {
      Toast.show({ type: 'error', text1: 'Invalid coupon code' });
      setSheet('coupon');
      return;
    }
    setLoading(true);
    try {
      const problemPhotos = photoUris.length > 0 ? await uploadImages(photoUris) : [];
      const scheduleRequest =
        scheduleMode === 'standard'
          ? { date, slot, notes: scheduleNotes.trim() || undefined }
          : { date, time: customTime, notes: scheduleNotes.trim() || undefined };

      let addressId = savedAddress?.id ?? null;
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
          Toast.show({ type: 'info', text1: 'Address not saved for later', text2: 'Booking will still use the details you entered' });
        }
      }

      const { data } = await api.post<{ booking: { id: string; amount?: { total?: number } } }>('/bookings', {
        serviceId: service.id,
        scheduleMode,
        scheduleRequest,
        propertyType,
        ...(option ? { optionKey: option.key } : {}),
        ...(addressId ? { addressId } : { address: typedAddress.trim() }),
        paymentMethod,
        couponCode: coupon.trim() || undefined,
        problemPhotos,
        assignmentMode: 'auto',
      });
      appReplace({
        pathname: sharedRoutes.bookSuccess,
        params: {
          bookingId: data.booking.id,
          serviceName: option ? `${service.name} · ${option.label}` : service.name,
          schedule: scheduleSummary,
          total: String(data.booking.amount?.total ?? pricing.total),
          payment: paymentMethodLabel(paymentMethod),
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
        <SafeAreaView style={styles.flex} edges={['left', 'right']}>
          <CustomerPageHeader variant="premium" title="Your cart" showBack onBack={() => safeGoBack(customerRoutes.services)} />
          <ListEmptyRetry
            message={loadError}
            onRetry={() => safeAsync(() => loadData(true), undefined, (msg) => setLoadError(msg))}
          />
        </SafeAreaView>
      </View>
    );
  }

  if (!service || !pricing) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.flex} edges={['left', 'right']}>
          <CustomerPageHeader variant="premium" title="Your cart" showBack onBack={() => safeGoBack(customerRoutes.services)} />
          <CartSkeleton />
        </SafeAreaView>
      </View>
    );
  }

  const type = (service.serviceTypes?.[0] ?? 'general') as ServiceTypeKey;
  const meta = SERVICE_TYPE_META[type] ?? SERVICE_TYPE_META.general;
  const duration = formatDuration(serviceDurationMins(service));
  const activeOffers = offers.filter((o) => o.active);
  const contactLine = [user?.name?.trim(), user?.phone ? `+91 ${user.phone}` : ''].filter(Boolean).join(', ');

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['left', 'right']}>
        <CustomerPageHeader variant="premium" title="Your cart" subtitle={service.name} showBack onBack={() => safeGoBack(customerRoutes.services)} />

        <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* The service in the cart, with its size and a way back to change it. */}
          <FadeSlideIn delay={stagger(0)} slideFrom={14}>
            <Card>
              <View style={styles.item}>
                <View style={[styles.itemArt, { backgroundColor: meta.bg }]}>
                  <PestImage source={meta.image} size={52} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {service.name}
                  </Text>
                  <Text style={styles.itemMeta}>{option ? `${option.label} · ${duration}` : duration}</Text>
                </View>
                <Text style={styles.itemPrice}>{formatRupeeFull(basePrice)}</Text>
              </View>
              <View style={styles.itemLinks}>
                {(service.options?.length ?? 0) > 0 ? (
                  <Pressable onPress={() => appPush(sharedRoutes.service(service.id))} hitSlop={6} accessibilityRole="link">
                    <Text style={styles.linkStrong}>Edit package</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => appPush(customerRoutes.services)} hitSlop={6} style={styles.addMore} accessibilityRole="link">
                  <Plus size={15} color={ui.brand} strokeWidth={2.6} />
                  <Text style={styles.link}>Add more services</Text>
                </Pressable>
              </View>
            </Card>
          </FadeSlideIn>

          <FadeSlideIn delay={stagger(1)} slideFrom={14}>
            <Card>
              <CartRow
                icon={BadgePercent}
                title={couponApplied ? `${coupon.trim().toUpperCase()} applied` : 'Coupons and offers'}
                sub={couponApplied ? `You save ${formatRupeeFull(pricing.coupon)}` : activeOffers.length > 0 ? `${activeOffers.length} available` : undefined}
                action={couponApplied ? 'Change' : 'View all'}
                onPress={() => setSheet('coupon')}
                last
              />
            </Card>
          </FadeSlideIn>

          <FadeSlideIn delay={stagger(2)} slideFrom={14}>
            <Card>
              <CartRow
                icon={Phone}
                title={contactLine || 'Add your contact details'}
                action="Change"
                onPress={() => appPush(customerRoutes.settings)}
              />
              <CartRow
                icon={Building2}
                title={propertyType ? propertyTypeLabel(propertyType) : 'Select property type'}
                sub={propertyType ? 'Property type' : 'Helps the technician bring the right treatment'}
                action={propertyType ? 'Change' : undefined}
                onPress={() => setSheet('property')}
                missing={!propertyType}
              />
              <CartRow
                icon={CreditCard}
                title={paymentMethod ? paymentMethodLabel(paymentMethod) : 'Choose payment method'}
                sub="Payment"
                action="Change"
                onPress={() => setSheet('payment')}
                missing={!paymentMethod}
              />
              <CartRow
                icon={Camera}
                title={photoUris.length ? `${photoUris.length} photo${photoUris.length === 1 ? '' : 's'} added` : 'Add photos of the problem'}
                sub={photoUris.length ? undefined : 'Optional — helps us prepare'}
                action={photoUris.length ? 'Edit' : 'Add'}
                onPress={() => setSheet('photos')}
                last
              />
            </Card>
          </FadeSlideIn>

          <FadeSlideIn delay={stagger(3)} slideFrom={14}>
            <Card>
              <Pressable
                onPress={() => setBillOpen((v) => !v)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{ expanded: billOpen }}
              >
                <ReceiptText size={20} color={ui.text} strokeWidth={2} />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>Total bill {formatRupeeFull(pricing.total)}</Text>
                  <Text style={styles.rowSub}>Incl. GST{pricing.coupon > 0 ? ` · saved ${formatRupeeFull(pricing.coupon)}` : ''}</Text>
                </View>
                {billOpen ? <ChevronUp size={18} color={ui.textTertiary} /> : <ChevronDown size={18} color={ui.textTertiary} />}
              </Pressable>
              {billOpen ? (
                <View style={styles.bill}>
                  <BookBillSummary amount={pricing} />
                </View>
              ) : null}
            </Card>
          </FadeSlideIn>

          <FadeSlideIn delay={stagger(4)} slideFrom={14}>
            <View style={styles.policy}>
              <Text style={styles.policyTitle}>Cancellation & reschedule policy</Text>
              <Text style={styles.policyText}>{bookingCopy.wizardCancellationNote}</Text>
              <Text style={[styles.policyTitle, styles.policyGap]}>{bookingCopy.wizardNextStepsTitle}</Text>
              <Text style={styles.policyText}>{bookingCopy.pendingReviewNote}</Text>
              <Pressable onPress={() => appPush(customerRoutes.terms)} hitSlop={6} accessibilityRole="link">
                <Text style={styles.linkUnderline}>Read full policy</Text>
              </Pressable>
            </View>
          </FadeSlideIn>
        </ScrollView>

        {/* Address + slot ride above the button, like a real checkout. */}
        <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {addressReady ? (
            <Pressable style={styles.bottomRow} onPress={() => setSheet('address')} accessibilityRole="button">
              <House size={17} color={ui.text} strokeWidth={2} />
              <Text style={styles.bottomText} numberOfLines={1}>
                <Text style={styles.bottomStrong}>{savedAddress?.label || addressForm.saveAs || 'Address'}</Text>
                {' - '}
                {addressSummary}
              </Text>
              <Pencil size={15} color={ui.textSecondary} strokeWidth={2} />
            </Pressable>
          ) : null}
          {slotConfirmed ? (
            <Pressable style={styles.bottomRow} onPress={() => setSheet('slot')} accessibilityRole="button">
              <Clock3 size={17} color={ui.text} strokeWidth={2} />
              <Text style={styles.bottomText} numberOfLines={1}>
                {scheduleSummary}
              </Text>
              <Pencil size={15} color={ui.textSecondary} strokeWidth={2} />
            </Pressable>
          ) : null}
          <Button title={nextStep.label} variant="premium" onPress={nextStep.run} loading={loading} />
          <Text style={styles.terms}>
            By proceeding, you agree to our{' '}
            <Text style={styles.termsLink} onPress={() => appPush(customerRoutes.terms)}>
              T&C
            </Text>{' '}
            and{' '}
            <Text style={styles.termsLink} onPress={() => appPush(customerRoutes.privacy)}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </SafeAreaView>

      <BottomSheet
        visible={sheet === 'slot'}
        onClose={() => setSheet(null)}
        title="When should the professional arrive?"
        hint={`Service will take approx. ${duration}`}
        footer={
          <Button
            title="Confirm slot"
            variant="premium"
            onPress={() => {
              if (!scheduleValid()) return;
              setSlotConfirmed(true);
              setSheet(null);
            }}
          />
        }
      >
        <ScheduleDayPicker selectedDate={date} onSelect={(d) => setDate(d)} />
        <View style={styles.sheetGap}>
          <ScheduleModeToggle
            mode={scheduleMode}
            onChange={setScheduleMode}
            standardLabel={bookingCopy.standardModeLabel}
            customLabel={bookingCopy.customModeLabel}
          />
        </View>
        <View style={styles.sheetGap}>
          {scheduleMode === 'standard' ? (
            <ScheduleSlotPicker selectedSlot={slot} onSelect={setSlot} date={date} />
          ) : (
            <>
              <BookTimePicker
                hour={customHour}
                minute={customMinute}
                date={date}
                onChange={(h, m) => {
                  setCustomHour(h);
                  setCustomMinute(m);
                }}
              />
              <View style={styles.sheetGap}>
                <Input
                  label={bookingCopy.wizardNotesLabel}
                  value={scheduleNotes}
                  onChangeText={setScheduleNotes}
                  placeholder={bookingCopy.customNotesPlaceholder}
                />
              </View>
            </>
          )}
        </View>
      </BottomSheet>

      <BottomSheet
        visible={sheet === 'address'}
        onClose={() => setSheet(null)}
        title="Saved address"
        footer={
          <Button
            title="Use this address"
            variant="premium"
            onPress={() => {
              if (!addressReady) {
                Toast.show({ type: 'error', text1: 'Add house/flat, street, and city — or pick a saved place' });
                return;
              }
              setSheet(null);
            }}
          />
        }
      >
        {addresses.map((a) => (
          <AddressCard
            key={a.id}
            address={a}
            selected={selectedAddressId === a.id}
            onPress={() => {
              setSelectedAddressId(a.id);
              setShowNewAddress(false);
            }}
          />
        ))}
        {showNewAddress || addresses.length === 0 ? (
          <View style={styles.sheetGap}>
            <AddressLocateButton loading={locating} onPress={() => void fillAddressFromLocation()} />
            <View style={styles.sheetGap}>
              <AddressDetailsForm
                value={addressForm}
                onChange={(next) => {
                  setSelectedAddressId(null);
                  setAddressForm(next);
                }}
              />
            </View>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.addAddress, pressed && styles.pressed]}
            onPress={() => {
              setSelectedAddressId(null);
              setShowNewAddress(true);
            }}
            accessibilityRole="button"
          >
            <Plus size={17} color={ui.brand} strokeWidth={2.6} />
            <Text style={styles.link}>Add another address</Text>
          </Pressable>
        )}
      </BottomSheet>

      <BottomSheet
        visible={sheet === 'property'}
        onClose={() => setSheet(null)}
        title={bookingCopy.wizardPropertyTitle}
        hint={bookingCopy.wizardPropertySubtitle}
        footer={<Button title="Done" variant="premium" disabled={!propertyType} onPress={() => setSheet(null)} />}
      >
        <PropertyTypePicker value={propertyType} onChange={setPropertyType} />
      </BottomSheet>

      <BottomSheet
        visible={sheet === 'payment'}
        onClose={() => setSheet(null)}
        title={bookingCopy.wizardPaymentTitle}
        footer={<Button title="Done" variant="premium" disabled={!paymentMethod} onPress={() => setSheet(null)} />}
      >
        <BookPaymentPicker
          methods={paymentMethods}
          selected={paymentMethod}
          onSelect={setPaymentMethod}
          showManageLink={hasSavedPaymentMethods}
        />
      </BottomSheet>

      <BottomSheet
        visible={sheet === 'coupon'}
        onClose={() => setSheet(null)}
        title="Coupons and offers"
        footer={<Button title="Done" variant="premium" disabled={couponInvalid} onPress={() => setSheet(null)} />}
      >
        {activeOffers.length > 0 ? (
          <View style={styles.sheetBottomGap}>
            <BookOfferList offers={activeOffers} appliedCode={coupon} onApply={setCoupon} />
          </View>
        ) : null}
        <PaymentCouponField value={coupon} onChangeText={setCoupon} invalid={couponInvalid} applied={couponApplied} />
      </BottomSheet>

      <BottomSheet
        visible={sheet === 'photos'}
        onClose={() => setSheet(null)}
        title={bookingCopy.wizardPhotosTitle}
        hint={bookingCopy.wizardPhotosSubtitle}
        footer={<Button title="Done" variant="premium" onPress={() => setSheet(null)} />}
      >
        <AddressPhotoGrid photos={photoUris} onChange={setPhotoUris} max={6} />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ui.surfaceMuted },
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.7 },
  content: { padding: spacing.md, gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ui.hairline,
    overflow: 'hidden',
    ...ui.shadow,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  itemArt: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontFamily: fonts.bodyBold, fontSize: 15.5, lineHeight: 21, color: ui.text },
  itemMeta: { marginTop: 3, fontFamily: fonts.bodyMedium, fontSize: 13, color: ui.textSecondary },
  itemPrice: { fontFamily: fonts.bodyBold, fontSize: 16, color: ui.text },
  itemLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  addMore: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  link: { fontFamily: fonts.bodySemi, fontSize: 14, color: ui.brand },
  linkStrong: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.text, textDecorationLine: 'underline' },
  linkUnderline: { marginTop: 10, fontFamily: fonts.bodySemi, fontSize: 13.5, color: ui.text, textDecorationLine: 'underline' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 15 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.border },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: fonts.bodySemi, fontSize: 15, color: ui.text },
  rowTitleMissing: { color: ui.brand },
  rowSub: { marginTop: 2, fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  rowAction: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.brand },
  bill: { paddingHorizontal: 14, paddingBottom: 14 },
  policy: { paddingHorizontal: 4, paddingTop: 6 },
  policyTitle: { fontFamily: fonts.displaySemi, fontSize: 17, letterSpacing: -0.3, color: ui.text },
  policyGap: { marginTop: 16 },
  policyText: { marginTop: 6, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: ui.textSecondary },
  bottom: {
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    gap: 10,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  bottomText: { flex: 1, fontFamily: fonts.body, fontSize: 13.5, color: ui.textSecondary },
  bottomStrong: { fontFamily: fonts.bodyBold, color: ui.text },
  terms: { textAlign: 'center', fontFamily: fonts.body, fontSize: 11.5, color: ui.textTertiary },
  termsLink: { fontFamily: fonts.bodySemi, color: ui.textSecondary, textDecorationLine: 'underline' },
  sheetGap: { marginTop: 16 },
  sheetBottomGap: { marginBottom: 14 },
  addAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
  },
});

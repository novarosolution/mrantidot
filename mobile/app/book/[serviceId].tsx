import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgePercent, Building2, Camera, ChevronDown, Clock3, CreditCard, House, Pencil, Phone, Plus, ReceiptText, Users } from 'lucide-react-native';
import { paramString } from '@/lib/routeParams';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { EMPTY_ADDRESS_FORM, addressFormValid, composeAddressLine, composeStreetLine } from '@/components/kit/AddressDetailsForm';
import { AddressPhotoGrid } from '@/components/kit/AddressPhotoGrid';
import { BookBillSummary } from '@/components/kit/BookFlowKit';
import { BookProgress } from '@/components/kit/BookProgress';
import {
  CartAddressSheet,
  CartContactSheet,
  CartCouponSheet,
  CartSlotSheet,
  EMPTY_CART_ADDRESS,
  scheduleProblem,
  scheduleTime,
  type CartAddress,
  type CartContact,
  type CartSchedule,
} from '@/components/kit/CartSheets';
import { ListActionRow, ListGroup } from '@/components/kit/ListGroup';
import { PropertyTypePicker } from '@/components/kit/PropertyTypePicker';
import { BookPaymentPicker } from '@/components/kit/BookPaymentPicker';
import { ServiceThumb } from '@/components/kit/ServiceThumb';
import { formatRupeeFull } from '@/components/kit/format';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { getReducedMotion } from '@/lib/a11yPrefs';
import { haptic, motion, shakeAnimation, stagger } from '@/lib/motion';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useBusinessSettings } from '@/lib/businessSettings';
import { activePaymentMethods, paymentLabel } from '@/lib/settingsLabels';
import { defaultPaymentType, resolvePaymentMethods } from '@/lib/bookingPayment';
import { computePricing } from '@/lib/pricing';
import { useBookingCopy } from '@/lib/schedule-copy';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { fillCopy } from '@/constants/customerUiCopy';
import { formatPhoneDisplay } from '@/lib/profile-display';
import { findOption, formatDuration, serviceDurationMins, servicePriceFor } from '@/lib/serviceDisplay';
import { safeGoBack, customerRoutes, sharedRoutes, appPush, appReplace } from '@/lib/routes';
import { uploadImages, type PickedImage } from '@/lib/upload';
import { appToast } from '@/lib/toast';
import {
  DEFAULT_BOOKING_SLOT,
  firstBookableSlot,
  formatBookableDate,
  formatSlotShort12h,
  formatTime12h,
  isSlotBookable,
  localDateKey,
} from '@/lib/dates';
import type { Offer, PaymentMethodRecord, PropertyTypeKey, SavedAddress, Service } from '@/types/api';
import { isPropertyTypeKey, propertyTypeLabel } from '@/constants/propertyTypes';
import { colors, radii, spacing, typeScale, ui } from '@/constants/theme';
import { CartSkeleton } from '@/components/kit/ScreenSkeletons';
import { firstOpenSlot } from '@/components/kit/ScheduleSlotPicker';

type Sheet = 'slot' | 'address' | 'property' | 'payment' | 'coupon' | 'photos' | 'contact' | null;
type Step = 'address' | 'slot' | 'property' | 'payment';

function initialSchedule(): CartSchedule {
  const first = firstBookableSlot();
  return {
    mode: 'standard',
    date: first?.date ?? localDateKey(),
    slot: first?.slot ?? DEFAULT_BOOKING_SLOT,
    hour: 10,
    minute: 0,
    notes: '',
  };
}

export default function BookCartScreen() {
  const bookingCopy = useBookingCopy();
  const copy = useCustomerUiCopy();
  const settings = useBusinessSettings();
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
  const [schedule, setSchedule] = useState<CartSchedule>(initialSchedule);
  const [slotConfirmed, setSlotConfirmed] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [address, setAddress] = useState<CartAddress>(EMPTY_CART_ADDRESS);
  const [propertyType, setPropertyType] = useState<PropertyTypeKey | null>(null);
  /** null = booking for myself; otherwise the person the technician should call at the property. */
  const [contact, setContact] = useState<CartContact>(null);
  const [coupon, setCoupon] = useState(couponParam ?? '');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [photoUris, setPhotoUris] = useState<PickedImage[]>([]);
  const [billOpen, setBillOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSavedPaymentMethods, setHasSavedPaymentMethods] = useState(false);
  /** Steps whose sheet was already opened once and closed without finishing. */
  const prompted = useRef(new Set<Step>());
  const ctaShake = useRef(new Animated.Value(0)).current;
  const billTurn = useRef(new Animated.Value(0)).current;

  const loadData = async (skipCache = false) => {
    if (!serviceId) {
      setLoadError(copy.serviceInvalidLink);
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
      setAddress((prev) =>
        prev.savedId || addressFormValid(prev.form)
          ? prev
          : { ...prev, savedId: list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? null },
      );
    }

    const pay = results[2];
    const saved = pay.status === 'fulfilled' ? pay.value.data.paymentMethods : [];
    setHasSavedPaymentMethods(saved.length > 0);
    setPaymentMethods(saved);
    // The customer's default, as long as the admin still offers it; otherwise the first offered method.
    const offered = activePaymentMethods().map((m) => m.key);
    const preferred = defaultPaymentType(resolvePaymentMethods(saved));
    setPaymentMethod(offered.includes(preferred) ? preferred : (offered[0] ?? null));

    const off = results[3];
    if (off.status === 'fulfilled') setOffers(off.value.data.offers);
  };

  useEffect(() => {
    safeAsync(async () => {
      try {
        await loadData();
      } catch (err) {
        setLoadError(getApiErrorMessage(err, copy.cartLoadFailed));
      }
    });
    // Load once per service; copy changes must not refetch.
  }, [serviceId]);

  useEffect(() => {
    if (couponParam) setCoupon(couponParam);
  }, [couponParam]);

  // A window that can no longer be booked (time passed, lead time) moves to the next open one.
  useEffect(() => {
    if (schedule.mode !== 'standard' || isSlotBookable(schedule.date, schedule.slot, settings)) return;
    const next = firstOpenSlot(schedule.date, 'bookable');
    if (next) {
      setSchedule((s) => ({ ...s, slot: next }));
      return;
    }
    const first = firstBookableSlot(settings);
    if (first && first.date !== schedule.date) setSchedule((s) => ({ ...s, date: first.date, slot: first.slot }));
  }, [schedule.date, schedule.slot, schedule.mode, settings]);

  // A home-size package ("2 BHK") already answers the property question — pre-pick it, still changeable.
  // Wait for the service so an unknown size key (old link) can't pre-pick a property that the
  // package — which falls back to the first size — doesn't match.
  useEffect(() => {
    if (!service || propertyType) return;
    const picked = findOption(service, optionKey);
    if (!picked) return;
    const guess = picked.key.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (isPropertyTypeKey(guess)) setPropertyType(guess);
  }, [service, optionKey, propertyType]);

  const option = service ? findOption(service, optionKey) : undefined;
  const basePrice = service ? servicePriceFor(service, optionKey) : 0;
  const gst = settings.tax.gstPercent;
  const pricing = useMemo(
    () => (service ? computePricing(basePrice, coupon, offers, gst) : null),
    [service, basePrice, coupon, offers, gst],
  );
  const couponApplied = coupon.trim().length > 0 && (pricing?.coupon ?? 0) > 0;
  const scheduleSummary =
    schedule.mode === 'standard'
      ? `${formatBookableDate(schedule.date)} · ${formatSlotShort12h(schedule.slot)}`
      : `${formatBookableDate(schedule.date)} · ${formatTime12h(scheduleTime(schedule))}`;

  const savedAddress = addresses.find((a) => a.id === address.savedId);
  const typedAddress = useMemo(() => composeAddressLine(address.form, copy), [address.form, copy]);
  const addressReady = Boolean(savedAddress) || addressFormValid(address.form);
  const addressSummary = savedAddress
    ? [savedAddress.line1, savedAddress.city, savedAddress.pincode].filter(Boolean).join(', ')
    : typedAddress.trim();
  const paymentOffered = paymentMethod ? activePaymentMethods(settings).some((m) => m.key === paymentMethod) : false;

  /** Opens a step's sheet; a step the customer already skipped once gets a shake + warning first. */
  function openStep(step: Step) {
    if (prompted.current.has(step)) {
      haptic('warning');
      if (!getReducedMotion()) shakeAnimation(ctaShake).start();
    } else {
      haptic('tap');
    }
    prompted.current.add(step);
    setSheet(step);
  }

  /** The bar's one button walks the customer through whatever is still missing, then submits. */
  const nextStep: { label: string; run: () => void } = !addressReady
    ? { label: copy.cartStepAddress, run: () => openStep('address') }
    : !slotConfirmed
      ? { label: copy.cartStepSlot, run: () => openStep('slot') }
      : !propertyType
        ? { label: copy.cartStepProperty, run: () => openStep('property') }
        : !paymentOffered
          ? { label: copy.cartStepPayment, run: () => openStep('payment') }
          : { label: bookingCopy.wizardSubmitButton, run: () => void confirm() };

  function toggleBill() {
    if (!getReducedMotion()) {
      LayoutAnimation.configureNext(LayoutAnimation.create(motion.duration.base, 'easeInEaseOut', 'opacity'));
      Animated.timing(billTurn, { toValue: billOpen ? 0 : 1, duration: motion.duration.base, useNativeDriver: true }).start();
    } else {
      billTurn.setValue(billOpen ? 0 : 1);
    }
    haptic('select');
    setBillOpen((v) => !v);
  }

  async function confirm() {
    if (!service || !pricing) return;
    const problem = scheduleProblem(schedule, settings, copy);
    if (problem) {
      haptic('warning');
      appToast.warning(problem);
      setSlotConfirmed(false);
      setSheet('slot');
      return;
    }
    if (!addressReady || !propertyType || !paymentMethod) return;
    if (coupon.trim() && !couponApplied) {
      haptic('warning');
      appToast.warning(copy.couponInvalid);
      setSheet('coupon');
      return;
    }
    haptic('tap');
    setLoading(true);
    try {
      const problemPhotos = photoUris.length > 0 ? await uploadImages(photoUris) : [];
      const notes = schedule.notes.trim() || undefined;
      const scheduleRequest =
        schedule.mode === 'standard'
          ? { date: schedule.date, slot: schedule.slot, notes }
          : { date: schedule.date, time: scheduleTime(schedule), notes };

      let addressId = savedAddress?.id ?? null;
      if (!addressId && addressFormValid(address.form)) {
        try {
          const saved = await api.post<{ address: SavedAddress }>('/addresses', {
            label: address.form.saveAs,
            line1: composeStreetLine(address.form, copy),
            city: address.form.city.trim(),
            pincode: address.form.pincode.trim() || undefined,
            isDefault: addresses.length === 0,
          });
          addressId = saved.data.address.id;
          setAddresses((prev) => [...prev, saved.data.address]);
          setAddress({ savedId: addressId, form: EMPTY_ADDRESS_FORM });
        } catch {
          appToast.info(copy.cartAddressNotSaved, copy.cartAddressNotSavedSub);
        }
      }

      const { data } = await api.post<{ booking: { id: string; amount?: { total?: number } } }>('/bookings', {
        serviceId: service.id,
        scheduleMode: schedule.mode,
        scheduleRequest,
        propertyType,
        ...(contact ? { visitContact: contact } : {}),
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
          payment: paymentLabel(paymentMethod, settings),
          ...(contact ? { forName: contact.name } : {}),
        },
      });
    } catch (err) {
      haptic('error');
      appToast.error(getApiErrorMessage(err, copy.cartBookFailed));
    } finally {
      setLoading(false);
    }
  }

  // White premium header — it sets dark status-bar glyphs itself.
  const header = (
    <CustomerPageHeader
      variant="premium"
      title={copy.cartTitle}
      subtitle={service?.name}
      showBack
      onBack={() => safeGoBack(customerRoutes.services)}
    />
  );

  if (loadError) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.flex} edges={['left', 'right']}>
          {header}
          <ListEmptyRetry message={loadError} onRetry={() => safeAsync(() => loadData(true), undefined, (msg) => setLoadError(msg))} />
        </SafeAreaView>
      </View>
    );
  }

  if (!service || !pricing) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.flex} edges={['left', 'right']}>
          {header}
          <CartSkeleton />
        </SafeAreaView>
      </View>
    );
  }

  const duration = formatDuration(serviceDurationMins(service));
  const activeOffers = offers.filter((o) => o.active);
  const contactLine = [user?.name?.trim(), formatPhoneDisplay(user?.phone)].filter(Boolean).join(', ');
  const billRotate = billTurn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['left', 'right']}>
        {header}

        <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FadeSlideIn delay={stagger(0)}>
            <BookProgress
              steps={[
                { key: 'address', label: copy.cartProgressAddress, done: addressReady, onPress: () => openStep('address') },
                { key: 'slot', label: copy.cartProgressTime, done: slotConfirmed, onPress: () => openStep('slot') },
                { key: 'property', label: copy.cartProgressProperty, done: Boolean(propertyType), onPress: () => openStep('property') },
                { key: 'payment', label: copy.cartProgressPayment, done: paymentOffered, onPress: () => openStep('payment') },
              ]}
            />
          </FadeSlideIn>

          {/* The service in the cart, with its size and a way back to change it. */}
          <FadeSlideIn delay={stagger(1)}>
            <View style={styles.card}>
              <View style={styles.item}>
                {/* Same picture as the catalog row and booking cards (the admin's icon, or the cover photo). */}
                <ServiceThumb service={service} width={64} radius={radii.control} iconSize={52} />
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
                  <Pressable
                    onPress={() => appPush(sharedRoutes.service(service.id))}
                    hitSlop={12}
                    style={styles.linkHit}
                    accessibilityRole="link"
                  >
                    <Text style={styles.linkStrong}>{copy.cartEditPackage}</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => appPush(customerRoutes.services)}
                  hitSlop={12}
                  style={[styles.linkHit, styles.addMore]}
                  accessibilityRole="link"
                >
                  <Plus size={15} color={ui.brand} strokeWidth={2.6} />
                  <Text style={styles.link}>{copy.cartAddMore}</Text>
                </Pressable>
              </View>
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={stagger(1)}>
            <ListGroup dividerInset={50}>
              <ListActionRow
                icon={BadgePercent}
                title={couponApplied ? fillCopy(copy.cartCouponApplied, { code: coupon.trim().toUpperCase() }) : copy.cartCouponsTitle}
                sub={
                  couponApplied
                    ? fillCopy(copy.cartCouponSaved, { amount: formatRupeeFull(pricing.coupon) })
                    : activeOffers.length > 0
                      ? fillCopy(copy.cartCouponsAvailable, { count: activeOffers.length })
                      : undefined
                }
                action={couponApplied ? copy.cartChange : copy.cartViewAll}
                onPress={() => setSheet('coupon')}
              />
            </ListGroup>
          </FadeSlideIn>

          <FadeSlideIn delay={stagger(2)}>
            <ListGroup dividerInset={50}>
              <ListActionRow
                icon={contact ? Users : Phone}
                title={contact ? `${contact.name}, ${formatPhoneDisplay(contact.phone)}` : contactLine || copy.cartContactMissing}
                sub={contact ? copy.cartForRowSub : copy.cartForMe}
                action={copy.cartChange}
                onPress={() => setSheet('contact')}
              />
              <ListActionRow
                icon={Building2}
                title={propertyType ? propertyTypeLabel(propertyType) : copy.cartPropertyMissing}
                sub={propertyType ? copy.cartPropertyLabel : copy.cartPropertyHint}
                action={propertyType ? copy.cartChange : undefined}
                onPress={() => setSheet('property')}
                missing={!propertyType}
              />
              <ListActionRow
                icon={CreditCard}
                title={paymentOffered ? paymentLabel(paymentMethod, settings) : copy.cartPaymentMissing}
                sub={copy.cartPaymentLabel}
                action={copy.cartChange}
                onPress={() => setSheet('payment')}
                missing={!paymentOffered}
              />
              <ListActionRow
                icon={Camera}
                title={photoUris.length ? fillCopy(copy.cartPhotosAdded, { count: photoUris.length }) : copy.cartPhotosMissing}
                sub={photoUris.length ? undefined : copy.cartPhotosHint}
                action={photoUris.length ? copy.cartEdit : copy.cartAdd}
                onPress={() => setSheet('photos')}
              />
            </ListGroup>
          </FadeSlideIn>

          <FadeSlideIn delay={stagger(3)}>
            <View style={styles.card}>
              <PressableScale
                onPress={toggleBill}
                scaleTo={0.985}
                style={styles.billHead}
                accessibilityRole="button"
                accessibilityState={{ expanded: billOpen }}
              >
                <ReceiptText size={20} color={ui.text} strokeWidth={2} />
                <View style={styles.flex}>
                  <Text style={styles.billTitle}>{fillCopy(copy.cartTotalLabel, { amount: formatRupeeFull(pricing.total) })}</Text>
                  <Text style={styles.billSub}>
                    {copy.cartGstNote}
                    {pricing.coupon > 0 ? ` · ${fillCopy(copy.cartSavedNote, { amount: formatRupeeFull(pricing.coupon) })}` : ''}
                  </Text>
                </View>
                <Animated.View style={{ transform: [{ rotate: billRotate }] }}>
                  <ChevronDown size={18} color={ui.textTertiary} />
                </Animated.View>
              </PressableScale>
              {billOpen ? (
                <View style={styles.bill}>
                  <BookBillSummary amount={pricing} gstPercent={gst} />
                </View>
              ) : null}
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={stagger(4)}>
            <View style={styles.policy}>
              <Text style={styles.policyTitle} accessibilityRole="header">
                {copy.cartPolicyTitle}
              </Text>
              <Text style={styles.policyText}>{bookingCopy.wizardCancellationNote}</Text>
              <Text style={[styles.policyTitle, styles.policyGap]} accessibilityRole="header">
                {bookingCopy.wizardNextStepsTitle}
              </Text>
              <Text style={styles.policyText}>{bookingCopy.pendingReviewNote}</Text>
              <Pressable onPress={() => appPush(customerRoutes.terms)} hitSlop={12} style={styles.linkHit} accessibilityRole="link">
                <Text style={styles.linkUnderline}>{copy.cartReadPolicy}</Text>
              </Pressable>
            </View>
          </FadeSlideIn>
        </ScrollView>

        {/* Address + slot ride above the button, like a real checkout. */}
        <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {addressReady ? (
            <PressableScale scaleTo={0.985} style={styles.bottomRow} onPress={() => setSheet('address')} accessibilityRole="button">
              <House size={17} color={ui.text} strokeWidth={2} />
              <Text style={styles.bottomText} numberOfLines={1}>
                <Text style={styles.bottomStrong}>{savedAddress?.label || address.form.saveAs || copy.cartAddressFallback}</Text>
                {' - '}
                {addressSummary}
              </Text>
              <Pencil size={15} color={ui.textSecondary} strokeWidth={2} />
            </PressableScale>
          ) : null}
          {slotConfirmed ? (
            <PressableScale scaleTo={0.985} style={styles.bottomRow} onPress={() => setSheet('slot')} accessibilityRole="button">
              <Clock3 size={17} color={ui.text} strokeWidth={2} />
              <Text style={styles.bottomText} numberOfLines={1}>
                {scheduleSummary}
              </Text>
              <Pencil size={15} color={ui.textSecondary} strokeWidth={2} />
            </PressableScale>
          ) : null}
          {/* Total rides beside the button, so the price never scrolls out of sight. */}
          <View style={styles.ctaRow}>
            <View style={styles.ctaTotal}>
              <Text style={styles.ctaTotalValue} numberOfLines={1}>
                {formatRupeeFull(pricing.total)}
              </Text>
              <Text style={styles.ctaTotalSub} numberOfLines={1}>
                {pricing.coupon > 0 ? fillCopy(copy.cartSavedNote, { amount: formatRupeeFull(pricing.coupon) }) : copy.cartGstNote}
              </Text>
            </View>
            <Animated.View style={[styles.ctaButton, { transform: [{ translateX: ctaShake }] }]}>
              <Button title={nextStep.label} variant="premium" onPress={nextStep.run} loading={loading} />
            </Animated.View>
          </View>
          <Text style={styles.terms}>
            {copy.cartTermsLine.split(/(\{terms\}|\{privacy\})/).map((part, i) =>
              part === '{terms}' ? (
                <Text key={i} style={styles.termsLink} onPress={() => appPush(customerRoutes.terms)} suppressHighlighting>
                  {copy.cartTermsLink}
                </Text>
              ) : part === '{privacy}' ? (
                <Text key={i} style={styles.termsLink} onPress={() => appPush(customerRoutes.privacy)} suppressHighlighting>
                  {copy.cartPrivacyLink}
                </Text>
              ) : (
                part
              ),
            )}
          </Text>
        </View>
      </SafeAreaView>

      <CartSlotSheet
        visible={sheet === 'slot'}
        onClose={() => setSheet(null)}
        value={schedule}
        durationLabel={duration}
        onCommit={(next) => {
          setSchedule(next);
          setSlotConfirmed(true);
          setSheet(null);
        }}
      />

      <CartContactSheet
        visible={sheet === 'contact'}
        onClose={() => setSheet(null)}
        value={contact}
        onCommit={(next) => {
          setContact(next);
          setSheet(null);
        }}
      />

      <CartAddressSheet
        visible={sheet === 'address'}
        onClose={() => setSheet(null)}
        addresses={addresses}
        value={address}
        location={location}
        locating={locating}
        detectAddress={detectAddress}
        onCommit={(next) => {
          setAddress(next);
          setSheet(null);
        }}
      />

      <BottomSheet
        visible={sheet === 'property'}
        onClose={() => setSheet(null)}
        title={bookingCopy.wizardPropertyTitle}
        hint={bookingCopy.wizardPropertySubtitle}
        footer={<Button title={copy.cartDone} variant="premium" disabled={!propertyType} onPress={() => setSheet(null)} />}
      >
        <PropertyTypePicker value={propertyType} onChange={setPropertyType} />
      </BottomSheet>

      <BottomSheet
        visible={sheet === 'payment'}
        onClose={() => setSheet(null)}
        title={bookingCopy.wizardPaymentTitle}
        footer={<Button title={copy.cartDone} variant="premium" disabled={!paymentOffered} onPress={() => setSheet(null)} />}
      >
        <BookPaymentPicker
          methods={paymentMethods}
          selected={paymentMethod}
          onSelect={setPaymentMethod}
          showManageLink={hasSavedPaymentMethods}
        />
      </BottomSheet>

      <CartCouponSheet
        visible={sheet === 'coupon'}
        onClose={() => setSheet(null)}
        offers={activeOffers}
        value={coupon}
        basePrice={basePrice}
        onCommit={(code) => {
          setCoupon(code);
          setSheet(null);
        }}
      />

      <BottomSheet
        visible={sheet === 'photos'}
        onClose={() => setSheet(null)}
        title={bookingCopy.wizardPhotosTitle}
        hint={bookingCopy.wizardPhotosSubtitle}
        footer={<Button title={copy.cartDone} variant="premium" onPress={() => setSheet(null)} />}
      >
        <AddressPhotoGrid photos={photoUris} onChange={setPhotoUris} max={6} />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ui.canvas },
  flex: { flex: 1, minWidth: 0 },
  content: { padding: spacing.md, gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: ui.hairline,
    overflow: 'hidden',
    ...ui.shadow,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  itemName: { ...typeScale.rowTitleLg, color: ui.text },
  itemMeta: { ...typeScale.caption, marginTop: 3, color: ui.textSecondary },
  itemPrice: { ...typeScale.price, color: ui.text },
  itemLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  linkHit: { minHeight: 44, justifyContent: 'center' },
  addMore: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  link: { ...typeScale.bodyStrong, color: ui.brand },
  linkStrong: { ...typeScale.bodyStrong, fontFamily: typeScale.button.fontFamily, color: ui.text, textDecorationLine: 'underline' },
  linkUnderline: { ...typeScale.captionStrong, color: ui.text, textDecorationLine: 'underline' },
  billHead: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 16, minHeight: 60 },
  billTitle: { ...typeScale.rowTitle, color: ui.text },
  billSub: { ...typeScale.caption, fontSize: 12.5, marginTop: 2, color: ui.textSecondary },
  bill: { paddingHorizontal: 14, paddingBottom: 14 },
  policy: { paddingHorizontal: 4, paddingTop: 6 },
  policyTitle: { ...typeScale.section, fontSize: 17, lineHeight: 23, color: ui.text },
  policyGap: { marginTop: 16 },
  policyText: { ...typeScale.caption, marginTop: 6, lineHeight: 20, color: ui.textSecondary },
  bottom: {
    paddingHorizontal: spacing.md,
    paddingTop: 6,
    gap: 6,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 4 },
  ctaTotal: { minWidth: 92 },
  ctaTotalValue: { ...typeScale.price, fontSize: 22, lineHeight: 28, color: ui.text },
  ctaTotalSub: { ...typeScale.caption, fontSize: 12, marginTop: 1, color: ui.textSecondary },
  ctaButton: { flex: 1 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  bottomText: { ...typeScale.caption, flex: 1, color: ui.textSecondary },
  bottomStrong: { fontFamily: typeScale.button.fontFamily, color: ui.text },
  terms: { ...typeScale.micro, fontFamily: typeScale.caption.fontFamily, textAlign: 'center', color: ui.textTertiary, marginTop: 4 },
  termsLink: { fontFamily: typeScale.captionStrong.fontFamily, color: ui.textSecondary, textDecorationLine: 'underline' },
});

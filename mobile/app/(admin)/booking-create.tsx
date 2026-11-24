import { useLocalSearchParams } from 'expo-router';
import { CalendarClock, ChevronRight, MapPin, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AddressDetailsForm, EMPTY_ADDRESS_FORM, addressFormValid, composeAddressLine, type AddressFormValues } from '@/components/kit/AddressDetailsForm';
import { AdminListShell, AdminSectionTitle, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminFormCard, AdminSearchField } from '@/components/kit/AdminPageKit';
import { BookBillSummary } from '@/components/kit/BookFlowKit';
import { CartSlotSheet, scheduleProblem, scheduleTime, type CartSchedule } from '@/components/kit/CartSheets';
import { firstOpenSlot } from '@/components/kit/ScheduleSlotPicker';
import { formatRupeeFull } from '@/components/kit/format';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { useBusinessSettings } from '@/lib/businessSettings';
import { confirmAsync } from '@/lib/confirm';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import {
  DEFAULT_BOOKING_SLOT,
  firstBookableSlot,
  formatBookableDate,
  formatSlotShort12h,
  formatTime12h,
  isSlotBookable,
  localDateKey,
} from '@/lib/dates';
import { haptic } from '@/lib/motion';
import { computePricing } from '@/lib/pricing';
import { paramString } from '@/lib/routeParams';
import { adminRoutes, appReplace } from '@/lib/routes';
import { findOption, formatDuration, serviceDurationMins, servicePriceFor } from '@/lib/serviceDisplay';
import { activePaymentMethods, activePropertyTypes, paymentLabel, propertyLabel } from '@/lib/settingsLabels';
import { BOOKING_NOTE_MAX, type AdminUserSearchResult } from '@/types/adminOps';
import type { Booking, Offer, PropertyTypeKey, SavedAddress, Service, User } from '@/types/api';
import { colors, fonts, radii, spacing, ui } from '@/constants/theme';

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

const PHONE = /^[0-9]{10}$/;

function addressLine(a: SavedAddress): string {
  return [a.line1, a.city, a.pincode].filter(Boolean).join(', ');
}

/** Numbered step heading inside the form. */
function StepTitle({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return <AdminSectionTitle title={`${n}. ${title}`} hint={hint} />;
}

function SelectRow({
  title,
  subtitle,
  selected,
  onPress,
  badge,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.selectRow, selected && styles.selectRowOn, pressed && styles.pressed]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={[title, subtitle].filter(Boolean).join(', ')}
    >
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      <View style={styles.selectText}>
        <View style={styles.selectTitleRow}>
          <Text style={[styles.selectTitle, selected && styles.selectTitleOn]} numberOfLines={1}>
            {title}
          </Text>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
        {subtitle ? (
          <Text style={styles.selectSub} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * Admin books a visit on a customer's behalf: customer → address → service + size → date + slot →
 * property → payment → notes → price preview → create. The server applies the same Business-settings
 * rules as a customer booking (slots, lead time, horizon, service area, payments), confirms the visit
 * straight away, records who booked it, and notifies the customer.
 */
export default function AdminBookingCreateScreen() {
  const presetCustomerId = paramString(useLocalSearchParams<{ customerId?: string | string[] }>().customerId);
  const settings = useBusinessSettings();
  const copy = useCustomerUiCopy();

  // 1. Customer
  const [customer, setCustomer] = useState<AdminUserSearchResult | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<AdminUserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [presetLoading, setPresetLoading] = useState(Boolean(presetCustomerId));
  const searchId = useRef(0);

  // 2. Address
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressFormValues>(EMPTY_ADDRESS_FORM);

  // 3. Service
  const [services, setServices] = useState<Service[] | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [optionKey, setOptionKey] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);

  // 4–7. Visit details
  const [schedule, setSchedule] = useState<CartSchedule>(initialSchedule);
  const [slotOpen, setSlotOpen] = useState(false);
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [coupon, setCoupon] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Customer opened from their profile (adminRoutes.bookingCreateFor).
  useEffect(() => {
    if (!presetCustomerId) return;
    api
      .get<{ user: User }>(`/admin/users/${presetCustomerId}`, screenLoadConfig)
      .then(({ data }) => {
        const u = data.user;
        if (u.role !== 'customer') return;
        setCustomer({
          id: u.id,
          name: u.name,
          phone: u.phone,
          email: u.email,
          role: u.role,
          city: u.city,
          disabled: u.disabled === true,
        });
      })
      .catch(() => Toast.show({ type: 'error', text1: 'Could not load that customer', text2: 'Search for them instead.' }))
      .finally(() => setPresetLoading(false));
  }, [presetCustomerId]);

  // Customer search.
  useEffect(() => {
    if (customer) return;
    const q = customerQuery.trim();
    if (q.length < 2) {
      setCustomerResults([]);
      setSearching(false);
      return;
    }
    const id = ++searchId.current;
    setSearching(true);
    const t = setTimeout(() => {
      api
        .get<{ users: AdminUserSearchResult[] }>('/admin/user-search', {
          ...screenLoadConfig,
          params: { q, role: 'customer', limit: 8 },
        })
        .then(({ data }) => {
          if (id === searchId.current) setCustomerResults(data.users);
        })
        .catch(() => {
          if (id === searchId.current) setCustomerResults([]);
        })
        .finally(() => {
          if (id === searchId.current) setSearching(false);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [customer, customerQuery]);

  // The customer's saved addresses (default pre-picked; none → type one).
  useEffect(() => {
    setAddresses(null);
    setAddressId(null);
    setNewAddress(false);
    setAddressForm(EMPTY_ADDRESS_FORM);
    if (!customer) return;
    let alive = true;
    api
      .get<{ addresses: SavedAddress[] }>(`/admin/customers/${customer.id}/addresses`, screenLoadConfig)
      .then(({ data }) => {
        if (!alive) return;
        setAddresses(data.addresses);
        const pick = data.addresses.find((a) => a.isDefault) ?? data.addresses[0];
        setAddressId(pick?.id ?? null);
        setNewAddress(!pick);
      })
      .catch(() => {
        if (!alive) return;
        setAddresses([]);
        setNewAddress(true);
      });
    return () => {
      alive = false;
    };
  }, [customer]);

  const loadServices = useCallback(async () => {
    setServicesError(null);
    try {
      const [svc, off] = await Promise.allSettled([
        api.get<{ services: Service[] }>('/services', screenLoadConfig),
        api.get<{ offers: Offer[] }>('/offers', screenLoadConfig),
      ]);
      if (svc.status === 'rejected') throw svc.reason;
      setServices(svc.value.data.services.filter((s) => s.active !== false));
      if (off.status === 'fulfilled') setOffers(off.value.data.offers);
    } catch (err) {
      setServicesError(getApiErrorMessage(err, 'Could not load services'));
    }
  }, []);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  // Default payment: the first method switched on in Business settings.
  useEffect(() => {
    const offered = activePaymentMethods(settings).map((m) => m.key);
    setPaymentMethod((prev) => (prev && offered.includes(prev) ? prev : (offered[0] ?? null)));
  }, [settings]);

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

  const service = services?.find((s) => s.id === serviceId) ?? null;
  const option = service ? findOption(service, optionKey) : undefined;
  const propertyTypes = activePropertyTypes(settings);
  const paymentMethods = activePaymentMethods(settings);

  function pickService(s: Service) {
    haptic('select');
    setServiceId(s.id);
    const first = s.options?.[0]?.key ?? null;
    setOptionKey(first);
    guessProperty(first);
  }

  /** A home-size package ("2 BHK") already answers the property question — pre-pick it (still changeable). */
  function guessProperty(key: string | null) {
    if (!key) return;
    const guess = key.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (propertyTypes.some((p) => p.key === guess)) setPropertyType(guess);
  }

  const gst = settings.tax.gstPercent;
  const pricing = useMemo(
    () => (service ? computePricing(servicePriceFor(service, optionKey), coupon, offers, gst) : null),
    [service, optionKey, coupon, offers, gst],
  );
  const couponTyped = coupon.trim().length > 0;
  const couponApplied = couponTyped && (pricing?.coupon ?? 0) > 0;

  const savedAddress = !newAddress ? addresses?.find((a) => a.id === addressId) : undefined;
  const typedAddress = composeAddressLine(addressForm, copy);
  const addressReady = Boolean(savedAddress) || (newAddress && addressFormValid(addressForm));
  const contactStarted = Boolean(contactName.trim() || contactPhone.trim());
  const contactValid = !contactStarted || (contactName.trim().length >= 2 && PHONE.test(contactPhone.trim()));
  const slotIssue = scheduleProblem(schedule, settings, copy);

  const scheduleSummary =
    schedule.mode === 'standard'
      ? `${formatBookableDate(schedule.date)} · ${formatSlotShort12h(schedule.slot)}`
      : `${formatBookableDate(schedule.date)} · ${formatTime12h(scheduleTime(schedule))}`;

  const problems: string[] = [];
  if (!customer) problems.push('Pick the customer.');
  else if (customer.disabled) problems.push('This customer account is disabled.');
  if (customer && !addressReady) problems.push(newAddress ? 'Fill in the house, street and city.' : 'Pick an address.');
  if (!service) problems.push('Pick a service.');
  else if ((service.options?.length ?? 0) > 0 && !option) problems.push(`Pick ${service.optionsTitle?.toLowerCase() || 'a size'}.`);
  if (slotIssue) problems.push(slotIssue);
  if (!propertyType) problems.push('Pick the property type.');
  if (!paymentMethod) problems.push('Pick how the customer will pay.');
  if (couponTyped && !couponApplied) problems.push('That coupon code doesn’t apply to this booking.');
  if (!contactValid) problems.push('On-site contact needs a name and a 10-digit phone.');

  async function submit() {
    setTouched(true);
    if (problems.length > 0 || !customer || !service || !pricing || !propertyType || !paymentMethod) {
      haptic('error');
      Toast.show({ type: 'error', text1: 'Booking not ready', text2: problems[0] });
      return;
    }
    const ok = await confirmAsync({
      title: `Book for ${customer.name}?`,
      message: `${option ? `${service.name} · ${option.label}` : service.name}\n${scheduleSummary}\nTotal ${formatRupeeFull(pricing.total)} · ${paymentLabel(paymentMethod, settings)}\n\nThe visit is confirmed now and the customer is notified.`,
      confirmLabel: 'Create booking',
      cancelLabel: 'Back',
    });
    if (!ok) return;

    const notes = schedule.notes.trim() || undefined;
    const scheduleRequest =
      schedule.mode === 'standard'
        ? { date: schedule.date, slot: schedule.slot, notes }
        : { date: schedule.date, time: scheduleTime(schedule), notes };

    setSubmitting(true);
    try {
      const { data } = await api.post<{ booking: Booking }>('/bookings', {
        customerId: customer.id,
        serviceId: service.id,
        scheduleMode: schedule.mode,
        scheduleRequest,
        propertyType: propertyType as PropertyTypeKey,
        ...(option ? { optionKey: option.key } : {}),
        ...(savedAddress ? { addressId: savedAddress.id } : { address: typedAddress.trim() }),
        ...(contactStarted ? { visitContact: { name: contactName.trim(), phone: contactPhone.trim() } } : {}),
        paymentMethod,
        couponCode: couponApplied ? coupon.trim() : undefined,
        assignmentMode: 'auto',
      });
      const note = internalNote.trim();
      if (note) {
        try {
          await api.post(`/bookings/${data.booking.id}/notes`, { text: note }, { skipErrorToast: true });
        } catch {
          Toast.show({ type: 'info', text1: 'Booking created', text2: 'The internal note could not be saved — add it on the booking.' });
        }
      }
      haptic('success');
      Toast.show({ type: 'success', text1: 'Booking created', text2: `${customer.name} has been notified.` });
      appReplace(adminRoutes.booking(data.booking.id));
    } catch {
      // The interceptor shows the server's reason (slot taken, outside service area, payment off…).
      haptic('error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminListShell
      title="New booking"
      subtitle={customer ? `For ${customer.name}` : 'Book a service for a customer'}
      backFallback={adminRoutes.bookings}
      keyboardAvoid
      stickyFooter={
        <StickyActionBar row>
          <View style={styles.footerTotal}>
            <Text style={styles.footerLabel}>Total</Text>
            <Text style={styles.footerValue}>{pricing ? formatRupeeFull(pricing.total) : '—'}</Text>
          </View>
          <Button
            title="Create booking"
            variant="premium"
            onPress={() => void submit()}
            loading={submitting}
            fullWidth={false}
            style={styles.footerButton}
          />
        </StickyActionBar>
      }
    >
      <ScrollView contentContainerStyle={adminListShellStyles.form} keyboardShouldPersistTaps="handled">
        <StepTitle n={1} title="Customer" hint="Search by name, phone or email" />
        <AdminFormCard>
          {presetLoading ? (
            <ActivityIndicator color={colors.forest} />
          ) : customer ? (
            <View style={styles.picked}>
              <View style={styles.pickedText}>
                <Text style={styles.pickedName} numberOfLines={1}>
                  {customer.name}
                </Text>
                <Text style={styles.pickedMeta} numberOfLines={1}>
                  {[customer.phone, customer.email, customer.city].filter(Boolean).join(' · ')}
                </Text>
                {customer.disabled ? <Text style={styles.error}>This account is disabled — it can't be booked for.</Text> : null}
              </View>
              <Pressable
                onPress={() => {
                  setCustomer(null);
                  setCustomerQuery('');
                }}
                hitSlop={8}
                style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Change customer, currently ${customer.name}`}
              >
                <X size={14} color={colors.white} strokeWidth={3} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.stack}>
              <AdminSearchField value={customerQuery} onChangeText={setCustomerQuery} placeholder="Name, phone or email" />
              {searching ? <ActivityIndicator color={colors.forest} /> : null}
              {!searching && customerQuery.trim().length >= 2 && customerResults.length === 0 ? (
                <Text style={styles.muted}>No customer matches “{customerQuery.trim()}”.</Text>
              ) : null}
              {customerResults.map((u) => (
                <Pressable
                  key={u.id}
                  onPress={() => {
                    haptic('select');
                    setCustomer(u);
                  }}
                  style={({ pressed }) => [styles.result, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Book for ${u.name}`}
                >
                  <View style={styles.pickedText}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {u.name}
                    </Text>
                    <Text style={styles.resultMeta} numberOfLines={1}>
                      {[u.phone, u.email, u.city].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={ui.textTertiary} />
                </Pressable>
              ))}
              {touched && !customer ? <Text style={styles.error}>Pick the customer first.</Text> : null}
            </View>
          )}
        </AdminFormCard>

        {customer ? (
          <>
            <StepTitle n={2} title="Address" hint="Where the visit happens" />
            <AdminFormCard>
              {addresses === null ? (
                <ActivityIndicator color={colors.forest} />
              ) : (
                <View style={styles.stack}>
                  {addresses.map((a) => (
                    <SelectRow
                      key={a.id}
                      title={a.label || 'Address'}
                      subtitle={addressLine(a)}
                      badge={a.isDefault ? 'Default' : undefined}
                      selected={!newAddress && addressId === a.id}
                      onPress={() => {
                        setNewAddress(false);
                        setAddressId(a.id);
                      }}
                    />
                  ))}
                  <SelectRow
                    title={addresses.length > 0 ? 'Use a different address' : 'Type the address'}
                    subtitle={
                      addresses.length > 0
                        ? 'For this booking only — not saved to their account'
                        : 'This customer has no saved addresses'
                    }
                    selected={newAddress}
                    onPress={() => setNewAddress(true)}
                  />
                  {newAddress ? (
                    <View style={styles.addressForm}>
                      <AddressDetailsForm
                        value={addressForm}
                        onChange={setAddressForm}
                        showSaveAs={false}
                        showErrors={touched}
                      />
                    </View>
                  ) : null}
                </View>
              )}
            </AdminFormCard>
          </>
        ) : null}

        <StepTitle n={customer ? 3 : 2} title="Service" />
        <AdminFormCard>
          {servicesError ? (
            <ListEmptyRetry message={servicesError} onRetry={() => void loadServices()} />
          ) : services === null ? (
            <ActivityIndicator color={colors.forest} />
          ) : services.length === 0 ? (
            <Text style={styles.muted}>No active services. Switch one on in Services first.</Text>
          ) : (
            <View style={styles.stack}>
              {services.map((s) => (
                <SelectRow
                  key={s.id}
                  title={s.name}
                  subtitle={
                    s.options?.length
                      ? `From ${formatRupeeFull(servicePriceFor(s, null))} · ${s.options.length} sizes`
                      : formatRupeeFull(s.basePrice)
                  }
                  selected={serviceId === s.id}
                  onPress={() => pickService(s)}
                />
              ))}
            </View>
          )}
          {service && (service.options?.length ?? 0) > 0 ? (
            <>
              <Text style={styles.fieldLabel}>{service.optionsTitle || 'Size'}</Text>
              <View style={styles.chips}>
                {service.options!.map((o) => (
                  <Chip
                    key={o.key}
                    label={`${o.label} · ${formatRupeeFull(o.price)}`}
                    compact
                    selected={optionKey === o.key}
                    onPress={() => {
                      setOptionKey(o.key);
                      guessProperty(o.key);
                    }}
                  />
                ))}
              </View>
            </>
          ) : null}
        </AdminFormCard>

        <StepTitle n={customer ? 4 : 3} title="Date & time" hint="Same slots and lead time customers see" />
        <AdminFormCard>
          <Pressable
            onPress={() => setSlotOpen(true)}
            style={({ pressed }) => [styles.slotRow, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Visit time: ${scheduleSummary}. Change`}
          >
            <View style={styles.slotIcon}>
              <CalendarClock size={18} color={colors.forest} strokeWidth={2.2} />
            </View>
            <View style={styles.pickedText}>
              <Text style={styles.slotValue}>{scheduleSummary}</Text>
              <Text style={styles.slotHint}>
                {schedule.mode === 'custom' ? 'Preferred time' : 'Time window'}
                {schedule.notes.trim() ? ` · Note: ${schedule.notes.trim()}` : ''}
              </Text>
            </View>
            <Text style={styles.change}>Change</Text>
          </Pressable>
          {slotIssue ? <Text style={styles.error}>{slotIssue}</Text> : null}
        </AdminFormCard>

        <StepTitle n={customer ? 5 : 4} title="Property" />
        <AdminFormCard>
          <View style={styles.chips}>
            {propertyTypes.map((p) => (
              <Chip key={p.key} label={p.label} compact selected={propertyType === p.key} onPress={() => setPropertyType(p.key)} />
            ))}
          </View>
          {touched && !propertyType ? <Text style={styles.error}>Pick the property type.</Text> : null}
        </AdminFormCard>

        <StepTitle n={customer ? 6 : 5} title="Payment" hint="How the customer will pay" />
        <AdminFormCard>
          <View style={styles.chips}>
            {paymentMethods.map((m) => (
              <Chip key={m.key} label={m.label} compact selected={paymentMethod === m.key} onPress={() => setPaymentMethod(m.key)} />
            ))}
          </View>
          <Input
            label="Coupon code (optional)"
            value={coupon}
            onChangeText={setCoupon}
            placeholder="e.g. ANTIDOT100"
            autoCapitalize="characters"
            autoCorrect={false}
            error={couponTyped && pricing && !couponApplied ? 'This code doesn’t apply to this booking' : undefined}
            hint={couponApplied && pricing ? `Saves ${formatRupeeFull(pricing.coupon)}` : undefined}
            containerStyle={styles.couponInput}
          />
        </AdminFormCard>

        <StepTitle n={customer ? 7 : 6} title="Notes & contact" hint="Optional" />
        <AdminFormCard>
          <Input
            label="Internal note (admins only)"
            value={internalNote}
            onChangeText={(t) => setInternalNote(t.slice(0, BOOKING_NOTE_MAX))}
            placeholder="e.g. Booked over the phone — prefers a call before arriving"
            multiline
            maxLength={BOOKING_NOTE_MAX}
            style={styles.multiline}
          />
          <Text style={styles.fieldLabel}>On-site contact (if someone else will be there)</Text>
          <View style={styles.contactRow}>
            <Input
              label="Name"
              value={contactName}
              onChangeText={setContactName}
              placeholder="Who to call"
              containerStyle={styles.contactField}
              error={touched && contactStarted && contactName.trim().length < 2 ? 'Add a name' : undefined}
            />
            <Input
              label="Phone"
              value={contactPhone}
              onChangeText={(t) => setContactPhone(t.replace(/\D/g, '').slice(0, 10))}
              placeholder="10 digits"
              keyboardType="number-pad"
              containerStyle={styles.contactField}
              error={touched && contactStarted && !PHONE.test(contactPhone.trim()) ? '10 digits' : undefined}
            />
          </View>
          <Text style={styles.muted}>Visit notes for the technician go with the date & time.</Text>
        </AdminFormCard>

        <StepTitle n={customer ? 8 : 7} title="Price" />
        <AdminFormCard>
          {pricing && service ? (
            <>
              <Text style={styles.priceFor} numberOfLines={2}>
                {option ? `${service.name} · ${option.label}` : service.name}
              </Text>
              <BookBillSummary amount={pricing} gstPercent={gst} />
              <View style={styles.summaryLines}>
                {customer ? <Text style={styles.summaryLine}>For {customer.name}</Text> : null}
                {savedAddress || (newAddress && typedAddress) ? (
                  <View style={styles.summaryAddress}>
                    <MapPin size={13} color={ui.textSecondary} />
                    <Text style={styles.summaryLine} numberOfLines={2}>
                      {savedAddress ? addressLine(savedAddress) : typedAddress}
                    </Text>
                  </View>
                ) : null}
                <Text style={styles.summaryLine}>
                  {scheduleSummary}
                  {propertyType ? ` · ${propertyLabel(propertyType, settings)}` : ''}
                  {paymentMethod ? ` · ${paymentLabel(paymentMethod, settings)}` : ''}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.muted}>Pick a service to see the price.</Text>
          )}
          {touched && problems.length > 0 ? (
            <View style={styles.problems}>
              {problems.map((p) => (
                <Text key={p} style={styles.error}>
                  • {p}
                </Text>
              ))}
            </View>
          ) : null}
        </AdminFormCard>
      </ScrollView>

      <CartSlotSheet
        visible={slotOpen}
        onClose={() => setSlotOpen(false)}
        value={schedule}
        onCommit={(next) => {
          setSchedule(next);
          setSlotOpen(false);
        }}
        durationLabel={service ? formatDuration(serviceDurationMins(service)) : ''}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 8 },
  pressed: { opacity: 0.85 },
  muted: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.muted },
  error: { fontFamily: fonts.body, fontSize: 12, color: colors.error, marginTop: 6 },
  picked: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickedText: { flex: 1, minWidth: 0 },
  pickedName: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  pickedMeta: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary, marginTop: 2 },
  clear: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  resultName: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ink },
  resultMeta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 2 },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  selectRowOn: { borderColor: colors.forest, backgroundColor: colors.soft },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.forest },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.forest },
  selectText: { flex: 1, minWidth: 0 },
  selectTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectTitle: { flexShrink: 1, fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ink },
  selectTitleOn: { color: colors.forest },
  selectSub: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: ui.textSecondary, marginTop: 2 },
  badge: {
    fontFamily: fonts.bodySemi,
    fontSize: 10.5,
    color: colors.forest,
    backgroundColor: colors.mint,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  addressForm: { marginTop: spacing.xs },
  fieldLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textSecondary, marginTop: spacing.md, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  slotIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotValue: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  slotHint: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 2 },
  change: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  couponInput: { marginTop: spacing.md },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  contactRow: { flexDirection: 'row', gap: spacing.sm },
  contactField: { flex: 1 },
  priceFor: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, marginBottom: spacing.sm },
  summaryLines: { marginTop: spacing.sm, gap: 4 },
  summaryAddress: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  summaryLine: { flexShrink: 1, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: ui.textSecondary },
  problems: { marginTop: spacing.sm },
  footerTotal: { flex: 1, justifyContent: 'center' },
  footerLabel: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary },
  footerValue: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.ink },
  footerButton: { flex: 1.6 },
});

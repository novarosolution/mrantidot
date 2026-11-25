import { BellRing, Lock, Minus, Plus, Search, Tag, Trash2, TriangleAlert } from 'lucide-react-native';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { AdminBottomSheet } from '@/components/kit/AdminBottomSheet';
import { formatINR } from '@/components/charts/chartFormat';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { textInputDefaults } from '@/components/ui/textInputDefaults';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { bookingServiceName } from '@/lib/booking-helpers';
import { useBusinessSettings } from '@/lib/businessSettings';
import { confirmAsync } from '@/lib/confirm';
import { haptic } from '@/lib/motion';
import { activePaymentMethods, activePropertyTypes, formatPercent, paymentLabel, propertyLabel } from '@/lib/settingsLabels';
import { appToast } from '@/lib/toast';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import {
  ORDER_ADJUSTMENT_AMOUNT_MAX,
  ORDER_ADJUSTMENT_LABEL_MAX,
  ORDER_ADJUSTMENT_LABEL_MIN,
  ORDER_ADJUSTMENT_MAX_LINES,
  ORDER_ADJUSTMENT_REASON_MAX,
  ORDER_NOTE_MAX,
  type OrderEditErrorCode,
  type OrderEditInput,
  type OrderEditPreview,
} from '@/types/adminOps';
import type { Booking, BookingAmount, BookingOrderChange, Offer, Service, ServiceOption } from '@/types/api';
import { colors, fonts, radii, spacing, ui } from '@/constants/theme';

/* ─── Draft (what the sheet edits) ─────────────────────────────────── */

type LineDraft = {
  /** Local key for React (existing lines keep their server id in `id`). */
  key: string;
  id?: string;
  sign: 1 | -1;
  label: string;
  amountText: string;
  reason: string;
};

type Draft = {
  serviceId: string;
  optionKey: string | null;
  propertyType: string;
  /** The applied coupon (null = none). */
  couponCode: string | null;
  lines: LineDraft[];
  paymentMethod: string;
};

type Field = 'service' | 'size' | 'property' | 'coupon' | 'lines' | 'payment' | 'general';

const FIELD_OF: Partial<Record<OrderEditErrorCode, Field>> = {
  SERVICE_LOCKED: 'service',
  SERVICE_UNAVAILABLE: 'service',
  OPTION_REQUIRED: 'size',
  PROPERTY_UNAVAILABLE: 'property',
  PAYMENT_UNAVAILABLE: 'payment',
  COUPON_INVALID: 'coupon',
  ADJUSTMENT_INVALID: 'lines',
  ADJUSTMENTS_TOO_LOW: 'lines',
};

const CHARGE_PRESETS = ['Extra room', 'Re-visit charge', 'Materials'];
const DISCOUNT_PRESETS = ['Goodwill discount', 'Loyalty discount'];

let lineSeq = 0;
const newKey = () => `line-${Date.now().toString(36)}-${(lineSeq += 1)}`;

function serviceIdOf(b: Booking): string {
  if (b.service && typeof b.service === 'object') return b.service.id;
  return typeof b.service === 'string' ? b.service : '';
}

function draftFrom(b: Booking): Draft {
  return {
    serviceId: serviceIdOf(b),
    optionKey: b.option?.key ?? null,
    propertyType: b.propertyType ?? '',
    couponCode: b.couponCode ? b.couponCode.toUpperCase() : null,
    lines: (b.adjustments ?? []).map((a) => ({
      key: a.id,
      id: a.id,
      sign: a.amount < 0 ? -1 : 1,
      label: a.label,
      amountText: String(Math.abs(a.amount)),
      reason: a.reason ?? '',
    })),
    paymentMethod: b.paymentMethod,
  };
}

/** Whole rupees from what was typed ("1,500" → 1500); null when it isn't a positive amount. */
function parseRupees(text: string): number | null {
  const clean = text.replace(/[,\s₹]/g, '');
  if (!/^\d+(\.\d+)?$/.test(clean)) return null;
  const n = Math.round(Number(clean));
  return n > 0 ? n : null;
}

function lineSignature(l: Pick<LineDraft, 'id' | 'sign' | 'label' | 'amountText' | 'reason'>): string {
  return JSON.stringify([l.id ?? '', l.sign * (parseRupees(l.amountText) ?? 0), l.label.trim().replace(/\s+/g, ' '), l.reason.trim()]);
}

function signedINR(n: number): string {
  return `${n < 0 ? '−' : '+'}${formatINR(Math.abs(n))}`;
}

function errorCode(err: unknown): string | undefined {
  const data = (err as { response?: { data?: { code?: unknown } } })?.response?.data;
  return typeof data?.code === 'string' ? data.code : undefined;
}

const webOnly = (style: object): ViewStyle | null => (Platform.OS === 'web' ? (style as ViewStyle) : null);

/* ─── Component ────────────────────────────────────────────────────── */

/**
 * Admin "Edit order" sheet. Server: POST /bookings/:id/order/preview (live price, saves nothing) and
 * PATCH /bookings/:id/order → { booking, change, notified }. What can change depends on the stage:
 * before work starts everything; once work started not the service or size; after completion only the
 * extra charges and discounts. The preview is the server's own price (same formula as checkout).
 */
export function AdminOrderEditor({
  visible,
  booking,
  onClose,
  onSaved,
  onStale,
}: {
  visible: boolean;
  booking: Booking;
  onClose: () => void;
  /** Receives the updated booking the server returns. */
  onSaved: (next: Booking, change: BookingOrderChange | null) => void;
  /** The booking changed elsewhere (409) — reload it. */
  onStale?: () => void;
}) {
  const settings = useBusinessSettings();
  const status = booking.status;
  const completed = status === 'completed';
  const preWork = status === 'pending' || status === 'confirmed';
  const canEditService = preWork;
  const canEditOther = !completed;

  const [initial, setInitial] = useState<Draft>(() => draftFrom(booking));
  /** Total when the sheet opened — the server refuses the save (409) if the booking changed since. */
  const [baseTotal, setBaseTotal] = useState(booking.amount.total);
  const [draft, setDraft] = useState<Draft>(() => draftFrom(booking));
  const [note, setNote] = useState('');
  const [couponText, setCouponText] = useState('');
  const [services, setServices] = useState<Service[] | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<OrderEditPreview | null>(null);
  const [previewError, setPreviewError] = useState<{ message: string; field: Field; code?: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  /** Bumped by "Try again" to re-run a preview that failed (network, server restart). */
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const seq = useRef(0);
  const catalogSeq = useRef(0);

  // Fresh draft every time the sheet opens (and the catalogue for the pickers).
  useEffect(() => {
    if (!visible) return;
    const start = draftFrom(booking);
    setInitial(start);
    setBaseTotal(booking.amount.total);
    setDraft(start);
    setNote('');
    setCouponText('');
    setPickerOpen(false);
    setQuery('');
    setPreview(null);
    setPreviewError(null);
    setTouched(false);
    void loadCatalog();
    // Only when the sheet opens — later booking refreshes must not wipe what the admin typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  async function loadCatalog() {
    const mine = ++catalogSeq.current;
    setCatalogError(null);
    const [svc, off] = await Promise.allSettled([
      api.get<{ services: Service[] }>('/services', screenLoadConfig),
      api.get<{ offers: Offer[] }>('/offers', screenLoadConfig),
    ]);
    if (mine !== catalogSeq.current) return;
    if (svc.status === 'fulfilled') setServices(svc.value.data.services);
    else setCatalogError(getApiErrorMessage(svc.reason, 'Could not load the services'));
    if (off.status === 'fulfilled') setOffers(off.value.data.offers);
  }

  const currentServiceName = bookingServiceName(booking);
  const selectedService = useMemo<Service | undefined>(() => {
    const fromList = services?.find((s) => s.id === draft.serviceId);
    if (fromList) return fromList;
    if (booking.service && typeof booking.service === 'object' && booking.service.id === draft.serviceId) return booking.service;
    return undefined;
  }, [services, draft.serviceId, booking.service]);
  const serviceChanged = draft.serviceId !== initial.serviceId;
  const sizeOptions: ServiceOption[] = useMemo(() => {
    const list = selectedService?.options ?? [];
    // The booked size stays pickable (at its locked price) even if the service dropped it since.
    if (!serviceChanged && booking.option && !list.some((o) => o.key === booking.option!.key)) {
      return [{ key: booking.option.key, label: booking.option.label, price: booking.option.price }, ...list];
    }
    return list;
  }, [selectedService, serviceChanged, booking.option]);

  /* ---------- what to send ---------- */
  const lineProblems = useMemo(() => {
    const out: Record<string, string> = {};
    for (const l of draft.lines) {
      const label = l.label.trim();
      const amount = parseRupees(l.amountText);
      if (label.length < ORDER_ADJUSTMENT_LABEL_MIN) out[l.key] = 'Add a label the customer will see on the bill.';
      else if (amount == null) out[l.key] = 'Enter the amount in rupees.';
      else if (amount > ORDER_ADJUSTMENT_AMOUNT_MAX) out[l.key] = `Keep each line under ${formatINR(ORDER_ADJUSTMENT_AMOUNT_MAX)}.`;
    }
    return out;
  }, [draft.lines]);

  // A new service needs a size when it has sizes; an older booking without one can stay as it is.
  const sizeMissing = canEditService && serviceChanged && sizeOptions.length > 0 && !sizeOptions.some((o) => o.key === draft.optionKey);
  const linesChanged =
    draft.lines.length !== initial.lines.length || draft.lines.some((l, i) => lineSignature(l) !== lineSignature(initial.lines[i]!));

  const input = useMemo<OrderEditInput>(() => {
    const out: OrderEditInput = {};
    if (draft.serviceId !== initial.serviceId) {
      out.serviceId = draft.serviceId;
      out.optionKey = draft.optionKey;
    } else if (draft.optionKey !== initial.optionKey) {
      out.optionKey = draft.optionKey;
    }
    if (draft.propertyType !== initial.propertyType) out.propertyType = draft.propertyType;
    if (draft.couponCode !== initial.couponCode) out.couponCode = draft.couponCode;
    if (linesChanged) {
      out.adjustments = draft.lines.map((l) => ({
        ...(l.id ? { id: l.id } : {}),
        label: l.label.trim().replace(/\s+/g, ' '),
        amount: l.sign * (parseRupees(l.amountText) ?? 0),
        ...(l.reason.trim() ? { reason: l.reason.trim() } : {}),
      }));
    }
    if (draft.paymentMethod !== initial.paymentMethod) out.paymentMethod = draft.paymentMethod;
    return out;
  }, [draft, initial, linesChanged]);

  const changed = Object.keys(input).length > 0;
  const localProblem = sizeMissing
    ? `Pick ${(selectedService?.optionsTitle || 'a size').toLowerCase()} for ${selectedService?.name ?? 'this service'}.`
    : Object.keys(lineProblems).length > 0
      ? 'Finish the extra charge / discount lines first.'
      : null;
  const previewKey = visible && changed && !localProblem ? JSON.stringify(input) : '';
  const debouncedKey = useDebouncedValue(previewKey, 350);

  useEffect(() => {
    if (!debouncedKey) {
      seq.current += 1;
      setPreview(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }
    const mine = ++seq.current;
    setPreviewLoading(true);
    api
      .post<{ preview: OrderEditPreview }>(`/bookings/${booking.id}/order/preview`, JSON.parse(debouncedKey) as OrderEditInput, {
        skipErrorToast: true,
      })
      .then(({ data }) => {
        if (mine !== seq.current) return;
        setPreview(data.preview);
        setPreviewError(null);
      })
      .catch((err: unknown) => {
        if (mine !== seq.current) return;
        const code = errorCode(err);
        setPreviewError({
          message: getApiErrorMessage(err, 'Could not price this order'),
          field: (code && FIELD_OF[code as OrderEditErrorCode]) || 'general',
          code,
        });
      })
      .finally(() => {
        if (mine === seq.current) setPreviewLoading(false);
      });
  }, [debouncedKey, booking.id, retry]);

  const pending = previewKey !== debouncedKey || previewLoading;
  const fieldError = (field: Field) => (previewError && previewError.field === field ? previewError.message : undefined);
  const canSave = changed && !localProblem && !pending && !previewError && preview != null && !preview.unchanged && !saving;

  /* ---------- edits ---------- */
  function patch(next: Partial<Draft>) {
    setTouched(true);
    setDraft((d) => ({ ...d, ...next }));
  }

  function pickService(s: Service) {
    haptic('select');
    const options = s.options ?? [];
    const keep = options.find((o) => o.key === draft.optionKey);
    patch({ serviceId: s.id, optionKey: keep ? keep.key : options.length === 1 ? options[0]!.key : null });
    setPickerOpen(false);
    setQuery('');
  }

  function applyCoupon(code: string) {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    haptic('select');
    patch({ couponCode: clean });
    setCouponText('');
  }

  function addLine(sign: 1 | -1, label = '') {
    if (draft.lines.length >= ORDER_ADJUSTMENT_MAX_LINES) {
      appToast({ type: 'warning', title: `At most ${ORDER_ADJUSTMENT_MAX_LINES} lines`, message: 'Combine some extra charges or discounts.' });
      return;
    }
    haptic('select');
    patch({ lines: [...draft.lines, { key: newKey(), sign, label, amountText: '', reason: '' }] });
  }

  function updateLine(key: string, next: Partial<LineDraft>) {
    setTouched(true);
    setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.key === key ? { ...l, ...next } : l)) }));
  }

  function removeLine(key: string) {
    haptic('select');
    setTouched(true);
    setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.key !== key) }));
  }

  function resetAll() {
    haptic('select');
    setDraft(initial);
    setNote('');
    setCouponText('');
    setTouched(false);
  }

  async function requestClose() {
    if (saving) return;
    if (touched && changed) {
      const leave = await confirmAsync({
        title: 'Discard your changes?',
        message: 'The order stays as it was.',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
        destructive: true,
      });
      if (!leave) return;
    }
    onClose();
  }

  async function save() {
    if (!canSave || !preview) {
      if (localProblem) {
        haptic('error');
        appToast({ type: 'warning', title: localProblem });
      }
      return;
    }
    const diff = preview.difference;
    const paid = booking.paymentStatus === 'paid';
    if (preview.totalChanged || preview.stepsRebuilt) {
      const message = [
        preview.totalChanged ? `It was ${formatINR(preview.before.total)} (${signedINR(diff)}).` : '',
        preview.notifyCustomer ? 'The customer gets a notification about the change.' : 'The customer is not notified.',
        preview.stepsRebuilt ? 'The treatment steps are replaced with the new service’s steps.' : '',
        paid && preview.totalChanged
          ? `This booking is marked paid — ${diff > 0 ? `collect ${formatINR(diff)} more` : `refund ${formatINR(-diff)}`} and update the payment.`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n');
      const ok = await confirmAsync({
        title: preview.totalChanged ? `Change the total to ${formatINR(preview.amount.total)}?` : 'Change the service?',
        message,
        confirmLabel: 'Save changes',
        cancelLabel: 'Keep editing',
      });
      if (!ok) return;
    }
    setSaving(true);
    try {
      const { data } = await api.patch<{ booking: Booking; change: BookingOrderChange | null; notified: boolean }>(
        `/bookings/${booking.id}/order`,
        { ...input, ...(note.trim() ? { note: note.trim() } : {}), expectedTotal: baseTotal },
        { skipErrorToast: true },
      );
      haptic('success');
      appToast({
        type: 'success',
        title: 'Order updated',
        message: data.notified
          ? `New total ${formatINR(data.booking.amount.total)} · the customer has been told`
          : data.change && data.change.totalAfter !== data.change.totalBefore
            ? `New total ${formatINR(data.booking.amount.total)}`
            : undefined,
      });
      onSaved(data.booking, data.change);
      onClose();
    } catch (err) {
      haptic('error');
      const code = errorCode(err);
      const message = getApiErrorMessage(err, 'Could not save the order');
      appToast({ type: 'error', title: code === 'ORDER_STALE' ? 'This booking just changed' : 'Could not save the order', message });
      if (code === 'ORDER_STALE') {
        onStale?.();
        onClose();
      } else {
        setPreviewError({ message, field: (code && FIELD_OF[code as OrderEditErrorCode]) || 'general', code });
      }
    } finally {
      setSaving(false);
    }
  }

  /* ---------- view helpers ---------- */
  const shownAmount: BookingAmount = preview?.amount ?? booking.amount;
  const shownLines = (preview ? draft.lines : initial.lines).map((l) => ({
    key: l.key,
    label: l.label.trim() || 'New line',
    amount: l.sign * (parseRupees(l.amountText) ?? 0),
  }));
  const gstPct = shownAmount.gstPercent ?? booking.amount.gstPercent ?? settings.tax.gstPercent;
  const stale = pending || Boolean(previewError);
  const couponValue = preview?.amount.coupon ?? (draft.couponCode === initial.couponCode ? booking.amount.coupon : 0);
  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (services ?? []).filter((s) => !q || s.name.toLowerCase().includes(q));
    return list.slice(0, 12);
  }, [services, query]);
  const propertyOptions = useMemo(() => {
    const list = activePropertyTypes(settings).map((p) => ({ key: p.key, label: p.label }));
    if (initial.propertyType && !list.some((p) => p.key === initial.propertyType)) {
      list.unshift({ key: initial.propertyType, label: `${propertyLabel(initial.propertyType, settings)} (switched off)` });
    }
    return list;
  }, [settings, initial.propertyType]);
  const paymentOptions = useMemo(() => {
    const list = activePaymentMethods(settings).map((m) => ({ key: m.key, label: m.label }));
    if (!list.some((m) => m.key === initial.paymentMethod)) {
      list.unshift({ key: initial.paymentMethod, label: `${paymentLabel(initial.paymentMethod, settings)} (switched off)` });
    }
    return list;
  }, [settings, initial.paymentMethod]);
  const offerChips = offers.filter((o) => o.code.toUpperCase() !== draft.couponCode).slice(0, 6);

  const stageNote = completed
    ? `Completed visit — only extra charges and discounts can change.${
        typeof booking.technicianEarning === 'number'
          ? ` Technician pay stays ${formatINR(booking.technicianEarning)} (locked at completion); use Payroll → Add adjustment to change it.`
          : ''
      }`
    : !preWork
      ? 'Work has started — the service and size are locked. Property, coupon, extra charges and payment can still change.'
      : null;

  return (
    <AdminBottomSheet
      visible={visible}
      onClose={() => void requestClose()}
      title="Edit order"
      hint={`${currentServiceName} · now ${formatINR(booking.amount.total)}`}
      footer={
        <>
          <Button
            title={preview && preview.totalChanged ? `Save · ${formatINR(preview.amount.total)}` : 'Save changes'}
            variant="premium"
            onPress={() => void save()}
            loading={saving}
            disabled={!canSave}
            accessibilityHint={!changed ? 'Change something first' : undefined}
          />
          <Button title="Close" variant="secondary" onPress={() => void requestClose()} disabled={saving} />
        </>
      }
    >
      {stageNote ? (
        <View style={styles.notice} accessibilityRole="text">
          <Lock size={15} color={colors.amberInk} strokeWidth={2.4} />
          <Text style={styles.noticeText}>{stageNote}</Text>
        </View>
      ) : null}

      {/* Service + size */}
      <Section title="Service" locked={!canEditService}>
        <View style={styles.serviceRow}>
          <View style={styles.flex}>
            <Text style={styles.serviceName} numberOfLines={2}>
              {selectedService?.name ?? currentServiceName}
            </Text>
            <Text style={styles.serviceMeta}>
              {serviceChanged ? `Was ${currentServiceName}` : booking.option ? `${booking.option.label} · ${formatINR(booking.option.price)} (locked price)` : `${formatINR(booking.amount.base)} (locked price)`}
            </Text>
          </View>
          {canEditService ? (
            <Button
              title={pickerOpen ? 'Done' : 'Change'}
              variant="secondary"
              size="sm"
              fullWidth={false}
              onPress={() => {
                haptic('select');
                setPickerOpen((o) => !o);
              }}
            />
          ) : null}
        </View>
        {fieldError('service') ? <Text style={styles.fieldError}>{fieldError('service')}</Text> : null}
        {canEditService && pickerOpen ? (
          <View style={styles.picker}>
            <View style={styles.searchBox}>
              <Search size={16} color={ui.textTertiary} strokeWidth={2.2} />
              <TextInput
                {...textInputDefaults}
                value={query}
                onChangeText={setQuery}
                placeholder="Search services"
                placeholderTextColor={ui.textTertiary}
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (filteredServices.length === 1) pickService(filteredServices[0]!);
                }}
                accessibilityLabel="Search services"
              />
            </View>
            {services === null && !catalogError ? (
              <View style={styles.pickerList}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} width="100%" height={48} radius={12} />
                ))}
              </View>
            ) : catalogError ? (
              <View style={styles.inlineError}>
                <Text style={styles.fieldError}>{catalogError}</Text>
                <Button title="Retry" variant="ghost" size="sm" fullWidth={false} onPress={() => void loadCatalog()} />
              </View>
            ) : filteredServices.length === 0 ? (
              <Text style={styles.muted}>No active service matches “{query.trim()}”.</Text>
            ) : (
              <View style={styles.pickerList}>
                {filteredServices.map((s) => {
                  const active = s.id === draft.serviceId;
                  const sizes = s.options?.length ?? 0;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => pickService(s)}
                      style={({ pressed }) => [styles.pickRow, active && styles.pickRowActive, webOnly({ cursor: 'pointer' }), pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`${s.name}${active ? ', selected' : ''}`}
                    >
                      <Text style={[styles.pickName, active && styles.pickNameActive]} numberOfLines={1}>
                        {s.name}
                      </Text>
                      <Text style={styles.pickMeta}>
                        {sizes > 0 ? `${sizes} sizes · from ${formatINR(Math.min(...s.options!.map((o) => o.price)))}` : formatINR(s.basePrice)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        {sizeOptions.length > 0 ? (
          <>
            <Text style={styles.label}>{selectedService?.optionsTitle || 'Size'}</Text>
            <View style={styles.chips}>
              {sizeOptions.map((o) => (
                <Chip
                  key={o.key}
                  compact
                  label={`${o.label} · ${formatINR(o.price)}`}
                  selected={draft.optionKey === o.key}
                  onPress={canEditService ? () => patch({ optionKey: o.key }) : undefined}
                />
              ))}
            </View>
            {sizeMissing ? <Text style={styles.fieldError}>{localProblem}</Text> : null}
            {fieldError('size') ? <Text style={styles.fieldError}>{fieldError('size')}</Text> : null}
          </>
        ) : null}
      </Section>

      {/* Property */}
      <Section title="Property type" locked={!canEditOther}>
        <View style={styles.chips}>
          {propertyOptions.map((p) => (
            <Chip
              key={p.key}
              compact
              label={p.label}
              selected={draft.propertyType === p.key}
              onPress={canEditOther ? () => patch({ propertyType: p.key }) : undefined}
            />
          ))}
        </View>
        {fieldError('property') ? <Text style={styles.fieldError}>{fieldError('property')}</Text> : null}
      </Section>

      {/* Coupon */}
      <Section title="Coupon" locked={!canEditOther}>
        {draft.couponCode ? (
          <View style={styles.couponApplied}>
            <Tag size={16} color={colors.forest} strokeWidth={2.4} />
            <View style={styles.flex}>
              <Text style={styles.couponCode}>{draft.couponCode}</Text>
              <Text style={styles.couponMeta}>
                {fieldError('coupon') ? 'Not valid for this order' : couponValue > 0 ? `Takes ${formatINR(couponValue)} off` : 'Checking…'}
              </Text>
            </View>
            {canEditOther ? (
              <Button title="Remove" variant="ghost" size="sm" fullWidth={false} onPress={() => patch({ couponCode: null })} />
            ) : null}
          </View>
        ) : canEditOther ? (
          <>
            <View style={styles.couponRow}>
              <View style={styles.flex}>
                <Input
                  label="Coupon code"
                  value={couponText}
                  onChangeText={(t) => setCouponText(t.toUpperCase().slice(0, 40))}
                  placeholder="e.g. FIRST50"
                  autoCapitalize="characters"
                  returnKeyType="done"
                  onSubmitEditing={() => applyCoupon(couponText)}
                  containerStyle={styles.noMargin}
                  accessibilityLabel="Coupon code"
                />
              </View>
              <Button
                title="Apply"
                variant="secondary"
                size="sm"
                fullWidth={false}
                disabled={!couponText.trim()}
                onPress={() => applyCoupon(couponText)}
                style={styles.applyBtn}
              />
            </View>
            {offerChips.length > 0 ? (
              <View style={[styles.chips, styles.mt8]}>
                {offerChips.map((o) => (
                  <Chip key={o.id} compact label={o.code} onPress={() => applyCoupon(o.code)} />
                ))}
              </View>
            ) : null}
          </>
        ) : (
          <Text style={styles.muted}>No coupon on this booking.</Text>
        )}
        {initial.couponCode && draft.couponCode !== initial.couponCode ? (
          <Text style={styles.hint}>{`${initial.couponCode} goes back to the offer’s free uses when you save.`}</Text>
        ) : null}
        {fieldError('coupon') ? <Text style={styles.fieldError}>{fieldError('coupon')}</Text> : null}
      </Section>

      {/* Extra charges + discounts */}
      <Section title="Extra charges & discounts" hint="Shown on the customer’s bill before GST. The reason stays internal.">
        {draft.lines.length === 0 ? <Text style={styles.muted}>None yet.</Text> : null}
        {draft.lines.map((l, i) => (
          <View key={l.key} style={styles.lineCard}>
            <View style={styles.lineTop}>
              <View style={styles.signTrack} accessibilityRole="radiogroup" accessibilityLabel={`Line ${i + 1} type`}>
                {([1, -1] as const).map((sign) => {
                  const active = l.sign === sign;
                  return (
                    <Pressable
                      key={sign}
                      onPress={() => updateLine(l.key, { sign })}
                      style={[styles.signItem, active && (sign > 0 ? styles.signCharge : styles.signDiscount), webOnly({ cursor: 'pointer' })]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                    >
                      {sign > 0 ? (
                        <Plus size={13} color={active ? colors.white : ui.textSecondary} strokeWidth={2.6} />
                      ) : (
                        <Minus size={13} color={active ? colors.white : ui.textSecondary} strokeWidth={2.6} />
                      )}
                      <Text style={[styles.signText, active && styles.signTextActive]}>{sign > 0 ? 'Charge' : 'Discount'}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                onPress={() => removeLine(l.key)}
                hitSlop={10}
                style={({ pressed }) => [styles.iconBtn, webOnly({ cursor: 'pointer' }), pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${l.label.trim() || `line ${i + 1}`}`}
              >
                <Trash2 size={16} color={ui.textTertiary} strokeWidth={2.2} />
              </Pressable>
            </View>
            <View style={styles.lineInputs}>
              <TextInput
                {...textInputDefaults}
                value={l.label}
                onChangeText={(t) => updateLine(l.key, { label: t.slice(0, ORDER_ADJUSTMENT_LABEL_MAX) })}
                placeholder={l.sign > 0 ? 'Label on the bill, e.g. Extra room' : 'Label on the bill, e.g. Goodwill discount'}
                placeholderTextColor={ui.textTertiary}
                style={[styles.field, styles.flex]}
                maxLength={ORDER_ADJUSTMENT_LABEL_MAX}
                returnKeyType="next"
                accessibilityLabel={`Line ${i + 1} label`}
              />
              <View style={[styles.field, styles.amountField]}>
                <Text style={styles.rupee}>{l.sign > 0 ? '+₹' : '−₹'}</Text>
                <TextInput
                  {...textInputDefaults}
                  value={l.amountText}
                  onChangeText={(t) => updateLine(l.key, { amountText: t.replace(/[^\d,]/g, '').slice(0, 9) })}
                  placeholder="0"
                  placeholderTextColor={ui.textTertiary}
                  keyboardType="number-pad"
                  style={styles.amountInput}
                  returnKeyType="done"
                  onSubmitEditing={() => void save()}
                  accessibilityLabel={`Line ${i + 1} amount in rupees`}
                />
              </View>
            </View>
            <TextInput
              {...textInputDefaults}
              value={l.reason}
              onChangeText={(t) => updateLine(l.key, { reason: t.slice(0, ORDER_ADJUSTMENT_REASON_MAX) })}
              placeholder="Internal reason (optional)"
              placeholderTextColor={ui.textTertiary}
              style={[styles.field, styles.reasonField]}
              maxLength={ORDER_ADJUSTMENT_REASON_MAX}
              accessibilityLabel={`Line ${i + 1} internal reason`}
            />
            {touched && lineProblems[l.key] && (l.label || l.amountText) ? <Text style={styles.fieldError}>{lineProblems[l.key]}</Text> : null}
          </View>
        ))}
        <View style={styles.addRow}>
          <Button title="+ Extra charge" variant="secondary" size="sm" fullWidth={false} onPress={() => addLine(1)} />
          <Button title="− Discount" variant="secondary" size="sm" fullWidth={false} onPress={() => addLine(-1)} />
        </View>
        <View style={[styles.chips, styles.mt8]}>
          {CHARGE_PRESETS.map((p) => (
            <Chip key={p} compact label={`+ ${p}`} onPress={() => addLine(1, p)} />
          ))}
          {DISCOUNT_PRESETS.map((p) => (
            <Chip key={p} compact label={`− ${p}`} onPress={() => addLine(-1, p)} />
          ))}
        </View>
        {fieldError('lines') ? <Text style={styles.fieldError}>{fieldError('lines')}</Text> : null}
      </Section>

      {/* Payment */}
      <Section title="Payment method" locked={!canEditOther}>
        <View style={styles.chips}>
          {paymentOptions.map((m) => (
            <Chip
              key={m.key}
              compact
              label={m.label}
              selected={draft.paymentMethod === m.key}
              onPress={canEditOther ? () => patch({ paymentMethod: m.key }) : undefined}
            />
          ))}
        </View>
        {fieldError('payment') ? <Text style={styles.fieldError}>{fieldError('payment')}</Text> : null}
      </Section>

      <Input
        label="Why are you changing this? (optional)"
        value={note}
        onChangeText={(t) => setNote(t.slice(0, ORDER_NOTE_MAX))}
        placeholder="Kept in the order history, e.g. Customer added the kitchen"
        maxLength={ORDER_NOTE_MAX}
        returnKeyType="done"
        onSubmitEditing={() => void save()}
        accessibilityLabel="Reason for this change"
      />

      {/* Live price */}
      <View style={styles.previewCard} accessibilityLiveRegion="polite">
        <View style={styles.previewHead}>
          <Text style={styles.previewTitle}>{changed ? 'New price' : 'Current price'}</Text>
          {pending && changed && !localProblem ? (
            <View style={styles.updating}>
              <ActivityIndicator size="small" color={colors.forest} />
              <Text style={styles.updatingText}>Updating…</Text>
            </View>
          ) : changed && preview ? (
            <Pressable onPress={resetAll} hitSlop={8} accessibilityRole="button" style={webOnly({ cursor: 'pointer' })}>
              <Text style={styles.resetText}>Undo changes</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={[stale && changed && styles.dim]}>
          <PriceRow label={serviceChanged || draft.optionKey !== initial.optionKey ? 'Service (new)' : 'Service'} value={formatINR(shownAmount.base)} />
          {shownAmount.coupon > 0 ? <PriceRow label={`Coupon${draft.couponCode ? ` ${draft.couponCode}` : ''}`} value={`−${formatINR(shownAmount.coupon)}`} accent /> : null}
          {shownLines
            .filter((l) => l.amount !== 0)
            .map((l) => (
              <PriceRow key={l.key} label={l.label} value={l.amount < 0 ? `−${formatINR(-l.amount)}` : formatINR(l.amount)} accent={l.amount < 0} />
            ))}
          <View style={styles.subtotalRule} />
          <PriceRow label="Subtotal before GST" value={formatINR(shownAmount.total - shownAmount.gst)} />
          <PriceRow label={`GST (${formatPercent(gstPct)}%)`} value={formatINR(shownAmount.gst)} />
          <View style={styles.previewDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatINR(shownAmount.total)}</Text>
          </View>
          {preview && preview.totalChanged ? (
            <View style={[styles.diffPill, preview.difference > 0 ? styles.diffUp : styles.diffDown]}>
              <Text style={[styles.diffText, preview.difference > 0 ? styles.diffTextUp : styles.diffTextDown]}>
                {`${signedINR(preview.difference)} vs ${formatINR(preview.before.total)} before`}
              </Text>
            </View>
          ) : null}
        </View>

        {previewError ? (
          <View style={styles.errorBox} accessibilityRole="alert">
            <TriangleAlert size={15} color={colors.error} strokeWidth={2.4} />
            <Text style={styles.errorText}>{previewError.message}</Text>
            {previewError.field === 'general' && previewError.code !== 'ORDER_LOCKED' && previewError.code !== 'ORDER_CANCELLED' ? (
              <Pressable
                onPress={() => setRetry((n) => n + 1)}
                hitSlop={8}
                accessibilityRole="button"
                style={webOnly({ cursor: 'pointer' })}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            ) : null}
          </View>
        ) : localProblem && changed ? (
          <Text style={styles.hint}>{localProblem}</Text>
        ) : !changed ? (
          <Text style={styles.hint}>Change anything above — the new price shows here before you save.</Text>
        ) : preview?.unchanged && !pending ? (
          <Text style={styles.hint}>That’s the same as the current order — nothing to save.</Text>
        ) : null}

        {preview && !previewError && preview.changes.length > 0 ? (
          <View style={styles.changes}>
            <Text style={styles.changesTitle}>What changes</Text>
            {preview.changes.map((c) => (
              <Text key={c} style={styles.changeLine}>
                • {c}
              </Text>
            ))}
            {preview.notifyCustomer ? (
              <View style={styles.notifyRow}>
                <BellRing size={13} color={colors.secondaryDark} strokeWidth={2.4} />
                <Text style={styles.notifyText}>The customer is notified when you save.</Text>
              </View>
            ) : null}
            {preview.gstChanged ? (
              <Text style={styles.hint}>{`Repriced at today’s GST rate (${formatPercent(preview.amount.gstPercent)}%).`}</Text>
            ) : null}
            {booking.paymentStatus === 'paid' && preview.totalChanged ? (
              <Text style={styles.warnText}>
                {preview.difference > 0
                  ? `Marked paid — collect ${formatINR(preview.difference)} more and update the payment.`
                  : `Marked paid — refund ${formatINR(-preview.difference)} and update the payment.`}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </AdminBottomSheet>
  );
}

function Section({
  title,
  hint,
  locked,
  children,
}: {
  title: string;
  hint?: string;
  locked?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {locked ? (
          <View style={styles.lockTag} accessibilityLabel="Locked">
            <Lock size={11} color={ui.textSecondary} strokeWidth={2.4} />
            <Text style={styles.lockText}>Locked</Text>
          </View>
        ) : null}
      </View>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      <View pointerEvents={locked ? 'none' : 'auto'} style={locked ? styles.lockedBody : undefined}>
        {children}
      </View>
    </View>
  );
}

function PriceRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[styles.priceValue, accent && styles.priceAccent]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.7 },
  mt8: { marginTop: 8 },
  noMargin: { marginBottom: 0 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: radii.control,
    backgroundColor: colors.amberBg,
    marginBottom: spacing.md,
  },
  noticeText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.amberInk },
  section: { marginBottom: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 14, color: ui.text },
  sectionHint: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: ui.textSecondary, marginTop: -4, marginBottom: 8 },
  lockTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.greyBg,
  },
  lockText: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: ui.textSecondary },
  lockedBody: { opacity: 0.55 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textSecondary, marginTop: spacing.sm, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  muted: { fontFamily: fonts.body, fontSize: 13, color: ui.textSecondary },
  hint: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: ui.textSecondary, marginTop: 6 },
  fieldError: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 17, color: colors.error, marginTop: 6 },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  serviceName: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: ui.text },
  serviceMeta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 2 },
  picker: { marginTop: 10, gap: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: radii.control,
    backgroundColor: ui.surfaceMuted,
    minHeight: 44,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: ui.text, paddingVertical: 10 },
  pickerList: { gap: 6 },
  pickRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.hairline,
    backgroundColor: colors.white,
  },
  pickRowActive: { borderColor: ui.brand, backgroundColor: ui.brandSoft },
  pickName: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: ui.text },
  pickNameActive: { color: colors.forest },
  pickMeta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 2 },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  couponApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radii.control,
    backgroundColor: colors.mint,
  },
  couponCode: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: 0.6, color: colors.forest },
  couponMeta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 1 },
  couponRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  applyBtn: { marginBottom: 4 },
  lineCard: {
    padding: 12,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
    marginBottom: 10,
    gap: 8,
  },
  lineTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  signTrack: { flexDirection: 'row', padding: 3, borderRadius: radii.pill, backgroundColor: ui.surfaceMuted, gap: 2 },
  signItem: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill },
  signCharge: { backgroundColor: colors.forest },
  signDiscount: { backgroundColor: colors.secondary },
  signText: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textSecondary },
  signTextActive: { color: colors.white },
  iconBtn: { padding: 6, borderRadius: 8 },
  lineInputs: { flexDirection: 'row', gap: 8 },
  field: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: ui.surfaceMuted,
    fontFamily: fonts.body,
    fontSize: 15,
    color: ui.text,
  },
  amountField: { width: 120, flexDirection: 'row', alignItems: 'center', gap: 2 },
  rupee: { fontFamily: fonts.bodySemi, fontSize: 14, color: ui.textSecondary },
  amountInput: { flex: 1, minWidth: 0, fontFamily: fonts.bodySemi, fontSize: 15, color: ui.text, paddingVertical: 10 },
  reasonField: { fontSize: 13.5 },
  addRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  previewCard: {
    marginTop: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
    ...ui.shadow,
  },
  previewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  previewTitle: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: ui.textTertiary },
  updating: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  updatingText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  resetText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.forest },
  dim: { opacity: 0.45 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  priceLabel: { flex: 1, minWidth: 0, fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  priceValue: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text },
  priceAccent: { color: colors.green },
  previewDivider: { height: 1, backgroundColor: ui.hairline, marginVertical: 10 },
  subtotalRule: { height: StyleSheet.hairlineWidth, backgroundColor: ui.hairline, marginTop: 2, marginBottom: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontFamily: fonts.bodySemi, fontSize: 14, color: ui.text },
  totalValue: { fontFamily: fonts.displayExtra, fontSize: 22, letterSpacing: -0.3, color: ui.text },
  diffPill: { alignSelf: 'flex-end', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
  diffUp: { backgroundColor: colors.amberBg },
  diffDown: { backgroundColor: colors.blueBg },
  diffText: { fontFamily: fonts.bodySemi, fontSize: 12 },
  diffTextUp: { color: colors.amberInk },
  diffTextDown: { color: colors.blue },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.errorBg,
  },
  errorText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 12.5, lineHeight: 18, color: colors.error },
  retryText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.forest },
  changes: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.border, gap: 4 },
  changesTitle: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textSecondary, marginBottom: 2 },
  changeLine: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: ui.text },
  notifyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  notifyText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.secondaryDark },
  warnText: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 17, color: colors.amberInk, marginTop: 6 },
});

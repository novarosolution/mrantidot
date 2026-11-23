import { Plus } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { AddressCard } from '@/components/kit/AddressCard';
import {
  AddressDetailsForm,
  EMPTY_ADDRESS_FORM,
  addressFormValid,
  type AddressFormValues,
} from '@/components/kit/AddressDetailsForm';
import { AddressLocateButton } from '@/components/kit/AddressLocateButton';
import { BookOfferList } from '@/components/kit/BookFlowKit';
import { BookTimePicker } from '@/components/kit/BookTimePicker';
import { PaymentCouponField } from '@/components/kit/PaymentStepKit';
import { ScheduleDayPicker } from '@/components/kit/ScheduleDayPicker';
import { ScheduleModeToggle } from '@/components/kit/ScheduleModeToggle';
import { ScheduleSlotPicker, firstOpenSlot } from '@/components/kit/ScheduleSlotPicker';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PressableScale } from '@/components/ui/PressableScale';
import { fillCopy } from '@/constants/customerUiCopy';
import { colors, typeScale, ui } from '@/constants/theme';
import type { AppLocation } from '@/lib/location';
import { getReducedMotion } from '@/lib/a11yPrefs';
import { useBusinessSettings } from '@/lib/businessSettings';
import { addressInServiceArea } from '@/lib/settingsLabels';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { daysFromToday, isSlotBookable, isTimeBookable, isTimeInActiveWindow, isTimeStarted } from '@/lib/dates';
import { haptic, shakeAnimation } from '@/lib/motion';
import { computePricing } from '@/lib/pricing';
import { formatDuration } from '@/lib/serviceDisplay';
import { useBookingCopy } from '@/lib/schedule-copy';
import { appToast } from '@/lib/toast';
import type { Offer, SavedAddress, ScheduleMode } from '@/types/api';

/*
 * Checkout sheets with their own draft state: typing an address or a coupon re-renders only the
 * sheet, never the cart. Each sheet hands the result back once, on its confirm button.
 */

/** A "no, not yet" nudge: shake + warning haptic (the shake is skipped with Reduce Motion). */
function useNudge() {
  const x = useRef(new Animated.Value(0)).current;
  const nudge = () => {
    haptic('warning');
    if (!getReducedMotion()) shakeAnimation(x).start();
  };
  return { x, nudge };
}

/* ─── Address ──────────────────────────────────────────────────────── */

export type CartAddress = { savedId: string | null; form: AddressFormValues };

export function CartAddressSheet({
  visible,
  onClose,
  addresses,
  value,
  onCommit,
  location,
  locating,
  detectAddress,
}: {
  visible: boolean;
  onClose: () => void;
  addresses: SavedAddress[];
  value: CartAddress;
  onCommit: (next: CartAddress) => void;
  /** Last detected place — pre-fills a fresh form (never over what the customer typed). */
  location: AppLocation | null;
  locating: boolean;
  detectAddress: () => Promise<AppLocation | null>;
}) {
  const copy = useCustomerUiCopy();
  const settings = useBusinessSettings();
  const [savedId, setSavedId] = useState<string | null>(value.savedId);
  const [form, setForm] = useState<AddressFormValues>(value.form);
  const [showNew, setShowNew] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  /** Set when the picked place is outside the admin's service area (same check as the server). */
  const [areaProblem, setAreaProblem] = useState(false);
  const { x, nudge } = useNudge();

  useEffect(() => {
    if (!visible) return;
    setSavedId(value.savedId);
    setShowErrors(false);
    setAreaProblem(false);
    setShowNew(addresses.length === 0 || (!value.savedId && Boolean(value.form.street || value.form.house)));
    setForm(() => {
      const base = value.form;
      if (base.street.trim() || base.house.trim() || !location) return base;
      const city = location.city && location.city !== 'your area' ? location.city : '';
      return { ...base, street: location.line1 || '', city: city || base.city, pincode: location.pincode || base.pincode };
    });
    // Only when the sheet opens — later prop changes must not overwrite the draft.
  }, [visible]);

  async function locate() {
    const loc = await detectAddress();
    if (!loc) return;
    setSavedId(null);
    setShowNew(true);
    setForm((prev) => ({
      ...prev,
      street: loc.line1 || prev.street,
      city: loc.city && loc.city !== 'your area' ? loc.city : prev.city,
      pincode: loc.pincode || prev.pincode,
    }));
    appToast.success(copy.cartLocationFilled, copy.cartLocationFilledSub);
  }

  function use() {
    const saved = savedId ? addresses.find((a) => a.id === savedId) : undefined;
    if (saved || addressFormValid(form)) {
      const served = saved
        ? addressInServiceArea({ city: saved.city, pincode: saved.pincode, text: saved.line1 }, settings)
        : addressInServiceArea({ city: form.city, pincode: form.pincode, text: form.street }, settings);
      if (!served) {
        setAreaProblem(true);
        nudge();
        return;
      }
      haptic('select');
      onCommit(saved ? { savedId: saved.id, form } : { savedId: null, form });
      return;
    }
    setShowNew(true);
    setShowErrors(true);
    nudge();
  }

  const creating = showNew || addresses.length === 0;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={copy.cartAddressTitle}
      footer={
        <>
          {areaProblem ? (
            <Text style={styles.footerWarn} accessibilityLiveRegion="polite">
              {copy.cartAreaNotServed}
            </Text>
          ) : showErrors && !savedId && !addressFormValid(form) ? (
            <Text style={styles.footerWarn} accessibilityLiveRegion="polite">
              {copy.cartAddressIncomplete}
            </Text>
          ) : null}
          <Button title={copy.cartAddressUse} variant="premium" onPress={use} />
        </>
      }
    >
      {addresses.map((a) => (
        <AddressCard
          key={a.id}
          address={a}
          selected={savedId === a.id}
          onPress={() => {
            if (savedId !== a.id) haptic('select');
            setSavedId(a.id);
            setShowNew(false);
            setShowErrors(false);
            setAreaProblem(false);
          }}
        />
      ))}
      {creating ? (
        <Animated.View style={[styles.gap, { transform: [{ translateX: x }] }]}>
          <AddressLocateButton loading={locating} onPress={() => void locate()} />
          <View style={styles.gap}>
            <AddressDetailsForm
              value={form}
              showErrors={showErrors}
              onChange={(next) => {
                setSavedId(null);
                setAreaProblem(false);
                setForm(next);
              }}
            />
          </View>
        </Animated.View>
      ) : (
        <PressableScale
          style={styles.addAnother}
          onPress={() => {
            setSavedId(null);
            setShowNew(true);
          }}
          accessibilityRole="button"
        >
          <Plus size={17} color={ui.brand} strokeWidth={2.6} />
          <Text style={styles.link}>{copy.cartAddressAddAnother}</Text>
        </PressableScale>
      )}
    </BottomSheet>
  );
}

export const EMPTY_CART_ADDRESS: CartAddress = { savedId: null, form: EMPTY_ADDRESS_FORM };

/* ─── Slot ─────────────────────────────────────────────────────────── */

export type CartSchedule = {
  mode: ScheduleMode;
  date: string;
  slot: string;
  hour: number;
  minute: number;
  notes: string;
};

export const scheduleTime = (s: Pick<CartSchedule, 'hour' | 'minute'>) =>
  `${String(s.hour).padStart(2, '0')}:${String(s.minute).padStart(2, '0')}`;

/** Why this visit time can't be booked (admin rules, same as the server), or null when it can. */
export function scheduleProblem(
  s: CartSchedule,
  settings: ReturnType<typeof useBusinessSettings>,
  copy: ReturnType<typeof useCustomerUiCopy>,
): string | null {
  if (daysFromToday(s.date) > settings.booking.horizonDays) {
    return fillCopy(copy.cartDateTooFar, { days: settings.booking.horizonDays });
  }
  if (s.mode === 'standard') {
    return s.slot && isSlotBookable(s.date, s.slot, settings) ? null : copy.cartSlotUnavailable;
  }
  const time = scheduleTime(s);
  if (isTimeStarted(s.date, time)) return copy.cartTimePast;
  if (!isTimeInActiveWindow(time, settings)) return copy.cartTimeOutside;
  if (!isTimeBookable(s.date, time, settings)) {
    return fillCopy(copy.cartSlotTooSoon, { lead: formatDuration(settings.booking.leadMinutes) });
  }
  return null;
}

export function CartSlotSheet({
  visible,
  onClose,
  value,
  onCommit,
  durationLabel,
}: {
  visible: boolean;
  onClose: () => void;
  value: CartSchedule;
  onCommit: (next: CartSchedule) => void;
  durationLabel: string;
}) {
  const copy = useCustomerUiCopy();
  const bookingCopy = useBookingCopy();
  const settings = useBusinessSettings();
  const [draft, setDraft] = useState<CartSchedule>(value);
  const [problem, setProblem] = useState<string | null>(null);
  const { x, nudge } = useNudge();

  useEffect(() => {
    if (!visible) return;
    setDraft(value);
    setProblem(null);
  }, [visible]);

  const patch = (p: Partial<CartSchedule>) => {
    setProblem(null);
    setDraft((d) => ({ ...d, ...p }));
  };

  function confirm() {
    const why = scheduleProblem(draft, settings, copy);
    if (why) {
      setProblem(why);
      nudge();
      return;
    }
    haptic('success');
    onCommit(draft);
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={copy.cartSlotTitle}
      hint={fillCopy(copy.cartSlotHint, { duration: durationLabel })}
      footer={
        <>
          {problem ? (
            <Text style={styles.footerWarn} accessibilityLiveRegion="polite">
              {problem}
            </Text>
          ) : null}
          <Button title={copy.cartSlotConfirm} variant="premium" onPress={confirm} />
        </>
      }
    >
      <ScheduleDayPicker
        selectedDate={draft.date}
        onSelect={(d) => {
          const keep = draft.slot && isSlotBookable(d, draft.slot, settings);
          patch({ date: d, slot: keep ? draft.slot : (firstOpenSlot(d, 'bookable') ?? '') });
        }}
      />
      <View style={styles.gap}>
        <ScheduleModeToggle
          mode={draft.mode}
          onChange={(mode) => {
            haptic('select');
            patch({ mode });
          }}
          standardLabel={bookingCopy.standardModeLabel}
          customLabel={bookingCopy.customModeLabel}
        />
      </View>
      <Animated.View style={[styles.gap, { transform: [{ translateX: x }] }]}>
        {draft.mode === 'standard' ? (
          <ScheduleSlotPicker selectedSlot={draft.slot} onSelect={(slot) => patch({ slot })} date={draft.date} rules="bookable" />
        ) : (
          <>
            <BookTimePicker
              hour={draft.hour}
              minute={draft.minute}
              date={draft.date}
              onChange={(hour, minute) => patch({ hour, minute })}
            />
            <View style={styles.gap}>
              <Input
                label={bookingCopy.wizardNotesLabel}
                value={draft.notes}
                onChangeText={(notes) => setDraft((d) => ({ ...d, notes }))}
                placeholder={bookingCopy.customNotesPlaceholder}
              />
            </View>
          </>
        )}
      </Animated.View>
    </BottomSheet>
  );
}

/* ─── Coupon ───────────────────────────────────────────────────────── */

export function CartCouponSheet({
  visible,
  onClose,
  offers,
  value,
  basePrice,
  onCommit,
}: {
  visible: boolean;
  onClose: () => void;
  offers: Offer[];
  value: string;
  basePrice: number;
  onCommit: (code: string) => void;
}) {
  const copy = useCustomerUiCopy();
  const settings = useBusinessSettings();
  const [code, setCode] = useState(value);
  const [tried, setTried] = useState(false);
  const { x, nudge } = useNudge();

  useEffect(() => {
    if (!visible) return;
    setCode(value);
    setTried(false);
  }, [visible]);

  const pricing = useMemo(
    () => computePricing(basePrice, code, offers, settings.tax.gstPercent),
    [basePrice, code, offers, settings.tax.gstPercent],
  );
  const typed = code.trim().length > 0;
  const applied = typed && pricing.coupon > 0;
  const invalid = typed && !applied;

  function done() {
    if (invalid) {
      setTried(true);
      nudge();
      return;
    }
    onCommit(code.trim());
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={copy.cartCouponsTitle}
      footer={<Button title={copy.cartDone} variant="premium" onPress={done} />}
    >
      {offers.length > 0 ? (
        <View style={styles.bottomGap}>
          <BookOfferList
            offers={offers}
            appliedCode={code}
            onApply={(c) => {
              setTried(false);
              setCode(c);
            }}
          />
        </View>
      ) : null}
      <Animated.View style={{ transform: [{ translateX: x }] }}>
        <PaymentCouponField
          value={code}
          onChangeText={(c) => {
            setTried(false);
            setCode(c);
          }}
          invalid={invalid && (tried || code.trim().length >= 4)}
          applied={applied}
        />
      </Animated.View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: 16 },
  bottomGap: { marginBottom: 14 },
  addAnother: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, minHeight: 44 },
  link: { ...typeScale.bodyStrong, color: ui.brand },
  footerWarn: { ...typeScale.captionStrong, color: colors.amberInk, textAlign: 'center' },
});

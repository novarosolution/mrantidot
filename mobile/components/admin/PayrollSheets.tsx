import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { addDaysKey, formatRangeLabel, istTodayKey } from '@/components/admin/DateRangePicker';
import { formatINR } from '@/components/charts/chartFormat';
import { AdminBottomSheet } from '@/components/kit/AdminBottomSheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { api, getApiErrorMessage } from '@/lib/api';
import { confirmAsync } from '@/lib/confirm';
import { haptic } from '@/lib/motion';
import { appToast } from '@/lib/toast';
import {
  PAY_ADJUSTMENT_AMOUNT_MAX,
  PAY_ADJUSTMENT_REASON_MAX,
  PAY_ADJUSTMENT_REASON_MIN,
  PAYOUT_AMOUNT_MAX,
  PAYOUT_METHODS,
  PAYOUT_NOTE_MAX,
  PAYOUT_REFERENCE_MAX,
  type PayoutMethod,
  type PayrollAdjustment,
  type PayrollPayout,
} from '@/types/adminOps';
import { colors, fonts, radii, spacing, ui } from '@/constants/theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const webPointer: ViewStyle | null = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : null;

/** "Tue, 24 Nov 2026". */
export function dayKeyLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' });
  return `${weekday}, ${d} ${MONTHS[m - 1] ?? ''} ${y}`;
}

/** Whole rupees from what was typed ("12,000" → 12000); null unless positive. */
function parseRupees(text: string): number | null {
  const clean = text.replace(/[,\s₹]/g, '');
  if (!/^\d+(\.\d+)?$/.test(clean)) return null;
  const n = Math.round(Number(clean));
  return n > 0 ? n : null;
}

/** One day at a time, never past `max` (or before `min`) — no nested calendar inside a sheet. */
function DayStepper({
  value,
  onChange,
  min,
  max,
  label,
}: {
  value: string;
  onChange: (key: string) => void;
  min?: string;
  max?: string;
  label: string;
}) {
  const today = istTodayKey();
  const prevOff = Boolean(min && value <= min);
  const nextOff = Boolean(max && value >= max);
  const step = (days: number) => {
    haptic('select');
    onChange(addDaysKey(value, days));
  };
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          onPress={() => step(-1)}
          disabled={prevOff}
          style={({ pressed }) => [styles.stepBtn, prevOff && styles.stepOff, webPointer, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Previous day"
        >
          <ChevronLeft size={18} color={prevOff ? ui.textTertiary : ui.text} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.stepValue} accessibilityLiveRegion="polite">
          {value === today ? `Today · ${dayKeyLabel(value)}` : dayKeyLabel(value)}
        </Text>
        <Pressable
          onPress={() => step(1)}
          disabled={nextOff}
          style={({ pressed }) => [styles.stepBtn, nextOff && styles.stepOff, webPointer, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Next day"
        >
          <ChevronRight size={18} color={nextOff ? ui.textTertiary : ui.text} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

/* ─── Record payout ───────────────────────────────────────────────── */

/**
 * Money paid to a technician for the period on screen. Server: POST /admin/payroll/payouts
 * { technicianId, periodFrom, periodTo, amount, method, reference?, paidAt?, note? } → { payout }.
 * Prefilled with what is still due; paying more is allowed (an advance) after a confirm.
 */
export function RecordPayoutSheet({
  visible,
  technician,
  due,
  period,
  onClose,
  onSaved,
}: {
  visible: boolean;
  technician: { id: string; name: string } | null;
  /** What is still owed for the period (can be ≤ 0). */
  due: number;
  period: { from: string; to: string };
  onClose: () => void;
  onSaved: (payout: PayrollPayout) => void | Promise<void>;
}) {
  const today = istTodayKey();
  const [amountText, setAmountText] = useState('');
  const [method, setMethod] = useState<PayoutMethod>('upi');
  const [reference, setReference] = useState('');
  const [paidOn, setPaidOn] = useState(today);
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setAmountText(due > 0 ? String(Math.round(due)) : '');
    setMethod('upi');
    setReference('');
    setPaidOn(istTodayKey());
    setNote('');
    setTouched(false);
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const amount = parseRupees(amountText);
  const amountError = touched
    ? amount == null
      ? 'Enter the amount paid.'
      : amount > PAYOUT_AMOUNT_MAX
        ? `Keep it under ${formatINR(PAYOUT_AMOUNT_MAX)}.`
        : undefined
    : undefined;
  const over = amount != null && amount > Math.max(0, due) ? amount - Math.max(0, due) : 0;

  async function save() {
    setTouched(true);
    if (!technician || amount == null || amount > PAYOUT_AMOUNT_MAX || busy) {
      haptic('error');
      return;
    }
    if (over > 0) {
      const ok = await confirmAsync({
        title: `Pay ${formatINR(over)} more than due?`,
        message:
          due > 0
            ? `${technician.name} is owed ${formatINR(due)} for this period. The extra is saved as an advance and shows as overpaid.`
            : `Nothing is due to ${technician.name} for this period. The payout is saved as an advance and shows as overpaid.`,
        confirmLabel: 'Record payout',
        cancelLabel: 'Change amount',
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const { data } = await api.post<{ payout: PayrollPayout }>(
        '/admin/payroll/payouts',
        {
          technicianId: technician.id,
          periodFrom: period.from,
          periodTo: period.to,
          amount,
          method,
          ...(reference.trim() ? { reference: reference.trim() } : {}),
          paidAt: paidOn,
          ...(note.trim() ? { note: note.trim() } : {}),
        },
        { skipErrorToast: true },
      );
      haptic('success');
      appToast({ type: 'success', title: 'Payout recorded', message: `${formatINR(amount)} to ${technician.name}` });
      onClose();
      await onSaved(data.payout);
    } catch (err) {
      haptic('error');
      appToast({ type: 'error', title: 'Could not record the payout', message: getApiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminBottomSheet
      visible={visible}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={technician ? `Pay ${technician.name}` : 'Record payout'}
      hint={`For ${formatRangeLabel(period)} · ${due > 0 ? `${formatINR(due)} due` : due < 0 ? `${formatINR(-due)} overpaid already` : 'nothing due'}`}
      footer={
        <>
          <Button title={amount ? `Record ${formatINR(amount)}` : 'Record payout'} variant="premium" onPress={() => void save()} loading={busy} />
          <Button title="Close" variant="secondary" onPress={onClose} disabled={busy} />
        </>
      }
    >
      <Input
        label="Amount paid (₹)"
        value={amountText}
        onChangeText={(t) => setAmountText(t.replace(/[^\d,]/g, '').slice(0, 11))}
        onBlur={() => setTouched(true)}
        keyboardType="number-pad"
        placeholder="0"
        returnKeyType="done"
        onSubmitEditing={() => void save()}
        error={amountError}
        hint={over > 0 ? `${formatINR(over)} more than due — saved as an advance.` : undefined}
        accessibilityLabel="Amount paid in rupees"
      />
      {due > 0 && amount !== Math.round(due) ? (
        <View style={[styles.chips, styles.mb]}>
          <Chip compact label={`Full due · ${formatINR(due)}`} onPress={() => setAmountText(String(Math.round(due)))} />
          {due >= 2 ? <Chip compact label={`Half · ${formatINR(Math.round(due / 2))}`} onPress={() => setAmountText(String(Math.round(due / 2)))} /> : null}
        </View>
      ) : null}

      <Text style={styles.label}>Paid with</Text>
      <View style={[styles.chips, styles.mb]}>
        {PAYOUT_METHODS.map((m) => (
          <Chip key={m.key} compact label={m.label} selected={method === m.key} onPress={() => setMethod(m.key)} />
        ))}
      </View>

      <Input
        label={method === 'cash' ? 'Receipt / voucher no. (optional)' : 'Transaction reference (optional)'}
        value={reference}
        onChangeText={(t) => setReference(t.slice(0, PAYOUT_REFERENCE_MAX))}
        placeholder={method === 'upi' ? 'e.g. UPI ref 4123…' : method === 'bank' ? 'e.g. NEFT / IMPS UTR' : 'Optional'}
        autoCapitalize="characters"
        maxLength={PAYOUT_REFERENCE_MAX}
        returnKeyType="done"
        onSubmitEditing={() => void save()}
        accessibilityLabel="Payment reference"
      />

      <DayStepper label="Paid on" value={paidOn} onChange={setPaidOn} max={today} min={addDaysKey(today, -365)} />

      <Input
        label="Note (optional)"
        value={note}
        onChangeText={(t) => setNote(t.slice(0, PAYOUT_NOTE_MAX))}
        placeholder="e.g. November salary, paid in two parts"
        maxLength={PAYOUT_NOTE_MAX}
        returnKeyType="done"
        onSubmitEditing={() => void save()}
        accessibilityLabel="Payout note"
      />
      <Text style={styles.footnote}>
        Counted for {formatRangeLabel(period)} and for any longer range that holds it. Delete it from the history if it was a mistake.
      </Text>
    </AdminBottomSheet>
  );
}

/* ─── Add adjustment ──────────────────────────────────────────────── */

const BONUS_REASONS = ['Festival bonus', 'Extra job', 'Fuel allowance', 'Performance bonus'];
const DEDUCTION_REASONS = ['Advance recovery', 'Late arrival', 'Damage', 'Uniform / kit'];

/**
 * A one-off bonus (+) or deduction (−) for a technician. Server: POST /admin/payroll/adjustments
 * { technicianId, date, amount, reason } → { adjustment }. Counted in the payroll of the range holding `date`.
 */
export function PayAdjustmentSheet({
  visible,
  technician,
  period,
  onClose,
  onSaved,
}: {
  visible: boolean;
  technician: { id: string; name: string } | null;
  period: { from: string; to: string };
  onClose: () => void;
  onSaved: (adjustment: PayrollAdjustment) => void | Promise<void>;
}) {
  const today = istTodayKey();
  const defaultDay = today < period.from ? period.from : today > period.to ? period.to : today;
  const [kind, setKind] = useState<1 | -1>(1);
  const [amountText, setAmountText] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(defaultDay);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setKind(1);
    setAmountText('');
    setReason('');
    setDate(defaultDay);
    setTouched(false);
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const amount = parseRupees(amountText);
  const trimmed = reason.trim();
  const amountError = touched
    ? amount == null
      ? 'Enter the amount.'
      : amount > PAY_ADJUSTMENT_AMOUNT_MAX
        ? `Keep it under ${formatINR(PAY_ADJUSTMENT_AMOUNT_MAX)}.`
        : undefined
    : undefined;
  const reasonError = touched && trimmed.length < PAY_ADJUSTMENT_REASON_MIN ? `Give a reason (at least ${PAY_ADJUSTMENT_REASON_MIN} characters).` : undefined;
  const outside = date < period.from || date > period.to;

  async function save() {
    setTouched(true);
    if (!technician || amount == null || amount > PAY_ADJUSTMENT_AMOUNT_MAX || trimmed.length < PAY_ADJUSTMENT_REASON_MIN || busy) {
      haptic('error');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post<{ adjustment: PayrollAdjustment }>(
        '/admin/payroll/adjustments',
        { technicianId: technician.id, date, amount: kind * amount, reason: trimmed },
        { skipErrorToast: true },
      );
      haptic('success');
      appToast({
        type: 'success',
        title: kind > 0 ? 'Bonus added' : 'Deduction added',
        message: `${kind > 0 ? '+' : '−'}${formatINR(amount)} for ${technician.name}`,
      });
      onClose();
      await onSaved(data.adjustment);
    } catch (err) {
      haptic('error');
      appToast({ type: 'error', title: 'Could not save the adjustment', message: getApiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminBottomSheet
      visible={visible}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={technician ? `Adjust pay · ${technician.name}` : 'Add adjustment'}
      hint="A bonus adds to what the technician is owed; a deduction takes it off."
      footer={
        <>
          <Button
            title={amount ? `Save ${kind > 0 ? '+' : '−'}${formatINR(amount)}` : 'Save adjustment'}
            variant="premium"
            onPress={() => void save()}
            loading={busy}
          />
          <Button title="Close" variant="secondary" onPress={onClose} disabled={busy} />
        </>
      }
    >
      <View style={styles.kindTrack} accessibilityRole="radiogroup" accessibilityLabel="Bonus or deduction">
        {([1, -1] as const).map((k) => {
          const active = kind === k;
          return (
            <Pressable
              key={k}
              onPress={() => {
                haptic('select');
                setKind(k);
              }}
              style={[styles.kindItem, active && (k > 0 ? styles.kindBonus : styles.kindDeduct), webPointer]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              {k > 0 ? (
                <Plus size={15} color={active ? colors.white : ui.textSecondary} strokeWidth={2.6} />
              ) : (
                <Minus size={15} color={active ? colors.white : ui.textSecondary} strokeWidth={2.6} />
              )}
              <Text style={[styles.kindText, active && styles.kindTextActive]}>{k > 0 ? 'Bonus' : 'Deduction'}</Text>
            </Pressable>
          );
        })}
      </View>

      <Input
        label="Amount (₹)"
        value={amountText}
        onChangeText={(t) => setAmountText(t.replace(/[^\d,]/g, '').slice(0, 9))}
        onBlur={() => setTouched(true)}
        keyboardType="number-pad"
        placeholder="0"
        returnKeyType="done"
        onSubmitEditing={() => void save()}
        error={amountError}
        accessibilityLabel="Adjustment amount in rupees"
      />

      <Text style={styles.label}>Quick reasons</Text>
      <View style={[styles.chips, styles.mb]}>
        {(kind > 0 ? BONUS_REASONS : DEDUCTION_REASONS).map((r) => (
          <Chip key={r} compact label={r} selected={trimmed === r} onPress={() => setReason(r)} />
        ))}
      </View>
      <Input
        label="Reason (required)"
        value={reason}
        onChangeText={(t) => setReason(t.slice(0, PAY_ADJUSTMENT_REASON_MAX))}
        placeholder={kind > 0 ? 'Why is this bonus given?' : 'Why is this deducted?'}
        maxLength={PAY_ADJUSTMENT_REASON_MAX}
        returnKeyType="done"
        onSubmitEditing={() => void save()}
        error={reasonError}
        hint="Shown in the payroll history and the activity log."
        accessibilityLabel="Adjustment reason"
      />

      <DayStepper label="Date" value={date} onChange={setDate} min={addDaysKey(period.from, -365)} max={today} />
      {outside ? (
        <Text style={styles.warn}>{`Outside ${formatRangeLabel(period)} — it will count in the payroll for ${dayKeyLabel(date)}.`}</Text>
      ) : null}
    </AdminBottomSheet>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.ink, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  mb: { marginBottom: spacing.md },
  footnote: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: ui.textSecondary },
  warn: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 17, color: colors.amberInk, marginTop: -6, marginBottom: spacing.sm },
  stepWrap: { marginBottom: 14 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 6,
    borderRadius: radii.control,
    backgroundColor: ui.surfaceMuted,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  stepOff: { backgroundColor: ui.surfaceMuted, borderColor: ui.hairline },
  stepValue: { flex: 1, textAlign: 'center', fontFamily: fonts.bodySemi, fontSize: 14, color: ui.text },
  kindTrack: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radii.pill,
    backgroundColor: ui.surfaceMuted,
    marginBottom: spacing.md,
    gap: 4,
  },
  kindItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  kindBonus: { backgroundColor: colors.forest },
  kindDeduct: { backgroundColor: colors.error },
  kindText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: ui.textSecondary },
  kindTextActive: { color: colors.white },
});

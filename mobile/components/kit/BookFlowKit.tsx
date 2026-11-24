import { StyleSheet, Text, View } from 'react-native';
import { BadgeCheck, Tag } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import type { BookingAmount, Offer } from '@/types/api';
import { colors, fonts, radii, typeScale, ui } from '@/constants/theme';
import { fillCopy } from '@/constants/customerUiCopy';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { useBusinessSettings } from '@/lib/businessSettings';
import { gstLabel } from '@/lib/settingsLabels';
import { haptic } from '@/lib/motion';
import type { CustomerUiCopy } from '@/types/api';

/** ₹1,179 — Indian digit grouping, used everywhere in the booking flow. */
export function rupee(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/* ─── Header ───────────────────────────────────────────────────────── */

/* ─── Sections ─────────────────────────────────────────────────────── */

/* ─── Payment ──────────────────────────────────────────────────────── */

export function offerValue(o: Offer, copy: Pick<CustomerUiCopy, 'offerPercentOff' | 'offerFlatOff'>): string {
  return o.discountType === 'percent'
    ? fillCopy(copy.offerPercentOff, { value: o.discount })
    : fillCopy(copy.offerFlatOff, { amount: rupee(o.discount) });
}

/** Coupons as a tappable list with Apply / Remove — Urban "Coupons and offers". */
export function BookOfferList({
  offers,
  appliedCode,
  onApply,
}: {
  offers: Offer[];
  appliedCode: string;
  onApply: (code: string) => void;
}) {
  const copy = useCustomerUiCopy();
  const applied = appliedCode.trim().toUpperCase();
  return (
    <View style={styles.offerList}>
      {offers.map((o, i) => {
        const on = applied === o.code.toUpperCase();
        return (
          <PressableScale
            key={o.id}
            scaleTo={0.985}
            onPress={() => {
              haptic(on ? 'tap' : 'success');
              onApply(on ? '' : o.code);
            }}
            style={[styles.offerRow, i > 0 && styles.offerDivider]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${o.code}, ${offerValue(o, copy)}. ${on ? copy.offerAppliedA11y : copy.offerTapToApplyA11y}`}
          >
            <View style={[styles.offerIcon, on && styles.offerIconOn]}>
              {on ? (
                <BadgeCheck size={18} color={colors.white} strokeWidth={2.2} />
              ) : (
                <Tag size={17} color={ui.brand} strokeWidth={2.1} />
              )}
            </View>
            <View style={styles.offerText}>
              <Text style={styles.offerTitle}>
                {offerValue(o, copy)} <Text style={styles.offerCode}>· {o.code}</Text>
              </Text>
              {o.description ? (
                <Text style={styles.offerDesc} numberOfLines={1}>
                  {o.description}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.offerAction, on && styles.offerActionOn]}>{on ? copy.offerRemove : copy.offerApply}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

/** Itemised bill — item total, taxes, discount, amount to pay, savings ribbon. */
export function BookBillSummary({
  amount,
  totalLabel,
  gstPercent: gstOverride,
}: {
  amount: Pick<BookingAmount, 'base' | 'gst' | 'coupon' | 'total'>;
  totalLabel?: string;
  /** Rate the amount was priced with (a saved booking); defaults to the admin's current rate. */
  gstPercent?: number;
}) {
  const copy = useCustomerUiCopy();
  const settings = useBusinessSettings();
  return (
    <View>
      <BillRow label={copy.billItemTotal} value={rupee(amount.base)} />
      <BillRow label={gstLabel(copy.billGst, settings, gstOverride)} value={rupee(amount.gst)} />
      {amount.coupon > 0 ? <BillRow label={copy.billCoupon} value={`−${rupee(amount.coupon)}`} accent /> : null}
      <View style={styles.billDivider} />
      <View style={styles.billTotalRow}>
        <Text style={styles.billTotalLabel}>{totalLabel ?? copy.billAmountToPay}</Text>
        <Text style={styles.billTotal}>{rupee(amount.total)}</Text>
      </View>
      {amount.coupon > 0 ? (
        <View style={styles.saveRibbon}>
          <BadgeCheck size={16} color={ui.brand} strokeWidth={2.2} />
          <Text style={styles.saveText}>{fillCopy(copy.billSaving, { amount: rupee(amount.coupon) })}</Text>
        </View>
      ) : null}
    </View>
  );
}

function BillRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.billRow}>
      <Text style={styles.billLabel}>{label}</Text>
      <Text style={[styles.billValue, accent && styles.billAccent]}>{value}</Text>
    </View>
  );
}

/* ─── Review ───────────────────────────────────────────────────────── */

/* ─── Bottom bar ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({




  offerList: {
    borderWidth: 1,
    borderColor: ui.border,
    borderRadius: radii.control,
    overflow: 'hidden',
  },
  offerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, minHeight: 56, backgroundColor: colors.white },
  offerDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.border },
  offerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerIconOn: { backgroundColor: ui.brand },
  offerText: { flex: 1, minWidth: 0 },
  offerTitle: { ...typeScale.bodyStrong, fontFamily: fonts.bodyBold, color: ui.text },
  offerCode: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.textSecondary, letterSpacing: 0.4 },
  offerDesc: { marginTop: 2, fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  offerAction: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: ui.brand },
  offerActionOn: { color: colors.error },

  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  billLabel: { fontFamily: fonts.body, fontSize: 14, color: ui.textSecondary },
  billValue: { fontFamily: fonts.bodySemi, fontSize: 14, color: ui.text },
  billAccent: { color: ui.brand },
  billDivider: {
    marginVertical: 10,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: ui.border,
  },
  billTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  billTotalLabel: { ...typeScale.rowTitle, fontFamily: fonts.bodyBold, color: ui.text },
  billTotal: { ...typeScale.priceLg, fontSize: 19, lineHeight: 24, color: ui.text },
  saveRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.thumb,
    backgroundColor: ui.brandSoft,
  },
  saveText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13, color: ui.brand },



});

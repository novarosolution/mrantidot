import { StyleSheet, Text, View } from 'react-native';
import type { BookingAmount } from '@/types/api';
import { useBookingCopy } from '@/lib/schedule-copy';
import { colors, fonts, premium, shadows, spacing, surfaces, ui } from '@/constants/theme';
import { useBusinessSettings } from '@/lib/businessSettings';
import { gstLabel } from '@/lib/settingsLabels';

/**
 * GST rate this booking was priced with (saved on the booking, else derived from its own amounts), so a
 * later admin change of the rate never relabels an old booking; falls back to the current rate.
 */
function bookingGstPercent(amount: Pick<BookingAmount, 'base' | 'gst' | 'coupon' | 'gstPercent'>, fallback: number): number {
  if (typeof amount.gstPercent === 'number') return amount.gstPercent;
  const taxable = amount.base - amount.coupon;
  if (taxable <= 0 || amount.gst <= 0) return fallback;
  return Math.round((amount.gst / taxable) * 1000) / 10;
}

function rupee(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export function BookingPriceBreakdown({
  amount,
  compact,
  serviceName,
  serviceDesc,
}: {
  amount: Pick<BookingAmount, 'base' | 'gst' | 'coupon' | 'total' | 'gstPercent'>;
  compact?: boolean;
  /** Optional service title shown above the charge rows. */
  serviceName?: string;
  serviceDesc?: string;
}) {
  const copy = useBookingCopy();
  const settings = useBusinessSettings();
  // The admin's GST label with this booking's own rate ("GST (18%)" → "GST (12%)" when priced at 12%).
  const gstText = gstLabel(copy.priceLabelGst, settings, bookingGstPercent(amount, settings.tax.gstPercent));
  return (
    <View style={[styles.wrap, compact && styles.compact, compact && styles.embedded]}>
      <Text style={styles.heading}>{copy.priceBreakdownTitle}</Text>
      {serviceName ? (
        <View style={styles.serviceBlock}>
          <Text style={styles.serviceName}>{serviceName}</Text>
          {serviceDesc ? (
            <Text style={styles.serviceDesc} numberOfLines={2}>
              {serviceDesc}
            </Text>
          ) : null}
        </View>
      ) : null}
      <Row label={copy.priceLabelService} value={rupee(amount.base)} />
      {amount.coupon > 0 ? (
        <Row label={copy.priceLabelCoupon} value={`−${rupee(amount.coupon)}`} valueStyle={styles.discount} />
      ) : null}
      <Row label={gstText} value={rupee(amount.gst)} />
      <View style={styles.divider} />
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{copy.priceLabelTotal}</Text>
        <Text style={styles.totalValue}>{rupee(amount.total)}</Text>
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: surfaces.glassInput,
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    overflow: 'hidden',
    ...shadows.card,
  },
  /** Embedded inside another card — no clipping, so edge glyphs never get cut. */
  compact: {
    padding: spacing.sm,
    overflow: 'visible',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    backgroundColor: 'transparent',
  },
  embedded: { paddingHorizontal: 0, paddingTop: 0 },
  heading: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: ui.textTertiary,
    marginBottom: spacing.sm,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  serviceBlock: {
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: surfaces.glassBorder,
  },
  serviceName: {
    fontFamily: fonts.display,
    fontSize: 15,
    letterSpacing: -0.25,
    color: colors.ink,
  },
  serviceDesc: {
    marginTop: 3,
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.muted,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  value: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  discount: { color: colors.green },
  divider: { height: 1, backgroundColor: surfaces.glassBorder, marginVertical: 12 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: 2,
  },
  totalLabel: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  totalValue: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: ui.text,
    letterSpacing: -0.3,
  },
});

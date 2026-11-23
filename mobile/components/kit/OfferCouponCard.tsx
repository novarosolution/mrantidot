import { useEffect, useRef, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { StyleSheet, Text, View } from 'react-native';
import { fillCopy } from '@/constants/customerUiCopy';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { haptic } from '@/lib/motion';
import { formatRupeeFull } from '@/components/kit/format';
import { ArrowRight, CalendarClock, Check, Copy } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { appToast } from '@/lib/toast';
import type { Offer } from '@/types/api';
import { colors, fonts, radii, spacing, ui } from '@/constants/theme';

const STUB_W = 100;
const NOTCH = 18;

/** Ticket palettes cycle so neighbouring coupons read as distinct offers (matches the home rail). */
const PALETTES = [
  { bg: colors.soft, ink: colors.forest },
  { bg: colors.blueBg, ink: colors.blue },
  { bg: colors.amberBg, ink: colors.amberInk },
] as const;

function discountValue(offer: Offer): string {
  return offer.discountType === 'percent' ? `${offer.discount}%` : `₹${offer.discount}`;
}

function formatExpiry(iso: string | undefined, template: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return fillCopy(template, { date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) });
}

/** Full coupon ticket for the Offers screen — tear-off stub, copyable code, "Apply & book". */
export function OfferCouponCard({
  offer,
  onPress,
  disabled,
  index = 0,
}: {
  offer: Offer;
  onPress?: () => void;
  disabled?: boolean;
  /** Position in the list — picks the ticket colour. */
  index?: number;
}) {
  const copy = useCustomerUiCopy();
  const palette = PALETTES[index % PALETTES.length];
  const expiry = formatExpiry(offer.expiresAt, copy.offerValidTill);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copyCode() {
    await Clipboard.setStringAsync(offer.code);
    haptic('success');
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
    appToast.success(copy.offerCouponCopied, offer.code);
  }

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.985}
      containerStyle={styles.outer}
      style={[styles.ticket, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={fillCopy(copy.offerTicketA11y, { value: discountValue(offer), code: offer.code })}
    >
      <View style={[styles.stub, { backgroundColor: palette.bg }]}>
        <Text style={[styles.save, { color: palette.ink }]}>{copy.offerSave}</Text>
        <Text style={[styles.value, { color: palette.ink }]} numberOfLines={1} adjustsFontSizeToFit>
          {discountValue(offer)}
        </Text>
        <Text style={[styles.save, { color: palette.ink }]}>{copy.offerOff}</Text>
      </View>
      <View style={[styles.perforation, { borderColor: palette.ink }]} />

      <View style={styles.body}>
        <View style={styles.codeRow}>
          <Text style={styles.code} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {offer.code}
          </Text>
          <PressableScale
            onPress={() => void copyCode()}
            hitSlop={10}
            scaleTo={0.92}
            style={[styles.copyPill, copied && { backgroundColor: palette.ink, borderColor: palette.ink }]}
            accessibilityRole="button"
            accessibilityLabel={fillCopy(copy.offerCopyA11y, { code: offer.code })}
          >
            {copied ? (
              <Check size={12} color={colors.white} strokeWidth={3} />
            ) : (
              <Copy size={12} color={palette.ink} strokeWidth={2.4} />
            )}
            <Text style={[styles.copyText, { color: copied ? colors.white : palette.ink }]}>
              {copied ? copy.offerCopied : copy.offerCopy}
            </Text>
          </PressableScale>
        </View>
        <Text style={styles.desc}>{offer.description}</Text>
        {offer.minOrderAmount || expiry ? (
          <View style={styles.metaRow}>
            {offer.minOrderAmount ? (
              <Text style={styles.meta}>{fillCopy(copy.offerMinOrder, { amount: formatRupeeFull(offer.minOrderAmount) })}</Text>
            ) : null}
            {expiry ? (
              <View style={styles.expiryRow}>
                <CalendarClock size={11} color={ui.textTertiary} strokeWidth={2.2} />
                <Text style={styles.meta}>{expiry}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <View style={styles.ctaRow}>
          <Text style={styles.cta}>{copy.offerApplyBook}</Text>
          <View style={styles.ctaIcon}>
            <ArrowRight size={14} color={colors.white} strokeWidth={2.6} />
          </View>
        </View>
      </View>

      <View style={[styles.notch, styles.notchTop]} />
      <View style={[styles.notch, styles.notchBottom]} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  outer: { marginBottom: spacing.md },
  ticket: {
    flexDirection: 'row',
    minHeight: 138,
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
    ...ui.shadowFloat,
  },
  disabled: { opacity: 0.5 },
  stub: { width: STUB_W, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, gap: 2 },
  save: { fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 1.6 },
  value: { fontFamily: fonts.displayExtra, fontSize: 28, letterSpacing: -0.6 },
  perforation: { width: 0, marginVertical: 14, borderLeftWidth: 1.5, borderStyle: 'dashed', opacity: 0.35 },
  body: { flex: 1, minWidth: 0, padding: 14, paddingLeft: 16 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: { flex: 1, fontFamily: fonts.displayExtra, fontSize: 17, letterSpacing: 1, color: ui.text },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  copyText: { fontFamily: fonts.bodyBold, fontSize: 11.5 },
  desc: { marginTop: 5, fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: ui.textSecondary },
  metaRow: { marginTop: 6, gap: 3 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: ui.textTertiary },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  cta: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.brand },
  ctaIcon: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notch: {
    position: 'absolute',
    left: STUB_W - NOTCH / 2,
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    backgroundColor: ui.canvas,
    borderWidth: 1,
    borderColor: ui.border,
  },
  notchTop: { top: -NOTCH / 2 - 1 },
  notchBottom: { bottom: -NOTCH / 2 - 1 },
});

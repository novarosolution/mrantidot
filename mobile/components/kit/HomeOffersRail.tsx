import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, Copy } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { HomeSectionTitle } from '@/components/kit/HomeSectionTitle';
import { appToast } from '@/lib/toast';
import type { Offer } from '@/types/api';
import { colors, fonts, ui } from '@/constants/theme';
import { fillCopy } from '@/constants/customerUiCopy';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { haptic } from '@/lib/motion';

const CARD_W = 268;
const STUB_W = 88;
const NOTCH = 16;

/** Ticket palettes cycle so neighbouring coupons read as distinct offers. */
const PALETTES = [
  { bg: colors.soft, ink: colors.forest },
  { bg: colors.blueBg, ink: colors.blue },
  { bg: colors.amberBg, ink: colors.amberInk },
] as const;

function discountParts(offer: Offer): { value: string } {
  if (offer.discountType === 'percent') return { value: `${offer.discount}%` };
  return { value: `₹${offer.discount}` };
}

function CouponTicket({ offer, index }: { offer: Offer; index: number }) {
  const text = useCustomerUiCopy();
  const palette = PALETTES[index % PALETTES.length];
  const { value } = discountParts(offer);
  const unit = text.offerOff;
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    await Clipboard.setStringAsync(offer.code);
    haptic('success');
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
    appToast.success(text.otpCodeCopied, fillCopy(text.offerCodeCopiedSub, { code: offer.code }));
  }

  return (
    <PressableScale
      onPress={() => void copy()}
      containerStyle={styles.ticketShadow}
      style={styles.ticket}
      accessibilityRole="button"
      accessibilityLabel={fillCopy(text.offerRailTicketA11y, { value, code: offer.code })}
    >
      <View style={[styles.stub, { backgroundColor: palette.bg }]}>
        <Text style={[styles.value, { color: palette.ink }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={[styles.unit, { color: palette.ink }]}>{unit}</Text>
      </View>
      <View style={[styles.perforation, { borderColor: palette.ink }]} />
      <View style={styles.body}>
        <Text style={styles.code} numberOfLines={1}>
          {offer.code}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {offer.description}
          {offer.minOrderAmount ? ` · ${fillCopy(text.offerMinOrder, { amount: `₹${offer.minOrderAmount}` })}` : ''}
        </Text>
        <View style={[styles.copyPill, copied && { backgroundColor: palette.ink, borderColor: palette.ink }]}>
          {copied ? (
            <Check size={12} color={colors.white} strokeWidth={3} />
          ) : (
            <Copy size={12} color={palette.ink} strokeWidth={2.4} />
          )}
          <Text style={[styles.copyText, { color: copied ? colors.white : palette.ink }]}>
            {copied ? text.offerCopied : text.offerCopyCode}
          </Text>
        </View>
      </View>
      {/* Ticket notches — section-coloured half circles over the perforation. */}
      <View style={[styles.notch, styles.notchTop]} />
      <View style={[styles.notch, styles.notchBottom]} />
    </PressableScale>
  );
}

/** "Offers for you" — live coupon codes as tear-off tickets; tap copies the code. */
export function HomeOffersRail({
  title,
  offers,
  onSeeAll,
}: {
  title?: string;
  offers: Offer[];
  onSeeAll?: () => void;
}) {
  const copy = useCustomerUiCopy();
  if (offers.length === 0) return null;
  return (
    <View>
      <HomeSectionTitle title={title ?? copy.offersRailTitle} actionLabel={copy.homeSeeAll} onAction={onSeeAll} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_W + 12}
        snapToAlignment="start"
        contentContainerStyle={styles.row}
      >
        {offers.map((o, i) => (
          <CouponTicket key={o.id} offer={o} index={i} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 12 },
  ticketShadow: { borderRadius: 18, backgroundColor: colors.white, ...ui.shadow },
  ticket: {
    width: CARD_W,
    minHeight: 112,
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  stub: {
    width: STUB_W,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  value: { fontFamily: fonts.displayExtra, fontSize: 24, letterSpacing: -0.6 },
  unit: { marginTop: 1, fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.2 },
  perforation: {
    width: 0,
    marginVertical: 12,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
    opacity: 0.35,
  },
  body: { flex: 1, minWidth: 0, paddingHorizontal: 14, paddingVertical: 12, justifyContent: 'center' },
  code: { fontFamily: fonts.displayExtra, fontSize: 16, letterSpacing: 1, color: ui.text },
  desc: { marginTop: 3, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17, color: ui.textSecondary },
  copyPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 9,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  copyText: { fontFamily: fonts.bodyBold, fontSize: 11.5 },
  notch: {
    position: 'absolute',
    left: STUB_W - NOTCH / 2,
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  notchTop: { top: -NOTCH / 2 - 1 },
  notchBottom: { bottom: -NOTCH / 2 - 1 },
});

import * as Clipboard from 'expo-clipboard';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Copy } from 'lucide-react-native';
import { HomeSectionTitle } from '@/components/kit/HomeSectionTitle';
import { appToast } from '@/lib/toast';
import type { Offer } from '@/types/api';
import { colors, fonts, ui } from '@/constants/theme';

const CARD_W = 268;
const STUB_W = 88;
const NOTCH = 16;

/** Ticket palettes cycle so neighbouring coupons read as distinct offers. */
const PALETTES = [
  { bg: '#E9F6EA', ink: '#0A6423' },
  { bg: '#EEEFFE', ink: '#4338CA' },
  { bg: '#FFF3E2', ink: '#A15C07' },
] as const;

function discountParts(offer: Offer): { value: string; unit: string } {
  if (offer.discountType === 'percent') return { value: `${offer.discount}%`, unit: 'OFF' };
  return { value: `₹${offer.discount}`, unit: 'OFF' };
}

function CouponTicket({ offer, index }: { offer: Offer; index: number }) {
  const palette = PALETTES[index % PALETTES.length];
  const { value, unit } = discountParts(offer);

  async function copy() {
    await Clipboard.setStringAsync(offer.code);
    appToast.success('Code copied', `${offer.code} — apply it at checkout`);
  }

  return (
    <Pressable
      onPress={() => void copy()}
      style={({ pressed }) => [styles.ticket, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${value} off with code ${offer.code}. Tap to copy`}
    >
      <View style={[styles.stub, { backgroundColor: palette.bg }]}>
        <Text style={[styles.value, { color: palette.ink }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={[styles.unit, { color: palette.ink }]}>{unit}</Text>
      </View>
      <View style={[styles.perforation, { borderColor: palette.ink }]} />
      <View style={styles.body}>
        <View style={styles.codeRow}>
          <Text style={styles.code} numberOfLines={1}>
            {offer.code}
          </Text>
          <Copy size={14} color={ui.textSecondary} strokeWidth={2.2} />
        </View>
        <Text style={styles.desc} numberOfLines={2}>
          {offer.description}
        </Text>
        {offer.minOrderAmount ? <Text style={styles.min}>Min. order ₹{offer.minOrderAmount}</Text> : null}
      </View>
      {/* Ticket notches — page-coloured half circles over the perforation. */}
      <View style={[styles.notch, styles.notchTop]} />
      <View style={[styles.notch, styles.notchBottom]} />
    </Pressable>
  );
}

/** "Offers for you" — live coupon codes as tear-off tickets; tap copies the code. */
export function HomeOffersRail({
  title = 'Offers for you',
  offers,
  onSeeAll,
}: {
  title?: string;
  offers: Offer[];
  onSeeAll?: () => void;
}) {
  if (offers.length === 0) return null;
  return (
    <View>
      <HomeSectionTitle title={title} actionLabel="See all" onAction={onSeeAll} />
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
  row: { paddingHorizontal: 16, gap: 12 },
  ticket: {
    width: CARD_W,
    minHeight: 104,
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  stub: {
    width: STUB_W,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  value: { fontFamily: fonts.displayExtra, fontSize: 22, letterSpacing: -0.5 },
  unit: { marginTop: 1, fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.2 },
  perforation: {
    width: 0,
    marginVertical: 12,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
    opacity: 0.35,
  },
  body: { flex: 1, minWidth: 0, paddingHorizontal: 14, paddingVertical: 12, justifyContent: 'center' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  code: { flexShrink: 1, fontFamily: fonts.displayExtra, fontSize: 15.5, letterSpacing: 0.8, color: ui.text },
  desc: { marginTop: 4, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17, color: ui.textSecondary },
  min: { marginTop: 4, fontFamily: fonts.bodySemi, fontSize: 11.5, color: ui.textTertiary },
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

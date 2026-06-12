import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, CheckCircle2, Lock, SprayCan, Tag, X } from 'lucide-react-native';
import { textInputDefaults } from '@/components/ui/textInputDefaults';
import type { BookingAmount, Offer } from '@/types/api';
import { colors, fonts, gradients, premium, spacing } from '@/constants/theme';

export function PaymentPriceHero({
  amount,
}: {
  amount: Pick<BookingAmount, 'base' | 'gst' | 'coupon' | 'total'>;
}) {
  return (
    <LinearGradient
      colors={['#14532D', '#1A6B3C']}
      style={styles.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.heroGlow} />
      <Text style={styles.heroKicker}>Total payable</Text>
      <Text style={styles.heroTotal}>₹{amount.total}</Text>
      {amount.coupon > 0 ? (
        <View style={styles.savePill}>
          <SprayCan size={12} color={colors.lime} />
          <Text style={styles.saveText}>You save ₹{amount.coupon}</Text>
        </View>
      ) : null}
      <View style={styles.heroRows}>
        <View style={styles.heroRow}>
          <Text style={styles.heroRowLabel}>Service</Text>
          <Text style={styles.heroRowVal}>₹{amount.base}</Text>
        </View>
        <View style={styles.heroRow}>
          <Text style={styles.heroRowLabel}>GST (18%)</Text>
          <Text style={styles.heroRowVal}>₹{amount.gst}</Text>
        </View>
        {amount.coupon > 0 ? (
          <View style={styles.heroRow}>
            <Text style={styles.heroRowLabel}>Discount</Text>
            <Text style={[styles.heroRowVal, styles.heroDiscount]}>-₹{amount.coupon}</Text>
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
}

export function PaymentOfferList({
  offers,
  selectedCode,
  onSelect,
}: {
  offers: Offer[];
  selectedCode: string;
  onSelect: (code: string) => void;
}) {
  if (offers.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offerRow}>
      {offers.map((o) => {
        const on = selectedCode.trim().toUpperCase() === o.code;
        return (
          <Pressable
            key={o.id}
            style={({ pressed }) => [styles.offerCard, on && styles.offerCardOn, pressed && styles.pressed]}
            onPress={() => onSelect(on ? '' : o.code)}
          >
            <View style={styles.offerTop}>
              <View style={[styles.offerIcon, on && styles.offerIconOn]}>
                <Tag size={14} color={on ? colors.white : colors.forest} />
              </View>
              {on ? (
                <View style={styles.offerApplied}>
                  <Check size={10} color={colors.forest} strokeWidth={3} />
                </View>
              ) : null}
            </View>
            <Text style={[styles.offerCode, on && styles.offerCodeOn]}>{o.code}</Text>
            <Text style={[styles.offerOff, on && styles.offerOffOn]}>
              {o.discountType === 'percent' ? `${o.discount}% off` : `₹${o.discount} off`}
            </Text>
            {o.description ? (
              <Text style={[styles.offerDesc, on && styles.offerDescOn]} numberOfLines={2}>
                {o.description}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function PaymentCouponField({
  value,
  onChangeText,
  invalid,
  applied,
}: {
  value: string;
  onChangeText: (v: string) => void;
  invalid?: boolean;
  applied?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.couponWrap}>
      <View
        style={[
          styles.couponRow,
          focused && styles.couponRowFocused,
          invalid && styles.couponRowError,
          applied && styles.couponRowApplied,
        ]}
      >
        <Tag size={18} color={applied ? colors.green : invalid ? colors.error : colors.muted} />
        <TextInput
          {...textInputDefaults}
          style={styles.couponInput}
          value={value}
          onChangeText={(t) => onChangeText(t.toUpperCase())}
          placeholder="Enter coupon code"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {value.length > 0 ? (
          <Pressable onPress={() => onChangeText('')} hitSlop={8} style={styles.clearBtn}>
            <X size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {invalid ? <Text style={styles.couponError}>This coupon is not valid</Text> : null}
      {applied ? (
        <View style={styles.couponOk}>
          <CheckCircle2 size={15} color={colors.green} />
          <Text style={styles.couponOkText}>Applied</Text>
        </View>
      ) : null}
    </View>
  );
}

export function PaymentSecureNote() {
  return (
    <View style={styles.secure}>
      <Lock size={14} color={colors.forest} />
      <Text style={styles.secureText}>Secure checkout · Your payment details stay protected</Text>
    </View>
  );
}

export function PaymentReadyBanner({
  methodLabel,
  total,
}: {
  methodLabel: string;
  total: number;
}) {
  return (
    <LinearGradient
      colors={['#E8F5EC', colors.white]}
      style={styles.readyBanner}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.readyTextCol}>
        <Text style={styles.readyKicker}>Ready to continue</Text>
        <Text style={styles.readyMethod}>{methodLabel}</Text>
        <Text style={styles.readyTotal}>₹{total} estimated</Text>
      </View>
      <LinearGradient colors={[gradients.primary[0], gradients.primary[1]]} style={styles.readyPill}>
        <Check size={14} color={colors.white} strokeWidth={3} />
      </LinearGradient>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 18,
    padding: spacing.md,
    overflow: 'hidden',
    ...premium.shadowSoft,
  },
  heroGlow: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(168,224,78,0.15)',
  },
  heroKicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTotal: {
    fontFamily: fonts.displayExtra,
    fontSize: 36,
    color: colors.lime,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  savePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  saveText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.lime },
  heroRows: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    gap: 6,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroRowLabel: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  heroRowVal: { fontFamily: fonts.bodySemi, fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  heroDiscount: { color: colors.lime },
  offerRow: { gap: 10, paddingRight: 4 },
  offerCard: {
    width: 140,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  offerCardOn: {
    backgroundColor: colors.soft,
    borderColor: colors.forest,
    borderWidth: 2,
  },
  pressed: { opacity: 0.9 },
  offerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  offerIconOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  offerApplied: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerCode: { fontFamily: fonts.displayExtra, fontSize: 15, color: colors.forest },
  offerCodeOn: { color: colors.forest },
  offerOff: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.green, marginTop: 2 },
  offerOffOn: { color: colors.forest },
  offerDesc: { fontFamily: fonts.body, fontSize: 10.5, color: colors.muted, marginTop: 4, lineHeight: 14 },
  offerDescOn: { color: colors.forest, opacity: 0.85 },
  couponWrap: { gap: spacing.xs },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  couponRowFocused: { backgroundColor: colors.white, borderColor: colors.forest },
  couponRowError: { borderColor: colors.error, backgroundColor: colors.errorBg },
  couponRowApplied: { borderColor: colors.green, backgroundColor: colors.soft },
  couponInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.bodySemi,
    letterSpacing: 1,
    color: colors.ink,
    paddingVertical: 12,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponError: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.error, paddingHorizontal: 4 },
  couponOk: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  couponOkText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.green, flex: 1 },
  secure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  secureText: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, flex: 1, lineHeight: 16 },
  readyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.18)',
    gap: 12,
  },
  readyTextCol: { flex: 1 },
  readyKicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.green,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readyMethod: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.forest, marginTop: 2 },
  readyTotal: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  readyPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

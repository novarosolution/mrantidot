import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, Calendar, Copy, Tag } from 'lucide-react-native';
import { appToast } from '@/lib/toast';
import type { Offer } from '@/types/api';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

function discountLabel(offer: Offer): string {
  if (offer.discountType === 'percent') return `${offer.discount}% OFF`;
  return `₹${offer.discount} OFF`;
}

function formatExpiry(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `Valid till ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export function OfferCouponCard({
  offer,
  onPress,
  disabled,
}: {
  offer: Offer;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const expiry = formatExpiry(offer.expiresAt);

  async function copyCode() {
    await Clipboard.setStringAsync(offer.code);
    appToast.success('Coupon copied', offer.code);
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.wrap, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <LinearGradient
        colors={['#14532D', '#0E3A20']}
        style={styles.leftPanel}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Text style={styles.saveLabel}>SAVE</Text>
        <Text style={styles.saveValue}>{discountLabel(offer)}</Text>
        <View style={styles.perforation} />
      </LinearGradient>

      <View style={styles.rightPanel}>
        <View style={styles.top}>
          <View style={styles.codeRow}>
            <Tag size={14} color={colors.forest} />
            <Text style={styles.code}>{offer.code}</Text>
            <Pressable onPress={() => void copyCode()} hitSlop={8} style={styles.copyBtn}>
              <Copy size={14} color={colors.muted} />
            </Pressable>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Coupon</Text>
          </View>
        </View>

        <Text style={styles.desc}>{offer.description}</Text>

        <View style={styles.metaRow}>
          {offer.minOrderAmount ? (
            <Text style={styles.meta}>Min order ₹{offer.minOrderAmount}</Text>
          ) : null}
          {expiry ? (
            <View style={styles.expiryRow}>
              <Calendar size={11} color={colors.muted} />
              <Text style={styles.meta}>{expiry}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.ctaRow}>
          <Text style={styles.cta}>Apply & book</Text>
          <View style={styles.ctaIcon}>
            <ArrowRight size={14} color={colors.forest} strokeWidth={2.5} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.08)',
    ...shadows.floating,
  },
  pressed: { opacity: 0.96, transform: [{ scale: 0.995 }] },
  disabled: { opacity: 0.5 },
  leftPanel: {
    width: 96,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
  },
  saveValue: {
    fontFamily: fonts.displayExtra,
    fontSize: 18,
    color: colors.lime,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 22,
  },
  perforation: {
    position: 'absolute',
    right: -6,
    top: '15%',
    bottom: '15%',
    width: 12,
    borderRightWidth: 2,
    borderRightColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
  },
  rightPanel: {
    flex: 1,
    padding: spacing.md,
    paddingLeft: spacing.sm + 4,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  codeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  code: {
    fontFamily: fonts.displayExtra,
    fontSize: 17,
    color: colors.forest,
    letterSpacing: 0.5,
  },
  copyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: premium.accentGoldBg,
    borderWidth: 1,
    borderColor: 'rgba(182,132,28,0.25)',
  },
  badgeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    color: premium.accentGold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  metaRow: { marginTop: spacing.sm, gap: 4 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cta: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  ctaIcon: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

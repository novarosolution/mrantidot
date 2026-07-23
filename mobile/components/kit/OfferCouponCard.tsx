import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { homeShadow } from '@/components/kit/homeUi';
import { appToast } from '@/lib/toast';
import type { Offer } from '@/types/api';
import { colors, customerType, premium, spacing, surfaces } from '@/constants/theme';

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
    <View style={[styles.outer, disabled && styles.disabled]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [styles.wrap, pressed && !disabled && styles.pressed]}
      >
      <LinearGradient
        colors={['#1A8734', '#0A6423']}
        style={styles.leftPanel}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Text style={styles.saveLabel}>SAVE</Text>
        <Text style={styles.saveValue}>{discountLabel(offer)}</Text>
        <View style={styles.perforation} />
      </LinearGradient>

      <View style={styles.rightPanel}>
        <LinearGradient
          colors={['rgba(255,255,255,0.92)', 'rgba(246,250,242,0.78)', 'rgba(234,246,227,0.55)']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
        />
        <View style={styles.rightInner}>
          <View style={styles.top}>
            <View style={styles.codeRow}>
              <PremiumIcon icon={AppIcons.ui.tag} variant="mint" size={14} color={colors.forest} boxSize={28} />
              <Text style={styles.code}>{offer.code}</Text>
              <Pressable onPress={() => void copyCode()} hitSlop={8} style={styles.copyBtn}>
                <PremiumIcon icon={AppIcons.ui.copy} variant="plain" size={14} color={colors.forest} strokeWidth={2.3} />
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
                <PremiumIcon icon={AppIcons.ui.calendar} variant="plain" size={11} color={colors.muted} />
                <Text style={styles.meta}>{expiry}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.ctaRow}>
            <Text style={styles.cta}>Apply & book</Text>
            <View style={styles.ctaIcon}>
              <PremiumIcon icon={AppIcons.ui.arrowRight} variant="chevron" size={14} color={colors.forest} strokeWidth={2.5} />
            </View>
          </View>
        </View>
      </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginBottom: spacing.md,
    borderRadius: premium.radiusCard,
    ...homeShadow.card,
  },
  wrap: {
    flexDirection: 'row',
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
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
  saveLabel: { ...customerType.offerSaveLabel },
  saveValue: {
    ...customerType.offerSaveValue,
    marginTop: 4,
  },
  perforation: {
    position: 'absolute',
    right: -6,
    top: '15%',
    bottom: '15%',
    width: 12,
    borderRightWidth: 2,
    borderRightColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  rightPanel: {
    flex: 1,
    overflow: 'hidden',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: surfaces.glassBorderStrong,
  },
  rightInner: {
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
  code: { ...customerType.offerCode, color: colors.ink },
  copyBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EAF6E3',
    borderWidth: 1,
    borderColor: 'rgba(143,208,60,0.5)',
  },
  badgeText: { ...customerType.pillLabel, color: colors.forest },
  desc: {
    ...customerType.offerDesc,
    marginTop: spacing.sm,
    color: colors.ink,
  },
  metaRow: { marginTop: spacing.sm, gap: 4 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { ...customerType.listMetaMuted, color: colors.muted },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: surfaces.glassBorderStrong,
  },
  cta: { ...customerType.sectionLink, fontSize: 13, color: colors.forest },
  ctaIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

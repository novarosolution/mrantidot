import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { appToast } from '@/lib/toast';
import type { Offer } from '@/types/api';
import { colors, customerType, premium, spacing, ui } from '@/constants/theme';

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
        colors={[colors.forestMid, colors.forest]}
        style={styles.leftPanel}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Text style={styles.saveLabel}>SAVE</Text>
        <Text style={styles.saveValue}>{discountLabel(offer)}</Text>
        <View style={styles.perforation} />
      </LinearGradient>

      <View style={styles.rightPanel}>
        <View style={styles.rightInner}>
          <View style={styles.codeRow}>
            <PremiumIcon icon={AppIcons.ui.tag} variant="mint" size={14} color={colors.forest} boxSize={28} />
            <Text style={styles.code} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {offer.code}
            </Text>
            <Pressable
              onPress={() => void copyCode()}
              hitSlop={8}
              style={styles.copyBtn}
              accessibilityRole="button"
              accessibilityLabel={`Copy code ${offer.code}`}
            >
              <PremiumIcon icon={AppIcons.ui.copy} variant="plain" size={14} color={colors.forest} strokeWidth={2.3} fill="none" />
            </Pressable>
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
    ...ui.shadow,
  },
  wrap: {
    flexDirection: 'row',
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
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
    borderLeftColor: ui.hairline,
  },
  rightInner: {
    flex: 1,
    padding: spacing.md,
    paddingLeft: spacing.sm + 4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  /** Long codes shrink instead of pushing the copy button off the card. */
  code: { ...customerType.offerCode, color: ui.text, flexShrink: 1 },
  copyBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desc: {
    ...customerType.offerDesc,
    marginTop: spacing.sm,
    color: ui.textSecondary,
  },
  metaRow: { marginTop: spacing.sm, gap: 4 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { ...customerType.listMetaMuted, color: ui.textTertiary },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  cta: { ...customerType.sectionLink, fontSize: 13, color: ui.brand },
  ctaIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

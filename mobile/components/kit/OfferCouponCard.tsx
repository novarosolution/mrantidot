import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tag } from 'lucide-react-native';
import type { Offer } from '@/types/api';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function OfferCouponCard({
  offer,
  onPress,
  disabled,
}: {
  offer: Offer;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.wrap, disabled && styles.disabled]}
    >
      <View style={styles.accent} />
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.codeRow}>
            <Tag size={16} color={colors.forest} />
            <Text style={styles.code}>{offer.code}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>₹{offer.discount} OFF</Text>
          </View>
        </View>
        <Text style={styles.desc}>{offer.description}</Text>
        <Text style={styles.cta}>Tap to apply →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.forest,
    borderStyle: 'dashed',
    overflow: 'hidden',
    ...premium.shadowSoft,
  },
  disabled: { opacity: 0.5 },
  accent: {
    width: 6,
    backgroundColor: colors.lime,
  },
  body: { flex: 1, padding: spacing.md },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: { fontFamily: fonts.displayExtra, fontSize: 16, color: colors.forest },
  badge: {
    backgroundColor: premium.accentGoldBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { fontFamily: fonts.display, fontSize: 12, color: premium.accentGold },
  desc: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 8 },
  cta: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.green, marginTop: 10 },
});

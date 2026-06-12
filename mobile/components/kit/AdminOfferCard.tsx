import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Edit, Percent } from 'lucide-react-native';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import type { Offer } from '@/types/api';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export const AdminOfferCard = memo(function AdminOfferCard({
  offer,
  onPress,
  onEdit,
  onToggle,
}: {
  offer: Offer;
  onPress: () => void;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const inactive = !offer.active;
  const expired = offer.expiresAt ? new Date(offer.expiresAt) < new Date() : false;
  const maxed = offer.maxUses != null && offer.useCount != null && offer.useCount >= offer.maxUses;
  const discountLabel =
    offer.discountType === 'percent' ? `${offer.discount}% off` : `₹${offer.discount} off`;

  return (
    <View style={[styles.card, inactive && styles.inactive]}>
      <Pressable style={styles.main} onPress={onPress}>
        <View style={[styles.icon, inactive && styles.iconMuted]}>
          <Percent size={18} color={inactive ? colors.muted : colors.forest} />
        </View>
        <View style={styles.body}>
          <Text style={styles.code}>{offer.code}</Text>
          <Text style={styles.discount}>{discountLabel}</Text>
          {offer.description ? (
            <Text style={styles.desc} numberOfLines={1}>
              {offer.description}
            </Text>
          ) : null}
          {expired ? <Text style={styles.badge}>Expired</Text> : null}
          {maxed ? <Text style={styles.badge}>Max uses</Text> : null}
        </View>
      </Pressable>
      <View style={styles.actions}>
        <ToggleSwitch value={offer.active} onToggle={onToggle} />
        <Pressable style={styles.editBtn} onPress={onEdit} hitSlop={8}>
          <Edit size={15} color={colors.forest} />
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    ...shadows.card,
  },
  inactive: { opacity: 0.75 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMuted: { backgroundColor: colors.greyBg },
  body: { flex: 1, minWidth: 0 },
  code: { fontFamily: fonts.displayExtra, fontSize: 16, color: colors.forest, letterSpacing: 0.3 },
  desc: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  discount: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink, marginTop: 2 },
  badge: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.error, marginTop: 4 },
  actions: { alignItems: 'flex-end', gap: 8, marginLeft: 8 },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

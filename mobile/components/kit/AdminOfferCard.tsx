import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Edit, Tag } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import type { Offer } from '@/types/api';
import { colors, fonts, premium } from '@/constants/theme';

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
  const maxed =
    offer.maxUses != null && offer.useCount != null && offer.useCount >= offer.maxUses;
  const discountLabel =
    offer.discountType === 'percent' ? `${offer.discount}% off` : `₹${offer.discount} off`;

  return (
    <Card variant="premium" style={{ ...styles.card, ...(inactive ? styles.inactive : {}) }}>
      <Pressable style={styles.main} onPress={onPress}>
        <View style={[styles.icon, inactive && styles.iconMuted]}>
          <Tag size={18} color={inactive ? colors.muted : colors.lime} />
        </View>
        <View style={styles.body}>
          <Text style={styles.code}>{offer.code}</Text>
          <Text style={styles.desc} numberOfLines={2}>
            {offer.description}
          </Text>
          <Text style={styles.discount}>{discountLabel}</Text>
          {expired ? <Text style={styles.badge}>Expired</Text> : null}
          {maxed ? <Text style={styles.badge}>Max uses reached</Text> : null}
          {offer.expiresAt && !expired ? (
            <Text style={styles.meta}>Expires {offer.expiresAt.slice(0, 10)}</Text>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.actions}>
        <ToggleSwitch value={offer.active} onToggle={onToggle} />
        <Pressable style={styles.editBtn} onPress={onEdit} hitSlop={8}>
          <Edit size={15} color={colors.green} />
        </Pressable>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 14,
    borderRadius: premium.radiusCard,
    ...premium.shadowSoft,
  },
  inactive: { opacity: 0.75 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMuted: { backgroundColor: colors.greyBg },
  body: { flex: 1, minWidth: 0 },
  code: { fontFamily: fonts.displayExtra, fontSize: 17, color: colors.green, letterSpacing: 0.5 },
  desc: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 4, lineHeight: 18 },
  discount: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink, marginTop: 6 },
  badge: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.error, marginTop: 4 },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  actions: { alignItems: 'flex-end', gap: 10, marginLeft: 8 },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

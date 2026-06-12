import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import type { Service } from '@/types/api';
import { serviceDisplayRating } from '@/lib/ratings';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

const COLS = 2;
const GAP = 10;

function cardWidth() {
  const pad = spacing.md * 2;
  return (Dimensions.get('window').width - pad - GAP * (COLS - 1)) / COLS;
}

export function ServiceGrid({
  services,
  onPressItem,
  limit = 8,
}: {
  services: Service[];
  onPressItem?: (service: Service) => void;
  limit?: number;
}) {
  const items = services.slice(0, limit);
  const width = cardWidth();

  return (
    <View style={styles.grid}>
      {items.map((s) => {
        const rating = serviceDisplayRating(s);
        return (
          <Pressable
            key={s.id}
            style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
            onPress={() => onPressItem?.(s)}
          >
            <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <View style={styles.iconWrap}>
              <ServiceIcon iconKey={s.iconKey} size={24} color={colors.forest} />
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {s.name}
            </Text>
            <View style={styles.footer}>
              <Text style={styles.price}>₹{s.basePrice}</Text>
              {rating > 0 ? (
                <View style={styles.ratingRow}>
                  <Star size={9} color={premium.accentGold} fill={premium.accentGold} />
                  <Text style={styles.rating}>{rating.toFixed(1)}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: GAP,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    padding: spacing.sm + 2,
    overflow: 'hidden',
    ...shadows.card,
  },
  goldBar: {
    height: 3,
    marginHorizontal: -(spacing.sm + 2),
    marginTop: -(spacing.sm + 2),
    marginBottom: spacing.sm,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    lineHeight: 17,
    color: colors.ink,
    minHeight: 34,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  price: {
    fontFamily: fonts.displayExtra,
    fontSize: 16,
    color: premium.accentGold,
    letterSpacing: -0.3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.muted,
  },
});

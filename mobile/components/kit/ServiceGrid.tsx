import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import type { Service } from '@/types/api';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

const CARD_W = 148;
const GAP = 12;

export function ServiceGrid({
  services,
  onPressItem,
}: {
  services: Service[];
  onPressItem?: (service: Service) => void;
}) {
  const items = services.slice(0, 10);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      decelerationRate="fast"
      snapToInterval={CARD_W + GAP}
    >
      {items.map((s) => {
        const rating = s.stats?.avgRating ?? s.rating ?? 0;
        return (
          <Pressable
            key={s.id}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() => onPressItem?.(s)}
          >
            <LinearGradient
              colors={['#E8F5EC', '#F7FAF6']}
              style={styles.iconWrap}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <ServiceIcon iconKey={s.iconKey} size={30} color={colors.forest} />
            </LinearGradient>
            <Text style={styles.name} numberOfLines={2}>
              {s.name}
            </Text>
            {rating > 0 ? (
              <View style={styles.ratingRow}>
                <Star size={10} color={premium.accentGold} fill={premium.accentGold} />
                <Text style={styles.rating}>{rating.toFixed(1)}</Text>
              </View>
            ) : null}
            <View style={styles.priceRow}>
              <Text style={styles.from}>from</Text>
              <Text style={styles.price}>₹{s.basePrice}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: GAP,
  },
  card: {
    width: CARD_W,
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: 'rgba(182,132,28,0.12)',
    borderTopWidth: 3,
    borderTopColor: premium.accentGold,
    padding: spacing.sm + 4,
    alignItems: 'center',
    ...shadows.card,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.08)',
  },
  name: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    lineHeight: 17,
    color: colors.ink,
    textAlign: 'center',
    minHeight: 34,
    width: '100%',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  rating: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.muted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 6,
  },
  from: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  price: {
    fontFamily: fonts.displayExtra,
    fontSize: 17,
    color: premium.accentGold,
    letterSpacing: -0.3,
  },
});

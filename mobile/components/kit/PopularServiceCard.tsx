import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, Star } from 'lucide-react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import { formatSocialProof } from '@/lib/display';
import { serviceDisplayRating } from '@/lib/ratings';
import type { Service } from '@/types/api';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function PopularServiceCard({
  service,
  bookingCount,
  onPress,
}: {
  service: Service;
  bookingCount?: number;
  onPress: () => void;
}) {
  const social = formatSocialProof(
    bookingCount ?? service.stats?.bookingCount,
    serviceDisplayRating(service),
  );
  const rating = serviceDisplayRating(service);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <LinearGradient
        colors={['#14532D', '#0E3A20', '#0A2E18']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.glow} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Popular</Text>
        </View>
        <View style={styles.body}>
          <View style={styles.icon}>
            <ServiceIcon iconKey={service.iconKey} size={32} color={colors.lime} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={2}>
              {service.name}
            </Text>
            <View style={styles.metaRow}>
              {rating > 0 ? (
                <View style={styles.ratingChip}>
                  <Star size={11} color={premium.accentGold} fill={premium.accentGold} />
                  <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                </View>
              ) : null}
              {social ? <Text style={styles.social}>{social}</Text> : null}
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{service.basePrice}</Text>
            </View>
          </View>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Book</Text>
            <ArrowRight size={16} color={colors.forest} strokeWidth={2.5} />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.md, marginBottom: spacing.lg },
  pressed: { opacity: 0.96, transform: [{ scale: 0.99 }] },
  card: {
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    overflow: 'hidden',
    ...shadows.hero,
  },
  glow: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(168,224,78,0.12)',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(168,224,78,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(168,224,78,0.3)',
    marginBottom: spacing.sm,
  },
  badgeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.lime,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  body: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  name: {
    fontFamily: fonts.displayExtra,
    fontSize: 17,
    color: colors.white,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  ratingText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.white,
  },
  social: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  price: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: premium.accentGold,
    letterSpacing: -0.4,
  },
  cta: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  ctaText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.forest,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

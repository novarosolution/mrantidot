import { useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { HomeSectionTitle } from '@/components/kit/HomeSectionTitle';
import { ServiceThumb } from '@/components/kit/ServiceThumb';
import { Skeleton, useSkeletonPulse } from '@/components/ui/Skeleton';
import { serviceDisplayRating } from '@/lib/ratings';
import type { Service } from '@/types/api';
import { colors, fonts, ui } from '@/constants/theme';

const CARD_W = 152;
const GAP = 12;

function RailCard({ service: s, badge, onPress }: { service: Service; badge?: string; onPress: () => void }) {
  const rating = serviceDisplayRating(s);
  const reviews = s.stats?.reviewCount ?? 0;
  const scale = useRef(new Animated.Value(1)).current;
  const spring = (to: number) =>
    Animated.spring(scale, { toValue: to, friction: 6, tension: 220, useNativeDriver: true }).start();

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      onPressIn={() => spring(0.96)}
      onPressOut={() => spring(1)}
      accessibilityRole="button"
      accessibilityLabel={`${s.name}, ₹${s.basePrice}`}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View>
          <ServiceThumb service={s} width={CARD_W} height={118} radius={18} iconSize={50} />
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {s.name}
        </Text>
        {rating > 0 ? (
          <View style={styles.ratingRow}>
            <Star size={12} color={ui.star} fill={ui.star} strokeWidth={1.5} />
            <Text style={styles.rating}>{rating.toFixed(1)}</Text>
            {reviews > 0 ? <Text style={styles.reviews}>({reviews})</Text> : null}
          </View>
        ) : null}
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{s.basePrice}</Text>
          <Text style={styles.book}>Book</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

/** Loading placeholder for the rail (title + three cards). */
export function MostBookedRailSkeleton() {
  const pulse = useSkeletonPulse();
  return (
    <View>
      <View style={styles.skeletonTitle}>
        <Skeleton width={190} height={22} radius={8} pulse={pulse} />
      </View>
      <View style={styles.row}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.card}>
            <Skeleton width={CARD_W} height={118} radius={18} pulse={pulse} />
            <Skeleton width={CARD_W * 0.8} height={13} radius={6} pulse={pulse} style={styles.skeletonLine} />
            <Skeleton width={CARD_W * 0.4} height={13} radius={6} pulse={pulse} style={styles.skeletonLine} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Horizontal "Most booked" rail — thumbnail, two-line name, rating and price (Urban-style). */
export function MostBookedRail({
  title,
  actionLabel,
  onAction,
  services,
  badge,
  onPressItem,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  services: Service[];
  /** Small tag on the first card, e.g. "Most booked". */
  badge?: string;
  onPressItem: (service: Service) => void;
}) {
  if (services.length === 0) return null;

  return (
    <View>
      <HomeSectionTitle title={title} actionLabel={actionLabel} onAction={onAction} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_W + GAP}
        snapToAlignment="start"
        contentContainerStyle={styles.row}
      >
        {services.map((s, index) => (
          <RailCard key={s.id} service={s} badge={index === 0 ? badge : undefined} onPress={() => onPressItem(s)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 16, gap: GAP },
  card: { width: CARD_W },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.1, color: ui.brand },
  name: {
    marginTop: 10,
    minHeight: 38,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    lineHeight: 19,
    color: ui.text,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rating: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.text },
  reviews: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  priceRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  price: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: ui.text },
  book: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    color: ui.brand,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ui.border,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  skeletonTitle: { paddingHorizontal: 16, marginBottom: 16 },
  skeletonLine: { marginTop: 10 },
});

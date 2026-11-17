import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, Star } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { HomeSectionTitle } from '@/components/kit/HomeSectionTitle';
import { ServiceThumb } from '@/components/kit/ServiceThumb';
import { Skeleton, useSkeletonPulse } from '@/components/ui/Skeleton';
import { serviceDisplayRating } from '@/lib/ratings';
import type { Service } from '@/types/api';
import { colors, fonts, ui } from '@/constants/theme';

const CARD_W = 168;
const THUMB_H = 120;
const GAP = 12;

function RailCard({ service: s, badge, onPress }: { service: Service; badge?: string; onPress: () => void }) {
  const rating = serviceDisplayRating(s);
  const reviews = s.stats?.reviewCount ?? 0;
  return (
    <PressableScale
      containerStyle={styles.cardWrap}
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${s.name}, ₹${s.basePrice}`}
    >
      <View>
        <ServiceThumb service={s} width={CARD_W - 16} height={THUMB_H} radius={16} iconSize={54} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
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
          <View style={styles.book}>
            <ArrowRight size={16} color={colors.white} strokeWidth={2.5} />
          </View>
        </View>
      </View>
    </PressableScale>
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
            <Skeleton width={CARD_W - 16} height={THUMB_H} radius={16} pulse={pulse} />
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
  row: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: GAP },
  cardWrap: { width: CARD_W },
  card: {
    width: CARD_W,
    padding: 8,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadowFloat,
  },
  cardBody: { paddingHorizontal: 4, paddingTop: 10, paddingBottom: 4 },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.1, color: ui.brand },
  name: {
    minHeight: 38,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: -0.15,
    color: ui.text,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rating: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.text },
  reviews: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  priceRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  price: { fontFamily: fonts.displayExtra, fontSize: 16, letterSpacing: -0.3, color: ui.text },
  book: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonTitle: { paddingHorizontal: 16, marginBottom: 16 },
  skeletonLine: { marginTop: 10 },
});

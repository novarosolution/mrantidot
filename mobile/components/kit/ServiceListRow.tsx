import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { ServiceThumb } from '@/components/kit/ServiceThumb';
import { serviceDurationLabel } from '@/components/kit/HomeServiceRail';
import { serviceDisplayRating } from '@/lib/ratings';
import { formatRupeeFull } from '@/components/kit/format';
import type { Service } from '@/types/api';
import { colors, fonts, ui } from '@/constants/theme';
import { serviceStartPrice } from '@/lib/serviceDisplay';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

const THUMB = 100;

/** "₹699", or "₹30 / sq ft" for the per-area services (bird, silo). */
export function servicePriceLabel(service: Service): string {
  if (service.basePrice <= 50 && (service.serviceTypes?.includes('bird') || service.serviceTypes?.includes('silo'))) {
    return `₹${service.basePrice} / sq ft`;
  }
  return formatRupeeFull(serviceStartPrice(service));
}

/**
 * Urban-style service row — details on the left, thumbnail on the right with the
 * "Book" button overlapping its bottom edge.
 */
export function ServiceListRow({
  service,
  onPress,
  onBook,
  showDivider = true,
  priceLabel,
  badge,
  detailed = false,
}: {
  service: Service;
  onPress: () => void;
  onBook?: () => void;
  showDivider?: boolean;
  /** Overrides the default price text (see servicePriceLabel). */
  priceLabel?: string;
  /** Small label above the name, e.g. "Popular". */
  badge?: string;
  /** Category-page style: admin highlights as bullets + a "View details" link. */
  detailed?: boolean;
}) {
  const copy = useCustomerUiCopy();
  const rating = serviceDisplayRating(service);
  const reviews = service.stats?.reviewCount ?? 0;
  const desc = service.shortDesc?.trim();
  const bullets = detailed ? (service.highlights ?? []).filter(Boolean).slice(0, 3) : [];

  return (
    <Pressable
      style={({ pressed }) => [styles.row, showDivider && styles.divider, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${service.name}, starts at ₹${serviceStartPrice(service)}`}
    >
      <View style={styles.info}>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        <Text style={styles.name} numberOfLines={2}>
          {service.name}
        </Text>
        <View style={styles.ratingRow}>
          {rating > 0 ? (
            <>
              <Star size={12} color={ui.star} fill={ui.star} strokeWidth={1.5} />
              <Text style={styles.rating}>{rating.toFixed(1)}</Text>
              {reviews > 0 ? <Text style={styles.reviews}>({reviews})</Text> : null}
              <Text style={styles.reviews}>·</Text>
            </>
          ) : null}
          <Text style={styles.reviews}>{serviceDurationLabel(service)}</Text>
        </View>
        <Text style={styles.price}>
          {copy.serviceStartsAtLabel} {priceLabel ?? servicePriceLabel(service)}
        </Text>
        {bullets.length > 0 ? (
          <View style={styles.bullets}>
            {bullets.map((b) => (
              <View key={b} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText} numberOfLines={2}>
                  {b}
                </Text>
              </View>
            ))}
          </View>
        ) : desc ? (
          <Text style={styles.desc} numberOfLines={3}>
            {desc}
          </Text>
        ) : null}
        {detailed ? <Text style={styles.viewDetails}>{copy.serviceRowViewDetails}</Text> : null}
      </View>

      <View style={styles.media}>
        <ServiceThumb service={service} width={THUMB} radius={20} iconSize={48} />
        <Pressable
          style={({ pressed }) => [styles.book, pressed && styles.bookPressed]}
          onPress={onBook ?? onPress}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Book ${service.name}`}
        >
          <Text style={styles.bookText}>{copy.serviceRowBook}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 18,
    marginHorizontal: 16,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  pressed: { opacity: 0.85 },
  info: { flex: 1, minWidth: 0 },
  bullets: {
    marginTop: 10,
    paddingTop: 10,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  bulletRow: { flexDirection: 'row', gap: 6 },
  bulletDot: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 18, color: ui.textTertiary },
  bulletText: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: ui.textSecondary },
  viewDetails: { marginTop: 10, fontFamily: fonts.bodyBold, fontSize: 13.5, color: ui.brand },
  badge: {
    marginBottom: 4,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: ui.brand,
  },
  name: {
    fontFamily: fonts.displayExtra,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.2,
    color: ui.text,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  rating: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.text },
  reviews: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  price: { marginTop: 6, fontFamily: fonts.bodyBold, fontSize: 14.5, color: ui.text },
  desc: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: ui.textSecondary,
  },
  media: { width: THUMB, alignItems: 'center' },
  book: {
    marginTop: -16,
    minWidth: 84,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.brand,
    ...ui.shadowFloat,
  },
  bookPressed: { opacity: 0.88 },
  bookText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.white },
});

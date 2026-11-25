import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { DEFAULT_CUSTOMER_UI_COPY, fillCopy } from '@/constants/customerUiCopy';
import { ServiceThumb } from '@/components/kit/ServiceThumb';
import { serviceDurationLabel } from '@/components/kit/HomeServiceRail';
import { serviceDisplayRating } from '@/lib/ratings';
import { formatRupeeFull } from '@/components/kit/format';
import type { Service } from '@/types/api';
import { colors, fonts, radii, typeScale, ui } from '@/constants/theme';
import { serviceStartPrice } from '@/lib/serviceDisplay';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

const THUMB = 100;

/** "₹699", or "₹30 / sq ft" for the per-area services (bird, silo). Pass the copy on customer screens. */
export function servicePriceLabel(service: Service, copy: { servicePerSqFt: string } = DEFAULT_CUSTOMER_UI_COPY): string {
  if (service.basePrice <= 50 && (service.serviceTypes?.includes('bird') || service.serviceTypes?.includes('silo'))) {
    return fillCopy(copy.servicePerSqFt, { price: formatRupeeFull(service.basePrice) });
  }
  return formatRupeeFull(serviceStartPrice(service));
}

/**
 * Urban-style service row — details on the left, thumbnail on the right with the
 * "Book" button overlapping its bottom edge.
 */
export const ServiceListRow = memo(function ServiceListRow({
  service,
  onPress,
  onBook,
  showDivider = true,
  priceLabel,
  badge,
  detailed = false,
}: {
  service: Service;
  /** Receives the service, so lists can pass one stable callback and keep the row memoised. */
  onPress: (service: Service) => void;
  onBook?: (service: Service) => void;
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
  const price = priceLabel ?? servicePriceLabel(service, copy);

  return (
    <PressableScale
      containerStyle={[styles.rowWrap, showDivider && styles.divider]}
      style={styles.row}
      scaleTo={0.985}
      onPress={() => onPress(service)}
      accessibilityRole="button"
      accessibilityLabel={fillCopy(copy.serviceRowA11y, { service: service.name, price })}
    >
      <View style={styles.info}>
        {badge ? (
          <View style={styles.badgePill}>
            <Text style={styles.badge}>{badge}</Text>
          </View>
        ) : null}
        <Text style={styles.name} numberOfLines={2}>
          {service.name}
        </Text>
        <View style={styles.ratingRow}>
          {rating > 0 ? (
            <>
              <Star size={12} color={colors.amber} fill={colors.amber} strokeWidth={1.5} />
              <Text style={styles.rating}>{rating.toFixed(1)}</Text>
              {reviews > 0 ? <Text style={styles.reviews}>({reviews})</Text> : null}
              <Text style={styles.reviews}>·</Text>
            </>
          ) : null}
          <Text style={styles.reviews}>{serviceDurationLabel(service)}</Text>
        </View>
        <Text style={styles.priceRow}>
          <Text style={styles.priceLabel}>{copy.serviceStartsAtLabel} </Text>
          <Text style={styles.price}>{price}</Text>
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
        <ServiceThumb service={service} width={THUMB} radius={radii.card} iconSize={48} />
        <PressableScale
          style={styles.book}
          onPress={() => (onBook ?? onPress)(service)}
          haptic="tap"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={fillCopy(copy.serviceRowBookA11y, { service: service.name })}
        >
          <Text style={styles.bookText}>{copy.serviceRowBook}</Text>
        </PressableScale>
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  rowWrap: { marginHorizontal: 16 },
  row: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 18,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
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
  bulletText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: ui.textSecondary },
  viewDetails: { marginTop: 10, fontFamily: fonts.bodyBold, fontSize: 13, color: ui.brand },
  badgePill: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    paddingHorizontal: 8,
    height: 20,
    borderRadius: radii.pill,
    backgroundColor: ui.brandSoft,
    justifyContent: 'center',
  },
  badge: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: ui.brand,
  },
  name: { ...typeScale.rowTitleLg, fontSize: 15.5, lineHeight: 21, color: ui.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  rating: { fontFamily: fonts.bodyBold, fontSize: 12, color: ui.text },
  reviews: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary },
  priceRow: { marginTop: 8 },
  priceLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: ui.textSecondary },
  price: { fontFamily: fonts.displayExtra, fontSize: 16, letterSpacing: -0.3, color: ui.text },
  desc: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: ui.textSecondary,
  },
  media: { width: THUMB, alignItems: 'center' },
  book: {
    marginTop: -15,
    minWidth: 80,
    height: 34,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    ...ui.shadowFloat,
  },
  bookText: { fontFamily: fonts.bodyBold, fontSize: 13, color: ui.brand },
});

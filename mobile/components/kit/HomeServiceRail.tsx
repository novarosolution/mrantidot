import { memo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { HomeSectionTitle } from '@/components/kit/HomeSectionTitle';
import { ServiceThumb } from '@/components/kit/ServiceThumb';
import { PressableScale } from '@/components/ui/PressableScale';
import { formatRupeeFull } from '@/components/kit/format';
import { serviceDisplayRating } from '@/lib/ratings';
import type { Service } from '@/types/api';
import { colors, fonts, ui } from '@/constants/theme';
import { formatDuration, serviceDurationMins, serviceStartPrice } from '@/lib/serviceDisplay';

export const SHOWCASE_W = 152;
const GAP = 16;

function compactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

/** Same estimate as the service page: ~15 min per treatment step, 30 min minimum. */
export function serviceDurationLabel(s: Service): string {
  return formatDuration(serviceDurationMins(s)).toUpperCase();
}

/** White "Add" button — rides the bottom-right corner of the service art. */
function AddButton({ service, onAdd }: { service: Service; onAdd: () => void }) {
  return (
    <PressableScale
      containerStyle={styles.addWrap}
      style={styles.add}
      scaleTo={0.92}
      onPress={onAdd}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`Book ${service.name}`}
    >
      <Text style={styles.addText}>Add</Text>
    </PressableScale>
  );
}

/**
 * Service card: square art with the white "Add" button on its corner, then the name, ★ rating (reviews)
 * · duration, and a "Starts at" price. Flat — no card chrome, the art is the card.
 */
export const ServiceShowcaseCard = memo(function ServiceShowcaseCard({
  service: s,
  badge,
  width = SHOWCASE_W,
  onPress,
  onAdd,
}: {
  service: Service;
  badge?: string;
  width?: number;
  onPress: () => void;
  onAdd: () => void;
}) {
  const rating = serviceDisplayRating(s);
  const reviews = s.stats?.reviewCount ?? 0;

  return (
    <PressableScale
      containerStyle={{ width }}
      scaleTo={0.97}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${s.name}, starts at ₹${serviceStartPrice(s)}`}
    >
      <View>
        <ServiceThumb service={s} width={width} height={width} radius={16} iconSize={64} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <AddButton service={s} onAdd={onAdd} />
      </View>

      <Text style={styles.name} numberOfLines={2}>
        {s.name}
      </Text>
      <View style={styles.metaRow}>
        <Star size={12} color={ui.text} fill={ui.text} strokeWidth={0} />
        <Text style={styles.meta} numberOfLines={1}>
          {rating.toFixed(2).replace(/0$/, '')}
          {reviews > 0 ? ` (${compactCount(reviews)})` : ''} · {serviceDurationLabel(s)}
        </Text>
      </View>
      <Text style={styles.from}>Starts at</Text>
      <Text style={styles.price}>{formatRupeeFull(serviceStartPrice(s))}</Text>
    </PressableScale>
  );
});

/**
 * Full-width row for a rail that holds a single service — a lone narrow card would leave the row
 * looking half empty, so it gets the whole width with the art on the left.
 */
function ServiceWideCard({ service: s, onPress, onAdd }: { service: Service; onPress: () => void; onAdd: () => void }) {
  const rating = serviceDisplayRating(s);
  const reviews = s.stats?.reviewCount ?? 0;
  return (
    <PressableScale
      containerStyle={styles.wideWrap}
      scaleTo={0.98}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${s.name}, starts at ₹${serviceStartPrice(s)}`}
    >
      <View style={styles.wide}>
        <View>
          <ServiceThumb service={s} width={132} height={132} radius={16} iconSize={64} />
          <AddButton service={s} onAdd={onAdd} />
        </View>
        <View style={styles.wideBody}>
          <Text style={styles.wideName} numberOfLines={2}>
            {s.name}
          </Text>
          <View style={styles.metaRow}>
            <Star size={12} color={ui.text} fill={ui.text} strokeWidth={0} />
            <Text style={styles.meta} numberOfLines={1}>
              {rating.toFixed(2).replace(/0$/, '')}
              {reviews > 0 ? ` (${compactCount(reviews)})` : ''} · {serviceDurationLabel(s)}
            </Text>
          </View>
          <Text style={styles.from}>Starts at</Text>
          <Text style={styles.price}>{formatRupeeFull(serviceStartPrice(s))}</Text>
        </View>
      </View>
    </PressableScale>
  );
}

/** Titled horizontal rail of service cards with an optional "See all". */
export function HomeServiceRail({
  title,
  subtitle,
  services,
  firstBadge,
  onSeeAll,
  onOpen,
  onAdd,
}: {
  title: string;
  subtitle?: string;
  services: Service[];
  /** Small tag on the first card (e.g. "Most booked"). */
  firstBadge?: string;
  onSeeAll?: () => void;
  onOpen: (s: Service) => void;
  onAdd: (s: Service) => void;
}) {
  if (services.length === 0) return null;
  return (
    <View>
      <HomeSectionTitle title={title} subtitle={subtitle} actionLabel="See all" onAction={onSeeAll} />
      {services.length === 1 ? (
        <ServiceWideCard service={services[0]} onPress={() => onOpen(services[0])} onAdd={() => onAdd(services[0])} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={SHOWCASE_W + GAP}
          snapToAlignment="start"
          contentContainerStyle={styles.row}
        >
          {services.map((s, i) => (
            <ServiceShowcaseCard
              key={s.id}
              service={s}
              badge={i === 0 ? firstBadge : undefined}
              onPress={() => onOpen(s)}
              onAdd={() => onAdd(s)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, gap: GAP },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: ui.brand },
  addWrap: { position: 'absolute', right: -4, bottom: -14 },
  add: {
    minWidth: 68,
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(17,26,21,0.12)',
    ...ui.shadow,
  },
  addText: { fontFamily: fonts.bodySemi, fontSize: 15, color: ui.brand },
  name: {
    marginTop: 24,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.15,
    color: ui.text,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  meta: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: 12, color: ui.textSecondary },
  from: { marginTop: 6, fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  price: { marginTop: 1, fontFamily: fonts.bodySemi, fontSize: 16, color: ui.text },

  wideWrap: { marginHorizontal: 16 },
  wide: { flexDirection: 'row', gap: 18 },
  wideBody: { flex: 1, minWidth: 0, paddingTop: 2 },
  wideName: { fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 22, letterSpacing: -0.25, color: ui.text },
});

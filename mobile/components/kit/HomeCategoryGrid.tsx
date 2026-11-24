import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from '@/lib/a11yPrefs';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { PestImage } from '@/components/kit/ServiceThumb';
import { Skeleton, useSkeletonPulse } from '@/components/ui/Skeleton';
import type { ServiceTypeKey } from '@/constants/serviceTypes';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { colors, fonts, ui } from '@/constants/theme';
import { sharedRoutes, appPush } from '@/lib/routes';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { stagger } from '@/lib/motion';

const COLS = 4;
const GAP = 8;
const H_PAD = 16;
/** Two even rows of four: [offers] + pest types + "All services". */
const MAX_TILES = 8;
/** Pest types in the secondary "specialist" group. */
const MORE_TILES = 4;
/** Neutral tile colour — the pest art carries the colour, not the tile. */
const TILE_BG = '#F4F5F4';

/** Display priority for home tiles — most-requested pests first. */
const HOME_TYPE_ORDER: ServiceTypeKey[] = [
  'cockroach',
  'termite',
  'mosquito',
  'bed_bug',
  'rodent',
  'ant',
  'general',
  'deep_cleaning',
  'bird',
  'fumigation',
  'lizard',
  'spider',
  'flea',
  'bee',
  'wood_borer',
  'silo',
];

/** Types that have live services, in priority order (limit defaults to one grid's worth). */
export function pickHomeTypes(available: ReadonlySet<ServiceTypeKey>, limit = MAX_TILES): ServiceTypeKey[] {
  return HOME_TYPE_ORDER.filter((key) => available.has(key)).slice(0, limit);
}

function useTileSize(): number {
  const { width } = useWindowDimensions();
  return Math.floor((width - H_PAD * 2 - GAP * (COLS - 1)) / COLS);
}

function Tile({
  size,
  label,
  onPress,
  children,
  pill,
}: {
  size: number;
  label: string;
  onPress: () => void;
  children: ReactNode;
  pill?: string;
}) {
  return (
    <PressableScale
      containerStyle={{ width: size }}
      scaleTo={0.94}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={pill ? `${label}, ${pill}` : label}
    >
      <View style={[styles.tile, { width: size, height: size }]}>
        {children}
        {pill ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{pill}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.label} numberOfLines={3}>
        {label}
      </Text>
    </PressableScale>
  );
}

function CategoryTile({ typeKey, size, popular }: { typeKey: ServiceTypeKey; size: number; popular: boolean }) {
  const copy = useCustomerUiCopy();
  const meta = SERVICE_TYPE_META[typeKey];
  return (
    <Tile size={size} label={meta.label} pill={popular ? copy.servicesPopularBadge : undefined} onPress={() => appPush(sharedRoutes.browse(typeKey))}>
      <PestImage source={meta.image} size={Math.round(size * 0.74)} />
    </Tile>
  );
}

/** How long each coupon stays on the Offers tile before the next one slides in. */
const OFFER_ROTATE_MS = 3000;

/**
 * The Offers tile's face: cycles through the live coupon values every 3 s (fade + small lift),
 * with dots underneath when there is more than one. A single coupon just sits still.
 */
function RotatingOffer({ values, unit }: { values: string[]; unit: string }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const anim = useRef(new Animated.Value(1)).current;
  const count = values.length;

  useEffect(() => {
    if (count < 2) return;
    const id = setInterval(() => {
      if (reduced) {
        setIndex((i) => (i + 1) % count);
        return;
      }
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setIndex((i) => (i + 1) % count);
        Animated.timing(anim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    }, OFFER_ROTATE_MS);
    return () => clearInterval(id);
  }, [count, reduced, anim]);

  const shown = values[index % Math.max(count, 1)] ?? '';
  return (
    <View style={styles.offerWrap}>
      <Animated.View
        style={{
          alignItems: 'center',
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
        }}
      >
        <Text style={styles.offerValue} numberOfLines={1} adjustsFontSizeToFit>
          {shown}
        </Text>
        <Text style={styles.offerUnit}>{unit}</Text>
      </Animated.View>
      {count > 1 ? (
        <View style={styles.offerDots}>
          {values.map((_, i) => (
            <View key={i} style={[styles.offerDot, i === index % count && styles.offerDotOn]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Nine dots (3 × 3) — the "see everything" tile. */
function DotsGlyph({ size }: { size: number }) {
  const dot = Math.max(6, Math.round(size * 0.085));
  const gap = Math.round(dot * 0.8);
  return (
    <View style={{ gap }}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={{ flexDirection: 'row', gap }}>
          {[0, 1, 2].map((col) => (
            <View key={col} style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: ui.text }} />
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * "What are you looking for?" — plain grey tiles in a 4-column grid, no heading, straight under the header.
 * The first tile can be the live offer; the last is always "All services". Pest types that don't fit
 * fall into a small second group below.
 */
export function HomeCategoryGrid({
  types,
  popularType,
  allLabel,
  onAll,
  offerTile,
  moreTitle,
}: {
  types: ServiceTypeKey[];
  /** Most-booked type — gets a small "Popular" pill. */
  popularType?: ServiceTypeKey | null;
  /** Adds the final "All services" tile. */
  allLabel?: string;
  onAll?: () => void;
  /** Live coupon shown as the first tile (value like "₹100"). */
  offerTile?: { values: string[]; label: string; onPress: () => void } | null;
  moreTitle?: string;
}) {
  const copy = useCustomerUiCopy();
  const size = useTileSize();
  if (types.length === 0) return null;

  const gridSlots = MAX_TILES - (onAll ? 1 : 0) - (offerTile ? 1 : 0);
  const gridTypes = types.slice(0, gridSlots);
  const moreTypes = types.slice(gridSlots, gridSlots + MORE_TILES);
  let n = 0;

  return (
    <View>
      <View style={styles.grid}>
        {offerTile ? (
          <FadeSlideIn delay={stagger(n++)} slideFrom={12}>
            <Tile size={size} label={offerTile.label} onPress={offerTile.onPress}>
              <RotatingOffer values={offerTile.values} unit={copy.offerOff} />
            </Tile>
          </FadeSlideIn>
        ) : null}
        {gridTypes.map((key) => (
          <FadeSlideIn key={key} delay={stagger(n++)} slideFrom={12}>
            <CategoryTile typeKey={key} size={size} popular={key === popularType} />
          </FadeSlideIn>
        ))}
        {onAll ? (
          <FadeSlideIn delay={stagger(n++)} slideFrom={12}>
            <Tile size={size} label={allLabel ?? copy.homeAllServices} onPress={onAll}>
              <DotsGlyph size={size} />
            </Tile>
          </FadeSlideIn>
        ) : null}
      </View>

      {moreTypes.length > 0 ? (
        <View style={moreTitle ? styles.more : styles.moreContinued}>
          {moreTitle ? <Text style={styles.moreTitle}>{moreTitle}</Text> : null}
          <View style={styles.grid}>
            {moreTypes.map((key) => (
              <CategoryTile key={key} typeKey={key} size={size} popular={false} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** Loading placeholder with the grid's exact geometry — no layout jump when tiles arrive. */
export function HomeCategoryGridSkeleton() {
  const size = useTileSize();
  const pulse = useSkeletonPulse();
  return (
    <View style={styles.grid}>
      {Array.from({ length: MAX_TILES }, (_, i) => (
        <View key={i} style={{ width: size }}>
          <Skeleton width={size} height={size} radius={16} pulse={pulse} />
          <Skeleton width={size * 0.7} height={11} radius={6} pulse={pulse} style={styles.skeletonLabel} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: GAP,
    rowGap: 16,
    paddingHorizontal: H_PAD,
  },
  tile: {
    borderRadius: 16,
    backgroundColor: TILE_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17,26,21,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pill: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    paddingHorizontal: 7,
    height: 20,
    borderRadius: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(8,123,53,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontFamily: fonts.bodySemi, fontSize: 11, color: ui.brand },
  label: {
    marginTop: 8,
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: 'center',
    color: ui.text,
  },
  offerValue: { fontFamily: fonts.displayExtra, fontSize: 22, lineHeight: 26, letterSpacing: -0.5, color: ui.brand },
  offerUnit: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.6, color: ui.brand },
  offerWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  offerDots: { flexDirection: 'row', gap: 4, marginTop: 8 },
  offerDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(8,123,53,0.25)' },
  offerDotOn: { width: 14, backgroundColor: ui.brand },
  more: { marginTop: 28 },
  /** No heading → the second group just continues the grid at the same row rhythm. */
  moreContinued: { marginTop: 16 },
  moreTitle: {
    paddingHorizontal: H_PAD,
    marginBottom: 14,
    fontFamily: fonts.displaySemi,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: ui.text,
  },
  skeletonLabel: { alignSelf: 'center', marginTop: 9 },
});

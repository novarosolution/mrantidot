import type { ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { PestImage } from '@/components/kit/ServiceThumb';
import { Skeleton, useSkeletonPulse } from '@/components/ui/Skeleton';
import type { ServiceTypeKey } from '@/constants/serviceTypes';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { colors, fonts, ui } from '@/constants/theme';
import { sharedRoutes, appPush } from '@/lib/routes';

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
  const meta = SERVICE_TYPE_META[typeKey];
  return (
    <Tile size={size} label={meta.label} pill={popular ? 'Popular' : undefined} onPress={() => appPush(sharedRoutes.browse(typeKey))}>
      <PestImage source={meta.image} size={Math.round(size * 0.74)} />
    </Tile>
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
  moreTitle = 'Specialist treatments',
}: {
  types: ServiceTypeKey[];
  /** Most-booked type — gets a small "Popular" pill. */
  popularType?: ServiceTypeKey | null;
  /** Adds the final "All services" tile. */
  allLabel?: string;
  onAll?: () => void;
  /** Live coupon shown as the first tile (value like "₹100"). */
  offerTile?: { value: string; label: string; onPress: () => void } | null;
  moreTitle?: string;
}) {
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
          <FadeSlideIn delay={n++ * 45} slideFrom={12}>
            <Tile size={size} label={offerTile.label} onPress={offerTile.onPress}>
              <Text style={styles.offerValue} numberOfLines={1} adjustsFontSizeToFit>
                {offerTile.value}
              </Text>
              <Text style={styles.offerUnit}>OFF</Text>
            </Tile>
          </FadeSlideIn>
        ) : null}
        {gridTypes.map((key) => (
          <FadeSlideIn key={key} delay={Math.min(n++, 7) * 45} slideFrom={12}>
            <CategoryTile typeKey={key} size={size} popular={key === popularType} />
          </FadeSlideIn>
        ))}
        {onAll ? (
          <FadeSlideIn delay={Math.min(n++, 7) * 45} slideFrom={12}>
            <Tile size={size} label={allLabel ?? 'All services'} onPress={onAll}>
              <DotsGlyph size={size} />
            </Tile>
          </FadeSlideIn>
        ) : null}
      </View>

      {moreTypes.length > 0 ? (
        <View style={styles.more}>
          <Text style={styles.moreTitle}>{moreTitle}</Text>
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
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
    color: ui.text,
  },
  offerValue: { fontFamily: fonts.displayExtra, fontSize: 23, lineHeight: 27, letterSpacing: -0.5, color: ui.brand },
  offerUnit: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.6, color: ui.brand },
  more: { marginTop: 28 },
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

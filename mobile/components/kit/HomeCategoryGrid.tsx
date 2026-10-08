import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { HomeSectionTitle } from '@/components/kit/HomeSectionTitle';
import { PestImage } from '@/components/kit/ServiceThumb';
import { Skeleton, useSkeletonPulse } from '@/components/ui/Skeleton';
import type { ServiceTypeKey } from '@/constants/serviceTypes';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { colors, fonts, ui } from '@/constants/theme';
import { sharedRoutes, appPush } from '@/lib/routes';

const COLS = 4;
const GAP = 12;
const H_PAD = 16;
const MAX_TILES = 8;

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

/** Types to show on home: only ones with live services, in priority order (max two rows). */
export function pickHomeTypes(available: ReadonlySet<ServiceTypeKey>): ServiceTypeKey[] {
  return HOME_TYPE_ORDER.filter((key) => available.has(key)).slice(0, MAX_TILES);
}

function useTileSize(): number {
  const { width } = useWindowDimensions();
  return Math.floor((width - H_PAD * 2 - GAP * (COLS - 1)) / COLS);
}

function CategoryTile({ typeKey, size, popular }: { typeKey: ServiceTypeKey; size: number; popular: boolean }) {
  const meta = SERVICE_TYPE_META[typeKey];
  const scale = useRef(new Animated.Value(1)).current;
  const spring = (to: number) =>
    Animated.spring(scale, { toValue: to, friction: 6, tension: 220, useNativeDriver: true }).start();

  return (
    <Pressable
      style={{ width: size }}
      onPress={() => appPush(sharedRoutes.browse(typeKey))}
      onPressIn={() => spring(0.93)}
      onPressOut={() => spring(1)}
      accessibilityRole="button"
      accessibilityLabel={popular ? `${meta.label}, popular` : meta.label}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={[styles.tile, { width: size, height: size, backgroundColor: meta.bg }]}>
          <PestImage source={meta.image} size={Math.round(size * 0.68)} />
        </View>
        {popular ? (
          <View style={[styles.tag, { backgroundColor: meta.color }]}>
            <Text style={styles.tagText}>Popular</Text>
          </View>
        ) : null}
      </Animated.View>
      <Text style={styles.label} numberOfLines={2}>
        {meta.label}
      </Text>
    </Pressable>
  );
}

/** "What are you looking for?" — pastel pest tiles in a 4-column grid (Urban-style category grid). */
export function HomeCategoryGrid({
  title,
  actionLabel,
  onAction,
  types,
  popularType,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  types: ServiceTypeKey[];
  /** Most-booked type — gets a small "Popular" tag. */
  popularType?: ServiceTypeKey | null;
}) {
  const size = useTileSize();
  if (types.length === 0) return null;

  return (
    <View>
      <HomeSectionTitle title={title} actionLabel={actionLabel} onAction={onAction} />
      <View style={styles.grid}>
        {types.map((key) => (
          <CategoryTile key={key} typeKey={key} size={size} popular={key === popularType} />
        ))}
      </View>
    </View>
  );
}

/** Loading placeholder with the grid's exact geometry — no layout jump when tiles arrive. */
export function HomeCategoryGridSkeleton() {
  const size = useTileSize();
  const pulse = useSkeletonPulse();
  return (
    <View>
      <View style={styles.skeletonTitle}>
        <Skeleton width={210} height={22} radius={8} pulse={pulse} />
      </View>
      <View style={styles.grid}>
        {Array.from({ length: MAX_TILES }, (_, i) => (
          <View key={i} style={{ width: size }}>
            <Skeleton width={size} height={size} radius={20} pulse={pulse} />
            <Skeleton width={size * 0.7} height={11} radius={6} pulse={pulse} style={styles.skeletonLabel} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: GAP,
    rowGap: 18,
    paddingHorizontal: H_PAD,
  },
  tile: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tag: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.white,
  },
  tagText: { fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 0.3, color: colors.white },
  label: {
    marginTop: 8,
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    lineHeight: 16,
    textAlign: 'center',
    color: ui.text,
  },
  skeletonTitle: { paddingHorizontal: H_PAD, marginBottom: 16 },
  skeletonLabel: { alignSelf: 'center', marginTop: 9 },
});

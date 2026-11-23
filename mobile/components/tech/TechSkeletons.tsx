import { StyleSheet, View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, radii, spacing, ui } from '@/constants/theme';

/**
 * Shimmer placeholders shaped like each technician screen, so the layout doesn't jump when data lands.
 * They sit under the screen's real header.
 */

/** The earnings card on the jobs screen. */
export function TechEarningsSkeleton() {
  return <Skeleton width="100%" height={164} radius={22} />;
}

/** The duty / check-in card. */
export function TechDutySkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={44} height={44} radius={14} />
        <View style={styles.flex}>
          <Skeleton width="58%" height={16} radius={6} />
          <Skeleton width="82%" height={12} radius={6} style={styles.gap8} />
        </View>
      </View>
      <View style={[styles.row, styles.gap16]}>
        <Skeleton width="48%" height={48} radius={14} />
        <Skeleton width="48%" height={48} radius={14} />
      </View>
    </View>
  );
}

function JobRowSkeleton() {
  return (
    <View style={[styles.card, styles.gap12]}>
      <View style={styles.row}>
        <Skeleton width={52} height={52} radius={16} />
        <View style={styles.flex}>
          <Skeleton width="68%" height={15} radius={6} />
          <Skeleton width="44%" height={12} radius={6} style={styles.gap8} />
          <Skeleton width="56%" height={12} radius={6} style={styles.gap8} />
        </View>
      </View>
    </View>
  );
}

/** Jobs tab body: earnings, duty card, one section of job rows. */
export function TechJobsSkeleton() {
  return (
    <View style={styles.pad}>
      <TechEarningsSkeleton />
      <View style={styles.gap12}>
        <TechDutySkeleton />
      </View>
      <Skeleton width="32%" height={14} radius={6} style={styles.gap24} />
      <JobRowSkeleton />
      <JobRowSkeleton />
      <JobRowSkeleton />
    </View>
  );
}

function StepRowSkeleton() {
  return (
    <View style={[styles.card, styles.gap12]}>
      <View style={styles.row}>
        <Skeleton width={46} height={46} radius={14} />
        <View style={styles.flex}>
          <Skeleton width="60%" height={14} radius={6} />
          <Skeleton width="36%" height={11} radius={5} style={styles.gap8} />
        </View>
      </View>
    </View>
  );
}

/** Job detail: status banner, value card, steps, visit times. */
export function TechJobDetailSkeleton() {
  return (
    <View style={styles.pad}>
      <Skeleton width="100%" height={76} radius={20} />
      <View style={[styles.card, styles.gap12]}>
        <Skeleton width="30%" height={12} radius={5} />
        <Skeleton width="42%" height={24} radius={7} style={styles.gap8} />
        <Skeleton width="64%" height={12} radius={5} style={styles.gap8} />
      </View>
      <Skeleton width="44%" height={18} radius={7} style={styles.gap24} />
      <StepRowSkeleton />
      <StepRowSkeleton />
      <StepRowSkeleton />
      <Skeleton width="36%" height={18} radius={7} style={styles.gap24} />
      <View style={[styles.card, styles.gap12]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.spread, i > 0 && styles.gap12]}>
            <Skeleton width="28%" height={12} radius={5} />
            <Skeleton width="34%" height={12} radius={5} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Leave: request form, then two request rows. */
export function TechLeaveSkeleton() {
  return (
    <View style={styles.pad}>
      <View style={styles.card}>
        <Skeleton width="46%" height={18} radius={7} />
        <Skeleton width="92%" height={12} radius={5} style={styles.gap8} />
        <Skeleton width="70%" height={12} radius={5} style={styles.gap8} />
        <View style={[styles.spread, styles.gap16]}>
          <Skeleton width="48%" height={62} radius={14} />
          <Skeleton width="48%" height={62} radius={14} />
        </View>
        <View style={[styles.chips, styles.gap12]}>
          {[64, 84, 64, 70].map((w, i) => (
            <Skeleton key={i} width={w} height={38} radius={19} />
          ))}
        </View>
        <Skeleton width="100%" height={100} radius={14} style={styles.gap16} />
        <Skeleton width="100%" height={54} radius={16} style={styles.gap16} />
      </View>
      <Skeleton width="38%" height={18} radius={7} style={styles.gap24} />
      {[0, 1].map((i) => (
        <View key={i} style={[styles.card, styles.gap12]}>
          <View style={styles.spread}>
            <Skeleton width="44%" height={15} radius={6} />
            <Skeleton width={72} height={20} radius={6} />
          </View>
          <Skeleton width="60%" height={12} radius={5} style={styles.gap8} />
        </View>
      ))}
    </View>
  );
}

/** Profile: identity card, quick actions, metrics, calendar. */
export function TechProfileSkeleton() {
  return (
    <View style={styles.pad}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Skeleton width={64} height={64} radius={22} />
          <View style={styles.flex}>
            <Skeleton width="62%" height={18} radius={7} />
            <Skeleton width="44%" height={12} radius={5} style={styles.gap8} />
            <Skeleton width={96} height={22} radius={11} style={styles.gap8} />
          </View>
        </View>
        <Skeleton width="100%" height={58} radius={14} style={styles.gap16} />
      </View>
      <Skeleton width="34%" height={12} radius={5} style={styles.gap24} />
      <View style={[styles.grid, styles.gap12]}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} width="48%" height={104} radius={20} />
        ))}
      </View>
      <Skeleton width="40%" height={18} radius={7} style={styles.gap24} />
      <View style={[styles.grid, styles.gap12]}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} width="48%" height={96} radius={20} />
        ))}
      </View>
      <Skeleton width="100%" height={300} radius={20} style={styles.gap24} />
    </View>
  );
}

/** A metric block that is still loading (e.g. after switching the calendar month). */
export function TechBlockSkeleton({ height = 180 }: { height?: number }) {
  return <Skeleton width="100%" height={height} radius={20} />;
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  card: {
    padding: 14,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  spread: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  flex: { flex: 1 },
  gap8: { marginTop: 8 },
  gap12: { marginTop: 12 },
  gap16: { marginTop: 16 },
  gap24: { marginTop: 24 },
});

import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, spacing, ui } from '@/constants/theme';

/** Loading state for the service detail page — hero, title block and size cards. */
export function ServiceDetailSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <Skeleton width="100%" height={insets.top + 248} radius={0} />
      <View style={styles.white}>
        <Skeleton width="72%" height={26} radius={8} />
        <Skeleton width="34%" height={14} radius={6} style={styles.gap8} />
        <Skeleton width="56%" height={14} radius={6} style={styles.gap12} />
        <Skeleton width="100%" height={14} radius={6} style={styles.gap16} />
        <Skeleton width="88%" height={14} radius={6} style={styles.gap8} />
      </View>
      <View style={styles.band} />
      <View style={styles.white}>
        <Skeleton width="52%" height={20} radius={8} />
        <View style={[styles.row, styles.gap16]}>
          <Skeleton width="31%" height={74} radius={14} />
          <Skeleton width="31%" height={74} radius={14} />
          <Skeleton width="31%" height={74} radius={14} />
        </View>
      </View>
    </View>
  );
}

/** Loading state for the cart — one block per card on the real page. */
export function CartSkeleton() {
  return (
    <View style={[styles.root, styles.pad]}>
      <Skeleton width="100%" height={136} radius={20} />
      <Skeleton width="100%" height={70} radius={20} style={styles.gap12} />
      <Skeleton width="100%" height={230} radius={20} style={styles.gap12} />
      <Skeleton width="100%" height={70} radius={20} style={styles.gap12} />
    </View>
  );
}

/** Loading state for a category page — summary card and a few service rows. */
export function CategorySkeleton() {
  return (
    <View style={styles.root}>
      <View style={[styles.white, styles.row, styles.center]}>
        <Skeleton width={72} height={72} radius={18} />
        <View style={styles.flex}>
          <Skeleton width="50%" height={14} radius={6} />
          <Skeleton width="70%" height={14} radius={6} style={styles.gap8} />
        </View>
      </View>
      <View style={styles.band} />
      <View style={styles.white}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.row, i > 0 && styles.gap24]}>
            <View style={styles.flex}>
              <Skeleton width="80%" height={18} radius={6} />
              <Skeleton width="40%" height={12} radius={6} style={styles.gap8} />
              <Skeleton width="50%" height={14} radius={6} style={styles.gap8} />
              <Skeleton width="90%" height={12} radius={6} style={styles.gap12} />
            </View>
            <Skeleton width={112} height={112} radius={20} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ui.surfaceMuted },
  pad: { padding: spacing.md },
  white: { backgroundColor: colors.white, padding: spacing.md },
  band: { height: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  center: { alignItems: 'center' },
  flex: { flex: 1 },
  gap8: { marginTop: 8 },
  gap12: { marginTop: 12 },
  gap16: { marginTop: 16 },
  gap24: { marginTop: 24 },
});

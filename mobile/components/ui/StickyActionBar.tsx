import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { spacing } from '@/constants/theme';

/** Bottom action dock — frosted glass with a hairline top edge; content scrolls softly underneath. */
export function StickyActionBar({ children, row = false }: { children: ReactNode; row?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <GlassSurface style={styles.shell} intensity={50} tintOpacity={0.78} edge={false}>
      <View style={styles.rule} />
      <View style={[styles.bar, row && styles.row, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {children}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: '#143C23',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 12,
  },
  rule: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(17,26,21,0.10)',
  },
  bar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  /** Secondary action left, primary right — children size themselves with flex. */
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});

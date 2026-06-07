import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/constants/theme';

/** Lightweight section wrapper — content cards carry their own elevation. */
export function HomeSection({ children }: { children: ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xs,
  },
});

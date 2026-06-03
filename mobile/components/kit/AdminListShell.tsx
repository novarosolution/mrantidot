import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminLightHeader } from './AdminLightHeader';
import { colors, design, spacing } from '@/constants/theme';

export function AdminListShell({
  title,
  subtitle,
  showBack = true,
  rightAction,
  headerExtra,
  children,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <AdminLightHeader title={title} subtitle={subtitle} showBack={showBack} rightAction={rightAction} />
      {headerExtra}
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

export const adminListShellStyles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  empty: { flexGrow: 1, padding: spacing.md },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  body: { flex: 1 },
});

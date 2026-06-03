import { type ReactNode } from 'react';
import { StyleSheet, View, type RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerPageHeader } from './CustomerPageHeader';
import { UserAccountCard } from './UserAccountCard';
import { colors, design, spacing } from '@/constants/theme';

export function CustomerListShell({
  title,
  subtitle,
  showBack = true,
  headerVariant = 'premium',
  rightAction,
  headerExtra,
  accountStrip,
  children,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  headerVariant?: 'gradient' | 'light' | 'premium';
  rightAction?: ReactNode;
  headerExtra?: ReactNode;
  accountStrip?: boolean;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <CustomerPageHeader
        title={title}
        subtitle={subtitle}
        showBack={showBack}
        variant={headerVariant}
        rightAction={rightAction}
      >
        {headerExtra}
      </CustomerPageHeader>
      {accountStrip ? <UserAccountCard /> : null}
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

export const listShellStyles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  empty: { flexGrow: 1, padding: spacing.md },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  body: { flex: 1 },
});

export type { RefreshControlProps };

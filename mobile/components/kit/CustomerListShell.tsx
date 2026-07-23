import { type ReactNode } from 'react';
import { StyleSheet, View, type RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerPageHeader } from './CustomerPageHeader';
import { UserAccountCard } from './UserAccountCard';
import { GlassBackdrop, TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { surfaces, spacing } from '@/constants/theme';

export function CustomerListShell({
  title,
  subtitle,
  showBack = true,
  headerVariant = 'premium',
  rightAction,
  headerExtra,
  accountStrip,
  heroOverlap,
  children,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  headerVariant?: 'gradient' | 'light' | 'premium';
  rightAction?: ReactNode;
  headerExtra?: ReactNode;
  accountStrip?: boolean;
  heroOverlap?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <CustomerPageHeader
          title={title}
          subtitle={subtitle}
          showBack={showBack}
          variant={headerVariant}
          rightAction={rightAction}
          overlapReserve={heroOverlap}
        >
          {headerExtra}
        </CustomerPageHeader>
        {accountStrip ? <UserAccountCard /> : null}
        <View style={styles.body}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

export const listShellStyles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: TAB_BAR_SCROLL_PAD },
  empty: { flexGrow: 1, padding: spacing.md, paddingBottom: TAB_BAR_SCROLL_PAD },
});

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: surfaces.glassScreenBase },
  safe: { flex: 1, backgroundColor: 'transparent', overflow: 'hidden' },
  body: { flex: 1, overflow: 'hidden' },
});

export type { RefreshControlProps };

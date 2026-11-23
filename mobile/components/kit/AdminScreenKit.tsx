import { type ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GlassBackdrop,
  GlassPanel,
  TAB_BAR_SCROLL_PAD,
  customerScrollProps,
} from '@/components/kit/GlassScreenKit';
import { adminShadow } from '@/components/kit/homeUi';
import { colors, surfaces, spacing } from '@/constants/theme';
import { useWideWebLayout } from '@/lib/webAdmin';

/** Thin brand divider. */
export function AdminGoldBar({ height = 3, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      colors={[colors.limeBright, colors.green]}
      style={[{ height, width: '100%' }, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    />
  );
}

/** Glass-backed shell for admin tab-root screens (dashboard, manage, etc.). */
export function AdminTabScreen({
  header,
  children,
  edges = ['left', 'right'],
  contentContainerStyle,
  refreshControl,
  scroll = true,
}: {
  header?: ReactNode;
  children: ReactNode;
  edges?: Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Set false for FlatList / custom body layouts (e.g. bookings tab). */
  scroll?: boolean;
}) {
  // Desktop browser: no tab bar under the content (the sidebar navigates), so no room is kept for one.
  // The scrollbar stays hidden: screens size pixel grids to the full column width (adminGrid.ts).
  const wideWeb = useWideWebLayout();
  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safe} edges={edges}>
        {header}
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, wideWeb && styles.contentWideWeb, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
            {...customerScrollProps}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, contentContainerStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

/** Frosted admin card shell with gold top bar — shadow on outer shell so overflow does not clip. */
export function AdminPremiumCard({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return (
    <View style={[styles.cardShell, style]}>
      <GlassPanel style={styles.cardInner} padded={padded} goldEdge tone="light">
        {children}
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: surfaces.glassScreenBase },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingBottom: TAB_BAR_SCROLL_PAD,
    flexGrow: 1,
    gap: spacing.sm,
  },
  contentWideWeb: { paddingBottom: spacing.xl },
  cardShell: {
    borderRadius: 22,
    ...adminShadow.card,
  },
  cardInner: {
    borderRadius: 22,
  },
});

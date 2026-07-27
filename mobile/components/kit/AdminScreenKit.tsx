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
import { surfaces, spacing } from '@/constants/theme';

/** Reusable gold accent bar for admin cards and strips. */
export function AdminGoldBar({ height = 3, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      colors={['#8FD03C', '#27A747']}
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
  return (
    <View style={styles.root}>
      <GlassBackdrop variant="deep" />
      <SafeAreaView style={styles.safe} edges={edges}>
        {header}
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, contentContainerStyle]}
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
  cardShell: {
    borderRadius: 22,
    ...adminShadow.card,
  },
  cardInner: {
    borderRadius: 22,
  },
});

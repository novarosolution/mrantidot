import { LinearGradient } from 'expo-linear-gradient';
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
import {
  GlassBackdrop,
  TAB_BAR_SCROLL_PAD,
  customerScrollProps,
} from '@/components/kit/GlassScreenKit';
import { gradients, shadows, spacing } from '@/constants/theme';

/** Reusable gold accent bar for admin cards and strips. */
export function AdminGoldBar({ height = 3, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      colors={[...gradients.goldBar]}
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
}: {
  header?: ReactNode;
  children: ReactNode;
  edges?: Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}) {
  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safe} edges={edges}>
        {header}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          {...customerScrollProps}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/** Frosted admin card shell with gold top bar. */
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
    <View style={[styles.card, style]}>
      <AdminGoldBar />
      <View style={padded ? styles.cardInner : undefined}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingBottom: TAB_BAR_SCROLL_PAD, flexGrow: 1 },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    ...shadows.card,
  },
  cardInner: {
    padding: spacing.md,
  },
});

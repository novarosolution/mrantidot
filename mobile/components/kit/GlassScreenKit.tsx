import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, fonts, premium, shadows, spacing, surfaces } from '@/constants/theme';

/** Bottom scroll inset for tab-root screens above the 82px glass tab bar. */
export const TAB_BAR_SCROLL_PAD = 96;

/** Prevent nested horizontal lists from dragging the whole screen sideways. */
export const customerScrollProps = {
  showsHorizontalScrollIndicator: false,
  directionalLockEnabled: true,
  alwaysBounceHorizontal: false,
  nestedScrollEnabled: true,
} as const;

type GlassPanelProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  intensity?: number;
};

/** Frosted glass card with blur, sheen, and premium border. */
export function GlassPanel({ children, style, padded = true, intensity }: GlassPanelProps) {
  const blur = intensity ?? (Platform.OS === 'ios' ? 48 : 64);
  return (
    <View style={[styles.panelShell, style]}>
      <BlurView intensity={blur} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.panelTint} pointerEvents="none" />
      <LinearGradient
        colors={['rgba(255,255,255,0.62)', 'rgba(255,255,255,0.08)']}
        style={styles.panelSheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
      <View style={[styles.panelInner, padded && styles.panelPadded]}>{children}</View>
    </View>
  );
}

/** Ambient gradient mesh behind glass screens. */
export function GlassBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#F7F4EF', '#EEF6F0', '#F3EFE8', '#F7F4EF']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[styles.orb, styles.orbGreen]} />
      <View style={[styles.orb, styles.orbGold]} />
      <View style={[styles.orb, styles.orbTeal]} />
    </View>
  );
}

export function GlassSectionLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.sectionLabelWrap}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

export function GlassScreen({
  header,
  children,
  edges = ['left', 'right'],
  contentContainerStyle,
  keyboardShouldPersistTaps,
}: {
  header?: ReactNode;
  children: ReactNode;
  edges?: Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
}) {
  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safe} edges={edges}>
        {header}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scroll, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? 'always'}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/** Blur background for bottom tab bars. */
export function GlassTabBarBackground() {
  return (
    <View style={styles.tabBarShell}>
      <BlurView intensity={Platform.OS === 'ios' ? 64 : 72} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.tabBarTint} />
      <LinearGradient
        colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.55)']}
        style={styles.tabBarSheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </View>
  );
}

export const glassTabBarStyle: ViewStyle = {
  backgroundColor: 'transparent',
  borderTopColor: surfaces.glassBorder,
  borderTopWidth: StyleSheet.hairlineWidth,
  height: 82,
  paddingBottom: 12,
  borderTopLeftRadius: 22,
  borderTopRightRadius: 22,
  ...premium.shadowSoft,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surfaces.glassScreenBase },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  panelShell: {
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    ...shadows.card,
  },
  panelTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: surfaces.glassPanelTint,
  },
  panelSheen: {
    ...StyleSheet.absoluteFill,
  },
  panelInner: {},
  panelPadded: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionLabelWrap: {
    paddingHorizontal: 2,
    marginBottom: -4,
  },
  sectionLabel: {
    fontFamily: fonts.displayExtra,
    fontSize: 17,
    letterSpacing: -0.35,
    color: colors.ink,
  },
  sectionHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 3,
    lineHeight: 17,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.55,
  },
  orbGreen: {
    width: 220,
    height: 220,
    top: -40,
    right: -60,
    backgroundColor: 'rgba(30,142,78,0.14)',
  },
  orbGold: {
    width: 180,
    height: 180,
    bottom: 120,
    left: -50,
    backgroundColor: 'rgba(212,160,23,0.12)',
  },
  orbTeal: {
    width: 140,
    height: 140,
    top: '42%',
    right: -30,
    backgroundColor: 'rgba(58,150,136,0.1)',
  },
  tabBarShell: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  tabBarTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: surfaces.glassTabTint,
  },
  tabBarSheen: {
    ...StyleSheet.absoluteFill,
  },
});

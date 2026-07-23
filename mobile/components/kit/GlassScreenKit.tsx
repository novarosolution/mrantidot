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
import { PremiumMeshBg } from '@/components/kit/PremiumMeshBg';
import { colors, fonts, premium, shadows, spacing, surfaces } from '@/constants/theme';

/** Bottom scroll inset for tab-root screens above the floating glass tab bar. */
export const TAB_BAR_SCROLL_PAD = 108;

/**
 * Shared ScrollView props for customer screens.
 * removeClippedSubviews=false avoids remount flashes + BlurView “ghost” duplicates while scrolling.
 */
export const customerScrollProps = {
  showsHorizontalScrollIndicator: false,
  directionalLockEnabled: true,
  alwaysBounceHorizontal: false,
  nestedScrollEnabled: true,
  removeClippedSubviews: false,
} as const;

const BLUR_IOS = Platform.OS === 'ios';

type GlassTone = 'light' | 'mint' | 'forest' | 'clear';

type GlassPanelProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  intensity?: number;
  tone?: GlassTone;
  /** Thin lime edge along the top (promo / premium cards). */
  goldEdge?: boolean;
  /**
   * Live blur. Off by default — BlurView inside ScrollViews ghosts/duplicates content while scrolling.
   * Tint + sheen still read as frosted glass.
   */
  blur?: boolean;
};

function toneTint(tone: GlassTone): string {
  switch (tone) {
    case 'mint':
      return 'rgba(234,246,227,0.36)';
    case 'forest':
      return 'rgba(11,114,40,0.12)';
    case 'clear':
      return 'rgba(255,255,255,0.18)';
    default:
      return surfaces.glassPanelTint;
  }
}

function blurTint(tone: GlassTone): 'light' | 'default' {
  return tone === 'forest' ? 'default' : 'light';
}

function solidFrost(tone: GlassTone): string {
  switch (tone) {
    case 'mint':
      return 'rgba(246,251,242,0.94)';
    case 'forest':
      return 'rgba(236,246,230,0.92)';
    case 'clear':
      return 'rgba(255,255,255,0.82)';
    default:
      return 'rgba(255,255,255,0.92)';
  }
}

/** Frosted glass card with sheen and premium border (blur optional — avoid in ScrollViews). */
export function GlassPanel({
  children,
  style,
  padded = true,
  intensity,
  tone = 'light',
  goldEdge = false,
  blur = false,
}: GlassPanelProps) {
  const blurAmount = intensity ?? (BLUR_IOS ? 56 : 72);
  return (
    <View style={[styles.panelShell, style]}>
      {blur && Platform.OS !== 'web' ? (
        <BlurView intensity={blurAmount} tint={blurTint(tone)} style={StyleSheet.absoluteFill} pointerEvents="none" />
      ) : (
        <View style={[styles.panelTint, { backgroundColor: solidFrost(tone) }]} pointerEvents="none" />
      )}
      <View style={[styles.panelTint, { backgroundColor: toneTint(tone) }]} pointerEvents="none" />
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.22)', 'rgba(232,248,214,0.32)']}
        locations={[0, 0.38, 1]}
        style={styles.panelSheen}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.72)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']}
        locations={[0, 0.55, 1]}
        style={styles.panelTopGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(143,208,60,0.14)', 'rgba(143,208,60,0)']}
        style={styles.panelCornerBloom}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.35, y: 0.65 }}
        pointerEvents="none"
      />
      <View style={styles.panelRim} pointerEvents="none" />
      <View style={styles.panelInnerRim} pointerEvents="none" />
      {goldEdge ? (
        <LinearGradient
          colors={['#C8F07A', '#8FD03C', '#27A747']}
          style={styles.goldEdge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          pointerEvents="none"
        />
      ) : null}
      <View style={[styles.panelInner, padded && styles.panelPadded]}>{children}</View>
    </View>
  );
}

/** Compact glass chip / pill. */
export function GlassChip({
  children,
  style,
  intensity: _intensity,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}) {
  return (
    <View style={[styles.chipShell, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.96)', 'rgba(244,250,238,0.9)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
      <View style={styles.chipInner}>{children}</View>
    </View>
  );
}

/**
 * Clean light premium wash behind screens.
 * Soft frost veil only — no 3D orbs.
 */
export function GlassBackdrop({ variant = 'default' }: { variant?: 'default' | 'deep' | 'auth' }) {
  return (
    <View style={styles.backdropRoot} pointerEvents="none">
      <PremiumMeshBg variant={variant} />
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.62)',
          'rgba(250,252,248,0.08)',
          'rgba(236,248,226,0.22)',
          'rgba(255,255,255,0.4)',
        ]}
        locations={[0, 0.32, 0.72, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(200,240,122,0.16)', 'rgba(200,240,122,0)']}
        style={styles.backdropLimeBloom}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.55 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
        style={styles.backdropTopSheen}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
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

/** Full-screen glass shell with mesh backdrop + safe area. */
export function GlassScreen({
  header,
  children,
  edges = ['left', 'right'],
  contentContainerStyle,
  keyboardShouldPersistTaps,
  backdrop = 'default',
  scroll = true,
}: {
  header?: ReactNode;
  children: ReactNode;
  edges?: Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  backdrop?: 'default' | 'deep' | 'auth';
  /** Set false for FlatList / custom body layouts. */
  scroll?: boolean;
}) {
  return (
    <View style={styles.root}>
      <GlassBackdrop variant={backdrop} />
      <SafeAreaView style={styles.safe} edges={edges}>
        {header}
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.scroll, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? 'always'}
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

/** Floating glass content slab — use under heroes for list bodies. */
export function GlassContentSheet({
  children,
  style,
  intensity: _intensity,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}) {
  return (
    <View style={[styles.sheetShell, style]}>
      <View style={[styles.sheetTint, { backgroundColor: 'rgba(255,255,255,0.94)' }]} pointerEvents="none" />
      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.08)', 'rgba(234,246,227,0.2)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
      <View style={styles.sheetInner}>{children}</View>
    </View>
  );
}

/** Blur background for bottom tab bars — floating premium glass dock. */
export function GlassTabBarBackground() {
  return (
    <View style={styles.tabBarShell}>
      {Platform.OS !== 'web' ? (
        <BlurView intensity={BLUR_IOS ? 64 : 80} tint="light" style={StyleSheet.absoluteFill} pointerEvents="none" />
      ) : null}
      <LinearGradient
        colors={['rgba(255,255,255,0.78)', 'rgba(246,250,242,0.72)', 'rgba(234,246,227,0.58)']}
        locations={[0, 0.45, 1]}
        style={styles.tabBarSheen}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
      <View style={styles.tabBarTint} pointerEvents="none" />
      <LinearGradient
        colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)']}
        style={styles.tabBarTopGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['#B6E86A', '#8FD03C', '#27A747']}
        style={styles.tabBarLimeEdge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        pointerEvents="none"
      />
      <View style={styles.tabBarRim} pointerEvents="none" />
    </View>
  );
}

/** Shared style tokens for glass surfaces without BlurView (lists, flat styles). */
export const glassSkin = {
  card: {
    backgroundColor: surfaces.glass,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    ...premium.shadowSoft,
  } satisfies ViewStyle,
  cardSoft: {
    backgroundColor: surfaces.glassSoft,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: surfaces.glassBorder,
    ...shadows.card,
  } satisfies ViewStyle,
  input: {
    backgroundColor: surfaces.glassInput,
    borderRadius: premium.radiusInput,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  } satisfies ViewStyle,
  sheet: {
    backgroundColor: surfaces.glassSheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    borderBottomWidth: 0,
    overflow: 'hidden' as const,
  } satisfies ViewStyle,
  frost: {
    backgroundColor: 'rgba(255,255,255,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.62)',
  } satisfies ViewStyle,
};

export const glassTabBarStyle: ViewStyle = {
  position: 'absolute',
  left: 12,
  right: 12,
  bottom: 10,
  backgroundColor: 'transparent',
  borderTopColor: 'transparent',
  borderTopWidth: 0,
  height: 78,
  paddingBottom: 10,
  paddingTop: 4,
  borderRadius: 28,
  elevation: 0,
  shadowColor: '#03170B',
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: 0.18,
  shadowRadius: 22,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surfaces.glassScreenBase, overflow: 'hidden' },
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  backdropRoot: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  backdropTopSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '32%',
  },
  backdropLimeBloom: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '70%',
    height: '42%',
  },
  panelShell: {
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(168,214,150,0.55)',
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 10,
  },
  panelTint: {
    ...StyleSheet.absoluteFill,
  },
  panelSheen: {
    ...StyleSheet.absoluteFill,
  },
  panelTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
  },
  panelCornerBloom: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '55%',
    height: '55%',
  },
  panelRim: {
    ...StyleSheet.absoluteFill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.78)',
    borderRadius: premium.radiusCard,
  },
  panelInnerRim: {
    ...StyleSheet.absoluteFill,
    margin: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(143,208,60,0.12)',
    borderRadius: premium.radiusCard - 1,
  },
  goldEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 2,
  },
  panelInner: {},
  panelPadded: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  chipShell: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    shadowColor: '#04150A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  chipTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  chipInner: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetShell: {
    flex: 1,
    marginTop: -18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: surfaces.glassBorderStrong,
    ...premium.shadowSoft,
    shadowOffset: { width: 0, height: -8 },
  },
  sheetTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  sheetInner: {
    flex: 1,
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
  tabBarShell: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderRadius: 28,
  },
  tabBarTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  tabBarSheen: {
    ...StyleSheet.absoluteFill,
  },
  tabBarTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
  },
  tabBarLimeEdge: {
    position: 'absolute',
    top: 0,
    left: 22,
    right: 22,
    height: 2.5,
    borderRadius: 2,
  },
  tabBarRim: {
    ...StyleSheet.absoluteFill,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
  },
});

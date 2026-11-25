import { useMemo, type ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { PremiumMeshBg } from '@/components/kit/PremiumMeshBg';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';

/** Bottom scroll inset for tab-root screens above the docked tab bar. */
export const TAB_BAR_SCROLL_PAD = 104;

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

type GlassTone = 'light' | 'mint' | 'forest' | 'clear';

type GlassPanelProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  intensity?: number;
  tone?: GlassTone;
  /** @deprecated Lime top edge — dropped in the white premium theme; accepted for older call sites. */
  goldEdge?: boolean;
  /**
   * Live blur. Off by default — BlurView inside ScrollViews ghosts/duplicates content while scrolling.
   * Tint + sheen still read as frosted glass.
   */
  blur?: boolean;
};

/** Card fill per tone — white canvas, faint brand wash for emphasis tones. */
function toneFill(tone: GlassTone): string {
  switch (tone) {
    case 'mint':
      return ui.surfaceMuted;
    case 'forest':
      return ui.brandSoft;
    default:
      return colors.white;
  }
}

const SHADOW_KEYS = ['shadowColor', 'shadowOffset', 'shadowOpacity', 'shadowRadius', 'elevation'] as const;

/**
 * Premium card — white surface, hairline border, one soft shadow.
 * Caller shadows are replaced so every card shares the same quiet depth.
 */
export function GlassPanel({
  children,
  style,
  padded = true,
  intensity: _intensity,
  tone = 'light',
  goldEdge: _goldEdge = false,
  blur: _blur = false,
}: GlassPanelProps) {
  const flat = { ...(StyleSheet.flatten(style) ?? {}) } as ViewStyle;
  for (const k of SHADOW_KEYS) delete flat[k];
  const radiusValue = typeof flat.borderRadius === 'number' ? flat.borderRadius : premium.radiusCard;
  return (
    <View style={[styles.panelShell, { backgroundColor: toneFill(tone) }, flat]}>
      <View style={[styles.panelClip, { borderRadius: radiusValue }]}>
        <View style={[styles.panelInner, padded && styles.panelPadded]}>{children}</View>
      </View>
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
      <View style={styles.chipInner}>{children}</View>
    </View>
  );
}

/** Screen background — muted premium canvas; mesh only for auth / deep heroes. */
export function GlassBackdrop({ variant = 'default' }: { variant?: 'default' | 'deep' | 'auth' }) {
  if (variant === 'auth' || variant === 'deep') {
    return (
      <View style={styles.backdropRoot} pointerEvents="none">
        <PremiumMeshBg variant={variant} />
      </View>
    );
  }
  return <View style={[styles.backdropRoot, styles.backdropMuted]} pointerEvents="none" />;
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
            automaticallyAdjustKeyboardInsets
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
      <View style={styles.sheetInner}>{children}</View>
    </View>
  );
}

/** Corner radius of the docked tab bar's top edge. */
export const TAB_BAR_RADIUS = 28;

/** Tab bar background — solid white dock, rounded at the top, with a hairline edge. */
export function GlassTabBarBackground() {
  return <View style={tabBarStyles.bg} />;
}

const tabBarStyles = StyleSheet.create({
  bg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.white,
    borderTopLeftRadius: TAB_BAR_RADIUS,
    borderTopRightRadius: TAB_BAR_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    borderColor: 'rgba(17,26,21,0.1)',
  },
});

/** Shared style tokens for glass surfaces without BlurView (lists, flat styles). */
export const glassSkin = {
  card: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  } satisfies ViewStyle,
  cardSoft: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: ui.hairline,
  } satisfies ViewStyle,
  input: {
    backgroundColor: ui.surfaceMuted,
    borderRadius: premium.radiusInput,
    borderWidth: 1,
    borderColor: ui.hairline,
  } satisfies ViewStyle,
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: ui.hairline,
    borderBottomWidth: 0,
    overflow: 'hidden' as const,
  } satisfies ViewStyle,
  frost: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
  } satisfies ViewStyle,
};

/**
 * Docked tab bar — full-width white bar on the bottom edge with rounded top corners; its height grows
 * with the home-indicator inset so icons and labels sit above it.
 */
export function dockTabBarStyle(bottomInset: number): ViewStyle {
  return {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 62 + bottomInset,
    paddingTop: 8,
    paddingBottom: Math.max(bottomInset - 4, 8),
    paddingHorizontal: 6,
    borderTopLeftRadius: TAB_BAR_RADIUS,
    borderTopRightRadius: TAB_BAR_RADIUS,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 12,
    shadowColor: '#0B1F14',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  };
}

/** Tab bar style for the current device — use in Tabs layouts and when restoring a hidden bar. */
export function useDockTabBarStyle(): ViewStyle {
  const { bottom } = useSafeAreaInsets();
  // Stable identity — screens restore this in focus-effect cleanups; a fresh object each render would loop.
  return useMemo(() => dockTabBarStyle(bottom), [bottom]);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ui.surfaceMuted, overflow: 'hidden' },
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
  backdropMuted: { backgroundColor: ui.surfaceMuted },
  panelShell: {
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  /** flexGrow keeps stretched panels (flex: 1 / fixed height) filling their shell. */
  panelClip: {
    flexGrow: 1,
    overflow: 'hidden',
  },
  panelInner: {},
  panelPadded: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  chipShell: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
    color: ui.text,
  },
  sectionHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: ui.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
});

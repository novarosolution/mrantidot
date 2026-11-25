import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  View,
  type FlatListProps,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import {
  GlassBackdrop,
  TAB_BAR_SCROLL_PAD,
  customerScrollProps,
} from '@/components/kit/GlassScreenKit';
import { StatusBarScrim, useStatusBarScrim, type ScrimScrollHandler } from '@/components/kit/StatusBarScrim';
import { spacing, surfaces } from '@/constants/theme';

/** Bottom inset so tab bar does not cover last items. */
export const TECH_TAB_BAR_PAD = TAB_BAR_SCROLL_PAD;

export const techScreenStyles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: surfaces.glassScreenBase },
  flex: { flex: 1 },
  gutter: { paddingHorizontal: spacing.md },
  scrollContent: { paddingBottom: TECH_TAB_BAR_PAD },
  scrollEmpty: { flexGrow: 1 },
});

/** Set by a TechScreen that wants the status-bar scrim; TechScreenScroll / TechScreenList report their scroll to it. */
const ScrimScrollContext = createContext<ScrimScrollHandler | null>(null);

type ScrollHandlers = Pick<ScrollViewProps, 'onScroll' | 'onScrollEndDrag' | 'onMomentumScrollEnd'>;

/**
 * Scroll props for a TechScreen scroller: the caller's own handlers plus the screen's scrim (when it has one).
 * The throttled `onScroll` can miss the final offset — a fling that settles back at the top, say — so the
 * scroll-end events re-check it too, otherwise the scrim could stay up on a page that is back at rest.
 */
function useScrimScroll({ onScroll, onScrollEndDrag, onMomentumScrollEnd }: ScrollHandlers) {
  const scrim = useContext(ScrimScrollContext);
  return useMemo(() => {
    if (!scrim) return { onScroll, onScrollEndDrag, onMomentumScrollEnd };
    const withScrim =
      (handler?: ScrimScrollHandler): ScrimScrollHandler =>
      (e) => {
        scrim(e);
        handler?.(e);
      };
    return {
      onScroll: withScrim(onScroll),
      onScrollEndDrag: withScrim(onScrollEndDrag),
      onMomentumScrollEnd: withScrim(onMomentumScrollEnd),
      scrollEventThrottle: 16,
    };
  }, [scrim, onScroll, onScrollEndDrag, onMomentumScrollEnd]);
}

/**
 * Shared tech screen shell — mesh glass backdrop + safe area.
 * Prefer this over duplicating GlassBackdrop in every tech route.
 *
 * With no fixed `header` the hero lives inside the scroll content and slides up under the clock, so the
 * shell lays a frosted status-bar scrim over it once the page scrolls (`statusScrim`, on by default in that case).
 */
export function TechScreen({
  header,
  children,
  edges = ['left', 'right'],
  style,
  backdrop = 'default',
  statusScrim = !header,
}: {
  header?: ReactNode;
  children: ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  backdrop?: 'default' | 'deep' | 'auth';
  statusScrim?: boolean;
}) {
  const scrim = useStatusBarScrim();
  return (
    <View style={[techScreenStyles.root, style]}>
      <GlassBackdrop variant={backdrop} />
      <ScrimScrollContext.Provider value={statusScrim ? scrim.onScroll : null}>
        <SafeAreaView style={techScreenStyles.flex} edges={edges}>
          {header}
          {children}
        </SafeAreaView>
      </ScrimScrollContext.Provider>
      {statusScrim ? <StatusBarScrim opacity={scrim.opacity} /> : null}
    </View>
  );
}

export function TechScreenGutter({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[techScreenStyles.gutter, style]}>{children}</View>;
}

export function TechScreenScroll({
  children,
  contentContainerStyle,
  onScroll,
  onScrollEndDrag,
  onMomentumScrollEnd,
  ...rest
}: ScrollViewProps & { children: ReactNode }) {
  const scroll = useScrimScroll({ onScroll, onScrollEndDrag, onMomentumScrollEnd });
  return (
    <ScrollView
      style={techScreenStyles.flex}
      contentContainerStyle={[techScreenStyles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...customerScrollProps}
      {...scroll}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

export function TechScreenList<T>({
  empty,
  contentContainerStyle,
  ListHeaderComponent,
  onScroll,
  onScrollEndDrag,
  onMomentumScrollEnd,
  ...rest
}: FlatListProps<T> & { empty?: boolean }) {
  const scroll = useScrimScroll({ onScroll, onScrollEndDrag, onMomentumScrollEnd });
  return (
    <FlatList
      style={techScreenStyles.flex}
      contentContainerStyle={[
        techScreenStyles.scrollContent,
        empty ? techScreenStyles.scrollEmpty : undefined,
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={ListHeaderComponent}
      {...scroll}
      {...rest}
    />
  );
}

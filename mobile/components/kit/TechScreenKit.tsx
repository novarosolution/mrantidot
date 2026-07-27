import { type ReactNode } from 'react';
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

/**
 * Shared tech screen shell — mesh glass backdrop + safe area.
 * Prefer this over duplicating GlassBackdrop in every tech route.
 */
export function TechScreen({
  header,
  children,
  edges = ['left', 'right'],
  style,
  backdrop = 'default',
}: {
  header?: ReactNode;
  children: ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  backdrop?: 'default' | 'deep' | 'auth';
}) {
  return (
    <View style={[techScreenStyles.root, style]}>
      <GlassBackdrop variant={backdrop} />
      <SafeAreaView style={techScreenStyles.flex} edges={edges}>
        {header}
        {children}
      </SafeAreaView>
    </View>
  );
}

export function TechScreenGutter({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[techScreenStyles.gutter, style]}>{children}</View>;
}

export function TechScreenScroll({
  children,
  contentContainerStyle,
  ...rest
}: ScrollViewProps & { children: ReactNode }) {
  return (
    <ScrollView
      style={techScreenStyles.flex}
      contentContainerStyle={[techScreenStyles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...customerScrollProps}
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
  ...rest
}: FlatListProps<T> & { empty?: boolean }) {
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
      {...rest}
    />
  );
}

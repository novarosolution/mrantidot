import { type ReactNode } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  View,
  type FlatListProps,
  type ScrollViewProps,
} from 'react-native';
import { TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { spacing } from '@/constants/theme';

/** Bottom inset so tab bar does not cover last items. */
export const TECH_TAB_BAR_PAD = TAB_BAR_SCROLL_PAD;

export const techScreenStyles = StyleSheet.create({
  flex: { flex: 1 },
  gutter: { paddingHorizontal: spacing.md },
  scrollContent: { paddingBottom: TECH_TAB_BAR_PAD },
  scrollEmpty: { flexGrow: 1 },
});

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

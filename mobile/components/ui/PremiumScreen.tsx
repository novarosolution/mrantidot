import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { type Edge } from 'react-native-safe-area-context';
import { GlassScreen } from '@/components/kit/GlassScreenKit';
import { design, spacing } from '@/constants/theme';

/** @deprecated Prefer GlassScreen / role shells; kept for callers that still import PremiumScreen. */
export const screenStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  content: { flex: 1, paddingBottom: spacing.sm },
  padded: { paddingHorizontal: design.screenPadding },
});

/**
 * Premium mesh + glass screen shell.
 * Thin wrapper around GlassScreen so legacy imports stay premium (not flat ivory).
 */
export function PremiumScreen({
  children,
  header,
  edges = ['top', 'left', 'right'],
  style,
  contentStyle,
  scroll = true,
}: {
  children: ReactNode;
  header?: ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
}) {
  return (
    <View style={[styles.root, style]}>
      <GlassScreen header={header} edges={edges} contentContainerStyle={contentStyle} scroll={scroll}>
        {children}
      </GlassScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

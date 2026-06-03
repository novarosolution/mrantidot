import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { design, spacing } from '@/constants/theme';

export const screenStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  content: { flex: 1, paddingBottom: spacing.sm },
  padded: { paddingHorizontal: design.screenPadding },
});

export function PremiumScreen({
  children,
  header,
  edges = ['top', 'left', 'right'],
  style,
  contentStyle,
}: {
  children: ReactNode;
  header?: ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}) {
  return (
    <SafeAreaView style={[screenStyles.safe, style]} edges={edges}>
      {header}
      <View style={[screenStyles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

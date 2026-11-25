import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { colors, spacing, typeScale, ui } from '@/constants/theme';

/**
 * Loading indicator. Screens should prefer shimmer skeletons shaped like their content; this is for
 * the brief gates in between (auth check, redirects). Full-screen is a quiet canvas with a small
 * spinner — no branded card — and dark status-bar glyphs so the clock stays readable.
 */
export function Spinner({
  fullScreen,
  label,
  color = colors.forest,
}: {
  fullScreen?: boolean;
  label?: string;
  color?: string;
}) {
  if (fullScreen) {
    return (
      <View style={styles.fullRoot} accessibilityRole="progressbar" accessibilityLabel={label}>
        <FocusStatusBar style="dark" />
        <ActivityIndicator size="small" color={color} />
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.inline} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={color} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fullRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: ui.canvas,
    padding: spacing.xl,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: spacing.lg,
  },
  label: {
    ...typeScale.captionStrong,
    color: ui.textSecondary,
  },
});

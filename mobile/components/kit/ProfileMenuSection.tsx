import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radii, spacing, typeScale, ui } from '@/constants/theme';

export function ProfileMenuSection({
  title,
  children,
  style,
}: {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.wrap, style]}>
      {title ? (
        <View style={styles.titleRow}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
        </View>
      ) : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  title: { ...typeScale.label, color: ui.textTertiary },
  card: {
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    overflow: 'hidden',
    ...ui.shadow,
  },
});

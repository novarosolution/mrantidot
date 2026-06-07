import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, fonts, premium, spacing } from '@/constants/theme';

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
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
  },
});

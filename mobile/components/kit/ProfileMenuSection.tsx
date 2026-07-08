import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, premium, premiumType, shadows, spacing } from '@/constants/theme';

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
          <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.titleAccent} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      <View style={styles.card}>
        <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        {children}
      </View>
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
  titleAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  title: {
    ...premiumType.heroEyebrow,
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
    ...shadows.card,
  },
  goldBar: {
    height: 3,
    width: '100%',
  },
});

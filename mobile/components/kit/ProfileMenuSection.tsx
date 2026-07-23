import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { colors, premiumType, spacing } from '@/constants/theme';

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
          <LinearGradient colors={['#8FD03C', '#27A747']} style={styles.titleAccent} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      <GlassPanel padded={false} goldEdge tone="clear" intensity={40} style={styles.card}>
        {children}
      </GlassPanel>
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
    borderRadius: 22,
  },
});

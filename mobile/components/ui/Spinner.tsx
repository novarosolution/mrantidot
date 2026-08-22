import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandLogo } from '@/components/BrandLogo';
import { PremiumMeshBg } from '@/components/kit/PremiumMeshBg';
import { colors, fonts, spacing } from '@/constants/theme';

/** Brand loading indicator — full-screen uses the premium forest wash + logo. */
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
      <View style={styles.fullRoot}>
        <PremiumMeshBg variant="default" />
        <SafeAreaView style={styles.full} edges={['top', 'left', 'right', 'bottom']}>
          <View style={styles.card}>
            <LinearGradient
              colors={[colors.limeBright, colors.green]}
              style={styles.goldBar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <View style={styles.logoWrap}>
              <BrandLogo size={72} animate />
            </View>
            <ActivityIndicator size="large" color={colors.forest} style={styles.spinner} />
            <Text style={styles.label}>{label?.trim() || 'Loading…'}</Text>
            <Text style={styles.hint}>Preparing your experience</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator color={color} />
      {label ? <Text style={styles.inlineLabel}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fullRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  full: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 28,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(205,232,192,0.95)',
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  goldBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  logoWrap: {
    marginBottom: spacing.md,
  },
  spinner: {
    marginTop: spacing.xs,
  },
  label: {
    marginTop: spacing.md,
    fontFamily: fonts.displaySemi,
    fontSize: 17,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  hint: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: spacing.lg,
  },
  inlineLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.muted,
  },
});

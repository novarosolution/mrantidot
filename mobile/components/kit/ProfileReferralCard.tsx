import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, gradients, premium, shadows, spacing, surfaces } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';

export function ProfileReferralCard({
  brandName,
  onShare,
}: {
  brandName: string;
  onShare: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
      onPress={() => appPush(customerRoutes.offers)}
    >
      <LinearGradient
        colors={['#F6FAF2', '#EEF8E6', '#FFFFFF']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <LinearGradient colors={[...gradients.goldBar]} style={styles.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={styles.glow} />
        <PremiumIcon icon={AppIcons.quick.offers} variant="gradient" size={20} color={colors.white} strokeWidth={2.2} boxSize={42} />
        <View style={styles.body}>
          <Text style={styles.title}>Invite & earn</Text>
          <Text style={styles.sub}>{brandName} offers</Text>
        </View>
        <Pressable
          style={styles.shareBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            onShare();
          }}
          hitSlop={8}
        >
          <LinearGradient
            colors={[colors.forest, '#1A6B3C']}
            style={styles.shareGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <PremiumIcon icon={AppIcons.ui.share} variant="plain" size={15} color={colors.white} strokeWidth={2.5} />
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.md, marginBottom: spacing.lg },
  pressed: { opacity: 0.96, transform: [{ scale: 0.995 }] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm + 4,
    paddingTop: spacing.md + 4,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    overflow: 'hidden',
    ...shadows.card,
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  glow: {
    position: 'absolute',
    top: -20,
    right: 40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(143,208,60,0.14)',
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...premium.shadowSoft,
  },
  body: { flex: 1, paddingRight: 4 },
  title: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  shareBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  shareGrad: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

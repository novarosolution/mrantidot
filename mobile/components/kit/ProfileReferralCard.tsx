import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Share2 } from 'lucide-react-native';
import { AppIcons } from '@/constants/appIcons';
import { router } from 'expo-router';
import { colors, fonts, gradients, premium, shadows, spacing } from '@/constants/theme';

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
      onPress={() => router.push('/(customer)/offers')}
    >
      <LinearGradient
        colors={['#FFF9ED', '#FFF4DC', '#FFFFFF']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.glow} />
        <LinearGradient colors={[...gradients.goldCta]} style={styles.icon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <AppIcons.quick.offers size={20} color={colors.white} strokeWidth={2.2} />
        </LinearGradient>
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
            <Share2 size={15} color={colors.white} strokeWidth={2.5} />
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
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: 'rgba(182,132,28,0.22)',
    overflow: 'hidden',
    ...shadows.card,
  },
  glow: {
    position: 'absolute',
    top: -20,
    right: 40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212,160,23,0.12)',
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

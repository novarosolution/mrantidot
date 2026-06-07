import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gift, Share2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function ProfileReferralCard({
  brandName,
  onShare,
}: {
  brandName: string;
  onShare: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.wrap, pressed && styles.pressed]} onPress={() => router.push('/(customer)/offers')}>
      <LinearGradient colors={['#FFF8E8', '#FFFFFF']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.icon}>
          <Gift size={22} color={premium.accentGold} strokeWidth={2} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>Invite friends & earn</Text>
          <Text style={styles.sub}>Share {brandName} and unlock exclusive offers</Text>
        </View>
        <Pressable
          style={styles.shareBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            onShare();
          }}
          hitSlop={8}
        >
          <Share2 size={16} color={colors.forest} strokeWidth={2.5} />
        </Pressable>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.md, marginBottom: spacing.lg },
  pressed: { opacity: 0.96 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: 'rgba(182,132,28,0.2)',
    ...shadows.card,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(182,132,28,0.25)',
  },
  body: { flex: 1 },
  title: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLogo } from '@/components/BrandLogo';
import { colors, fonts, gradients, headerTopPad, premium, radius, spacing } from '@/constants/theme';

export function AdminScreenHeader({
  title,
  subtitle,
  userInitial,
  unreadCount = 0,
  onBellPress = () => router.push('/(admin)/notifications'),
  onProfilePress = () => router.push('/(admin)/settings'),
}: {
  title: string;
  subtitle: string;
  userInitial: string;
  unreadCount?: number;
  onBellPress?: () => void;
  onProfilePress?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const letter = userInitial.slice(0, 1).toUpperCase();
  const badge = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <LinearGradient
      colors={[...gradients.premiumHero]}
      style={[styles.wrap, { paddingTop: headerTopPad(insets.top) }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.glowA} pointerEvents="none" />
      <View style={styles.glowB} pointerEvents="none" />
      <View style={styles.row}>
        <View style={styles.logoBox}>
          <BrandLogo size={36} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          onPress={onBellPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={8}
        >
          <Bell size={18} color={colors.white} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          onPress={onProfilePress}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          hitSlop={8}
        >
          <Text style={styles.avatarText}>{letter}</Text>
        </Pressable>
      </View>
      <View style={styles.goldRule} pointerEvents="none">
        <View style={styles.goldRuleAccent} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md + 4,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
    ...premium.shadowSoft,
  },
  glowA: {
    position: 'absolute',
    top: -36,
    right: -8,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(168,224,78,0.12)',
  },
  glowB: {
    position: 'absolute',
    bottom: 8,
    left: -24,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(182,132,28,0.1)',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.white, letterSpacing: -0.3 },
  sub: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.82)', marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.96 }] },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 9, color: colors.forest },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 15, color: colors.forest },
  goldRule: {
    marginTop: spacing.sm + 2,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  goldRuleAccent: {
    width: 72,
    height: '100%',
    backgroundColor: premium.accentGold,
    borderRadius: 2,
  },
});

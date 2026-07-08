import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { adminType, colors, fonts, gradients, headerTopPad, premium, radius, shadows, spacing } from '@/constants/theme';

const ACTION = 44;

export function AdminScreenHeader({
  title,
  subtitle,
  userInitial,
  unreadCount = 0,
  onBellPress = () => router.push('/(admin)/notifications'),
  onProfilePress = () => router.push('/(admin)/settings'),
}: {
  title: string;
  subtitle?: string;
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
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.sub} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
          onPress={onBellPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={8}
        >
          <Bell size={20} color={colors.forest} strokeWidth={2} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}
          onPress={onProfilePress}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          hitSlop={8}
        >
          <LinearGradient
            colors={['#2A9D5C', '#14532D']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.avatarText}>{letter}</Text>
        </Pressable>
      </View>
      <View style={styles.goldRule}>
        <View style={styles.goldAccent} />
        <View style={styles.goldLine} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.hero,
  },
  glowA: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(168,224,78,0.12)',
  },
  glowB: {
    position: 'absolute',
    bottom: -20,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(212,160,23,0.08)',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  textCol: { flex: 1, minWidth: 0 },
  title: { ...adminType.screenTitle },
  sub: { ...adminType.screenSubtitle, marginTop: 2 },
  actionBtn: {
    width: ACTION,
    height: ACTION,
    borderRadius: ACTION / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  avatarBtn: {
    width: ACTION,
    height: ACTION,
    borderRadius: ACTION / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: { ...adminType.badgeCount },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 17, color: colors.white, letterSpacing: -0.2 },
  goldRule: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  goldAccent: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: premium.accentGold,
  },
  goldLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});

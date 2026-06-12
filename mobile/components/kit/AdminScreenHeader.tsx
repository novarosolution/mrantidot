import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, gradients, headerTopPad, radius, spacing } from '@/constants/theme';

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
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  textCol: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.displayExtra, fontSize: 26, color: colors.white, letterSpacing: -0.5 },
  sub: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  actionBtn: {
    width: ACTION,
    height: ACTION,
    borderRadius: ACTION / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
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
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.white },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 17, color: colors.white },
});

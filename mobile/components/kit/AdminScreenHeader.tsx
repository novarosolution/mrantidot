import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BugMark } from '@/components/BugMark';
import { colors, fonts, gradients, headerTopPad, radius, shadows, spacing } from '@/constants/theme';

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
    >
      <View style={styles.glow} />
      <View style={styles.row}>
        <View style={styles.logoBox}>
          <BugMark size={22} />
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
          style={({ pressed }) => [styles.bellWrap, pressed && styles.pressed]}
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
          style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
          onPress={onProfilePress}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          hitSlop={8}
        >
          <Text style={styles.avatarText}>{letter}</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: 22,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.hero,
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -10,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(168,224,78,0.1)',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.white },
  sub: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.lime, marginTop: 2 },
  bellWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.amber,
    borderWidth: 2,
    borderColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontFamily: fonts.displayExtra, fontSize: 9, color: colors.forest },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarPressed: { opacity: 0.9, transform: [{ scale: 0.96 }] },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 15, color: colors.green },
});

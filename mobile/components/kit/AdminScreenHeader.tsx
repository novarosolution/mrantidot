import { LinearGradient } from 'expo-linear-gradient';
import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumAppHeader } from '@/components/kit/PremiumAppHeader';
import { colors, fonts } from '@/constants/theme';
import { adminRoutes, appPush } from '@/lib/routes';

const ACTION = 44;

export function AdminScreenHeader({
  title,
  subtitle,
  userInitial,
  unreadCount = 0,
  eyebrow = 'OPERATIONS',
  onBellPress = () => appPush(adminRoutes.notifications),
  onProfilePress = () => appPush(adminRoutes.settings),
}: {
  title: string;
  subtitle?: string;
  userInitial: string;
  unreadCount?: number;
  eyebrow?: string;
  onBellPress?: () => void;
  onProfilePress?: () => void;
}) {
  const letter = userInitial.slice(0, 1).toUpperCase();
  const badge = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <PremiumAppHeader
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      right={
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            onPress={onBellPress}
            accessibilityRole="button"
            accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            hitSlop={8}
          >
            <Bell size={20} color={colors.white} strokeWidth={2.1} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ) : (
              <View style={styles.ping} />
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.avatarShell, pressed && styles.pressed]}
            onPress={onProfilePress}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            hitSlop={8}
          >
            <LinearGradient
              colors={[colors.white, colors.soft]}
              style={styles.avatarBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>{letter}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 2 },
  actionBtn: {
    width: ACTION,
    height: ACTION,
    borderRadius: ACTION / 2,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  avatarShell: {
    borderRadius: ACTION / 2,
    shadowColor: colors.deep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarBtn: {
    width: ACTION,
    height: ACTION,
    borderRadius: ACTION / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
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
    borderColor: colors.forest,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.white,
  },
  ping: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.limeBright,
    borderWidth: 1.5,
    borderColor: colors.forest,
  },
  avatarText: {
    fontFamily: fonts.displayExtra,
    fontSize: 17,
    color: colors.forestDeep,
    letterSpacing: -0.2,
  },
});

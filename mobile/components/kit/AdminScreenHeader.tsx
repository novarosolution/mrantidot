import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Search } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumAppHeader } from '@/components/kit/PremiumAppHeader';
import { colors, fonts, ui } from '@/constants/theme';
import { adminRoutes, appPush } from '@/lib/routes';
import { useWideWebLayout } from '@/lib/webAdmin';
import { webTitle } from '@/lib/webKeys';

const ACTION = 44;

export function AdminScreenHeader({
  title,
  subtitle,
  userInitial,
  unreadCount = 0,
  eyebrow = 'OPERATIONS',
  onBellPress = () => appPush(adminRoutes.notifications),
  onProfilePress = () => appPush(adminRoutes.settings),
  onSearchPress = () => appPush(adminRoutes.search),
}: {
  title: string;
  subtitle?: string;
  userInitial: string;
  unreadCount?: number;
  eyebrow?: string;
  onBellPress?: () => void;
  onProfilePress?: () => void;
  /** Global search (phones; the desktop top bar has the search field). */
  onSearchPress?: () => void;
}) {
  const letter = userInitial.slice(0, 1).toUpperCase();
  const badge = unreadCount > 99 ? '99+' : String(unreadCount);
  // Desktop browser: the sidebar (notifications + badge) and the top bar (account menu) already have these.
  const wideWeb = useWideWebLayout();

  const actions = wideWeb ? undefined : (
    <View style={styles.actions}>
      <Pressable
        ref={webTitle('Search')}
        style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
        onPress={onSearchPress}
        accessibilityRole="button"
        accessibilityLabel="Search bookings, customers and more"
        hitSlop={8}
      >
        <Search size={20} color={ui.text} strokeWidth={2} />
      </Pressable>

      <Pressable
        ref={webTitle('Notifications')}
        style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
        onPress={onBellPress}
        accessibilityRole="button"
        accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        hitSlop={8}
      >
        <Bell size={20} color={ui.text} strokeWidth={2} />
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </Pressable>

      <Pressable
        ref={webTitle('Account settings')}
        style={({ pressed }) => [styles.avatarShell, pressed && styles.pressed]}
        onPress={onProfilePress}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        hitSlop={8}
      >
        <LinearGradient
          colors={[colors.forestMid, colors.forest]}
          style={styles.avatarBtn}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.avatarText}>{letter}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );

  return <PremiumAppHeader eyebrow={eyebrow} title={title} subtitle={subtitle} right={actions} />;
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 2 },
  actionBtn: {
    width: ACTION,
    height: ACTION,
    borderRadius: ACTION / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ui.border,
  },
  avatarShell: {
    borderRadius: ACTION / 2,
    padding: 2,
    backgroundColor: ui.brandSoft,
  },
  avatarBtn: {
    width: ACTION - 4,
    height: ACTION - 4,
    borderRadius: (ACTION - 4) / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    color: colors.white,
  },
  avatarText: {
    fontFamily: fonts.displayExtra,
    fontSize: 16,
    color: colors.white,
    letterSpacing: -0.2,
  },
});

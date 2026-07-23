import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeroDarkSlice } from '@/components/kit/HeroDarkSlice';
import { colors, fonts, headerTopPad, spacing } from '@/constants/theme';
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
  /** Small label above the title (brand hierarchy). */
  eyebrow?: string;
  onBellPress?: () => void;
  onProfilePress?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const letter = userInitial.slice(0, 1).toUpperCase();
  const badge = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <HeroDarkSlice
      style={styles.shell}
      contentStyle={[styles.content, { paddingTop: headerTopPad(insets.top) }]}
      sliceHeight={20}
    >
      <View style={styles.row}>
        <View style={styles.textCol}>
          <View style={styles.eyebrowRow}>
            <LinearGradient
              colors={['#C8F07A', '#8FD03C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.eyebrowBar}
            />
            <Text style={styles.eyebrow}>{eyebrow}</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.sub} numberOfLines={2}>
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
          <PremiumIcon icon={AppIcons.ui.bell} variant="plain" size={20} color="#FFFFFF" strokeWidth={2.2} />
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
          accessibilityLabel="Open profile"
          hitSlop={8}
        >
          <LinearGradient
            colors={['#FFFFFF', '#EAF6E3']}
            style={styles.avatarBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>{letter}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </HeroDarkSlice>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginBottom: -4,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md + 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  textCol: { flex: 1, minWidth: 0 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  eyebrowBar: { width: 18, height: 3, borderRadius: 2 },
  eyebrow: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.3,
    color: 'rgba(255,255,255,0.92)',
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.55,
    color: '#FFFFFF',
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.86)',
    marginTop: 4,
  },
  actionBtn: {
    width: ACTION,
    height: ACTION,
    borderRadius: ACTION / 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarShell: {
    borderRadius: ACTION / 2,
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarBtn: {
    width: ACTION,
    height: ACTION,
    borderRadius: ACTION / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
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
    borderColor: '#0A6423',
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
    backgroundColor: '#8FD03C',
    borderWidth: 1.5,
    borderColor: '#0A6423',
  },
  avatarText: {
    fontFamily: fonts.displayExtra,
    fontSize: 17,
    color: '#043813',
    letterSpacing: -0.2,
  },
});

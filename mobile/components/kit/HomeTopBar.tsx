import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, ChevronDown, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { homeGreetingName } from '@/lib/profile-display';
import { colors, fonts, ui } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';

/** Header wash — white at the status bar fading into a faint brand mint. */
export const HOME_HEADER_TOP = '#FFFFFF';
export const HOME_HEADER_BOTTOM = '#EEF6EF';

function greetingForHour(
  h: number,
  copy: { homeGreetingMorning: string; homeGreetingAfternoon: string; homeGreetingEvening: string },
): string {
  if (h < 12) return copy.homeGreetingMorning;
  if (h < 17) return copy.homeGreetingAfternoon;
  return copy.homeGreetingEvening;
}

/** "Union Square, San Francisco" → bold place + quiet detail line. */
function splitPlace(label: string): { place: string; detail: string } {
  const [place, ...rest] = label.split(',');
  return { place: (place ?? '').trim(), detail: rest.join(',').trim() };
}

/**
 * Premium home header — location + actions on top, compact personal greeting below.
 * Sits on a soft gradient that continues behind the status bar.
 */
export function HomeTopBar({ unread, tagline }: { unread: number; tagline?: string }) {
  const copy = useCustomerUiCopy();
  const { user } = useAuth();
  const { displayLabel, locating, refreshLocation } = useLocation();
  const name = homeGreetingName(user);
  const greeting = greetingForHour(new Date().getHours(), copy);
  const label = displayLabel?.trim() ?? '';
  const { place, detail } = splitPlace(label);
  const placeTitle = place || (locating ? copy.homeFindingLocation : copy.homeSetLocation);
  const initial = (user?.name?.trim()?.[0] ?? 'U').toUpperCase();

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[HOME_HEADER_TOP, HOME_HEADER_BOTTOM]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.topRow}>
        <Pressable
          style={({ pressed }) => [styles.location, pressed && styles.pressed]}
          onPress={() => void refreshLocation()}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Service location: ${label || placeTitle}. Tap to refresh`}
        >
          <View style={styles.pin}>
            <MapPin size={16} color={colors.white} strokeWidth={2.4} />
          </View>
          <View style={styles.placeCol}>
            <View style={styles.placeRow}>
              <Text style={styles.place} numberOfLines={1}>
                {placeTitle}
              </Text>
              {locating ? (
                <ActivityIndicator size="small" color={ui.brand} style={styles.spinner} />
              ) : (
                <ChevronDown size={16} color={ui.text} strokeWidth={2.5} />
              )}
            </View>
            <Text style={styles.detail} numberOfLines={1}>
              {detail || (place ? 'Your service location' : 'Tap to detect your location')}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          onPress={() => appPush(customerRoutes.notifications)}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell size={20} color={ui.text} strokeWidth={2} />
          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          onPress={() => appPush(customerRoutes.profile)}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <LinearGradient
            colors={[colors.forestMid, colors.forest]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
      </View>

      <View style={styles.greetingBlock}>
        <Text style={styles.greeting} numberOfLines={1}>
          {name === 'Guest' ? greeting : `${greeting}, ${name}`}
        </Text>
        <Text style={styles.tagline} numberOfLines={1}>
          {tagline?.trim() || 'What can we help you with today?'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    overflow: 'hidden',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  location: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  pin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeCol: { flex: 1, minWidth: 0 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  place: {
    flexShrink: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.25,
    color: ui.text,
  },
  detail: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 16,
    color: ui.textSecondary,
  },
  spinner: { transform: [{ scale: 0.7 }] },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 9.5, color: colors.white },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 17, color: colors.white },
  greetingBlock: { marginTop: 18 },
  greeting: {
    fontFamily: fonts.displayExtra,
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: -0.6,
    color: ui.text,
  },
  tagline: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: ui.textSecondary,
  },
  pressed: { opacity: 0.75 },
});

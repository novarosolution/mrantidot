import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, ChevronDown, CircleUserRound } from 'lucide-react-native';
import { useLocation } from '@/context/LocationContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { PressableScale } from '@/components/ui/PressableScale';
import { AURORA_BRAND_TOP } from '@/components/kit/PremiumAurora';
import { colors, fonts, ui } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';
import { fillCopy } from '@/constants/customerUiCopy';

/** Light wash still used by the profile header. */
export const HOME_HEADER_TOP = '#FFFFFF';
export const HOME_HEADER_BOTTOM = '#EAF4EC';
/** Solid brand green behind the home top bar, search and hero carousel. */
export const HOME_HERO_GREEN = '#0B7C38';
/** Top of the header gradient — also fills the status-bar strip so there is no seam. */
export const HOME_HERO_TOP = AURORA_BRAND_TOP;

/** "Union Square, San Francisco" → bold place + quiet detail line. */
function splitPlace(label: string): { place: string; detail: string } {
  const [place, ...rest] = label.split(',');
  return { place: (place ?? '').trim(), detail: rest.join(',').trim() };
}

/**
 * Home header on the brand green: the service promise as a big title, a "Home – area ⌄" location line,
 * and two round white buttons (notifications, profile). Search and the hero carousel continue below.
 */
export function HomeTopBar({ unread, scrollY }: { unread: number; scrollY?: Animated.Value }) {
  const copy = useCustomerUiCopy();
  const { displayLabel, locating, refreshLocation } = useLocation();
  const label = displayLabel?.trim() ?? '';
  const { place, detail } = splitPlace(label);
  const where = place
    ? [place, detail].filter(Boolean).join(', ')
    : locating
      ? copy.homeFindingLocation
      : copy.homeSetLocation;

  return (
    <View style={styles.wrap}>
      {/* Fades and lifts away as the feed scrolls under the sticky search bar. */}
      <Animated.View
        style={[
          styles.row,
          scrollY
            ? {
                opacity: scrollY.interpolate({ inputRange: [0, 70], outputRange: [1, 0], extrapolate: 'clamp' }),
                transform: [{ translateY: scrollY.interpolate({ inputRange: [0, 70], outputRange: [0, -10], extrapolate: 'clamp' }) }],
              }
            : null,
        ]}
      >
        <Pressable
          style={({ pressed }) => [styles.textCol, pressed && styles.pressed]}
          onPress={() => void refreshLocation()}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={fillCopy(copy.homeTopLocationA11y, { title: copy.homeHeroTitle, place: where })}
        >
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {copy.homeHeroTitle}
          </Text>
          <View style={styles.placeRow}>
            <Text style={styles.place} numberOfLines={1}>
              <Text style={styles.placeLabel}>{copy.homeLocationLabel}</Text>
              {` - ${where}`}
            </Text>
            {locating ? (
              <ActivityIndicator size="small" color={colors.white} style={styles.spinner} />
            ) : (
              <ChevronDown size={18} color={colors.white} strokeWidth={2.2} />
            )}
          </View>
        </Pressable>

        <PressableScale
          scaleTo={0.92}
          style={styles.circle}
          onPress={() => appPush(customerRoutes.notifications)}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={unread > 0 ? fillCopy(copy.profileNotificationsA11y, { count: unread }) : copy.profileMenuNotifications}
        >
          <Bell size={20} color={ui.text} strokeWidth={1.9} />
          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          ) : null}
        </PressableScale>

        <PressableScale
          scaleTo={0.92}
          style={styles.circle}
          onPress={() => appPush(customerRoutes.profile)}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={copy.homeOpenProfileA11y}
        >
          <CircleUserRound size={25} color={ui.text} strokeWidth={1.8} />
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const CIRCLE = 42;

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  textCol: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: fonts.displaySemi,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: colors.white,
  },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  place: {
    flexShrink: 1,
    fontFamily: fonts.body,
    fontSize: 14.5,
    color: 'rgba(255,255,255,0.94)',
  },
  placeLabel: { fontFamily: fonts.bodySemi, color: colors.white },
  spinner: { transform: [{ scale: 0.7 }] },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: HOME_HERO_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 9.5, color: colors.white },
  pressed: { opacity: 0.8 },
});

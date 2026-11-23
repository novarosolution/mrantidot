import { Redirect, Tabs, useSegments } from 'expo-router';
import { KitTabBarButton } from '@/components/kit/KitTabBarButton';
import { GlassTabBarBackground, useDockTabBarStyle } from '@/components/kit/GlassScreenKit';
import { KitTabBarIcon } from '@/components/kit/PremiumIcon';
import { Spinner } from '@/components/ui/Spinner';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, typography, ui } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { isProfileIncomplete } from '@/lib/profile-display';
import { appHref, authRoutes, customerRoutes, homeRouteForRole } from '@/lib/routes';
import { Platform } from 'react-native';
import { WebAdminRedirect } from '@/components/admin/WebAdminRedirect';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

const Tab = AppIcons.customerTab;

/** Screens incomplete OTP profiles may still open (booking follow-ups + settings). */
const INCOMPLETE_PROFILE_ALLOWED = new Set([
  'settings',
  'booking',
  'bookings',
  'notifications',
  'help',
  'faq',
  'addresses',
  'book-guide',
  'about',
  'terms',
  'privacy',
  'payment-methods',
  'services',
]);

function CustomerLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const tabBarStyle = useDockTabBarStyle();
  const copy = useCustomerUiCopy();

  if (isLoading) return <Spinner fullScreen />;
  if (!user) return <Redirect href={authRoutes.login} />;
  if (user.role !== 'customer') {
    return <Redirect href={appHref(homeRouteForRole(user.role))} />;
  }
  if (isProfileIncomplete(user)) {
    const allowed = (segments as string[]).some((s) => INCOMPLETE_PROFILE_ALLOWED.has(s));
    if (!allowed) {
      return <Redirect href={appHref(customerRoutes.settings)} />;
    }
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: ui.textTertiary,
        tabBarStyle,
        tabBarBackground: () => <GlassTabBarBackground />,
        tabBarLabelStyle: {
          ...typography.tabLabel,
          fontFamily: fonts.bodySemi,
          fontSize: 11,
          letterSpacing: 0.1,
          marginTop: 3,
        },
        tabBarItemStyle: {
          paddingTop: 0,
        },
        tabBarButton: (props) => <KitTabBarButton {...props} />,
        tabBarHideOnKeyboard: true,
        // Hidden tabs stop re-rendering (their decorative loops also pause via useAmbientLoop).
        freezeOnBlur: true,
        sceneStyle: { backgroundColor: ui.canvas },
      }}
    >
      <Tabs.Screen name="index" options={{ title: copy.customerTabHome, tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.home} color={color} focused={focused} /> }} />
      <Tabs.Screen name="bookings" options={{ title: copy.customerTabBookings, tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.bookings} color={color} focused={focused} /> }} />
      <Tabs.Screen name="offers" options={{ title: copy.customerTabOffers, tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.offers} color={color} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: copy.customerTabProfile, tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.profile} color={color} focused={focused} /> }} />
      <Tabs.Screen name="services" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="addresses" options={{ href: null }} />
      <Tabs.Screen name="payment-methods" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      {/* Booking detail has its own sticky actions — no tab bar there (set once, so it never flashes). */}
      <Tabs.Screen name="booking" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="help" options={{ href: null }} />
      <Tabs.Screen name="book-guide" options={{ href: null }} />
      <Tabs.Screen name="faq" options={{ href: null }} />
      <Tabs.Screen name="about" options={{ href: null }} />
      <Tabs.Screen name="terms" options={{ href: null }} />
      <Tabs.Screen name="privacy" options={{ href: null }} />
    </Tabs>
  );
}

/** The web build is the admin panel only — these screens redirect to the admin app or sign-in there. */
export default Platform.OS === 'web' ? WebAdminRedirect : CustomerLayout;

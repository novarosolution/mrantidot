import { Redirect, Tabs, useSegments } from 'expo-router';
import { KitTabBarButton } from '@/components/kit/KitTabBarButton';
import { GlassTabBarBackground, glassTabBarStyle } from '@/components/kit/GlassScreenKit';
import { KitTabBarIcon } from '@/components/kit/PremiumIcon';
import { Spinner } from '@/components/ui/Spinner';
import { AppIcons } from '@/constants/appIcons';
import { fonts, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { isProfileIncomplete } from '@/lib/profile-display';
import { appHref, authRoutes, customerRoutes, homeRouteForRole } from '@/lib/routes';

const Tab = AppIcons.customerTab;

/** Screens incomplete OTP profiles may still open (booking follow-ups + settings). */
const INCOMPLETE_PROFILE_ALLOWED = new Set([
  'settings',
  'booking',
  'notifications',
  'help',
  'faq',
]);

export default function CustomerLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

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
        tabBarActiveTintColor: '#0A6423',
        tabBarInactiveTintColor: '#2F5538',
        tabBarStyle: glassTabBarStyle,
        tabBarBackground: () => <GlassTabBarBackground />,
        tabBarLabelStyle: {
          ...typography.tabLabel,
          fontFamily: fonts.bodyBold,
          fontSize: 10,
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingTop: 0,
        },
        tabBarButton: (props) => <KitTabBarButton {...props} />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.home} color={color} focused={focused} /> }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.bookings} color={color} focused={focused} /> }} />
      <Tabs.Screen name="offers" options={{ title: 'Offers', tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.offers} color={color} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.profile} color={color} focused={focused} /> }} />
      <Tabs.Screen name="services" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="addresses" options={{ href: null }} />
      <Tabs.Screen name="payment-methods" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="booking" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
      <Tabs.Screen name="faq" options={{ href: null }} />
      <Tabs.Screen name="about" options={{ href: null }} />
      <Tabs.Screen name="terms" options={{ href: null }} />
      <Tabs.Screen name="privacy" options={{ href: null }} />
    </Tabs>
  );
}

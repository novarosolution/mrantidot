import { Tabs } from 'expo-router';
import { KitTabBarButton } from '@/components/kit/KitTabBarButton';
import { GlassTabBarBackground, glassTabBarStyle } from '@/components/kit/GlassScreenKit';
import { KitTabBarIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, design, typography } from '@/constants/theme';

const Tab = AppIcons.customerTab;

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: design.tabBarActive,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: glassTabBarStyle,
        tabBarBackground: () => <GlassTabBarBackground />,
        tabBarLabelStyle: typography.tabLabel,
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

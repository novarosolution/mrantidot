import { Tabs } from 'expo-router';
import { KitTabBarButton } from '@/components/kit/KitTabBarButton';
import { AppIcons } from '@/constants/appIcons';
import { colors, design, fonts } from '@/constants/theme';

const Tab = AppIcons.customerTab;

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: design.tabBarActive,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: design.tabBar,
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 10 },
        tabBarButton: (props) => <KitTabBarButton {...props} />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Tab.home color={color} size={size} /> }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: ({ color, size }) => <Tab.bookings color={color} size={size} /> }} />
      <Tabs.Screen name="offers" options={{ title: 'Offers', tabBarIcon: ({ color, size }) => <Tab.offers color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Tab.profile color={color} size={size} /> }} />
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

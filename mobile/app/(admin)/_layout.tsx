import { Tabs } from 'expo-router';
import { KitTabBarButton } from '@/components/kit/KitTabBarButton';
import { AppIcons } from '@/constants/appIcons';
import { colors, design, fonts } from '@/constants/theme';

const Tab = AppIcons.adminTab;

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarActiveTintColor: design.tabBarActive,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: design.tabBar,
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 10 },
        tabBarButton: (props) => <KitTabBarButton {...props} />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Tab.dashboard color={color} size={size} /> }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: ({ color, size }) => <Tab.bookings color={color} size={size} /> }} />
      <Tabs.Screen name="team" options={{ title: 'Team', tabBarIcon: ({ color, size }) => <Tab.team color={color} size={size} /> }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports', tabBarIcon: ({ color, size }) => <Tab.reports color={color} size={size} /> }} />
      <Tabs.Screen name="services" options={{ href: null }} />
      <Tabs.Screen name="technicians" options={{ href: null }} />
      <Tabs.Screen name="customers" options={{ href: null }} />
      <Tabs.Screen name="service-edit" options={{ href: null }} />
      <Tabs.Screen name="booking/[id]" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="customer/[id]" options={{ href: null }} />
      <Tabs.Screen name="technician/[id]" options={{ href: null }} />
      <Tabs.Screen name="technician-edit" options={{ href: null }} />
      <Tabs.Screen name="offers" options={{ href: null }} />
      <Tabs.Screen name="offer-edit" options={{ href: null }} />
      <Tabs.Screen name="customer-edit" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="content" options={{ href: null }} />
      <Tabs.Screen name="reviews" options={{ href: null }} />
      <Tabs.Screen name="users" options={{ href: null }} />
      <Tabs.Screen name="user-edit" options={{ href: null }} />
    </Tabs>
  );
}

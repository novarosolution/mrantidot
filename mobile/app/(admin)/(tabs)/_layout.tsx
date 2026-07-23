import { Tabs } from 'expo-router';
import { KitTabBarButton } from '@/components/kit/KitTabBarButton';
import { GlassTabBarBackground, glassTabBarStyle } from '@/components/kit/GlassScreenKit';
import { KitTabBarIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { fonts, typography } from '@/constants/theme';

const Tab = AppIcons.adminTab;

export default function AdminTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
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
        tabBarButton: (props) => <KitTabBarButton {...props} />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.dashboard} color={color} focused={focused} /> }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.bookings} color={color} focused={focused} /> }} />
      <Tabs.Screen name="team" options={{ title: 'Manage', tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.team} color={color} focused={focused} /> }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports', tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.reports} color={color} focused={focused} /> }} />
    </Tabs>
  );
}

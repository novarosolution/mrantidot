import { Tabs } from 'expo-router';
import { KitTabBarButton } from '@/components/kit/KitTabBarButton';
import { GlassTabBarBackground, glassTabBarStyle } from '@/components/kit/GlassScreenKit';
import { KitTabBarIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, design, typography } from '@/constants/theme';

const Tab = AppIcons.techTab;

export default function TechLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarActiveTintColor: design.tabBarActive,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: glassTabBarStyle,
        tabBarBackground: () => <GlassTabBarBackground />,
        tabBarLabelStyle: typography.tabLabel,
        tabBarButton: (props) => <KitTabBarButton {...props} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.jobs} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.profile} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="job/[id]" options={{ href: null }} />
    </Tabs>
  );
}

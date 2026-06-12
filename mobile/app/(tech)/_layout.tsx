import { Tabs } from 'expo-router';
import { ClipboardList, UserCircle } from 'lucide-react-native';
import { KitTabBarButton } from '@/components/kit/KitTabBarButton';
import { colors, design, fonts } from '@/constants/theme';

export default function TechLayout() {
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <UserCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="job/[id]" options={{ href: null }} />
    </Tabs>
  );
}

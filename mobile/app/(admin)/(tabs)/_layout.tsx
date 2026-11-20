import { Tabs } from 'expo-router';
import { KitTabBarButton } from '@/components/kit/KitTabBarButton';
import { GlassTabBarBackground, useDockTabBarStyle } from '@/components/kit/GlassScreenKit';
import { KitTabBarIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, typography, ui } from '@/constants/theme';
import { adminDocumentTitle, IS_WEB, useWideWebLayout } from '@/lib/webAdmin';

const Tab = AppIcons.adminTab;

/** Desktop browsers navigate with the WebAdminShell sidebar, so the bottom dock is hidden there. */
const HIDDEN_TAB_BAR = { display: 'none' } as const;

/** Native: the tab label. Web: also a browser-tab title (`Bookings · Mr Antidot Admin`), label kept as-is. */
function tabTitle(name: string, label: string) {
  return IS_WEB ? { title: adminDocumentTitle(name), tabBarLabel: label } : { title: label };
}

export default function AdminTabsLayout() {
  const dockTabBarStyle = useDockTabBarStyle();
  const wideWeb = useWideWebLayout();
  const tabBarStyle = wideWeb ? HIDDEN_TAB_BAR : dockTabBarStyle;
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
        tabBarButton: (props) => <KitTabBarButton {...props} />,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ ...tabTitle('index', 'Dashboard'), tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.dashboard} color={color} focused={focused} /> }} />
      <Tabs.Screen name="bookings" options={{ ...tabTitle('bookings', 'Bookings'), tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.bookings} color={color} focused={focused} /> }} />
      <Tabs.Screen name="team" options={{ ...tabTitle('team', 'Manage'), tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.team} color={color} focused={focused} /> }} />
      <Tabs.Screen name="reports" options={{ ...tabTitle('reports', 'Reports'), tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.reports} color={color} focused={focused} /> }} />
    </Tabs>
  );
}

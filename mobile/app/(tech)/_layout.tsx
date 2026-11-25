import { Redirect, Tabs } from 'expo-router';
import { KitTabBarButton } from '@/components/kit/KitTabBarButton';
import { GlassTabBarBackground, useDockTabBarStyle } from '@/components/kit/GlassScreenKit';
import { KitTabBarIcon } from '@/components/kit/PremiumIcon';
import { Spinner } from '@/components/ui/Spinner';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, typography, ui } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { appHref, authRoutes, homeRouteForRole } from '@/lib/routes';
import { Platform } from 'react-native';
import { WebAdminRedirect } from '@/components/admin/WebAdminRedirect';

const Tab = AppIcons.techTab;

function TechLayout() {
  const { user, isLoading } = useAuth();
  const tabBarStyle = useDockTabBarStyle();
  const copy = useCustomerUiCopy();

  if (isLoading) return <Spinner fullScreen />;
  if (!user) return <Redirect href={authRoutes.login} />;
  if (user.role !== 'technician') {
    return <Redirect href={appHref(homeRouteForRole(user.role))} />;
  }

  return (
    <Tabs
      // Inbox, leave, analytics and job detail are hidden tabs: "back" must return to the screen the
      // technician came from (inbox → job → back lands on the inbox), not jump to the first tab.
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        lazy: true,
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
      <Tabs.Screen
        name="index"
        options={{
          title: copy.techTabJobs,
          tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.jobs} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: copy.techTabProfile,
          tabBarIcon: ({ color, focused }) => <KitTabBarIcon icon={Tab.profile} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="leave" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="job/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}

/** The web build is the admin panel only — these screens redirect to the admin app or sign-in there. */
export default Platform.OS === 'web' ? WebAdminRedirect : TechLayout;

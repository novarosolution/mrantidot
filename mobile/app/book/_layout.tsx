import { Redirect, Stack } from 'expo-router';
import { Spinner } from '@/components/ui/Spinner';
import { design } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { appHref, authRoutes, homeRouteForRole } from '@/lib/routes';
import { Platform } from 'react-native';
import { WebAdminRedirect } from '@/components/admin/WebAdminRedirect';

function Layout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner fullScreen />;
  if (!user) return <Redirect href={authRoutes.login} />;
  if (user.role !== 'customer') {
    return <Redirect href={appHref(homeRouteForRole(user.role))} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: design.screenBg },
      }}
    />
  );
}

/** The web build is the admin panel only — these screens redirect to the admin app or sign-in there. */
export default Platform.OS === 'web' ? WebAdminRedirect : Layout;

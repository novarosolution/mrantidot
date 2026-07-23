import { Redirect, Stack } from 'expo-router';
import { Spinner } from '@/components/ui/Spinner';
import { design } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { appHref, authRoutes, homeRouteForRole } from '@/lib/routes';

export default function Layout() {
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

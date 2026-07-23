import { Redirect, Stack } from 'expo-router';
import { Spinner } from '@/components/ui/Spinner';
import { design } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { isProfileIncomplete } from '@/lib/profile-display';
import { appHref, customerRoutes, homeRouteForRole } from '@/lib/routes';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner fullScreen />;
  if (user) {
    if (user.role === 'customer' && isProfileIncomplete(user)) {
      return <Redirect href={appHref(customerRoutes.settings)} />;
    }
    return <Redirect href={appHref(homeRouteForRole(user.role))} />;
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: design.screenBg } }} />;
}

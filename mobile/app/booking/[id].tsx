import { Redirect, useLocalSearchParams } from 'expo-router';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { bookingDetailPath, authRoutes, appHref, homeRouteForRole } from '@/lib/routes';
import { paramString } from '@/lib/routeParams';

/** Legacy /booking/:id URLs — send users to the correct role-specific screen. */
export default function BookingDetailRedirect() {
  const { user, isLoading } = useAuth();
  const id = paramString(useLocalSearchParams<{ id?: string | string[] }>().id);

  if (isLoading) return <Spinner fullScreen />;
  if (!user) return <Redirect href={authRoutes.login} />;
  if (!id) return <Redirect href={appHref(homeRouteForRole(user.role))} />;

  return <Redirect href={appHref(bookingDetailPath(user.role, id))} />;
}

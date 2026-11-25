import { Redirect, useGlobalSearchParams, usePathname, type Href } from 'expo-router';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { adminRoutes, authRoutes } from '@/lib/routes';
import { webAdminPathFor } from '@/lib/webAdmin';

/**
 * Web only: customer / technician screens are not part of the admin panel. A signed-in admin who lands
 * on one (web URLs drop route groups, so a refresh on `/bookings` can resolve to the customer tab) is
 * sent to the matching admin screen with the same query; everyone else goes to sign-in.
 */
export function WebAdminRedirect() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const search = useGlobalSearchParams<Record<string, string | string[]>>();

  if (isLoading) return <Spinner fullScreen />;
  if (!user || user.role !== 'admin') return <Redirect href={authRoutes.login} />;

  const target = webAdminPathFor(pathname);
  const params: Record<string, string> = {};
  if (target !== adminRoutes.home) {
    for (const [key, value] of Object.entries(search)) {
      // Dynamic segments (the `id` of /booking/[id]) are already part of the target path.
      if (key === 'id' || value == null) continue;
      params[key] = Array.isArray(value) ? value.join(',') : String(value);
    }
  }
  const href = (Object.keys(params).length > 0 ? { pathname: target, params } : target) as Href;
  return <Redirect href={href} />;
}

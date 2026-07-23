import { Redirect, useLocalSearchParams } from 'expo-router';
import { paramString } from '@/lib/routeParams';
import { adminRoutes } from '@/lib/routes';

/** Legacy route — redirects to unified user edit. */
export default function CustomerEditRedirect() {
  const id = paramString(useLocalSearchParams<{ id?: string | string[] }>().id);
  if (id) {
    return <Redirect href={{ pathname: adminRoutes.userEdit, params: { id } }} />;
  }
  return <Redirect href={{ pathname: adminRoutes.userEdit, params: { role: 'customer' } }} />;
}

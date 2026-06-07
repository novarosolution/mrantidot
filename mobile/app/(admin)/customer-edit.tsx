import { Redirect, useLocalSearchParams } from 'expo-router';
import { paramString } from '@/lib/routeParams';

/** Legacy route — redirects to unified user edit. */
export default function CustomerEditRedirect() {
  const id = paramString(useLocalSearchParams<{ id?: string | string[] }>().id);
  if (id) {
    return <Redirect href={{ pathname: '/(admin)/user-edit', params: { id } }} />;
  }
  return <Redirect href={{ pathname: '/(admin)/user-edit', params: { role: 'customer' } }} />;
}

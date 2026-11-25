import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { WebAdminRedirect } from '@/components/admin/WebAdminRedirect';

function BookingRedirectLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

/** The web build is the admin panel only — these screens redirect to the admin app or sign-in there. */
export default Platform.OS === 'web' ? WebAdminRedirect : BookingRedirectLayout;

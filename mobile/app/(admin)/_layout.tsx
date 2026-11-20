import { Redirect, Stack } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';
import { WebAdminShell } from '@/components/admin/WebAdminShell';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { appHref, authRoutes, homeRouteForRole } from '@/lib/routes';
import { adminDocumentTitle } from '@/lib/webAdmin';

const IS_WEB = Platform.OS === 'web';

const STACK_OPTIONS = {
  headerShown: false,
  animation: 'slide_from_right',
  contentStyle: { backgroundColor: 'transparent' },
} as const;

/** Web: same options plus a per-screen browser-tab title (the header is hidden, so native never shows it). */
const WEB_STACK_OPTIONS: ComponentProps<typeof Stack>['screenOptions'] = ({ route }) => ({
  ...STACK_OPTIONS,
  title: adminDocumentTitle(route.name),
});

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner fullScreen />;

  if (!user) return <Redirect href={authRoutes.login} />;

  if (user.role !== 'admin') {
    return <Redirect href={appHref(homeRouteForRole(user.role))} />;
  }

  const stack = (
    <Stack screenOptions={IS_WEB ? WEB_STACK_OPTIONS : STACK_OPTIONS}>
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      <Stack.Screen name="content" />
      <Stack.Screen name="services" />
      <Stack.Screen name="service-order" />
      <Stack.Screen name="service-edit" />
      <Stack.Screen name="offers" />
      <Stack.Screen name="offer-edit" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="customer/[id]" />
      <Stack.Screen name="customer-edit" />
      <Stack.Screen name="technicians" />
      <Stack.Screen name="technician/[id]" />
      <Stack.Screen name="technician-edit" />
      <Stack.Screen name="users" />
      <Stack.Screen name="user-edit" />
      <Stack.Screen name="booking/[id]" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="data-export" />
      <Stack.Screen name="reviews" />
      <Stack.Screen name="leave" />
      <Stack.Screen name="payroll" />
    </Stack>
  );

  // Desktop browsers get the sidebar frame (narrow windows keep the phone layout inside it).
  return IS_WEB ? <WebAdminShell>{stack}</WebAdminShell> : stack;
}

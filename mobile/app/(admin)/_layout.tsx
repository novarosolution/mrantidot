import { Redirect, Stack } from 'expo-router';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { appHref, authRoutes, homeRouteForRole } from '@/lib/routes';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner fullScreen />;

  if (!user) return <Redirect href={authRoutes.login} />;

  if (user.role !== 'admin') {
    return <Redirect href={appHref(homeRouteForRole(user.role))} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      <Stack.Screen name="content" />
      <Stack.Screen name="services" />
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
      <Stack.Screen name="reviews" />
      <Stack.Screen name="leave" />
      <Stack.Screen name="payroll" />
    </Stack>
  );
}

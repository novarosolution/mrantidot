import { Redirect } from 'expo-router';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner fullScreen />;

  if (!user) return <Redirect href="/(auth)/splash" />;
  if (user.role === 'admin') return <Redirect href="/(admin)" />;
  if (user.role === 'technician') return <Redirect href="/(tech)" />;
  return <Redirect href="/(customer)" />;
}

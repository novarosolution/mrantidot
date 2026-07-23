import { Redirect } from 'expo-router';
import { techRoutes } from '@/lib/routes';

/** Analytics merged into technician profile */
export default function TechAnalyticsScreen() {
  return <Redirect href={techRoutes.profile} />;
}

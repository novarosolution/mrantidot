import { ScrollView } from 'react-native';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminTabHint } from '@/components/kit/AdminPageKit';
import { adminRoutes } from '@/lib/routes';

/** Placeholder — filled in by the admin upgrade (see docs/ui-roadmap.md). */
export default function AdminBookingCreateScreen() {
  return (
    <AdminListShell title="New booking" subtitle="Book a service for a customer" backFallback={adminRoutes.bookings}>
      <ScrollView contentContainerStyle={adminListShellStyles.form}>
        <AdminTabHint title="Coming soon" body="This screen is being built." />
      </ScrollView>
    </AdminListShell>
  );
}

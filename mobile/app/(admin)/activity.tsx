import { ScrollView } from 'react-native';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminTabHint } from '@/components/kit/AdminPageKit';
import { adminRoutes } from '@/lib/routes';

/** Placeholder — filled in by the admin upgrade (see docs/ui-roadmap.md). */
export default function ActivityLogScreen() {
  return (
    <AdminListShell title="Activity log" subtitle="Who changed what, and when" backFallback={adminRoutes.team}>
      <ScrollView contentContainerStyle={adminListShellStyles.form}>
        <AdminTabHint title="Coming soon" body="This screen is being built." />
      </ScrollView>
    </AdminListShell>
  );
}

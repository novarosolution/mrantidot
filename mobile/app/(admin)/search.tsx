import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { AdminSearchPanel } from '@/components/admin/search/AdminSearchPanel';
import { AdminListShell } from '@/components/kit/AdminListShell';
import { adminGoBack, adminRoutes } from '@/lib/routes';

/**
 * Phone search (header search button): bookings by ref / customer / phone / service, customers,
 * technicians, services, offer codes and blog posts, plus quick actions and recent searches.
 * The desktop web uses the same panel in the ⌘K command palette.
 */
export default function AdminSearchScreen() {
  return (
    <AdminListShell title="Search" subtitle="Bookings, people, services, codes and posts" backFallback={adminRoutes.home}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <AdminSearchPanel variant="screen" onClose={Platform.OS === 'web' ? () => adminGoBack(adminRoutes.home) : undefined} />
      </KeyboardAvoidingView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

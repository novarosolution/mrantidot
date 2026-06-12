import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Settings } from 'lucide-react-native';
import { AdminHubLink } from '@/components/kit/AdminHubLink';
import { AdminScreenHeader } from '@/components/kit/AdminScreenHeader';
import { AdminSectionTitle } from '@/components/kit/AdminListShell';
import { Button } from '@/components/ui/Button';
import { AppIcons } from '@/constants/appIcons';
import { useAuth } from '@/context/AuthContext';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { userInitial } from '@/lib/userInitials';
import { colors, design, spacing } from '@/constants/theme';

const Hub = AppIcons.adminHub;
const Tab = AppIcons.adminTab;

const OPERATIONS_LINKS = [
  {
    icon: Tab.bookings,
    label: 'Bookings',
    desc: 'Assign techs, confirm & track jobs',
    href: '/(admin)/bookings' as const,
  },
  {
    icon: Bell,
    label: 'Notifications',
    desc: 'Unread alerts & activity feed',
    href: '/(admin)/notifications' as const,
  },
  {
    icon: Tab.reports,
    label: 'Reports',
    desc: 'Revenue, trends & performance',
    href: '/(admin)/reports' as const,
  },
];

const CONTENT_LINKS = [
  {
    icon: Hub.homeContent,
    label: 'App content',
    desc: 'Promo banner, home screen & brand',
    href: '/(admin)/content' as const,
  },
  {
    icon: AppIcons.contentTab.booking,
    label: 'Booking copy',
    desc: 'Wizard steps, lists & status text',
    href: '/(admin)/content?tab=booking' as const,
  },
  {
    icon: Hub.services,
    label: 'Services catalog',
    desc: 'Pricing, categories & availability',
    href: '/(admin)/services' as const,
  },
  {
    icon: Hub.offers,
    label: 'Offers & promos',
    desc: 'Discounts and seasonal deals',
    href: '/(admin)/offers' as const,
  },
  {
    icon: Hub.reviews,
    label: 'Reviews',
    desc: 'Customer feedback & ratings',
    href: '/(admin)/reviews' as const,
  },
];

const PEOPLE_LINKS = [
  {
    icon: Hub.users,
    label: 'Users & roles',
    desc: 'Admin access & permissions',
    href: '/(admin)/users' as const,
  },
  {
    icon: Hub.technicians,
    label: 'Technicians',
    desc: 'Field team roster & skills',
    href: '/(admin)/technicians' as const,
  },
  {
    icon: Hub.customers,
    label: 'Customers',
    desc: 'Accounts, history & contact info',
    href: '/(admin)/customers' as const,
  },
];

const SYSTEM_LINKS = [
  {
    icon: Settings,
    label: 'Settings',
    desc: 'Profile, password & preferences',
    href: '/(admin)/settings' as const,
  },
];

export default function TeamHubScreen() {
  const { user } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const initial = userInitial(user?.name);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <AdminScreenHeader
        title="Manage"
        subtitle="Content, people & operations"
        userInitial={initial}
        unreadCount={unreadCount}
      />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AdminSectionTitle title="Operations" hint="Day-to-day jobs and alerts" />
        <View style={styles.links}>
          {OPERATIONS_LINKS.map((l) => (
            <AdminHubLink key={l.href} icon={l.icon} label={l.label} desc={l.desc} onPress={() => router.push(l.href)} />
          ))}
        </View>

        <AdminSectionTitle title="Content & catalog" hint="What customers see in the app" />
        <View style={styles.links}>
          {CONTENT_LINKS.map((l) => (
            <AdminHubLink key={l.href} icon={l.icon} label={l.label} desc={l.desc} onPress={() => router.push(l.href)} />
          ))}
        </View>

        <AdminSectionTitle title="People" hint="Team members and customer accounts" />
        <View style={styles.links}>
          {PEOPLE_LINKS.map((l) => (
            <AdminHubLink key={l.href} icon={l.icon} label={l.label} desc={l.desc} onPress={() => router.push(l.href)} />
          ))}
        </View>

        <AdminSectionTitle title="Account" hint="Your admin profile" />
        <View style={styles.links}>
          {SYSTEM_LINKS.map((l) => (
            <AdminHubLink key={l.href} icon={l.icon} label={l.label} desc={l.desc} onPress={() => router.push(l.href)} />
          ))}
        </View>

        <View style={styles.addBlock}>
          <Button
            title="Add technician"
            variant="premium"
            onPress={() => router.push({ pathname: '/(admin)/user-edit', params: { role: 'technician' } })}
          />
          <Button
            title="Add customer"
            variant="secondary"
            onPress={() => router.push({ pathname: '/(admin)/user-edit', params: { role: 'customer' } })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  flex: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  links: { paddingHorizontal: spacing.md, gap: spacing.sm },
  addBlock: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    gap: spacing.sm,
  },
});

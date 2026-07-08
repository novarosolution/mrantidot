import { StyleSheet, View } from 'react-native';
import { Bell, Settings } from 'lucide-react-native';
import { AdminHubLink } from '@/components/kit/AdminHubLink';
import { AdminScreenHeader } from '@/components/kit/AdminScreenHeader';
import { AdminTabScreen } from '@/components/kit/AdminScreenKit';
import { AdminSectionTitle } from '@/components/kit/AdminListShell';
import { Button } from '@/components/ui/Button';
import { AppIcons } from '@/constants/appIcons';
import { useAuth } from '@/context/AuthContext';
import { adminRoutes, appPush, type RouteInput } from '@/lib/routes';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { userInitial } from '@/lib/userInitials';
import { colors, spacing } from '@/constants/theme';

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

const CONTENT_LINKS: Array<{
  icon: typeof Hub.homeContent;
  label: string;
  desc: string;
  href: RouteInput;
}> = [
  {
    icon: Hub.homeContent,
    label: 'App content',
    desc: 'Promo banner, home screen & brand',
    href: adminRoutes.content,
  },
  {
    icon: AppIcons.contentTab.booking,
    label: 'Booking copy',
    desc: 'Wizard steps, lists & status text',
    href: { pathname: adminRoutes.content, params: { tab: 'booking' } },
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
    <AdminTabScreen
      header={
        <AdminScreenHeader
          title="Manage"
          subtitle="Content, people & operations"
          userInitial={initial}
          unreadCount={unreadCount}
        />
      }
    >
        <AdminSectionTitle title="Operations" hint="Day-to-day jobs and alerts" />
        <View style={styles.links}>
          {OPERATIONS_LINKS.map((l) => (
            <AdminHubLink key={l.href} icon={l.icon} label={l.label} desc={l.desc} onPress={() => appPush(l.href)} />
          ))}
        </View>

        <AdminSectionTitle title="Content & catalog" hint="What customers see in the app" />
        <View style={styles.links}>
          {CONTENT_LINKS.map((l) => (
            <AdminHubLink key={l.label} icon={l.icon} label={l.label} desc={l.desc} onPress={() => appPush(l.href)} />
          ))}
        </View>

        <AdminSectionTitle title="People" hint="Team members and customer accounts" />
        <View style={styles.links}>
          {PEOPLE_LINKS.map((l) => (
            <AdminHubLink key={l.href} icon={l.icon} label={l.label} desc={l.desc} onPress={() => appPush(l.href)} />
          ))}
        </View>

        <AdminSectionTitle title="Account" hint="Your admin profile" />
        <View style={styles.links}>
          {SYSTEM_LINKS.map((l) => (
            <AdminHubLink key={l.href} icon={l.icon} label={l.label} desc={l.desc} onPress={() => appPush(l.href)} />
          ))}
        </View>

        <View style={styles.addBlock}>
          <Button
            title="Add technician"
            variant="premium"
            onPress={() =>
              appPush({
                pathname: adminRoutes.userEdit,
                params: { role: 'technician', returnTo: adminRoutes.team },
              })
            }
          />
          <Button
            title="Add customer"
            variant="secondary"
            onPress={() =>
              appPush({
                pathname: adminRoutes.userEdit,
                params: { role: 'customer', returnTo: adminRoutes.team },
              })
            }
          />
        </View>
    </AdminTabScreen>
  );
}

const styles = StyleSheet.create({
  links: { paddingHorizontal: spacing.md, gap: spacing.sm },
  addBlock: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    gap: spacing.sm,
  },
});

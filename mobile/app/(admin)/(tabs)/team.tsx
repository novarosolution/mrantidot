import { StyleSheet, View } from 'react-native';
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
import { spacing } from '@/constants/theme';

const Hub = AppIcons.adminHub;
const Tab = AppIcons.adminTab;

const OPERATIONS_LINKS = [
  {
    icon: Tab.bookings,
    label: 'Bookings',
    desc: 'Assign techs, confirm & track jobs',
    href: adminRoutes.bookings,
  },
  {
    icon: AppIcons.ui.bell,
    label: 'Notifications',
    desc: 'Unread alerts & activity feed',
    href: adminRoutes.notifications,
  },
  {
    icon: Tab.reports,
    label: 'Reports',
    desc: 'Revenue, trends & performance',
    href: adminRoutes.reports,
  },
];

const CONTENT_LINKS: Array<{
  icon: typeof Hub.homeContent;
  label: string;
  desc: string;
  href: RouteInput;
  featured?: boolean;
}> = [
  {
    icon: Hub.homeContent,
    label: 'App content',
    desc: 'Promo banner, home screen & brand',
    href: adminRoutes.content,
    featured: true,
  },
  {
    icon: AppIcons.contentTab.booking,
    label: 'Booking copy',
    desc: 'Wizard steps, lists & status text',
    href: { pathname: adminRoutes.content, params: { tab: 'booking' } },
    featured: true,
  },
  {
    icon: Hub.services,
    label: 'Services catalog',
    desc: 'Pricing, categories & availability',
    href: adminRoutes.services,
  },
  {
    icon: Hub.offers,
    label: 'Offers & promos',
    desc: 'Discounts and seasonal deals',
    href: adminRoutes.offers,
  },
  {
    icon: Hub.reviews,
    label: 'Reviews',
    desc: 'Customer feedback & ratings',
    href: adminRoutes.reviews,
  },
];

const PEOPLE_LINKS = [
  {
    icon: Hub.technicians,
    label: 'Technicians',
    desc: 'Roster, attendance, jobs & pay',
    href: adminRoutes.technicians,
  },
  {
    icon: AppIcons.ui.calendar,
    label: 'Leave requests',
    desc: 'Approve or reject tech leave',
    href: adminRoutes.leave,
  },
  {
    icon: AppIcons.ui.rupee,
    label: 'Payroll',
    desc: 'Period earnings by technician',
    href: adminRoutes.payroll,
  },
  {
    icon: Hub.customers,
    label: 'Customers',
    desc: 'Accounts, history & contact info',
    href: adminRoutes.customers,
  },
  {
    icon: Hub.users,
    label: 'Users & roles',
    desc: 'Admin access & permissions',
    href: adminRoutes.users,
  },
];

const SYSTEM_LINKS = [
  {
    icon: AppIcons.ui.settings,
    label: 'Settings',
    desc: 'Profile, password & preferences',
    href: adminRoutes.settings,
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
          eyebrow="CONTROL"
          userInitial={initial}
          unreadCount={unreadCount}
        />
      }
    >
        <AdminSectionTitle title="Operations" hint="Jobs, alerts & performance" />
        <View style={styles.links}>
          {OPERATIONS_LINKS.map((l) => (
            <AdminHubLink key={l.href} icon={l.icon} label={l.label} desc={l.desc} onPress={() => appPush(l.href)} />
          ))}
        </View>

        <AdminSectionTitle title="Content & catalog" hint="Promo, home, brand & catalog" />
        <View style={styles.links}>
          {CONTENT_LINKS.map((l) => (
            <AdminHubLink
              key={l.label}
              icon={l.icon}
              label={l.label}
              desc={l.desc}
              featured={l.featured}
              onPress={() => appPush(l.href)}
            />
          ))}
        </View>

        <AdminSectionTitle title="People" hint="Roster, roles & customer accounts" />
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

import { StyleSheet, View } from 'react-native';
import { AdminHubLink } from '@/components/kit/AdminHubLink';
import { AdminScreenHeader } from '@/components/kit/AdminScreenHeader';
import { AdminTabScreen } from '@/components/kit/AdminScreenKit';
import { AdminSectionTitle } from '@/components/kit/AdminListShell';
import { Button } from '@/components/ui/Button';
import { AppIcons } from '@/constants/appIcons';
import { AppIconImages, AppImageIcons } from '@/constants/appImageIcons';
import { useAuth } from '@/context/AuthContext';
import { adminRoutes, appPush, type RouteInput } from '@/lib/routes';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { userInitial } from '@/lib/userInitials';
import { spacing } from '@/constants/theme';
import type { LucideIcon } from 'lucide-react-native';
import type { ImageSourcePropType } from 'react-native';

const Hub = AppIcons.adminHub;
const Tab = AppIcons.adminTab;
const HubImg = AppIconImages.adminHub;
const TabImg = AppIconImages.adminTab;

type HubLink = {
  icon: LucideIcon;
  image?: ImageSourcePropType;
  label: string;
  desc: string;
  href: RouteInput;
  featured?: boolean;
};

const OPERATIONS_LINKS: HubLink[] = [
  {
    icon: Tab.bookings,
    image: TabImg.bookings,
    label: 'Bookings',
    desc: 'Assign techs, confirm & track jobs',
    href: adminRoutes.bookings,
  },
  {
    icon: AppIcons.ui.bell,
    image: AppImageIcons.bell,
    label: 'Notifications',
    desc: 'Unread alerts & activity feed',
    href: adminRoutes.notifications,
  },
  {
    icon: Tab.reports,
    image: TabImg.reports,
    label: 'Reports',
    desc: 'Revenue, trends & performance',
    href: adminRoutes.reports,
  },
];

const CONTENT_LINKS: HubLink[] = [
  {
    icon: Hub.homeContent,
    image: HubImg.homeContent,
    label: 'App content',
    desc: 'Promo banner, home screen & brand',
    href: adminRoutes.content,
    featured: true,
  },
  {
    icon: AppIcons.contentTab.booking,
    image: AppIconImages.contentTab.booking,
    label: 'Booking copy',
    desc: 'Wizard steps, lists & status text',
    href: { pathname: adminRoutes.content, params: { tab: 'booking' } },
    featured: true,
  },
  {
    icon: Hub.services,
    image: HubImg.services,
    label: 'Services catalog',
    desc: 'Pricing, categories & availability',
    href: adminRoutes.services,
  },
  {
    icon: Hub.offers,
    image: HubImg.offers,
    label: 'Offers & promos',
    desc: 'Discounts and seasonal deals',
    href: adminRoutes.offers,
  },
  {
    icon: Hub.reviews,
    image: HubImg.reviews,
    label: 'Reviews',
    desc: 'Customer feedback & ratings',
    href: adminRoutes.reviews,
  },
];

const PEOPLE_LINKS: HubLink[] = [
  {
    icon: Hub.technicians,
    image: HubImg.technicians,
    label: 'Technicians',
    desc: 'Roster, attendance, jobs & pay',
    href: adminRoutes.technicians,
  },
  {
    icon: AppIcons.ui.calendar,
    image: AppImageIcons.calendar,
    label: 'Leave requests',
    desc: 'Approve or reject tech leave',
    href: adminRoutes.leave,
  },
  {
    icon: AppIcons.ui.rupee,
    image: AppImageIcons.rupee,
    label: 'Payroll',
    desc: 'Period earnings by technician',
    href: adminRoutes.payroll,
  },
  {
    icon: Hub.customers,
    image: HubImg.customers,
    label: 'Customers',
    desc: 'Accounts, history & contact info',
    href: adminRoutes.customers,
  },
  {
    icon: Hub.users,
    image: HubImg.users,
    label: 'Users & roles',
    desc: 'Admin access & permissions',
    href: adminRoutes.users,
  },
];

const SYSTEM_LINKS: HubLink[] = [
  {
    icon: AppIcons.ui.download,
    image: AppImageIcons.file,
    label: 'Data export',
    desc: 'Download all bookings, people & catalog',
    href: adminRoutes.dataExport,
  },
  {
    icon: AppIcons.ui.settings,
    image: AppImageIcons.settings,
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
          <AdminHubLink
            key={typeof l.href === 'string' ? l.href : l.label}
            icon={l.icon}
            image={l.image}
            label={l.label}
            desc={l.desc}
            onPress={() => appPush(l.href)}
          />
        ))}
      </View>

      <AdminSectionTitle title="Content & catalog" hint="Promo, home, brand & catalog" />
      <View style={styles.links}>
        {CONTENT_LINKS.map((l) => (
          <AdminHubLink
            key={l.label}
            icon={l.icon}
            image={l.image}
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
          <AdminHubLink
            key={typeof l.href === 'string' ? l.href : l.label}
            icon={l.icon}
            image={l.image}
            label={l.label}
            desc={l.desc}
            onPress={() => appPush(l.href)}
          />
        ))}
      </View>

      <AdminSectionTitle title="System" hint="Export & admin account" />
      <View style={styles.links}>
        {SYSTEM_LINKS.map((l) => (
          <AdminHubLink
            key={typeof l.href === 'string' ? l.href : l.label}
            icon={l.icon}
            image={l.image}
            label={l.label}
            desc={l.desc}
            onPress={() => appPush(l.href)}
          />
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

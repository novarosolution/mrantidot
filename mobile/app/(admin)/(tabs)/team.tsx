import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowUpDown, UserPlus, UserRoundPlus } from 'lucide-react-native';
import { AdminHubGroup, AdminHubLink } from '@/components/kit/AdminHubLink';
import { adminShadow } from '@/components/kit/homeUi';
import { AdminScreenHeader } from '@/components/kit/AdminScreenHeader';
import { AdminTabScreen } from '@/components/kit/AdminScreenKit';
import { AdminSectionTitle } from '@/components/kit/AdminListShell';
import { AppIcons } from '@/constants/appIcons';
import { AppIconImages, AppImageIcons } from '@/constants/appImageIcons';
import { useAuth } from '@/context/AuthContext';
import { adminRoutes, appPush, type RouteInput } from '@/lib/routes';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { userInitial } from '@/lib/userInitials';
import { colors, fonts, spacing, ui } from '@/constants/theme';
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
    icon: ArrowUpDown,
    label: 'Arrange services',
    desc: 'Order & which services show on home',
    href: adminRoutes.serviceOrder,
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

const SECTIONS: { title: string; hint: string; links: HubLink[] }[] = [
  { title: 'Operations', hint: 'Jobs, alerts & performance', links: OPERATIONS_LINKS },
  { title: 'Content & catalog', hint: 'What customers see in the app', links: CONTENT_LINKS },
  { title: 'People', hint: 'Roster, leave, pay & accounts', links: PEOPLE_LINKS },
  { title: 'System', hint: 'Export & admin account', links: SYSTEM_LINKS },
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
      <View style={styles.addRow}>
        <AddTile
          icon={UserPlus}
          label="Add technician"
          onPress={() =>
            appPush({ pathname: adminRoutes.userEdit, params: { role: 'technician', returnTo: adminRoutes.team } })
          }
        />
        <AddTile
          icon={UserRoundPlus}
          label="Add customer"
          onPress={() =>
            appPush({ pathname: adminRoutes.userEdit, params: { role: 'customer', returnTo: adminRoutes.team } })
          }
        />
      </View>

      {SECTIONS.map((section) => (
        <View key={section.title}>
          <AdminSectionTitle title={section.title} hint={section.hint} />
          <AdminHubGroup>
            {section.links.map((l) => (
              <AdminHubLink
                key={l.label}
                icon={l.icon}
                label={l.label}
                desc={l.desc}
                badge={l.href === adminRoutes.notifications ? unreadCount : undefined}
                onPress={() => appPush(l.href)}
              />
            ))}
          </AdminHubGroup>
        </View>
      ))}
    </AdminTabScreen>
  );
}

function AddTile({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.addTile, pressed && styles.addPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.addIcon}>
        <Icon size={18} color={colors.white} strokeWidth={2.2} />
      </View>
      <Text style={styles.addLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.md, marginTop: spacing.xs },
  addTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...adminShadow.tile,
  },
  addPressed: { backgroundColor: ui.surfaceMuted },
  addIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 13.5, color: ui.text },
});

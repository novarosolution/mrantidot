import { StyleSheet, Text, View } from 'react-native';
import { ArrowUpDown, BriefcaseBusiness, CalendarPlus, Globe, Megaphone, ScrollText, UserPlus, UserRoundPlus } from 'lucide-react-native';
import { AdminHubGroup, AdminHubLink } from '@/components/kit/AdminHubLink';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { AdminScreenHeader } from '@/components/kit/AdminScreenHeader';
import { AdminTabScreen } from '@/components/kit/AdminScreenKit';
import { AdminSectionTitle } from '@/components/kit/AdminListShell';
import { AppIcons } from '@/constants/appIcons';
import { AppIconImages, AppImageIcons } from '@/constants/appImageIcons';
import { useAuth } from '@/context/AuthContext';
import { adminRoutes, appPush, type RouteInput } from '@/lib/routes';
import { stagger } from '@/lib/motion';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { useWebsiteSummary } from '@/lib/useWebsiteSummary';
import { userInitial } from '@/lib/userInitials';
import { useWideWebLayout } from '@/lib/webAdmin';
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
  {
    icon: Megaphone,
    label: 'Broadcast',
    desc: 'Send a notice to customers or technicians',
    href: adminRoutes.broadcast,
  },
  {
    icon: ScrollText,
    label: 'Activity log',
    desc: 'Who changed what, and when',
    href: adminRoutes.activity,
  },
];

const CONTENT_LINKS: HubLink[] = [
  {
    icon: Globe,
    label: 'Website',
    desc: 'Pages, photos, blog, team & messages',
    href: adminRoutes.website,
  },
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
    icon: BriefcaseBusiness,
    label: 'Business settings',
    desc: 'Tax, time slots, booking rules, lists, service area, payments & app status',
    href: adminRoutes.businessSettings,
    featured: true,
  },
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
  const { summary: websiteSummary } = useWebsiteSummary();
  const initial = userInitial(user?.name);
  // Desktop: the sidebar calls this page "All tools", and the groups sit in two columns.
  const wide = useWideWebLayout();

  const renderSection = (section: (typeof SECTIONS)[number], i: number) => (
    <FadeSlideIn key={section.title} delay={stagger(i + 1)} slideFrom={14}>
      <AdminSectionTitle title={section.title} hint={section.hint} />
      <AdminHubGroup>
        {section.links.map((l) => (
          <AdminHubLink
            key={l.label}
            icon={l.icon}
            label={l.label}
            desc={l.desc}
            badge={
              l.href === adminRoutes.notifications
                ? unreadCount
                : l.href === adminRoutes.website
                  ? websiteSummary?.newMessages
                  : undefined
            }
            onPress={() => appPush(l.href)}
          />
        ))}
      </AdminHubGroup>
    </FadeSlideIn>
  );

  return (
    <AdminTabScreen
      header={
        <AdminScreenHeader
          title={wide ? 'All tools' : 'Manage'}
          subtitle="Content, people & operations"
          eyebrow={wide ? 'ALL TOOLS' : 'CONTROL'}
          userInitial={initial}
          unreadCount={unreadCount}
        />
      }
    >
      <FadeSlideIn delay={stagger(0)} slideFrom={14}>
        <View style={styles.addRow}>
          {wide ? <AddTile icon={CalendarPlus} label="New booking" onPress={() => appPush(adminRoutes.bookingCreate)} /> : null}
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
      </FadeSlideIn>

      {wide ? (
        <View style={styles.cols}>
          <View style={styles.col}>{[0, 2].map((i) => renderSection(SECTIONS[i], i))}</View>
          <View style={styles.col}>{[1, 3].map((i) => renderSection(SECTIONS[i], i))}</View>
        </View>
      ) : (
        SECTIONS.map(renderSection)
      )}
    </AdminTabScreen>
  );
}

function AddTile({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <PressableScale
      containerStyle={styles.addCell}
      style={styles.addTile}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.addIcon}>
        <Icon size={18} color={colors.white} strokeWidth={2.2} />
      </View>
      <Text style={styles.addLabel} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  cols: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { flex: 1, minWidth: 0 },
  addRow: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.md, marginTop: spacing.xs },
  addCell: { flex: 1 },
  addTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
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

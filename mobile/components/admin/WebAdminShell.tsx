import { router, usePathname, type Href } from 'expo-router';
import {
  Bell,
  CalendarCheck,
  CalendarOff,
  ChartColumn,
  Globe,
  HardHat,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Settings,
  Smartphone,
  Sparkles,
  Star,
  TicketPercent,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { colors, fonts, ui } from '@/constants/theme';
import { useAppContent } from '@/context/AppContentContext';
import { useAuth } from '@/context/AuthContext';
import { confirmAsync } from '@/lib/confirm';
import { adminRoutes } from '@/lib/routes';
import { useWideWebLayout, WEB_CONTENT_MAX_WIDTH, WEB_SIDEBAR_WIDTH } from '@/lib/webAdmin';

type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
  /** Lives in the (tabs) navigator — switch tabs instead of pushing a stack screen. */
  tab?: boolean;
  /** Web pathname (no route groups) → whether this link is the active section. */
  match: (path: string) => boolean;
};

const is = (...paths: string[]) => (path: string) => paths.includes(path);
const under = (...prefixes: string[]) => (path: string) => prefixes.some((p) => path === p || path.startsWith(`${p}/`));

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: adminRoutes.home, tab: true, match: is('/', '') },
  { key: 'bookings', label: 'Bookings', icon: CalendarCheck, href: adminRoutes.bookings, tab: true, match: under('/bookings', '/booking') },
  { key: 'customers', label: 'Customers', icon: UsersRound, href: adminRoutes.customers, match: under('/customers', '/customer', '/customer-edit') },
  { key: 'technicians', label: 'Technicians', icon: HardHat, href: adminRoutes.technicians, match: under('/technicians', '/technician', '/technician-edit') },
  { key: 'services', label: 'Services', icon: Sparkles, href: adminRoutes.services, match: under('/services', '/service-edit', '/service-order') },
  { key: 'offers', label: 'Offers', icon: TicketPercent, href: adminRoutes.offers, match: under('/offers', '/offer-edit') },
  { key: 'reviews', label: 'Reviews', icon: Star, href: adminRoutes.reviews, match: under('/reviews') },
  { key: 'leave', label: 'Leave', icon: CalendarOff, href: adminRoutes.leave, match: under('/leave') },
  { key: 'payroll', label: 'Payroll', icon: Wallet, href: adminRoutes.payroll, match: under('/payroll') },
  { key: 'reports', label: 'Reports', icon: ChartColumn, href: adminRoutes.reports, tab: true, match: under('/reports') },
  { key: 'website', label: 'Website', icon: Globe, href: adminRoutes.website, match: under('/website') },
  { key: 'content', label: 'App content', icon: Smartphone, href: adminRoutes.content, match: under('/content') },
  { key: 'notifications', label: 'Notifications', icon: Bell, href: adminRoutes.notifications, match: under('/notifications') },
  /* The phone "Manage" tab — the only way to Users and a few other tools. */
  { key: 'team', label: 'All tools', icon: LayoutGrid, href: adminRoutes.team, tab: true, match: under('/team', '/users', '/user-edit') },
  { key: 'settings', label: 'Settings', icon: Settings, href: adminRoutes.settings, match: under('/settings', '/data-export') },
];

/** `/(admin)/customers` → `/customers` (web pathnames never contain route groups). */
function webPath(href: string): string {
  return href.replace(/\/\([^/]+\)/g, '') || '/';
}

/** Sidebar navigation: drop back to the tabs root, then switch tab or open the section's screen (shallow history). */
function openSection(item: NavItem) {
  if (router.canDismiss()) router.dismissAll();
  if (item.tab) router.navigate(item.href as Href);
  else router.push(item.href as Href);
}

function SidebarLink({ item, active, current }: { item: NavItem; active: boolean; current: boolean }) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;
  const tint = active ? colors.forest : hovered ? ui.text : ui.textSecondary;
  return (
    <Pressable
      onPress={() => {
        if (!current) openSection(item);
      }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.link,
        hovered && !active && styles.linkHover,
        active && styles.linkActive,
        pressed && styles.linkPressed,
      ]}
    >
      {active ? <View style={styles.activeBar} /> : null}
      <Icon size={18} color={tint} strokeWidth={active ? 2.3 : 2} />
      <Text style={[styles.linkLabel, { color: tint }, active && styles.linkLabelActive]} numberOfLines={1}>
        {item.label}
      </Text>
    </Pressable>
  );
}

function Sidebar() {
  const pathname = usePathname() || '/';
  const { user, logout } = useAuth();
  const { content } = useAppContent();
  const [logoutHover, setLogoutHover] = useState(false);
  const brandName = content.branding.name?.trim() || 'Mr Antidot';
  const activeKey = NAV_ITEMS.find((item) => item.match(pathname))?.key;

  const signOut = async () => {
    const ok = await confirmAsync({
      title: 'Log out?',
      message: 'You will return to the sign-in screen.',
      confirmLabel: 'Log out',
      destructive: true,
    });
    if (!ok) return;
    // The admin layout redirects to sign-in as soon as the session is gone.
    await logout();
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <BrandLogo size={36} animate={false} />
        <View style={styles.brandText}>
          <Text style={styles.brandName} numberOfLines={1}>
            {brandName}
          </Text>
          <Text style={styles.brandSub}>Admin panel</Text>
        </View>
      </View>

      <ScrollView style={styles.nav} contentContainerStyle={styles.navInner} showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.key}
            item={item}
            active={item.key === activeKey}
            current={pathname === webPath(item.href)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {user ? (
          <View style={styles.account}>
            <Text style={styles.accountName} numberOfLines={1}>
              {user.name || 'Admin'}
            </Text>
            {user.email ? (
              <Text style={styles.accountMeta} numberOfLines={1}>
                {user.email}
              </Text>
            ) : null}
          </View>
        ) : null}
        <Pressable
          onPress={() => void signOut()}
          onHoverIn={() => setLogoutHover(true)}
          onHoverOut={() => setLogoutHover(false)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.link, logoutHover && styles.logoutHover, pressed && styles.linkPressed]}
        >
          <LogOut size={18} color={colors.error} strokeWidth={2} />
          <Text style={[styles.linkLabel, styles.logoutLabel]}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Desktop browser frame for the admin app: fixed left sidebar + a centred content column on the app
 * canvas. Narrow windows (< 1024 px) render the children exactly like the phone layout. The children
 * keep the same position in the tree in both modes, so resizing never remounts the navigator.
 * Mount it on web only.
 */
export function WebAdminShell({ children }: { children: ReactNode }) {
  const wide = useWideWebLayout();
  return (
    <View style={[styles.root, wide && styles.rootWide]}>
      {wide ? <Sidebar /> : null}
      <View style={wide ? styles.contentWide : styles.fill}>
        <View style={wide ? styles.column : styles.fill}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rootWide: { flexDirection: 'row', backgroundColor: ui.surfaceMuted },
  fill: { flex: 1 },
  contentWide: { flex: 1, minWidth: 0, backgroundColor: ui.surfaceMuted, alignItems: 'stretch' },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: WEB_CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    // No side borders: screens size their grids to exactly this width (adminContentWidth).
    overflow: 'hidden',
  },
  sidebar: {
    width: WEB_SIDEBAR_WIDTH,
    backgroundColor: colors.white,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: ui.border,
    paddingTop: 20,
    paddingBottom: 16,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.hairline,
  },
  brandText: { flex: 1, minWidth: 0 },
  brandName: { fontFamily: fonts.brand, fontSize: 16, lineHeight: 20, letterSpacing: -0.3, color: ui.text },
  brandSub: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.forest,
    marginTop: 2,
  },
  nav: { flex: 1 },
  navInner: { paddingHorizontal: 12, paddingVertical: 4, gap: 2 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    position: 'relative',
  },
  linkHover: { backgroundColor: ui.surfaceMuted },
  linkActive: { backgroundColor: ui.brandSoft },
  linkPressed: { opacity: 0.8 },
  activeBar: {
    position: 'absolute',
    left: -12,
    top: 8,
    bottom: 8,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.forest,
  },
  linkLabel: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 14, letterSpacing: -0.1 },
  linkLabelActive: { fontFamily: fonts.bodyBold },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.hairline,
    gap: 6,
  },
  account: { paddingHorizontal: 12, paddingBottom: 4 },
  accountName: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: ui.text },
  accountMeta: { fontFamily: fonts.body, fontSize: 12, color: ui.textTertiary, marginTop: 1 },
  logoutHover: { backgroundColor: colors.errorBg },
  logoutLabel: { color: colors.error },
});

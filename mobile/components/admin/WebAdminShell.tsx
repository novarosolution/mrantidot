import { router, usePathname, useSegments, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarOff,
  ChartColumn,
  ChevronDown,
  DatabaseBackup,
  Globe,
  HardHat,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  ScrollText,
  Settings,
  Smartphone,
  Sparkles,
  Star,
  TicketPercent,
  UserCog,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { colors, fonts, ui } from '@/constants/theme';
import { useAppContent } from '@/context/AppContentContext';
import { useAuth } from '@/context/AuthContext';
import { api, clearApiCache, screenLoadConfig } from '@/lib/api';
import { confirmAsync } from '@/lib/confirm';
import { adminRoutes } from '@/lib/routes';
import {
  adminRouteName,
  adminScreenTitle,
  setSidebarCollapsed,
  useSidebarCollapsed,
  useWideWebLayout,
  WEB_CONTENT_MAX_WIDTH,
  WEB_SIDEBAR_COLLAPSED_WIDTH,
  WEB_SIDEBAR_WIDTH,
  WEB_TOPBAR_HEIGHT,
} from '@/lib/webAdmin';

type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
  /** Lives in the (tabs) navigator — switch tabs instead of pushing a stack screen. */
  tab?: boolean;
  /** Web pathname (no route groups) → whether this link is the active section. */
  match: (path: string) => boolean;
  /** Shows the unread notification count. */
  unread?: boolean;
};

type NavGroup = { key: string; label: string; items: NavItem[] };

const is = (...paths: string[]) => (path: string) => paths.includes(path);
const under = (...prefixes: string[]) => (path: string) => prefixes.some((p) => path === p || path.startsWith(`${p}/`));

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview',
    label: 'Overview',
    items: [{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: adminRoutes.home, tab: true, match: is('/', '') }],
  },
  {
    key: 'operations',
    label: 'Operations',
    items: [
      { key: 'bookings', label: 'Bookings', icon: CalendarCheck, href: adminRoutes.bookings, tab: true, match: under('/bookings', '/booking', '/booking-create') },
      { key: 'broadcast', label: 'Broadcast', icon: Megaphone, href: adminRoutes.broadcast, match: under('/broadcast') },
      { key: 'notifications', label: 'Notifications', icon: Bell, href: adminRoutes.notifications, match: under('/notifications'), unread: true },
      { key: 'reports', label: 'Reports', icon: ChartColumn, href: adminRoutes.reports, tab: true, match: under('/reports') },
      { key: 'activity', label: 'Activity log', icon: ScrollText, href: adminRoutes.activity, match: under('/activity') },
    ],
  },
  {
    key: 'catalog',
    label: 'Catalog',
    items: [
      { key: 'services', label: 'Services', icon: Sparkles, href: adminRoutes.services, match: under('/services', '/service-edit', '/service-order') },
      { key: 'offers', label: 'Offers', icon: TicketPercent, href: adminRoutes.offers, match: under('/offers', '/offer-edit') },
      { key: 'reviews', label: 'Reviews', icon: Star, href: adminRoutes.reviews, match: under('/reviews') },
    ],
  },
  {
    key: 'people',
    label: 'People',
    items: [
      { key: 'customers', label: 'Customers', icon: UsersRound, href: adminRoutes.customers, match: under('/customers', '/customer', '/customer-edit') },
      { key: 'technicians', label: 'Technicians', icon: HardHat, href: adminRoutes.technicians, match: under('/technicians', '/technician', '/technician-edit') },
      { key: 'users', label: 'Users', icon: UserCog, href: adminRoutes.users, match: under('/users', '/user-edit') },
      { key: 'leave', label: 'Leave', icon: CalendarOff, href: adminRoutes.leave, match: under('/leave') },
      { key: 'payroll', label: 'Payroll', icon: Wallet, href: adminRoutes.payroll, match: under('/payroll') },
    ],
  },
  {
    key: 'website',
    label: 'Website & content',
    items: [
      { key: 'website', label: 'Website', icon: Globe, href: adminRoutes.website, match: under('/website') },
      { key: 'content', label: 'App content', icon: Smartphone, href: adminRoutes.content, match: under('/content') },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    items: [
      { key: 'businessSettings', label: 'Business settings', icon: BriefcaseBusiness, href: adminRoutes.businessSettings, match: under('/settings-business') },
      { key: 'settings', label: 'Account settings', icon: Settings, href: adminRoutes.settings, match: under('/settings') },
      { key: 'dataExport', label: 'Data export', icon: DatabaseBackup, href: adminRoutes.dataExport, match: under('/data-export') },
      /* The phone "Manage" tab — every tool in one grid. */
      { key: 'team', label: 'All tools', icon: LayoutGrid, href: adminRoutes.team, tab: true, match: under('/team') },
    ],
  },
];

const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })));

const ACCOUNT_SETTINGS = NAV_ITEMS.find((item) => item.key === 'settings')!;
const BUSINESS_SETTINGS = NAV_ITEMS.find((item) => item.key === 'businessSettings')!;

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

function badgeText(count: number): string {
  return count > 99 ? '99+' : String(count);
}

/** Unread notifications for the sidebar badge: on open, on navigation (throttled) and every 30 s. */
function useUnreadCount(enabled: boolean, pathname: string) {
  const [count, setCount] = useState(0);
  const lastFetch = useRef(0);

  const load = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetch.current < 15_000) return;
    lastFetch.current = now;
    try {
      const { data } = await api.get<{ unreadCount?: number }>('/notifications', screenLoadConfig);
      setCount(typeof data?.unreadCount === 'number' ? data.unreadCount : 0);
    } catch {
      // Keep the last count; a real 401 signs out through the API client.
    }
  }, []);

  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load, pathname]);

  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setInterval(() => void load(true), 30_000);
    return () => clearInterval(timer);
  }, [enabled, load]);

  return { count, reload: () => void load(true) };
}

/* ─── Sidebar ──────────────────────────────────────────────────────── */

type Box = { y: number; height: number };

function SidebarLink({
  item,
  active,
  current,
  collapsed,
  unread,
  onLayout,
  onHover,
}: {
  item: NavItem;
  /** The section the current screen belongs to (highlighted). */
  active: boolean;
  /** Already on exactly this screen — pressing does nothing. */
  current: boolean;
  collapsed: boolean;
  unread: number;
  onLayout: (e: LayoutChangeEvent) => void;
  onHover: (hovered: boolean) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;
  const tint = active ? colors.forest : hovered ? ui.text : ui.textSecondary;
  const showBadge = item.unread === true && unread > 0;
  return (
    <Pressable
      onLayout={onLayout}
      onPress={() => {
        if (!current) openSection(item);
      }}
      onHoverIn={() => {
        setHovered(true);
        onHover(true);
      }}
      onHoverOut={() => {
        setHovered(false);
        onHover(false);
      }}
      accessibilityRole="link"
      accessibilityLabel={showBadge ? `${item.label}, ${unread} unread` : item.label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.link,
        collapsed && styles.linkCollapsed,
        hovered && !active && styles.linkHover,
        pressed && styles.linkPressed,
      ]}
    >
      <View>
        <Icon size={18} color={tint} strokeWidth={active ? 2.3 : 2} />
        {showBadge && collapsed ? <View style={styles.badgeDot} /> : null}
      </View>
      {collapsed ? null : (
        <Text style={[styles.linkLabel, { color: tint }, active && styles.linkLabelActive]} numberOfLines={1}>
          {item.label}
        </Text>
      )}
      {showBadge && !collapsed ? (
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{badgeText(unread)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function Sidebar({ activeKey, pathname, unread }: { activeKey: string | undefined; pathname: string; unread: number }) {
  const collapsed = useSidebarCollapsed();
  const { content } = useAppContent();
  const brandName = content.branding.name?.trim() || 'Mr Antidot';
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const [navTop, setNavTop] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [tip, setTip] = useState<{ key: string; label: string } | null>(null);
  const [toggleHover, setToggleHover] = useState(false);

  // Sliding active indicator: one soft pill that springs to the active link (measured with onLayout).
  const indicatorY = useRef(new Animated.Value(0)).current;
  const indicatorH = useRef(new Animated.Value(40)).current;
  const indicatorOpacity = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);
  const target = activeKey ? boxes[activeKey] : undefined;
  const targetY = target?.y;
  const targetH = target?.height;

  useEffect(() => {
    if (targetY == null || targetH == null) {
      Animated.timing(indicatorOpacity, { toValue: 0, duration: 120, useNativeDriver: false }).start();
      return;
    }
    if (!placed.current) {
      placed.current = true;
      indicatorY.setValue(targetY);
      indicatorH.setValue(targetH);
      Animated.timing(indicatorOpacity, { toValue: 1, duration: 180, useNativeDriver: false }).start();
      return;
    }
    Animated.parallel([
      Animated.spring(indicatorY, { toValue: targetY, friction: 10, tension: 110, useNativeDriver: false }),
      Animated.spring(indicatorH, { toValue: targetH, friction: 10, tension: 110, useNativeDriver: false }),
      Animated.timing(indicatorOpacity, { toValue: 1, duration: 120, useNativeDriver: false }),
    ]).start();
  }, [indicatorH, indicatorOpacity, indicatorY, targetH, targetY]);

  const measure = useCallback(
    (key: string) => (e: LayoutChangeEvent) => {
      const { y, height } = e.nativeEvent.layout;
      setBoxes((prev) => (prev[key]?.y === y && prev[key]?.height === height ? prev : { ...prev, [key]: { y, height } }));
    },
    [],
  );

  const tipBox = collapsed && tip ? boxes[tip.key] : undefined;

  return (
    <View style={[styles.sidebar, { width: collapsed ? WEB_SIDEBAR_COLLAPSED_WIDTH : WEB_SIDEBAR_WIDTH }]}>
      <View style={[styles.brand, collapsed && styles.brandCollapsed]}>
        <BrandLogo size={34} animate={false} />
        {collapsed ? null : (
          <View style={styles.brandText}>
            <Text style={styles.brandName} numberOfLines={1}>
              {brandName}
            </Text>
            <Text style={styles.brandSub}>Admin panel</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.nav}
        contentContainerStyle={styles.navInner}
        onLayout={(e) => setNavTop(e.nativeEvent.layout.y)}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={32}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.indicator, { opacity: indicatorOpacity, height: indicatorH, transform: [{ translateY: indicatorY }] }]}
        >
          <View style={styles.indicatorBar} />
        </Animated.View>
        {NAV_GROUPS.flatMap((group, index) => [
          collapsed ? (
            index > 0 ? <View key={`${group.key}-rule`} style={styles.groupRule} /> : <View key={`${group.key}-rule`} style={styles.groupTopGap} />
          ) : (
            <Text key={`${group.key}-label`} style={[styles.groupLabel, index === 0 && styles.groupLabelFirst]} numberOfLines={1}>
              {group.label}
            </Text>
          ),
          ...group.items.map((item) => (
            <SidebarLink
              key={item.key}
              item={item}
              active={item.key === activeKey}
              current={pathname === webPath(item.href)}
              collapsed={collapsed}
              unread={unread}
              onLayout={measure(item.key)}
              onHover={(hovered) =>
                setTip((current) => (hovered ? { key: item.key, label: item.label } : current?.key === item.key ? null : current))
              }
            />
          )),
        ])}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <Pressable
          onPress={() => setSidebarCollapsed(!collapsed)}
          onHoverIn={() => setToggleHover(true)}
          onHoverOut={() => setToggleHover(false)}
          accessibilityRole="button"
          accessibilityLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={({ pressed }) => [
            styles.link,
            collapsed && styles.linkCollapsed,
            toggleHover && styles.linkHover,
            pressed && styles.linkPressed,
          ]}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} color={ui.textSecondary} strokeWidth={2} />
          ) : (
            <>
              <PanelLeftClose size={18} color={ui.textSecondary} strokeWidth={2} />
              <Text style={[styles.linkLabel, { color: ui.textSecondary }]}>Collapse</Text>
            </>
          )}
        </Pressable>
      </View>

      {tipBox && tip ? (
        <View
          pointerEvents="none"
          style={[styles.tooltip, { top: navTop + tipBox.y - scrollY + tipBox.height / 2 - 15, left: WEB_SIDEBAR_COLLAPSED_WIDTH - 6 }]}
        >
          <Text style={styles.tooltipText} numberOfLines={1}>
            {tip.label}
            {NAV_ITEMS.find((item) => item.key === tip.key)?.unread && unread > 0 ? ` · ${badgeText(unread)}` : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/* ─── Top bar ──────────────────────────────────────────────────────── */

function TopButton({
  icon: Icon,
  label,
  onPress,
  spin,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  spin?: Animated.Value;
}) {
  const [hovered, setHovered] = useState(false);
  const rotate = spin?.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.topButton, hovered && styles.topButtonHover, pressed && styles.linkPressed]}
    >
      <Animated.View style={rotate ? { transform: [{ rotate }] } : undefined}>
        <Icon size={16} color={ui.text} strokeWidth={2.2} />
      </Animated.View>
      <Text style={styles.topButtonText}>{label}</Text>
    </Pressable>
  );
}

function MenuRow({
  icon: Icon,
  label,
  danger,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const tint = danger ? colors.error : ui.text;
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="menuitem"
      style={({ pressed }) => [
        styles.menuRow,
        hovered && (danger ? styles.menuRowDangerHover : styles.menuRowHover),
        pressed && styles.linkPressed,
      ]}
    >
      <Icon size={17} color={danger ? colors.error : ui.textSecondary} strokeWidth={2} />
      <Text style={[styles.menuRowText, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

/** Account dropdown card — a quick fade + drop on open. */
function MenuCard({ style, children }: { style: { top: number; right: number }; children: ReactNode }) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [enter]);
  return (
    <Animated.View
      style={[
        styles.menu,
        style,
        { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] },
      ]}
      role="menu"
      aria-label="Account"
    >
      {children}
    </Animated.View>
  );
}

function AccountMenu() {
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const anchor = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [position, setPosition] = useState({ top: WEB_TOPBAR_HEIGHT, right: 16 });
  const name = user?.name?.trim() || 'Admin';
  const initial = name.slice(0, 1).toUpperCase();

  // The menu is placed from a measurement — a resized window simply closes it.
  useEffect(() => {
    setOpen(false);
  }, [width]);

  const show = () => {
    const node = anchor.current;
    if (!node) {
      setOpen(true);
      return;
    }
    node.measureInWindow((x, y, w, h) => {
      setPosition({ top: y + h + 8, right: Math.max(12, width - (x + w)) });
      setOpen(true);
    });
  };

  const go = (item: NavItem) => {
    setOpen(false);
    openSection(item);
  };

  const signOut = async () => {
    setOpen(false);
    const ok = await confirmAsync({
      title: 'Sign out?',
      message: 'You will return to the sign-in screen.',
      confirmLabel: 'Sign out',
      destructive: true,
    });
    // The admin layout redirects to sign-in as soon as the session is gone.
    if (ok) await logout();
  };

  return (
    <>
      <Pressable
        ref={anchor}
        onPress={show}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        accessibilityRole="button"
        accessibilityLabel={`Account: ${name}`}
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.accountButton, (hovered || open) && styles.topButtonHover, pressed && styles.linkPressed]}
      >
        <LinearGradient colors={[colors.forestMid, colors.forest]} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.avatarText}>{initial}</Text>
        </LinearGradient>
        <Text style={styles.accountName} numberOfLines={1}>
          {name}
        </Text>
        <ChevronDown size={16} color={ui.textSecondary} strokeWidth={2.2} />
      </Pressable>

      {/* No modal fade: the menu is gone (and focus restored) before a sign-out dialog opens. */}
      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} focusable={false} accessibilityLabel="Close menu" />
        <MenuCard style={position}>
          <View style={styles.menuHead}>
            <LinearGradient colors={[colors.forestMid, colors.forest]} style={styles.menuAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.menuAvatarText}>{initial}</Text>
            </LinearGradient>
            <View style={styles.menuHeadText}>
              <Text style={styles.menuName} numberOfLines={1}>
                {name}
              </Text>
              {user?.email ? (
                <Text style={styles.menuMeta} numberOfLines={1}>
                  {user.email}
                </Text>
              ) : null}
              <View style={styles.roleChip}>
                <Text style={styles.roleChipText}>Admin</Text>
              </View>
            </View>
          </View>
          <View style={styles.menuRule} />
          <MenuRow icon={Settings} label="Account settings" onPress={() => go(ACCOUNT_SETTINGS)} />
          <MenuRow icon={BriefcaseBusiness} label="Business settings" onPress={() => go(BUSINESS_SETTINGS)} />
          <View style={styles.menuRule} />
          <MenuRow icon={LogOut} label="Sign out" danger onPress={() => void signOut()} />
        </MenuCard>
      </Modal>
    </>
  );
}

function TopBar({ title, group, onRefresh }: { title: string; group?: string; onRefresh: () => void }) {
  const spin = useRef(new Animated.Value(0)).current;
  const refresh = () => {
    spin.setValue(0);
    Animated.timing(spin, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start();
    onRefresh();
  };
  return (
    <View style={styles.topBar}>
      <View style={styles.topTitleCol}>
        {group ? (
          <Text style={styles.topEyebrow} numberOfLines={1}>
            {group}
          </Text>
        ) : null}
        <Text style={styles.topTitle} numberOfLines={1} role="heading">
          {title}
        </Text>
      </View>
      <TopButton icon={RefreshCw} label="Refresh" onPress={refresh} spin={spin} />
      <AccountMenu />
    </View>
  );
}

/**
 * Desktop browser frame for the admin app: grouped left sidebar (sliding active indicator, collapses to
 * icons), a top bar (page title, refresh, account menu) and a centred content column on the app canvas.
 * Narrow windows (< 1024 px) render the children exactly like the phone layout. The children keep the
 * same position in the tree in both modes, so resizing never remounts the navigator; Refresh remounts
 * it on purpose (same routes, fresh screens and data). Mount it on web only.
 */
export function WebAdminShell({ children }: { children: ReactNode }) {
  const wide = useWideWebLayout();
  const pathname = usePathname() || '/';
  const segments = useSegments() as string[];
  const [epoch, setEpoch] = useState(0);
  const { count: unread, reload: reloadUnread } = useUnreadCount(wide, pathname);
  const activeItem = NAV_ITEMS.find((item) => item.match(pathname));
  const title = adminScreenTitle(adminRouteName(segments));

  const refresh = useCallback(() => {
    clearApiCache();
    setEpoch((value) => value + 1);
    reloadUnread();
  }, [reloadUnread]);

  return (
    <View style={[styles.root, wide && styles.rootWide]}>
      {wide ? <Sidebar activeKey={activeItem?.key} pathname={pathname} unread={unread} /> : null}
      <View style={wide ? styles.contentWide : styles.fill}>
        {wide ? <TopBar title={title} group={activeItem?.group} onRefresh={refresh} /> : null}
        <View style={wide ? styles.column : styles.fill}>
          <View key={epoch} style={styles.fill}>
            {children}
          </View>
        </View>
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

  /* sidebar */
  sidebar: {
    backgroundColor: colors.white,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: ui.border,
    paddingTop: 16,
    paddingBottom: 10,
    // Above the content column so the collapsed-mode tooltips can overlap it.
    zIndex: 3,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 44,
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  brandCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  brandText: { flex: 1, minWidth: 0 },
  brandName: { fontFamily: fonts.brand, fontSize: 16, lineHeight: 20, letterSpacing: -0.3, color: ui.text },
  brandSub: {
    fontFamily: fonts.bodySemi,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.forest,
    marginTop: 2,
  },
  nav: { flex: 1 },
  navInner: { paddingHorizontal: 12, paddingBottom: 12, gap: 2 },
  groupLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: ui.textTertiary,
    paddingHorizontal: 12,
    marginTop: 14,
    marginBottom: 4,
  },
  groupLabelFirst: { marginTop: 6 },
  groupRule: { height: StyleSheet.hairlineWidth, backgroundColor: ui.border, marginVertical: 9, marginHorizontal: 10 },
  groupTopGap: { height: 6 },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    borderRadius: 10,
    backgroundColor: ui.brandSoft,
  },
  indicatorBar: {
    position: 'absolute',
    left: -12,
    top: 9,
    bottom: 9,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.forest,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  linkCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  linkHover: { backgroundColor: ui.surfaceMuted },
  linkPressed: { opacity: 0.8 },
  linkLabel: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13.5, letterSpacing: -0.1 },
  linkLabelActive: { fontFamily: fonts.bodyBold },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
  },
  badgeLabel: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: colors.white },
  badgeDot: {
    position: 'absolute',
    top: -3,
    right: -4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  sidebarFooter: {
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.hairline,
  },
  tooltip: {
    position: 'absolute',
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: ui.text,
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  tooltipText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.white },

  /* top bar */
  topBar: {
    height: WEB_TOPBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
    zIndex: 2,
  },
  topTitleCol: { flex: 1, minWidth: 0 },
  topEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.forest,
  },
  topTitle: { fontFamily: fonts.displayExtra, fontSize: 18, lineHeight: 24, letterSpacing: -0.35, color: ui.text },
  topButton: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  topButtonHover: { backgroundColor: ui.surfaceMuted },
  topButtonText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: ui.text },
  accountButton: {
    height: 42,
    maxWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingLeft: 4,
    paddingRight: 10,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 14, color: colors.white },
  accountName: { flexShrink: 1, fontFamily: fonts.bodySemi, fontSize: 13.5, color: ui.text },

  /* account menu */
  menu: {
    position: 'absolute',
    width: 272,
    padding: 8,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 36,
  },
  menuHead: { flexDirection: 'row', gap: 12, padding: 10 },
  menuAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  menuAvatarText: { fontFamily: fonts.displayExtra, fontSize: 16, color: colors.white },
  menuHeadText: { flex: 1, minWidth: 0 },
  menuName: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.text },
  menuMeta: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary, marginTop: 1 },
  roleChip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: ui.brandSoft,
  },
  roleChipText: { fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.4, color: colors.forest },
  menuRule: { height: StyleSheet.hairlineWidth, backgroundColor: ui.border, marginVertical: 6, marginHorizontal: 4 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 40, paddingHorizontal: 10, borderRadius: 10 },
  menuRowHover: { backgroundColor: ui.surfaceMuted },
  menuRowDangerHover: { backgroundColor: colors.errorBg },
  menuRowText: { fontFamily: fonts.bodySemi, fontSize: 13.5 },
});

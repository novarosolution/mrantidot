import { useCallback, useSyncExternalStore } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { adminRoutes } from '@/lib/routes';

/**
 * The web build (Expo web export) is the admin panel only: customers book on the public website and
 * technicians use the phone app. Everything here is inert on iOS / Android.
 */
export const IS_WEB = Platform.OS === 'web';

export const WEB_ADMIN_ONLY_MESSAGE = 'This web panel is for admins. Customers can book on mrantidot.com.';

/** Browser windows at least this wide get the desktop sidebar layout; narrower ones keep the phone UI. */
export const WEB_WIDE_MIN_WIDTH = 1024;

/** Desktop sidebar width (WebAdminShell). */
export const WEB_SIDEBAR_WIDTH = 248;
/** Desktop sidebar collapsed to icons. */
export const WEB_SIDEBAR_COLLAPSED_WIDTH = 76;
/** Desktop top bar (page title, refresh, account menu). */
export const WEB_TOPBAR_HEIGHT = 64;
/** Widest the admin screens get on a desktop — keeps lists and forms readable on big monitors. */
export const WEB_CONTENT_MAX_WIDTH = 1080;
/** Table screens (bookings, customers, payroll…) may widen the column to this while focused — `useWebWideContent`. */
export const WEB_TABLE_CONTENT_MAX_WIDTH = 1360;

/* ─── Wider column for table screens (desktop, opt-in) ─────────────── */

let wideContentRequests = 0;
/**
 * Set once the shell sizes its column with `useWebContentMaxWidth()`. Until then the opt-in is ignored,
 * so grid maths (adminContentWidth) never assume a wider column than the shell actually draws.
 */
let shellFollowsContentWidth = false;
const wideContentListeners = new Set<() => void>();

function subscribeWideContent(listener: () => void): () => void {
  wideContentListeners.add(listener);
  return () => {
    wideContentListeners.delete(listener);
  };
}

function getWideContent(): boolean {
  return wideContentRequests > 0;
}

function changeWideContent(delta: 1 | -1): void {
  const before = wideContentRequests > 0;
  wideContentRequests = Math.max(0, wideContentRequests + delta);
  if (before === wideContentRequests > 0) return;
  wideContentListeners.forEach((listener) => listener());
  remeasureWindow();
}

/** Max width of the desktop content column right now (a focused table screen may have widened it). */
export function webContentMaxWidth(): number {
  return wideContentRequests > 0 && shellFollowsContentWidth ? WEB_TABLE_CONTENT_MAX_WIDTH : WEB_CONTENT_MAX_WIDTH;
}

/**
 * For the shell's content column (WebAdminShell `maxWidth`): `WEB_TABLE_CONTENT_MAX_WIDTH` while a table
 * screen that called `useWebWideContent()` is focused, else `WEB_CONTENT_MAX_WIDTH`. Re-renders on change.
 */
export function useWebContentMaxWidth(): number {
  shellFollowsContentWidth = true;
  useSyncExternalStore(subscribeWideContent, getWideContent, getWideContent);
  return webContentMaxWidth();
}

/**
 * Table screens: ask for the wider desktop column while this screen is focused (given back on blur /
 * unmount, so forms and detail screens keep the readable width). No-op on native.
 */
export function useWebWideContent(enabled = true): void {
  useFocusEffect(
    useCallback(() => {
      if (!IS_WEB || !enabled) return undefined;
      changeWideContent(1);
      return () => changeWideContent(-1);
    }, [enabled]),
  );
}

/* ─── Sidebar collapse (desktop) ───────────────────────────────────── */

const SIDEBAR_COLLAPSED_KEY = '@mrantidot/admin-sidebar-collapsed';

function readSidebarCollapsed(): boolean {
  if (!IS_WEB || typeof window === 'undefined') return false;
  try {
    return window.localStorage?.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

let sidebarCollapsed = readSidebarCollapsed();
const sidebarListeners = new Set<() => void>();

function subscribeSidebar(listener: () => void): () => void {
  sidebarListeners.add(listener);
  return () => {
    sidebarListeners.delete(listener);
  };
}

function getSidebarCollapsed(): boolean {
  return sidebarCollapsed;
}

/**
 * Screens size their pixel grids from the window width (useWindowDimensions). Collapsing the sidebar
 * changes the content width without a window resize, so fire the browser resize event react-native-web's
 * Dimensions listens to — every useWindowDimensions() user re-measures once.
 */
function remeasureWindow(): void {
  if (typeof window === 'undefined') return;
  try {
    window.visualViewport?.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
  } catch {
    // Very old browsers: widths catch up on the next real resize.
  }
}

/** Collapse (icons only) or expand the desktop sidebar; remembered in this browser. Web only. */
export function setSidebarCollapsed(next: boolean): void {
  if (!IS_WEB || next === sidebarCollapsed) return;
  sidebarCollapsed = next;
  try {
    window.localStorage?.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
  } catch {
    // Private mode / storage blocked — the choice just isn't remembered.
  }
  sidebarListeners.forEach((listener) => listener());
  remeasureWindow();
}

/** Whether the desktop sidebar is collapsed to icons (re-renders when it changes). Always false on native. */
export function useSidebarCollapsed(): boolean {
  return useSyncExternalStore(subscribeSidebar, getSidebarCollapsed, getSidebarCollapsed);
}

/** Current desktop sidebar width (expanded or collapsed). */
export function webSidebarWidth(): number {
  return sidebarCollapsed ? WEB_SIDEBAR_COLLAPSED_WIDTH : WEB_SIDEBAR_WIDTH;
}

/**
 * Width the admin screens actually get. On a desktop browser the screens sit in WebAdminShell's
 * centred column (window minus sidebar, capped at WEB_CONTENT_MAX_WIDTH), so grid maths based on the
 * window width must use this instead. Native / narrow windows: the window width, unchanged.
 * Prefer `useAdminContentWidth()` in components — it also follows resizes and the sidebar collapse.
 */
export function adminContentWidth(windowWidth: number): number {
  if (!IS_WEB || windowWidth < WEB_WIDE_MIN_WIDTH) return windowWidth;
  return Math.min(windowWidth - webSidebarWidth(), webContentMaxWidth());
}

/** `adminContentWidth` as a hook: re-renders on window resize, sidebar collapse and the table-width opt-in. */
export const useAdminContentWidth: () => number = IS_WEB
  ? function useAdminContentWidthWeb() {
      const { width } = useWindowDimensions();
      useSidebarCollapsed();
      useSyncExternalStore(subscribeWideContent, getWideContent, getWideContent);
      return adminContentWidth(width);
    }
  : function useAdminContentWidthNative() {
      return useWindowDimensions().width;
    };

/** True on a desktop-width browser window. Always false on native (never subscribes to dimensions there). */
export const useWideWebLayout: () => boolean = IS_WEB
  ? function useWideWebLayoutWeb() {
      const { width } = useWindowDimensions();
      return width >= WEB_WIDE_MIN_WIDTH;
    }
  : function useWideWebLayoutNative() {
      return false;
    };

/* ─── Session expiry (web) ─────────────────────────────────────────── */

let sessionExpired = false;

/** lib/api.ts (web): a 401 dropped the session — the sign-in screen says so once. */
export function noteSessionExpired(): void {
  sessionExpired = true;
}

/** True after a 401 sign-out until `clearSessionExpired()` (read it in a state initializer). */
export function peekSessionExpired(): boolean {
  return sessionExpired;
}

export function clearSessionExpired(): void {
  sessionExpired = false;
}

/** Paths that exist in the customer / tech groups AND in the admin group (groups are not part of web URLs). */
const SHARED_ADMIN_PATHS = new Set(['/bookings', '/notifications', '/settings', '/offers', '/services', '/leave']);

/**
 * Web URLs drop route groups, so a refresh on `/bookings` can resolve to the customer screen. Map the
 * URL back to the admin screen with the same path (or the admin home when there is none).
 */
export function webAdminPathFor(pathname: string | undefined): string {
  const path = (pathname || '/').replace(/\/+$/, '') || '/';
  if (SHARED_ADMIN_PATHS.has(path)) return `/(admin)${path}`;
  const booking = path.match(/^\/(?:booking|job)\/([^/]+)$/);
  if (booking?.[1]) return adminRoutes.booking(booking[1]);
  return adminRoutes.home;
}

const BRAND_TITLE = 'Mr Antidot Admin';

/** Browser-tab titles for admin routes (keys are expo-router route names inside the admin group). */
const ADMIN_SCREEN_TITLES: Record<string, string> = {
  '(tabs)': 'Dashboard',
  index: 'Dashboard',
  bookings: 'Bookings',
  team: 'All tools',
  reports: 'Reports',
  content: 'App content',
  services: 'Services',
  'service-order': 'Service order',
  'service-edit': 'Edit service',
  offers: 'Offers',
  'offer-edit': 'Edit offer',
  customers: 'Customers',
  'customer/[id]': 'Customer',
  'customer-edit': 'Edit customer',
  technicians: 'Technicians',
  'technician/[id]': 'Technician',
  'technician-edit': 'Edit technician',
  users: 'Users',
  'user-edit': 'Edit user',
  'booking/[id]': 'Booking',
  'booking-create': 'New booking',
  notifications: 'Notifications',
  settings: 'Account settings',
  'data-export': 'Data export',
  'settings-business': 'Business settings',
  activity: 'Activity log',
  broadcast: 'Broadcast',
  reviews: 'Reviews',
  leave: 'Leave requests',
  payroll: 'Payroll',
  'website/index': 'Website',
  'website/pages': 'Website pages',
  'website/photos': 'Website photos',
  'website/lists': 'Website lists',
  'website/settings': 'Website settings',
  'website/blog': 'Blog',
  'website/blog-edit': 'Edit post',
  'website/gallery': 'Gallery',
  'website/team': 'Website team',
  'website/team-edit': 'Edit team member',
  'website/testimonials': 'Testimonials',
  'website/testimonial-edit': 'Edit testimonial',
  'website/messages': 'Messages',
  'website/subscribers': 'Subscribers',
  'website/trash': 'Recently deleted',
  search: 'Search',
};

/** `Customers · Mr Antidot Admin` — the document title for an admin route name. */
export function adminDocumentTitle(routeName: string): string {
  const label = ADMIN_SCREEN_TITLES[routeName];
  return label ? `${label} · ${BRAND_TITLE}` : BRAND_TITLE;
}

/**
 * Admin route name for expo-router segments: `['(admin)', '(tabs)', 'bookings']` → `bookings`, the
 * dashboard → `index`, `['(admin)', 'website']` → `website/index`, `['(admin)', 'booking', '[id]']` → `booking/[id]`.
 */
export function adminRouteName(segments: readonly string[]): string {
  const name = segments.filter((segment) => !/^\(.*\)$/.test(segment)).join('/');
  if (!name || name === 'index') return 'index';
  if (!ADMIN_SCREEN_TITLES[name] && ADMIN_SCREEN_TITLES[`${name}/index`]) return `${name}/index`;
  return name;
}

/** On-screen title for an admin route name (`Bookings`); routes without a title get a readable fallback. */
export function adminScreenTitle(routeName: string): string {
  const label = ADMIN_SCREEN_TITLES[routeName];
  if (label) return label;
  const last = routeName.split('/').filter((segment) => segment && !segment.startsWith('[')).pop() ?? '';
  const words = last.replace(/[-_]+/g, ' ').trim();
  return words ? `${words.charAt(0).toUpperCase()}${words.slice(1)}` : 'Admin';
}

export const WEB_LOGIN_DOCUMENT_TITLE = `Sign in · ${BRAND_TITLE}`;

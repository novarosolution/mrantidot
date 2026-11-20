import { Platform, useWindowDimensions } from 'react-native';
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
/** Widest the admin screens get on a desktop — keeps lists and forms readable on big monitors. */
export const WEB_CONTENT_MAX_WIDTH = 1080;

/**
 * Width the admin screens actually get. On a desktop browser the screens sit in WebAdminShell's
 * centred column (window minus sidebar, capped at WEB_CONTENT_MAX_WIDTH), so grid maths based on the
 * window width must use this instead. Native / narrow windows: the window width, unchanged.
 */
export function adminContentWidth(windowWidth: number): number {
  if (!IS_WEB || windowWidth < WEB_WIDE_MIN_WIDTH) return windowWidth;
  return Math.min(windowWidth - WEB_SIDEBAR_WIDTH, WEB_CONTENT_MAX_WIDTH);
}

/** True on a desktop-width browser window. Always false on native (never subscribes to dimensions there). */
export const useWideWebLayout: () => boolean = IS_WEB
  ? function useWideWebLayoutWeb() {
      const { width } = useWindowDimensions();
      return width >= WEB_WIDE_MIN_WIDTH;
    }
  : function useWideWebLayoutNative() {
      return false;
    };

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
  notifications: 'Notifications',
  settings: 'Settings',
  'data-export': 'Data export',
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
};

/** `Customers · Mr Antidot Admin` — the document title for an admin route name. */
export function adminDocumentTitle(routeName: string): string {
  const label = ADMIN_SCREEN_TITLES[routeName];
  return label ? `${label} · ${BRAND_TITLE}` : BRAND_TITLE;
}

export const WEB_LOGIN_DOCUMENT_TITLE = `Sign in · ${BRAND_TITLE}`;

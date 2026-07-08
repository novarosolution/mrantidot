import { router, type Href } from 'expo-router';
import type { UserRole } from '@/types/api';

/** Typed-route-safe navigation (avoids expo-router Href mismatches after layout changes). */
export type RouteInput =
  | Href
  | string
  | { pathname: string; params?: Record<string, string | undefined> };

/** Typed-route-safe navigation (avoids expo-router Href mismatches after layout changes). */
export function appPush(href: RouteInput): void {
  router.push(href as Href);
}

export function appReplace(href: RouteInput): void {
  router.replace(href as Href);
}

/** Cast dynamic paths for `<Redirect href={...} />` and typed links. */
export function appHref(href: string): Href {
  return href as Href;
}

/** Role-aware booking detail route (avoids /booking/[id] resolving to admin). */
export function bookingDetailPath(role: UserRole | undefined, bookingId: string): string {
  if (role === 'admin') return `/(admin)/booking/${bookingId}`;
  if (role === 'technician') return `/(tech)/job/${bookingId}`;
  return `/(customer)/booking/${bookingId}`;
}

export const ADMIN_HOME = '/(admin)' as const;
export const ADMIN_TEAM = '/(admin)/team' as const;

/** Common admin stack destinations (hidden from tab bar). */
export const adminRoutes = {
  home: ADMIN_HOME,
  team: ADMIN_TEAM,
  bookings: '/(admin)/bookings',
  reports: '/(admin)/reports',
  services: '/(admin)/services',
  serviceEdit: '/(admin)/service-edit',
  offers: '/(admin)/offers',
  offerEdit: '/(admin)/offer-edit',
  customers: '/(admin)/customers',
  customer: (id: string) => `/(admin)/customer/${id}` as const,
  technicians: '/(admin)/technicians',
  technician: (id: string) => `/(admin)/technician/${id}` as const,
  users: '/(admin)/users',
  userEdit: '/(admin)/user-edit',
  booking: (id: string) => `/(admin)/booking/${id}` as const,
  notifications: '/(admin)/notifications',
  settings: '/(admin)/settings',
  content: '/(admin)/content',
  reviews: '/(admin)/reviews',
} as const;

export type AdminRoute = (typeof adminRoutes)[keyof typeof adminRoutes] | ReturnType<
  typeof adminRoutes.customer | typeof adminRoutes.technician | typeof adminRoutes.booking
>;

/** Default fallback when admin back stack is empty (deep link / refresh). */
export function adminBackFallback(pathname?: string): string {
  if (!pathname) return ADMIN_TEAM;

  if (pathname.includes('/service-edit')) return adminRoutes.services;
  if (pathname.includes('/offer-edit')) return adminRoutes.offers;
  if (pathname.includes('/user-edit')) return adminRoutes.users;
  if (pathname.includes('/customer/')) return adminRoutes.customers;
  if (pathname.includes('/technician/')) return adminRoutes.technicians;
  if (pathname.includes('/booking/')) return adminRoutes.bookings;
  if (pathname.includes('/notifications')) return ADMIN_TEAM;
  if (pathname.includes('/settings')) return ADMIN_TEAM;
  if (pathname.includes('/content')) return ADMIN_TEAM;
  if (pathname.includes('/reviews')) return ADMIN_TEAM;
  if (pathname.includes('/services')) return ADMIN_TEAM;
  if (pathname.includes('/offers')) return ADMIN_TEAM;
  if (pathname.includes('/customers')) return ADMIN_TEAM;
  if (pathname.includes('/technicians')) return ADMIN_TEAM;
  if (pathname.includes('/users')) return ADMIN_TEAM;

  return ADMIN_TEAM;
}

/** Back navigation with fallback when there is no history (deep links, refresh). */
export function safeGoBack(fallback = '/(customer)'): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as never);
  }
}

/** Admin-aware back — never falls through to the customer app. */
export function adminGoBack(fallback: string = ADMIN_TEAM): void {
  safeGoBack(fallback);
}

/** Navigate to user edit and return to the caller screen on save/back. */
export function adminUserEdit(params: {
  id?: string;
  role?: 'customer' | 'technician' | 'admin';
  returnTo?: string;
}) {
  appPush({
    pathname: adminRoutes.userEdit,
    params: {
      ...(params.id ? { id: params.id } : {}),
      ...(params.role ? { role: params.role } : {}),
      ...(params.returnTo ? { returnTo: params.returnTo } : {}),
    },
  });
}

import type { LucideIcon } from 'lucide-react-native';
import {
  BarChart3,
  BugOff,
  CalendarCheck,
  ClipboardList,
  Clock,
  FileText,
  HardHat,
  Home,
  LayoutDashboard,
  Leaf,
  LifeBuoy,
  MessageSquare,
  Percent,
  PhoneCall,
  Shield,
  ShieldCheck,
  SprayCan,
  Tag,
  UserCircle,
  UserPlus,
  Users,
} from 'lucide-react-native';

/** Pest-control themed icons for navigation, menus, and empty states. */
export const AppIcons = {
  brand: SprayCan,
  empty: BugOff,

  customerTab: {
    home: Home,
    bookings: ClipboardList,
    offers: Tag,
    profile: UserCircle,
  } satisfies Record<string, LucideIcon>,

  adminTab: {
    dashboard: LayoutDashboard,
    bookings: ClipboardList,
    team: HardHat,
    reports: BarChart3,
  } satisfies Record<string, LucideIcon>,

  quick: {
    book: SprayCan,
    bookings: CalendarCheck,
    offers: Percent,
    support: LifeBuoy,
  } satisfies Record<string, LucideIcon>,

  adminQuick: {
    bookings: ClipboardList,
    services: SprayCan,
    addTech: UserPlus,
    offers: Tag,
    content: FileText,
    team: HardHat,
  } satisfies Record<string, LucideIcon>,

  adminKpi: {
    pending: Clock,
    bookings: ClipboardList,
    active: SprayCan,
    customers: Users,
  } satisfies Record<string, LucideIcon>,

  adminHub: {
    homeContent: Home,
    services: SprayCan,
    offers: Tag,
    reviews: MessageSquare,
    users: Shield,
    technicians: HardHat,
    customers: UserCircle,
  } satisfies Record<string, LucideIcon>,

  contentTab: {
    promo: Tag,
    home: Home,
    brand: ShieldCheck,
    booking: CalendarCheck,
    onboard: SprayCan,
    legal: Shield,
  } satisfies Record<string, LucideIcon>,

  trust: {
    verified: ShieldCheck,
    sameDay: Clock,
    eco: Leaf,
  } satisfies Record<string, LucideIcon>,

  notification: {
    admin: ClipboardList,
    booking: CalendarCheck,
    complete: ShieldCheck,
    default: BugOff,
  } satisfies Record<string, LucideIcon>,

  profile: {
    bookings: ClipboardList,
    addresses: Home,
    payments: Tag,
    offers: Percent,
    notifications: BugOff,
    help: PhoneCall,
    faq: LifeBuoy,
    privacy: Shield,
  } satisfies Record<string, LucideIcon>,
};

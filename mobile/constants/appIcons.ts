import type { LucideIcon } from 'lucide-react-native';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  BugOff,
  CalendarCheck,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  FileText,
  HardHat,
  Home,
  ImageIcon,
  IndianRupee,
  LayoutDashboard,
  Leaf,
  LifeBuoy,
  LogOut,
  MapPin,
  MessageSquare,
  Percent,
  Phone,
  PhoneCall,
  Pencil,
  Settings,
  Shield,
  ShieldCheck,
  SprayCan,
  Star,
  Tag,
  UserCircle,
  UserPlus,
  Users,
  BadgeCheck,
  Wallet,
  Mail,
  Info,
} from 'lucide-react-native';

/** Shared gradient fills for premium icon tiles. */
export const IconGradients = {
  forest: ['#14532D', '#1E8E4E'],
  gold: ['#B6841C', '#D4A017'],
  teal: ['#2A756A', '#3A9688'],
  blue: ['#3461B6', '#4A7AD4'],
  danger: ['#7C2D12', '#B45309'],
  verify: ['#14532D', '#0E3A20'],
} as const satisfies Record<string, readonly [string, string]>;

/** Pest-control themed icons — single source for navigation, menus, KPIs, and actions. */
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

  techTab: {
    jobs: ClipboardList,
    profile: HardHat,
  } satisfies Record<string, LucideIcon>,

  quick: {
    book: SprayCan,
    bookings: CalendarCheck,
    offers: Percent,
    support: LifeBuoy,
  } satisfies Record<string, LucideIcon>,

  techHub: {
    jobs: ClipboardList,
    active: Briefcase,
    verify: ShieldCheck,
    allJobs: CalendarDays,
  } satisfies Record<string, LucideIcon>,

  techStats: {
    assigned: Briefcase,
    active: Clock,
    verify: ShieldCheck,
    done: CheckCircle2,
    earnings: IndianRupee,
    rating: Star,
  } satisfies Record<string, LucideIcon>,

  techAlert: {
    verify: ShieldCheck,
    overdue: AlertTriangle,
  } satisfies Record<string, LucideIcon>,

  techProfile: {
    verified: BadgeCheck,
    location: MapPin,
    phone: Phone,
    logout: LogOut,
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
    default: Bell,
  } satisfies Record<string, LucideIcon>,

  profile: {
    bookings: ClipboardList,
    addresses: Home,
    payments: CreditCard,
    offers: Percent,
    notifications: Bell,
    help: PhoneCall,
    faq: LifeBuoy,
    privacy: Shield,
    settings: Settings,
  } satisfies Record<string, LucideIcon>,

  ui: {
    chevronRight: ChevronRight,
    camera: Camera,
    check: Check,
    image: ImageIcon,
    edit: Pencil,
    mail: Mail,
    user: UserCircle,
    wallet: Wallet,
    calendar: CalendarDays,
    bell: Bell,
    settings: Settings,
    logout: LogOut,
    info: Info,
    terms: FileText,
  } satisfies Record<string, LucideIcon>,
};

export type AppIconName = LucideIcon;

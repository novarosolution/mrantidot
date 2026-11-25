import type { ImageSourcePropType } from 'react-native';

/** Generated mint-tile icon pack (forest glyph on #EAF6E3). */
export const AppImageIcons = {
  spray: require('../assets/icons/ui/spray.jpg'),
  calendar: require('../assets/icons/ui/calendar.jpg'),
  offer: require('../assets/icons/ui/offer.jpg'),
  help: require('../assets/icons/ui/help.jpg'),
  pin: require('../assets/icons/ui/pin.jpg'),
  card: require('../assets/icons/ui/card.jpg'),
  bell: require('../assets/icons/ui/bell.jpg'),
  settings: require('../assets/icons/ui/settings.jpg'),
  home: require('../assets/icons/ui/home.jpg'),
  user: require('../assets/icons/ui/user.jpg'),
  clipboard: require('../assets/icons/ui/clipboard.jpg'),
  shield: require('../assets/icons/ui/shield.jpg'),
  phone: require('../assets/icons/ui/phone.jpg'),
  chat: require('../assets/icons/ui/chat.jpg'),
  file: require('../assets/icons/ui/file.jpg'),
  faq: require('../assets/icons/ui/faq.jpg'),
  info: require('../assets/icons/ui/info.jpg'),
  logout: require('../assets/icons/ui/logout.jpg'),
  star: require('../assets/icons/ui/star.jpg'),
  clock: require('../assets/icons/ui/clock.jpg'),
  rupee: require('../assets/icons/ui/rupee.jpg'),
  check: require('../assets/icons/ui/check.jpg'),
  alert: require('../assets/icons/ui/alert.jpg'),
  leaf: require('../assets/icons/ui/leaf.jpg'),
  gift: require('../assets/icons/ui/gift.jpg'),
  briefcase: require('../assets/icons/ui/briefcase.jpg'),
  dashboard: require('../assets/icons/ui/dashboard.jpg'),
  users: require('../assets/icons/ui/users.jpg'),
  chart: require('../assets/icons/ui/chart.jpg'),
  search: require('../assets/icons/ui/search.jpg'),
  lock: require('../assets/icons/ui/lock.jpg'),
  wallet: require('../assets/icons/ui/wallet.jpg'),
  tags: require('../assets/icons/ui/tags.jpg'),
  mail: require('../assets/icons/ui/mail.jpg'),
  tech: require('../assets/icons/ui/tech.jpg'),
  building: require('../assets/icons/ui/building.jpg'),
  store: require('../assets/icons/ui/store.jpg'),
  camera: require('../assets/icons/ui/camera.jpg'),
  userPlus: require('../assets/icons/ui/user-plus.jpg'),
  percent: require('../assets/icons/ui/percent.jpg'),
} as const satisfies Record<string, ImageSourcePropType>;

export type AppImageIconKey = keyof typeof AppImageIcons;

/** Mirrors AppIcons groups with generated image assets. */
export const AppIconImages = {
  brand: AppImageIcons.spray,
  empty: AppImageIcons.spray,

  customerTab: {
    home: AppImageIcons.home,
    bookings: AppImageIcons.calendar,
    offers: AppImageIcons.offer,
    profile: AppImageIcons.user,
  },

  adminTab: {
    dashboard: AppImageIcons.dashboard,
    bookings: AppImageIcons.calendar,
    team: AppImageIcons.users,
    reports: AppImageIcons.chart,
  },

  techTab: {
    jobs: AppImageIcons.briefcase,
    profile: AppImageIcons.user,
  },

  techHub: {
    jobs: AppImageIcons.clipboard,
    active: AppImageIcons.briefcase,
    verify: AppImageIcons.shield,
    allJobs: AppImageIcons.calendar,
  },

  techStats: {
    assigned: AppImageIcons.briefcase,
    active: AppImageIcons.clock,
    verify: AppImageIcons.shield,
    done: AppImageIcons.check,
    earnings: AppImageIcons.rupee,
    rating: AppImageIcons.star,
  },

  techAlert: {
    verify: AppImageIcons.shield,
    overdue: AppImageIcons.alert,
  },

  techProfile: {
    verified: AppImageIcons.check,
    location: AppImageIcons.pin,
    phone: AppImageIcons.phone,
    logout: AppImageIcons.logout,
  },

  adminQuick: {
    bookings: AppImageIcons.clipboard,
    services: AppImageIcons.spray,
    addTech: AppImageIcons.userPlus,
    offers: AppImageIcons.tags,
    content: AppImageIcons.file,
    team: AppImageIcons.tech,
  },

  adminKpi: {
    pending: AppImageIcons.clock,
    bookings: AppImageIcons.clipboard,
    active: AppImageIcons.spray,
    customers: AppImageIcons.users,
  },

  adminHub: {
    homeContent: AppImageIcons.home,
    services: AppImageIcons.spray,
    offers: AppImageIcons.tags,
    reviews: AppImageIcons.chat,
    users: AppImageIcons.shield,
    technicians: AppImageIcons.tech,
    customers: AppImageIcons.user,
  },

  contentTab: {
    promo: AppImageIcons.tags,
    home: AppImageIcons.home,
    brand: AppImageIcons.shield,
    booking: AppImageIcons.calendar,
    screens: AppImageIcons.user,
    onboard: AppImageIcons.spray,
    legal: AppImageIcons.shield,
  },

  trust: {
    verified: AppImageIcons.shield,
    sameDay: AppImageIcons.clock,
    eco: AppImageIcons.leaf,
  },

  notification: {
    admin: AppImageIcons.clipboard,
    booking: AppImageIcons.calendar,
    complete: AppImageIcons.shield,
    default: AppImageIcons.bell,
  },

  profile: {
    bookings: AppImageIcons.clipboard,
    addresses: AppImageIcons.pin,
    payments: AppImageIcons.card,
    offers: AppImageIcons.offer,
    notifications: AppImageIcons.bell,
    help: AppImageIcons.help,
    faq: AppImageIcons.faq,
    about: AppImageIcons.info,
    terms: AppImageIcons.file,
    privacy: AppImageIcons.lock,
    settings: AppImageIcons.settings,
    chat: AppImageIcons.chat,
    call: AppImageIcons.phone,
    logout: AppImageIcons.logout,
  },

  property: {
    home: AppImageIcons.home,
    apartment: AppImageIcons.building,
    hotel: AppImageIcons.building,
    store: AppImageIcons.store,
    warehouse: AppImageIcons.building,
    factory: AppImageIcons.building,
  },

  payment: {
    card: AppImageIcons.card,
    wallet: AppImageIcons.wallet,
    upi: AppImageIcons.phone,
  },

  toast: {
    success: AppImageIcons.check,
    error: AppImageIcons.alert,
    warn: AppImageIcons.alert,
    info: AppImageIcons.info,
    offline: AppImageIcons.alert,
  },

  ui: {
    calendar: AppImageIcons.calendar,
    clock: AppImageIcons.clock,
    mapPin: AppImageIcons.pin,
    bell: AppImageIcons.bell,
    settings: AppImageIcons.settings,
    logout: AppImageIcons.logout,
    info: AppImageIcons.info,
    terms: AppImageIcons.file,
    search: AppImageIcons.search,
    pay: AppImageIcons.rupee,
    lock: AppImageIcons.lock,
    phone: AppImageIcons.phone,
    message: AppImageIcons.chat,
    help: AppImageIcons.help,
    tag: AppImageIcons.tags,
    percent: AppImageIcons.percent,
    star: AppImageIcons.star,
    leaf: AppImageIcons.leaf,
    shield: AppImageIcons.shield,
    gift: AppImageIcons.gift,
    mail: AppImageIcons.mail,
    user: AppImageIcons.user,
    wallet: AppImageIcons.wallet,
    camera: AppImageIcons.camera,
    brand: AppImageIcons.spray,
    rupee: AppImageIcons.rupee,
    alert: AppImageIcons.alert,
    check: AppImageIcons.check,
  },
} as const;

/** @deprecated use AppIconImages.quick — kept for existing imports */
export const QuickImages = {
  book: AppImageIcons.spray,
  bookings: AppImageIcons.calendar,
  offers: AppImageIcons.offer,
  help: AppImageIcons.help,
  address: AppImageIcons.pin,
  payment: AppImageIcons.card,
  bell: AppImageIcons.bell,
  settings: AppImageIcons.settings,
} as const;

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, type Href } from 'expo-router';
import {
  ArchiveRestore,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarOff,
  CalendarPlus,
  ChartColumn,
  DatabaseBackup,
  Globe,
  HardHat,
  Keyboard,
  LayoutDashboard,
  Megaphone,
  Bell,
  Newspaper,
  ScrollText,
  Smartphone,
  Sparkles,
  Star,
  TicketPercent,
  UserCog,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { adminRoutes, appPush } from '@/lib/routes';

/* ─── Server types (GET /admin/search) ─────────────────────────────── */

export type SearchScreen = 'booking' | 'customer' | 'technician' | 'service' | 'offer' | 'blog';
export type SearchGroupType = 'bookings' | 'customers' | 'technicians' | 'services' | 'offers' | 'blog';
export type SearchBadgeTone = 'green' | 'amber' | 'red' | 'grey' | 'blue';

export interface SearchHit {
  type: SearchScreen;
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: { label: string; tone: SearchBadgeTone };
  status?: string;
  score: number;
  open: { screen: SearchScreen; id: string };
}

export interface SearchGroup {
  type: SearchGroupType;
  label: string;
  total: number;
  items: SearchHit[];
}

export interface SearchResponse {
  q: string;
  groups: SearchGroup[];
  tookMs?: number;
}

/** Opens the admin screen for a search result. */
export function openSearchHit(hit: SearchHit): void {
  const id = hit.open.id;
  switch (hit.open.screen) {
    case 'booking':
      appPush(adminRoutes.booking(id));
      return;
    case 'customer':
      appPush(adminRoutes.customer(id));
      return;
    case 'technician':
      appPush(adminRoutes.technician(id));
      return;
    case 'service':
      appPush({ pathname: adminRoutes.serviceEdit, params: { id } });
      return;
    case 'offer':
      appPush({ pathname: adminRoutes.offerEdit, params: { id } });
      return;
    case 'blog':
      appPush({ pathname: adminRoutes.websiteBlogEdit, params: { id } });
  }
}

/** Search words as the server reads them (for highlighting): lower case, `#MA-` dropped. */
export function searchTokens(q: string): string[] {
  return q
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/^#/, '').replace(/^ma-/, '').trim())
    .filter(Boolean)
    .slice(0, 4);
}

/* ─── Results hook ─────────────────────────────────────────────────── */

export function useAdminSearchResults(q: string, limit = 5) {
  const [state, setState] = useState<{ q: string; groups: SearchGroup[]; loading: boolean; error: string | null }>({
    q: '',
    groups: [],
    loading: false,
    error: null,
  });
  const requestId = useRef(0);

  const run = useCallback(
    async (text: string) => {
      const id = ++requestId.current;
      if (!text) {
        setState({ q: '', groups: [], loading: false, error: null });
        return;
      }
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const { data } = await api.get<SearchResponse>('/admin/search', { ...screenLoadConfig, params: { q: text, limit }, skipCache: true });
        if (id !== requestId.current) return;
        setState({ q: text, groups: data.groups ?? [], loading: false, error: null });
      } catch (err) {
        if (id !== requestId.current) return;
        setState((prev) => ({ ...prev, loading: false, error: getApiErrorMessage(err, 'Search failed') }));
      }
    },
    [limit],
  );

  useEffect(() => {
    void run(q);
  }, [q, run]);

  return { ...state, retry: () => void run(q) };
}

/* ─── Recent searches (this device) ───────────────────────────────── */

const RECENT_KEY = '@mrantidot/admin-recent-searches';
const RECENT_MAX = 6;

let recentCache: string[] | null = null;
const recentListeners = new Set<(list: string[]) => void>();

async function readRecent(): Promise<string[]> {
  if (recentCache) return recentCache;
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    recentCache = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string').slice(0, RECENT_MAX) : [];
  } catch {
    recentCache = [];
  }
  return recentCache;
}

function writeRecent(list: string[]): void {
  recentCache = list;
  recentListeners.forEach((listener) => listener(list));
  AsyncStorage.setItem(RECENT_KEY, JSON.stringify(list)).catch(() => undefined);
}

export async function rememberSearch(q: string): Promise<void> {
  const text = q.trim().replace(/\s+/g, ' ').slice(0, 80);
  if (text.length < 2) return;
  const list = await readRecent();
  writeRecent([text, ...list.filter((x) => x.toLowerCase() !== text.toLowerCase())].slice(0, RECENT_MAX));
}

export function clearRecentSearches(): void {
  writeRecent([]);
}

export function useRecentSearches(): string[] {
  const [list, setList] = useState<string[]>(recentCache ?? []);
  useEffect(() => {
    let alive = true;
    void readRecent().then((l) => {
      if (alive) setList(l);
    });
    recentListeners.add(setList);
    return () => {
      alive = false;
      recentListeners.delete(setList);
    };
  }, []);
  return list;
}

/* ─── Quick actions ────────────────────────────────────────────────── */

export type QuickAction = {
  key: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  /** Extra words that find it ("create", "message"…). */
  keywords?: string;
  /** Keyboard shortcut shown on the web ("G B", "N"). */
  shortcut?: string;
  /** Shown when the search box is empty. */
  featured?: boolean;
  webOnly?: boolean;
  run: () => void;
};

/** Sidebar-style navigation: back to the tabs root, then switch tab or open the screen (shallow history). */
export function openAdminSection(href: string, tab = false): void {
  if (router.canDismiss()) router.dismissAll();
  if (tab) router.navigate(href as Href);
  else router.push(href as Href);
}

export function quickActions(opts: { openShortcuts?: () => void } = {}): QuickAction[] {
  const list: QuickAction[] = [
    {
      key: 'new-booking',
      label: 'New booking',
      hint: 'Book a visit for a customer',
      icon: CalendarPlus,
      keywords: 'create add book visit order',
      shortcut: 'N',
      featured: true,
      run: () => appPush(adminRoutes.bookingCreate),
    },
    {
      key: 'broadcast',
      label: 'Send a broadcast',
      hint: 'Message customers or technicians',
      icon: Megaphone,
      keywords: 'notify announce message push',
      featured: true,
      run: () => openAdminSection(adminRoutes.broadcast),
    },
    {
      key: 'business',
      label: 'Business settings',
      hint: 'Slots, prices, payments and rules',
      icon: BriefcaseBusiness,
      keywords: 'settings slots gst payments rules hours area',
      featured: true,
      run: () => openAdminSection(adminRoutes.businessSettings),
    },
    { key: 'go-dashboard', label: 'Dashboard', icon: LayoutDashboard, keywords: 'home overview', shortcut: 'G D', run: () => openAdminSection(adminRoutes.home, true) },
    { key: 'go-bookings', label: 'Bookings', icon: CalendarCheck, keywords: 'jobs orders visits', shortcut: 'G B', featured: true, run: () => openAdminSection(adminRoutes.bookings, true) },
    { key: 'go-customers', label: 'Customers', icon: UsersRound, keywords: 'clients people', shortcut: 'G C', featured: true, run: () => openAdminSection(adminRoutes.customers) },
    { key: 'go-technicians', label: 'Technicians', icon: HardHat, keywords: 'team staff experts', shortcut: 'G T', run: () => openAdminSection(adminRoutes.technicians) },
    { key: 'go-services', label: 'Services', icon: Sparkles, keywords: 'catalog treatments prices', shortcut: 'G S', run: () => openAdminSection(adminRoutes.services) },
    { key: 'go-reports', label: 'Reports', icon: ChartColumn, keywords: 'revenue analytics stats', shortcut: 'G R', run: () => openAdminSection(adminRoutes.reports, true) },
    { key: 'go-offers', label: 'Offers', icon: TicketPercent, keywords: 'coupons codes discounts', run: () => openAdminSection(adminRoutes.offers) },
    { key: 'go-reviews', label: 'Reviews', icon: Star, keywords: 'ratings feedback', run: () => openAdminSection(adminRoutes.reviews) },
    { key: 'go-notifications', label: 'Notifications', icon: Bell, keywords: 'inbox alerts', run: () => openAdminSection(adminRoutes.notifications) },
    { key: 'go-activity', label: 'Activity log', icon: ScrollText, keywords: 'audit history changes', run: () => openAdminSection(adminRoutes.activity) },
    { key: 'go-users', label: 'Users', icon: UserCog, keywords: 'admins accounts', run: () => openAdminSection(adminRoutes.users) },
    { key: 'go-leave', label: 'Leave requests', icon: CalendarOff, keywords: 'holiday off', run: () => openAdminSection(adminRoutes.leave) },
    { key: 'go-payroll', label: 'Payroll', icon: Wallet, keywords: 'pay salary earnings', run: () => openAdminSection(adminRoutes.payroll) },
    { key: 'go-website', label: 'Website', icon: Globe, keywords: 'site pages photos', run: () => openAdminSection(adminRoutes.website) },
    { key: 'new-post', label: 'Write a blog post', icon: Newspaper, keywords: 'new article blog website', run: () => appPush(adminRoutes.websiteBlogEdit) },
    { key: 'trash', label: 'Recently deleted', hint: 'Restore website items', icon: ArchiveRestore, keywords: 'trash undo restore deleted bin', run: () => openAdminSection(adminRoutes.websiteTrash) },
    { key: 'go-content', label: 'App content', icon: Smartphone, keywords: 'text labels copy wording', run: () => openAdminSection(adminRoutes.content) },
    { key: 'go-export', label: 'Data export', icon: DatabaseBackup, keywords: 'backup download csv', run: () => openAdminSection(adminRoutes.dataExport) },
  ];
  if (opts.openShortcuts) {
    list.push({
      key: 'shortcuts',
      label: 'Keyboard shortcuts',
      icon: Keyboard,
      keywords: 'keys help hotkeys',
      shortcut: '?',
      webOnly: true,
      run: opts.openShortcuts,
    });
  }
  return list;
}

/** Actions whose label (or keywords) has a word starting with every search word. */
export function matchQuickActions(actions: QuickAction[], q: string, max = 4): QuickAction[] {
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const scored = actions
    .map((action) => {
      const label = action.label.toLowerCase();
      const words = `${label} ${action.keywords ?? ''}`.split(/[^a-z0-9]+/).filter(Boolean);
      const all = tokens.every((t) => words.some((w) => w.startsWith(t)));
      if (!all) return null;
      const score = label.startsWith(tokens.join(' ')) ? 3 : tokens.every((t) => label.split(/\s+/).some((w) => w.startsWith(t))) ? 2 : 1;
      return { action, score };
    })
    .filter((x): x is { action: QuickAction; score: number } => x !== null)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((x) => x.action);
}

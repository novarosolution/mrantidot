import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import type { NativeStackNavigationProp } from 'expo-router';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import Toast from 'react-native-toast-message';
import { AdminCollapsibleCard, AdminFormCard, AdminSearchField, AdminTabHint } from '@/components/kit/AdminPageKit';
import { ADMIN_STICKY_FOOTER_PAD, AdminListShell, AdminSectionTitle } from '@/components/kit/AdminListShell';
import { AdminSectionTabs, type AdminSectionTab } from '@/components/kit/AdminSectionTabs';
import { PendingScheduleCard } from '@/components/kit/PendingScheduleCard';
import { IconInput } from '@/components/kit/IconInput';
import { StringListEditor } from '@/components/kit/StringListEditor';
import { MarkdownEditor } from '@/components/kit/MarkdownEditor';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { Button } from '@/components/ui/Button';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { HERO_SLIDE_H, HomeHeroCarousel, promoHeroSlide } from '@/components/kit/HomeHeroCarousel';
import { PremiumAurora } from '@/components/kit/PremiumAurora';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { chooseAsync, confirmAsync } from '@/lib/confirm';
import { haptic } from '@/lib/motion';
import { useAppContent } from '@/context/AppContentContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { AppConfig, BookingCopyConfig, CustomerUiCopy, HomeConfig, HomePromo, Service } from '@/types/api';
import { DEFAULT_BOOKING_COPY, BOOKING_COPY_ADMIN_GROUPS, type BookingCopyFieldKey } from '@/constants/bookingCopy';
import {
  CUSTOMER_UI_ADMIN_GROUPS,
  WEBSITE_GROUP_META,
  WEBSITE_UI_ADMIN_GROUPS,
  DEFAULT_CUSTOMER_UI_COPY,
  type CustomerUiFieldKey,
} from '@/constants/customerUiCopy';
import { DEFAULT_HOME_CONFIG, DEFAULT_HOME_PROMO } from '@/constants/homeContent';
import { DEFAULT_APP_CONFIG, mergeAppConfig, mergeHomeConfig } from '@/lib/mergeHomeConfig';
import { colors, fonts, spacing, surfaces, ui } from '@/constants/theme';
import { adminContentWidth } from '@/lib/webAdmin';
import { useBusinessSettings } from '@/lib/businessSettings';
import { categoryLabel } from '@/lib/settingsLabels';

const CONTENT_TABS: AdminSectionTab[] = [
  { key: 'promo', label: 'Promo', icon: AppIcons.contentTab.promo },
  { key: 'home', label: 'Home', icon: AppIcons.contentTab.home },
  { key: 'screens', label: 'Screens', icon: AppIcons.contentTab.screens },
  { key: 'brand', label: 'Brand', icon: AppIcons.contentTab.brand },
  { key: 'booking', label: 'Booking', icon: AppIcons.contentTab.booking },
  { key: 'onboard', label: 'Onboard', icon: AppIcons.contentTab.onboard },
  { key: 'legal', label: 'Legal', icon: AppIcons.contentTab.legal },
  { key: 'website', label: 'Website', icon: AppIcons.contentTab.website },
];

const CONTENT_TAB_HINTS: Record<string, { title: string; body: string }> = {
  promo: {
    title: 'Home promo banner',
    body: 'Toggle visibility, headline, CTA label, and which service the banner links to.',
  },
  home: {
    title: 'Home screen content',
    body: 'Edit hero copy, search, promo carousel, section titles, quick actions, and category filters.',
  },
  screens: {
    title: 'Customer app screens',
    body: 'Edit greetings, auth, offers, profile menus, help, and account screen copy across the user app.',
  },
  brand: {
    title: 'Brand & support',
    body: 'App name, tagline, contact details, guarantee text, and trust badges.',
  },
  booking: {
    title: 'Booking experience',
    body: 'Expand each section to edit wizard steps, technician app copy, detail screen text, and status messages.',
  },
  onboard: {
    title: 'Onboarding slides',
    body: 'First-launch carousel titles, subtitles, and trust chips shown to new customers.',
  },
  legal: {
    title: 'Legal & help',
    body: 'Terms, privacy policy, FAQ entries, and about page markdown.',
  },
  website: {
    title: 'Website',
    body: 'Text on mrantidot.com — menu, home sections, about, contact, footer and checkout. Phone, email, WhatsApp, hours and FAQ come from the Brand and Legal tabs.',
  },
};

const BOOKING_GROUP_META: Record<
  keyof typeof BOOKING_COPY_ADMIN_GROUPS,
  { subtitle: string; defaultOpen?: boolean }
> = {
  wizard: { subtitle: 'Book flow steps, schedule panel & submit actions', defaultOpen: true },
  list: { subtitle: 'My bookings filters, empty states & CTAs' },
  success: { subtitle: 'Confirmation screen labels & buttons' },
  pending: { subtitle: 'Awaiting admin schedule approval' },
  detail: { subtitle: 'Single booking view sections & actions' },
  trackingSteps: { subtitle: 'Live job timeline step labels' },
  statusGuidance: { subtitle: 'Status-specific customer guidance messages' },
  admin: { subtitle: 'Admin schedule confirm / reject copy' },
  tech: { subtitle: 'Technician jobs, profile, check-in & job screen copy' },
};

const SCREENS_GROUP_META: Record<
  keyof typeof CUSTOMER_UI_ADMIN_GROUPS,
  { title: string; subtitle: string; defaultOpen?: boolean }
> = {
  home: { title: 'Home chrome', subtitle: 'Greetings, location, empty states & carousel kickers', defaultOpen: true },
  catalog: { title: 'Services catalog', subtitle: 'Search, pest filters, sort & empty state' },
  browse: { title: 'Category page', subtitle: 'Browse-by-pest page titles, sections & help row' },
  service: { title: 'Service detail', subtitle: 'Sizes, included / excluded, trust, share & book bar' },
  cart: { title: 'Cart & checkout', subtitle: 'Cart rows, bill, policy, sheets & step buttons' },
  bookings: { title: 'My bookings', subtitle: 'Bookings list header, sections & card hints' },
  bookingDetail: { title: 'Booking detail', subtitle: 'Status card, journey, treatment steps, invoice & actions' },
  offers: { title: 'Offers', subtitle: 'Coupons screen titles & empty states' },
  profile: { title: 'Profile', subtitle: 'Quick actions, stats & menu rows' },
  account: { title: 'Account screens', subtitle: 'Addresses, payments, notifications & settings' },
  help: { title: 'Help', subtitle: 'Support page section labels' },
  auth: { title: 'Auth', subtitle: 'Login, register & OTP copy' },
  onboarding: { title: 'Onboarding buttons', subtitle: 'Skip / Next / Get started and slide art chips' },
  review: { title: 'Review screen', subtitle: 'Rate & review copy after a visit' },
  tech: { title: 'Technician app', subtitle: 'Jobs, job screen, check-in, leave & profile copy' },
  system: { title: 'App status & system', subtitle: 'Maintenance, update, offline and general error messages' },
};


type CopyGroupMeta = { title: string; subtitle: string; defaultOpen?: boolean };
type CopyGroups = Record<string, readonly (readonly [CustomerUiFieldKey, string])[]>;

const APP_COPY_SECTIONS = { groups: CUSTOMER_UI_ADMIN_GROUPS as CopyGroups, meta: SCREENS_GROUP_META as Record<string, CopyGroupMeta> };
const WEBSITE_COPY_SECTIONS = { groups: WEBSITE_UI_ADMIN_GROUPS as CopyGroups, meta: WEBSITE_GROUP_META as Record<string, CopyGroupMeta> };

const DEFAULT_CONFIG: HomeConfig = DEFAULT_HOME_CONFIG;

const DEFAULT_PROMO: HomePromo = DEFAULT_HOME_PROMO;

const DEFAULT_APP: AppConfig = DEFAULT_APP_CONFIG;

export default function AdminContentScreen() {
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const { refresh: refreshAppContent } = useAppContent();
  const { loading, error, runLoad, reload } = useScreenLoad();
  const [promo, setPromo] = useState<HomePromo>(DEFAULT_PROMO);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(DEFAULT_CONFIG);
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_APP);
  const [services, setServices] = useState<Service[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(CONTENT_TABS[0].key);
  const [screenQuery, setScreenQuery] = useState('');
  const [webQuery, setWebQuery] = useState('');
  /** Version stamps of the loaded documents — sent back so a save never silently overwrites another admin's. */
  const [homeVersion, setHomeVersion] = useState<string | undefined>(undefined);
  const [appVersion, setAppVersion] = useState<string | undefined>(undefined);
  /** JSON of what the server has — differs from the form while there are unsaved edits. */
  const [savedHome, setSavedHome] = useState<string | null>(null);
  const [savedApp, setSavedApp] = useState<string | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();

  /** Puts a home document from the server into the form and marks it as saved. */
  const applyHome = useCallback((data: { promo: HomePromo; homeConfig: HomeConfig; updatedAt?: string }) => {
    const nextPromo = data.promo ?? DEFAULT_PROMO;
    const nextConfig = mergeHomeConfig(data.homeConfig);
    setPromo(nextPromo);
    setHomeConfig(nextConfig);
    setSavedHome(JSON.stringify({ promo: nextPromo, homeConfig: nextConfig }));
    setHomeVersion(data.updatedAt);
  }, []);

  /** Same for the app document. */
  const applyApp = useCallback((data: { app: AppConfig; updatedAt?: string }) => {
    const next = mergeAppConfig(data.app);
    setAppConfig(next);
    setSavedApp(JSON.stringify(next));
    setAppVersion(data.updatedAt);
  }, []);

  const load = useCallback(async () => {
    const [homeRes, appRes, svcRes] = await Promise.all([
      api.get<{ promo: HomePromo; homeConfig: HomeConfig; updatedAt?: string }>('/content/admin/home', screenLoadConfig),
      api.get<{ app: AppConfig; updatedAt?: string }>('/content/admin/app', screenLoadConfig),
      api.get<{ services: Service[] }>('/services', {
        ...screenLoadConfig,
        params: { includeInactive: '1' },
      }),
    ]);
    applyHome(homeRes.data);
    applyApp(appRes.data);
    setServices(svcRes.data.services);
  }, [applyHome, applyApp]);

  useEffect(() => {
    void runLoad(load, 'Could not load content');
  }, [load, runLoad]);

  useEffect(() => {
    if (tabParam && CONTENT_TABS.some((t) => t.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  /* ---------- unsaved changes ---------- */
  const homeSnapshot = useMemo(() => JSON.stringify({ promo, homeConfig }), [promo, homeConfig]);
  const appSnapshot = useMemo(() => JSON.stringify(appConfig), [appConfig]);
  const homeDirty = savedHome !== null && homeSnapshot !== savedHome;
  const appDirty = savedApp !== null && appSnapshot !== savedApp;
  const dirty = homeDirty || appDirty;

  const guard = useRef({ dirty: false, saving: false });
  guard.current = { dirty, saving };

  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (!guard.current.dirty || guard.current.saving) return;
      e.preventDefault();
      void confirmAsync({
        title: 'Discard your changes?',
        message: 'Your app content changes are not saved yet.',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
        destructive: true,
      }).then((ok) => {
        if (!ok) return;
        guard.current.dirty = false;
        navigation.dispatch(e.data.action);
      });
    });
  }, [navigation]);

  // A swipe-back can't be stopped half way on iOS — switch it off while there are unsaved changes.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !dirty });
  }, [navigation, dirty]);

  // Browser admin: closing or reloading the tab.
  useEffect(() => {
    if (Platform.OS !== 'web' || !dirty || typeof window === 'undefined') return;
    const onUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [dirty]);

  const onAbout = useCallback((aboutMarkdown: string) => setAppConfig((a) => ({ ...a, aboutMarkdown })), []);
  const onTerms = useCallback(
    (termsMarkdown: string) => setAppConfig((a) => ({ ...a, legal: { ...a.legal, termsMarkdown } })),
    [],
  );
  const onPrivacy = useCallback(
    (privacyMarkdown: string) => setAppConfig((a) => ({ ...a, legal: { ...a.legal, privacyMarkdown } })),
    [],
  );

  /* ---------- saving ---------- */
  type Part = 'home' | 'app';

  /**
   * Saves the changed documents. Each carries the version it was loaded at; a 409 means another admin
   * saved meanwhile, and the admin chooses to load their version or save over it (`force`).
   */
  async function save(force: Part[] = []) {
    if (saving) return;
    const parts: Part[] = force.length > 0 ? force : [...(homeDirty ? (['home'] as const) : []), ...(appDirty ? (['app'] as const) : [])];
    if (parts.length === 0) {
      Toast.show({ type: 'info', text1: 'No changes to save' });
      return;
    }
    setSaving(true);
    guard.current.saving = true;
    const conflicts: Part[] = [];
    let failed = false;
    try {
      const results = await Promise.allSettled(
        parts.map((part) =>
          part === 'home'
            ? api
                .patch<{ promo: HomePromo; homeConfig: HomeConfig; updatedAt?: string }>(
                  '/content/admin/home',
                  { ...promo, homeConfig, ...(force.includes('home') ? {} : { updatedAt: homeVersion }) },
                  { skipErrorToast: true },
                )
                .then((res) => applyHome(res.data))
            : api
                .patch<{ app: AppConfig; updatedAt?: string }>(
                  '/content/admin/app',
                  { ...appConfig, ...(force.includes('app') ? {} : { updatedAt: appVersion }) },
                  { skipErrorToast: true },
                )
                .then((res) => applyApp(res.data)),
        ),
      );
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') return;
        if (axios.isAxiosError(r.reason) && r.reason.response?.status === 409) {
          conflicts.push(parts[i]);
        } else {
          failed = true;
          Toast.show({ type: 'error', text1: 'Could not save', text2: getApiErrorMessage(r.reason, 'Please try again') });
        }
      });
      if (results.some((r) => r.status === 'fulfilled')) await refreshAppContent();
      if (conflicts.length === 0 && !failed) {
        haptic('success');
        Toast.show({ type: 'success', text1: 'Content saved' });
      } else if (failed) {
        haptic('error');
      }
    } finally {
      setSaving(false);
      guard.current.saving = false;
    }
    if (conflicts.length > 0) await resolveConflict(conflicts);
  }

  async function resolveConflict(parts: Part[]) {
    haptic('warning');
    const what =
      parts.length === 2 ? 'the home screen and app content' : parts[0] === 'home' ? 'the home screen content' : 'the app content';
    const choice = await chooseAsync({
      title: 'Someone else saved meanwhile',
      message: `Another admin saved ${what} after you opened this screen. Load their version (your unsaved edits there are lost), or save yours over theirs.`,
      options: [
        { label: 'Load their version', value: 'reload' },
        { label: 'Save mine anyway', value: 'overwrite', destructive: true },
      ],
      cancelLabel: 'Keep editing',
    });
    if (choice === 'reload') {
      try {
        await Promise.all(
          parts.map((part) =>
            part === 'home'
              ? api
                  .get<{ promo: HomePromo; homeConfig: HomeConfig; updatedAt?: string }>('/content/admin/home', screenLoadConfig)
                  .then((res) => applyHome(res.data))
              : api
                  .get<{ app: AppConfig; updatedAt?: string }>('/content/admin/app', screenLoadConfig)
                  .then((res) => applyApp(res.data)),
          ),
        );
        Toast.show({ type: 'info', text1: 'Loaded the latest version' });
      } catch (err) {
        Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not load the latest content') });
      }
    } else if (choice === 'overwrite') {
      await save(parts);
    }
  }

  function patchHome(partial: Partial<HomeConfig>) {
    setHomeConfig((c) => ({ ...c, ...partial }));
  }

  function patchBookingField(key: BookingCopyFieldKey, value: string) {
    setAppConfig((a) => ({
      ...a,
      booking: { ...(a.booking ?? DEFAULT_BOOKING_COPY), [key]: value } as BookingCopyConfig,
    }));
  }

  function patchCustomerUiField(key: CustomerUiFieldKey, value: string) {
    setAppConfig((a) => ({
      ...a,
      customerUi: { ...(a.customerUi ?? DEFAULT_CUSTOMER_UI_COPY), [key]: value } as CustomerUiCopy,
    }));
  }

  function renderBookingFields(
    groupKey: keyof typeof BOOKING_COPY_ADMIN_GROUPS,
    title: string,
    fields: ReadonlyArray<readonly [BookingCopyFieldKey, string]>,
  ) {
    const meta = BOOKING_GROUP_META[groupKey];
    return (
      <AdminCollapsibleCard title={title} subtitle={meta.subtitle} defaultOpen={meta.defaultOpen}>
        {fields.map(([key, label]) => (
          <IconInput
            key={key}
            label={label}
            multiline={
              key.includes('Subtitle') ||
              key.includes('Hint') ||
              key.includes('Note') ||
              key.includes('Message') ||
              key.includes('Guidance') ||
              key.includes('Toast')
            }
            value={appConfig.booking?.[key] ?? DEFAULT_BOOKING_COPY[key]}
            onChangeText={(value) => patchBookingField(key, value)}
          />
        ))}
      </AdminCollapsibleCard>
    );
  }

  function renderCustomerUiField(key: CustomerUiFieldKey, label: string) {
    return (
      <IconInput
        key={key}
        label={label}
        multiline={
          key.includes('Subtitle') ||
          key.includes('Message') ||
          key.includes('Hint') ||
          key.includes('Sub') ||
          key.includes('Body') ||
          key.includes('Line') ||
          key.includes('Text') ||
          key.includes('Intro') ||
          key.includes('Description') ||
          key.endsWith('List') ||
          key.endsWith('Points')
        }
        value={appConfig.customerUi?.[key] ?? DEFAULT_CUSTOMER_UI_COPY[key]}
        onChangeText={(value) => patchCustomerUiField(key, value)}
      />
    );
  }

  function renderCopyGroups(sections: { groups: CopyGroups; meta: Record<string, CopyGroupMeta> }) {
    return Object.keys(sections.meta).map((groupKey) => {
      const meta = sections.meta[groupKey];
      return (
        <AdminCollapsibleCard key={groupKey} title={meta.title} subtitle={meta.subtitle} defaultOpen={meta.defaultOpen}>
          {sections.groups[groupKey].map(([key, label]) => renderCustomerUiField(key, label))}
        </AdminCollapsibleCard>
      );
    });
  }

  /** Every field whose label, current text or default text contains the query, grouped by screen. */
  function renderCopySearchResults(query: string, sections: { groups: CopyGroups; meta: Record<string, CopyGroupMeta> }) {
    const q = query.trim().toLowerCase();
    const groups = Object.keys(sections.meta).map((g) => ({
      g,
      fields: sections.groups[g].filter(([key, label]) =>
        [label, appConfig.customerUi?.[key] ?? '', DEFAULT_CUSTOMER_UI_COPY[key]].some((s) => s.toLowerCase().includes(q)),
      ),
    })).filter((x) => x.fields.length > 0);
    if (groups.length === 0) {
      return <Text style={styles.searchEmpty}>No field matches “{query.trim()}”.</Text>;
    }
    return groups.map(({ g, fields }) => (
      <AdminFormCard key={g}>
        <Text style={styles.searchGroup}>{sections.meta[g].title}</Text>
        {fields.map(([key, label]) => renderCustomerUiField(key, label))}
      </AdminFormCard>
    ));
  }

  function setChip(index: number, partial: { label?: string; category?: string }) {
    const chips = [...homeConfig.categoryChips];
    chips[index] = { ...chips[index], ...partial };
    patchHome({ categoryChips: chips });
  }
  function addChip() {
    patchHome({ categoryChips: [...homeConfig.categoryChips, { label: 'New', category: '' }] });
  }
  function removeChip(index: number) {
    patchHome({ categoryChips: homeConfig.categoryChips.filter((_, i) => i !== index) });
  }

  if (loading) return <Spinner fullScreen />;

  if (error) {
    return (
      <AdminListShell title="App content" subtitle="Error">
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell
      title="App content"
      subtitle={dirty ? 'Unsaved changes' : 'Manage every customer-facing string'}
      keyboardAvoid
      stickyFooter={
        <StickyActionBar>
          <Button
            title={dirty ? 'Save changes' : 'All changes saved'}
            variant="premium"
            onPress={() => void save()}
            loading={saving}
            disabled={!dirty || saving}
          />
        </StickyActionBar>
      }
    >
      <AdminSectionTabs tabs={CONTENT_TABS} active={activeTab} onChange={setActiveTab} />
      {CONTENT_TAB_HINTS[activeTab] ? (
        <AdminTabHint title={CONTENT_TAB_HINTS[activeTab].title} body={CONTENT_TAB_HINTS[activeTab].body} />
      ) : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'promo' ? (
          <>
            <AdminSectionTitle title="Promo banner" hint="Live preview below — save to publish" />
            <PromoPreview promo={promo} />
            <AdminFormCard>
              <View style={styles.toggleRow}>
                <View style={styles.flex}>
                  <Text style={styles.toggleLabel}>Show on home</Text>
                </View>
                <ToggleSwitch
                  value={promo.active}
                  onToggle={() => setPromo({ ...promo, active: !promo.active })}
                  accessibilityLabel="Home promo active"
                />
              </View>
              <IconInput label="Badge text" value={promo.badge} onChangeText={(badge) => setPromo({ ...promo, badge })} />
              <IconInput label="Headline" value={promo.title} onChangeText={(title) => setPromo({ ...promo, title })} />
              <IconInput
                label="Button label"
                value={promo.ctaLabel}
                onChangeText={(ctaLabel) => setPromo({ ...promo, ctaLabel })}
              />
              <Text style={styles.label}>Link to service</Text>
              <ServiceChips
                services={services}
                selectedId={promo.serviceId}
                onSelect={(serviceId) => setPromo({ ...promo, serviceId })}
              />
            </AdminFormCard>
          </>
        ) : null}

        {activeTab === 'home' ? (
          <>
            <AdminSectionTitle title="Hero & search" hint="Greeting area at the top of home" />
            <AdminFormCard>
              <IconInput
                label="Hero eyebrow"
                value={homeConfig.heroEyebrow ?? ''}
                onChangeText={(heroEyebrow) => patchHome({ heroEyebrow })}
                placeholder="Mr Antidot"
              />
              <IconInput
                label="Hero subtitle"
                value={homeConfig.heroSubtitle ?? ''}
                onChangeText={(heroSubtitle) => patchHome({ heroSubtitle })}
                placeholder="Eco-safe care for your space"
              />
              <IconInput
                label="Search placeholder"
                value={homeConfig.searchPlaceholder}
                onChangeText={(searchPlaceholder) => patchHome({ searchPlaceholder })}
              />
            </AdminFormCard>

            <AdminSectionTitle title="Promo carousel" hint="Book slide + offer code on home" />
            <AdminFormCard>
              <IconInput
                label="Book slide title"
                value={homeConfig.bookSlideTitle ?? ''}
                onChangeText={(bookSlideTitle) => patchHome({ bookSlideTitle })}
              />
              <IconInput
                label="Book slide CTA"
                value={homeConfig.bookSlideCta ?? ''}
                onChangeText={(bookSlideCta) => patchHome({ bookSlideCta })}
              />
              <IconInput
                label="Book slide subtitle fallback"
                value={homeConfig.bookSlideFallbackSub ?? ''}
                onChangeText={(bookSlideFallbackSub) => patchHome({ bookSlideFallbackSub })}
              />
              <IconInput
                label="Promo code hint"
                value={homeConfig.promoCodeHint ?? ''}
                onChangeText={(promoCodeHint) => patchHome({ promoCodeHint })}
                autoCapitalize="characters"
              />
            </AdminFormCard>

            <AdminSectionTitle title="Sections" hint="Titles shown above each home block" />
            <AdminFormCard>
              <IconInput
                label="Services title"
                value={homeConfig.sectionTitles.services}
                onChangeText={(services) =>
                  patchHome({ sectionTitles: { ...homeConfig.sectionTitles, services } })
                }
              />
              <IconInput
                label="Services subtitle"
                value={homeConfig.servicesSubtitle ?? ''}
                onChangeText={(servicesSubtitle) => patchHome({ servicesSubtitle })}
                placeholder="Trusted pest control & home services"
              />
              <IconInput
                label="Services action"
                value={homeConfig.servicesActionLabel}
                onChangeText={(servicesActionLabel) => patchHome({ servicesActionLabel })}
              />
              <IconInput
                label="Popular title"
                value={homeConfig.sectionTitles.popular}
                onChangeText={(popular) =>
                  patchHome({ sectionTitles: { ...homeConfig.sectionTitles, popular } })
                }
              />
              <IconInput
                label="Popular action"
                value={homeConfig.popularActionLabel}
                onChangeText={(popularActionLabel) => patchHome({ popularActionLabel })}
              />
              <IconInput
                label="Service types title"
                value={homeConfig.serviceTypesTitle ?? ''}
                onChangeText={(serviceTypesTitle) => patchHome({ serviceTypesTitle })}
              />
              <IconInput
                label="Service types action"
                value={homeConfig.serviceTypesAction ?? ''}
                onChangeText={(serviceTypesAction) => patchHome({ serviceTypesAction })}
              />
              <Text style={styles.label}>Featured “Popular” service</Text>
              <ServiceChips
                services={services}
                selectedId={homeConfig.featuredServiceId}
                onSelect={(featuredServiceId) => patchHome({ featuredServiceId })}
              />
            </AdminFormCard>

            <AdminFormCard>
              <Text style={styles.blockTitle}>Quick action labels</Text>
              <IconInput
                label="Book"
                value={homeConfig.quickLabels?.book ?? ''}
                onChangeText={(book) =>
                  patchHome({
                    quickLabels: {
                      book,
                      bookings: homeConfig.quickLabels?.bookings ?? 'Bookings',
                      offers: homeConfig.quickLabels?.offers ?? 'Offers',
                      help: homeConfig.quickLabels?.help ?? 'Help',
                    },
                  })
                }
              />
              <IconInput
                label="Bookings"
                value={homeConfig.quickLabels?.bookings ?? ''}
                onChangeText={(bookings) =>
                  patchHome({
                    quickLabels: {
                      book: homeConfig.quickLabels?.book ?? 'Book',
                      bookings,
                      offers: homeConfig.quickLabels?.offers ?? 'Offers',
                      help: homeConfig.quickLabels?.help ?? 'Help',
                    },
                  })
                }
              />
              <IconInput
                label="Offers"
                value={homeConfig.quickLabels?.offers ?? ''}
                onChangeText={(offers) =>
                  patchHome({
                    quickLabels: {
                      book: homeConfig.quickLabels?.book ?? 'Book',
                      bookings: homeConfig.quickLabels?.bookings ?? 'Bookings',
                      offers,
                      help: homeConfig.quickLabels?.help ?? 'Help',
                    },
                  })
                }
              />
              <IconInput
                label="Help"
                value={homeConfig.quickLabels?.help ?? ''}
                onChangeText={(help) =>
                  patchHome({
                    quickLabels: {
                      book: homeConfig.quickLabels?.book ?? 'Book',
                      bookings: homeConfig.quickLabels?.bookings ?? 'Bookings',
                      offers: homeConfig.quickLabels?.offers ?? 'Offers',
                      help,
                    },
                  })
                }
              />
            </AdminFormCard>

            <AdminFormCard>
              <View style={styles.blockHead}>
                <Text style={styles.blockTitle}>Category filters</Text>
                <Pressable style={styles.addPill} onPress={addChip}>
                  <PremiumIcon icon={AppIcons.ui.plus} variant="plain" size="xs" color={colors.green} />
                  <Text style={styles.addPillText}>Add</Text>
                </Pressable>
              </View>
              {homeConfig.categoryChips.map((chip, i) => (
                <View key={i} style={styles.chipRow}>
                  <View style={styles.flex}>
                    <IconInput label="Label" value={chip.label} onChangeText={(label) => setChip(i, { label })} />
                    <CategoryChipPicker value={chip.category} onChange={(category) => setChip(i, { category })} />
                  </View>
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() => removeChip(i)}
                    accessibilityRole="button"
                    accessibilityLabel="Remove category filter"
                  >
                    <PremiumIcon icon={AppIcons.ui.trash} variant="plain" size="sm" color={colors.error} />
                  </Pressable>
                </View>
              ))}
            </AdminFormCard>
          </>
        ) : null}

        {activeTab === 'screens' ? (
          <>
            <AdminSectionTitle
              title="Customer screens"
              hint="Words in {braces} are filled in by the app ({brand}, {price}, {count}…) — keep them · save to publish"
            />
            <View style={styles.searchWrap}>
              <AdminSearchField
                value={screenQuery}
                onChangeText={setScreenQuery}
                placeholder="Find a label, e.g. “Book now” or “cart”"
              />
            </View>
            {screenQuery.trim()
              ? renderCopySearchResults(screenQuery, APP_COPY_SECTIONS)
              : renderCopyGroups(APP_COPY_SECTIONS)}
          </>
        ) : null}

        {activeTab === 'website' ? (
          <>
            <AdminSectionTitle
              title="Website text"
              hint="Shown on the website within a minute of saving · {phone}, {year}, {code}, {amount} are filled in automatically"
            />
            <View style={styles.searchWrap}>
              <AdminSearchField
                value={webQuery}
                onChangeText={setWebQuery}
                placeholder="Find a label, e.g. “hero” or “footer”"
              />
            </View>
            {webQuery.trim()
              ? renderCopySearchResults(webQuery, WEBSITE_COPY_SECTIONS)
              : renderCopyGroups(WEBSITE_COPY_SECTIONS)}
          </>
        ) : null}

        {activeTab === 'brand' ? (
          <>
            <AdminSectionTitle title="Branding" hint="Name and tagline shown across the app" />
            <AdminFormCard>
              <IconInput
                label="App name"
                value={appConfig.branding.name}
                onChangeText={(name) => setAppConfig((a) => ({ ...a, branding: { ...a.branding, name } }))}
              />
              <IconInput
                label="Tagline"
                value={appConfig.branding.tagline}
                onChangeText={(tagline) => setAppConfig((a) => ({ ...a, branding: { ...a.branding, tagline } }))}
              />
            </AdminFormCard>

            <AdminSectionTitle title="Support contact" />
            <AdminFormCard>
              <IconInput
                label="Phone"
                keyboardType="phone-pad"
                value={appConfig.support.phone}
                onChangeText={(phone) => setAppConfig((a) => ({ ...a, support: { ...a.support, phone } }))}
              />
              <IconInput
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={appConfig.support.email}
                onChangeText={(email) => setAppConfig((a) => ({ ...a, support: { ...a.support, email } }))}
              />
              <IconInput
                label="WhatsApp (optional)"
                keyboardType="phone-pad"
                value={appConfig.support.whatsapp ?? ''}
                onChangeText={(whatsapp) => setAppConfig((a) => ({ ...a, support: { ...a.support, whatsapp } }))}
              />
              <IconInput
                label="Hours"
                value={appConfig.support.hours ?? ''}
                onChangeText={(hours) => setAppConfig((a) => ({ ...a, support: { ...a.support, hours } }))}
              />
            </AdminFormCard>

            <AdminSectionTitle title="Trust & guarantee" />
            <AdminFormCard>
              <IconInput
                label="Guarantee text"
                multiline
                value={appConfig.trust.guaranteeText}
                onChangeText={(guaranteeText) => setAppConfig((a) => ({ ...a, trust: { ...a.trust, guaranteeText } }))}
              />
              <StringListEditor
                title="Trust badges"
                items={appConfig.trust.badges}
                onChange={(badges) => setAppConfig((a) => ({ ...a, trust: { ...a.trust, badges } }))}
              />
            </AdminFormCard>
          </>
        ) : null}

        {activeTab === 'booking' ? (
          <>
            <AdminSectionTitle title="Booking & schedule" hint="Tap a section to expand and edit fields" />
            <AdminFormCard>
              <Text style={styles.previewLabel}>Customer preview</Text>
              <PendingScheduleCard
                variant="customer"
                title={appConfig.booking?.pendingCustomerTitle ?? DEFAULT_BOOKING_COPY.pendingCustomerTitle}
                scheduleLabel="Sat, 7 Jun · 10:00 AM – 12:00 PM"
                hint={appConfig.booking?.pendingCustomerHint ?? DEFAULT_BOOKING_COPY.pendingCustomerHint}
                modeLabel={appConfig.booking?.standardModeLabel ?? DEFAULT_BOOKING_COPY.standardModeLabel}
              />
            </AdminFormCard>

            {renderBookingFields('wizard', 'Book wizard', BOOKING_COPY_ADMIN_GROUPS.wizard)}
            {renderBookingFields('list', 'My bookings list', BOOKING_COPY_ADMIN_GROUPS.list)}
            {renderBookingFields('success', 'Booking success screen', BOOKING_COPY_ADMIN_GROUPS.success)}
            {renderBookingFields('pending', 'Customer pending booking', BOOKING_COPY_ADMIN_GROUPS.pending)}
            {renderBookingFields('detail', 'Booking detail screen', BOOKING_COPY_ADMIN_GROUPS.detail)}
            {renderBookingFields('trackingSteps', 'Tracking timeline steps', BOOKING_COPY_ADMIN_GROUPS.trackingSteps)}
            {renderBookingFields('statusGuidance', 'Status messages (customer)', BOOKING_COPY_ADMIN_GROUPS.statusGuidance)}
            {renderBookingFields('admin', 'Admin schedule actions', BOOKING_COPY_ADMIN_GROUPS.admin)}
            {renderBookingFields('tech', 'Technician app', BOOKING_COPY_ADMIN_GROUPS.tech)}
          </>
        ) : null}

        {activeTab === 'onboard' ? (
          <>
            <AdminSectionTitle title="Onboarding" />
            <AdminFormCard>
              <View style={styles.blockHead}>
                <Text style={styles.blockTitle}>Slides</Text>
                <Pressable
                  style={styles.addPill}
                  onPress={() =>
                    setAppConfig((a) => ({
                      ...a,
                      onboarding: {
                        ...a.onboarding,
                        slides: [...a.onboarding.slides, { title: 'New slide', subtitle: '' }],
                      },
                    }))
                  }
                >
                  <PremiumIcon icon={AppIcons.ui.plus} variant="plain" size="xs" color={colors.green} />
                  <Text style={styles.addPillText}>Add</Text>
                </Pressable>
              </View>
              {appConfig.onboarding.slides.map((slide, i) => (
                <View key={i} style={styles.chipRow}>
                  <View style={styles.flex}>
                    <IconInput
                      label={`Slide ${i + 1} title`}
                      value={slide.title}
                      onChangeText={(title) =>
                        setAppConfig((a) => {
                          const slides = [...a.onboarding.slides];
                          slides[i] = { ...slides[i], title };
                          return { ...a, onboarding: { ...a.onboarding, slides } };
                        })
                      }
                    />
                    <IconInput
                      label="Subtitle"
                      multiline
                      value={slide.subtitle}
                      onChangeText={(subtitle) =>
                        setAppConfig((a) => {
                          const slides = [...a.onboarding.slides];
                          slides[i] = { ...slides[i], subtitle };
                          return { ...a, onboarding: { ...a.onboarding, slides } };
                        })
                      }
                    />
                  </View>
                  <Pressable
                    style={styles.removeBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Remove onboarding slide"
                    onPress={() =>
                      setAppConfig((a) => ({
                        ...a,
                        onboarding: {
                          ...a.onboarding,
                          slides: a.onboarding.slides.filter((_, idx) => idx !== i),
                        },
                      }))
                    }
                  >
                    <PremiumIcon icon={AppIcons.ui.trash} variant="plain" size="sm" color={colors.error} />
                  </Pressable>
                </View>
              ))}
              <StringListEditor
                title="Trust chips"
                items={appConfig.onboarding.trustChips}
                onChange={(trustChips) =>
                  setAppConfig((a) => ({ ...a, onboarding: { ...a.onboarding, trustChips } }))
                }
              />
            </AdminFormCard>
          </>
        ) : null}

        {activeTab === 'legal' ? (
          <>
            <AdminSectionTitle title="Legal & help" />
            <AdminFormCard>
              <MarkdownEditor
                label="About"
                value={appConfig.aboutMarkdown}
                onChangeText={onAbout}
                placeholder="Who you are and what you do…"
                minHeight={160}
              />
              <MarkdownEditor
                label="Terms of Service"
                value={appConfig.legal.termsMarkdown}
                onChangeText={onTerms}
                placeholder="Write your terms — use ## for headings"
                minHeight={220}
              />
              <MarkdownEditor
                label="Privacy Policy"
                value={appConfig.legal.privacyMarkdown}
                onChangeText={onPrivacy}
                placeholder="Write your privacy policy — use ## for headings"
                minHeight={220}
              />
              <View style={styles.blockHead}>
                <Text style={styles.blockTitle}>FAQ</Text>
                <Pressable
                  style={styles.addPill}
                  onPress={() => setAppConfig((a) => ({ ...a, faq: [...a.faq, { q: '', a: '' }] }))}
                >
                  <PremiumIcon icon={AppIcons.ui.plus} variant="plain" size="xs" color={colors.green} />
                  <Text style={styles.addPillText}>Add</Text>
                </Pressable>
              </View>
              {appConfig.faq.map((item, i) => (
                <View key={i} style={styles.chipRow}>
                  <View style={styles.flex}>
                    <IconInput
                      label={`Question ${i + 1}`}
                      value={item.q}
                      onChangeText={(q) =>
                        setAppConfig((a) => {
                          const faq = [...a.faq];
                          faq[i] = { ...faq[i], q };
                          return { ...a, faq };
                        })
                      }
                    />
                    <IconInput
                      label="Answer"
                      multiline
                      value={item.a}
                      onChangeText={(ans) =>
                        setAppConfig((a) => {
                          const faq = [...a.faq];
                          faq[i] = { ...faq[i], a: ans };
                          return { ...a, faq };
                        })
                      }
                    />
                  </View>
                  <Pressable
                    style={styles.removeBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Remove FAQ item"
                    onPress={() => setAppConfig((a) => ({ ...a, faq: a.faq.filter((_, idx) => idx !== i) }))}
                  >
                    <PremiumIcon icon={AppIcons.ui.trash} variant="plain" size="sm" color={colors.error} />
                  </Pressable>
                </View>
              ))}
            </AdminFormCard>
          </>
        ) : null}
      </ScrollView>
    </AdminListShell>
  );
}

function ServiceChips({
  services,
  selectedId,
  onSelect,
}: {
  services: Service[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
      <Pressable style={[styles.chip, !selectedId && styles.chipOn]} onPress={() => onSelect(undefined)}>
        <Text style={[styles.chipText, !selectedId && styles.chipTextOn]}>None</Text>
      </Pressable>
      {services.map((s) => (
        <Pressable
          key={s.id}
          style={[styles.chip, selectedId === s.id && styles.chipOn]}
          onPress={() => onSelect(s.id)}
        >
          <Text style={[styles.chipText, selectedId === s.id && styles.chipTextOn]}>{s.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/** Category a home filter chip shows — Business settings → Lists → Categories; "All services" = no filter. */
function CategoryChipPicker({ value, onChange }: { value?: string; onChange: (category: string) => void }) {
  const settings = useBusinessSettings();
  const current = value?.trim() ?? '';
  const active = settings.lists.categories.filter((c) => c.active);
  const options = [
    { key: '', label: 'All services' },
    ...active.map((c) => ({ key: c.key, label: c.label })),
    ...(current && !active.some((c) => c.key === current) ? [{ key: current, label: `${categoryLabel(current, settings)} (off)` }] : []),
  ];
  return (
    <View style={styles.catPick}>
      <Text style={styles.catPickLabel}>Shows</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} keyboardShouldPersistTaps="handled">
        {options.map((o) => {
          const on = o.key === current;
          return (
            <Pressable
              key={o.key || 'all'}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => onChange(o.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** What shoppers get: the promo as a slide of the green home header. Drawn even while switched off, with a note. */
function PromoPreview({ promo }: { promo: HomePromo }) {
  const copy = useCustomerUiCopy();
  const width = adminContentWidth(useWindowDimensions().width);
  const slide = promoHeroSlide({ ...promo, active: true }, copy, () => {});
  // previewShell sits in a 16pt gutter and has a 1pt border on each side.
  const innerWidth = width - spacing.md * 2 - 2;

  return (
    <View>
      <View style={styles.previewShell}>
        <PremiumAurora tone="brand" />
        {slide ? (
          <HomeHeroCarousel slides={[slide]} width={innerWidth} />
        ) : (
          <View style={styles.previewEmpty}>
            <Text style={styles.previewEmptyText}>Add a headline to see the preview</Text>
          </View>
        )}
      </View>
      <Text style={styles.previewNote}>
        {promo.active ? 'Shown as a slide in the green home header.' : 'Switched off — shoppers will not see this.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  /** Cards and section titles carry their own 16pt gutter — no extra container padding. */
  scrollContent: { paddingTop: spacing.xs, paddingBottom: ADMIN_STICKY_FOOTER_PAD },
  searchWrap: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  searchGroup: {
    marginBottom: 6,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: ui.textTertiary,
  },
  searchEmpty: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 14,
    color: ui.textSecondary,
  },
  previewShell: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ui.hairline,
    backgroundColor: colors.white,
    ...ui.shadow,
  },
  previewEmpty: { height: HERO_SLIDE_H, alignItems: 'center', justifyContent: 'center' },
  previewEmptyText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  previewNote: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.muted,
  },
  previewLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  blockHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  adminBlockHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  blockTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: 12 },
  flex: { flex: 1 },
  toggleLabel: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: colors.ink },
  label: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.muted, marginTop: spacing.sm, marginBottom: 8 },
  chips: { flexDirection: 'row', marginBottom: spacing.sm },
  chip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  chipOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.ink },
  chipTextOn: { color: colors.white },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  addPillText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  catPick: { marginBottom: spacing.sm },
  catPickLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text, marginBottom: 8 },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  removeBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
  },
});


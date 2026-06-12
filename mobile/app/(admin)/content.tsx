import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  Plus,
  Trash2,
  X,
} from 'lucide-react-native';
import { AppIcons } from '@/constants/appIcons';
import Toast from 'react-native-toast-message';
import { AdminCollapsibleCard, AdminFormCard, AdminTabHint } from '@/components/kit/AdminPageKit';
import { AdminListShell, AdminSectionTitle, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminSectionTabs, type AdminSectionTab } from '@/components/kit/AdminSectionTabs';
import { PendingScheduleCard } from '@/components/kit/PendingScheduleCard';
import { IconInput } from '@/components/kit/IconInput';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { Button } from '@/components/ui/Button';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { PromoBanner } from '@/components/ui/PromoBanner';
import { api, screenLoadConfig } from '@/lib/api';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { AppConfig, BookingCopyConfig, HomeConfig, HomePromo, Service } from '@/types/api';
import { DEFAULT_BOOKING_COPY, BOOKING_COPY_ADMIN_GROUPS, getBookingCopy, type BookingCopyFieldKey } from '@/constants/bookingCopy';
import { colors, fonts, spacing } from '@/constants/theme';

const CONTENT_TABS: AdminSectionTab[] = [
  { key: 'promo', label: 'Promo', icon: AppIcons.contentTab.promo },
  { key: 'home', label: 'Home', icon: AppIcons.contentTab.home },
  { key: 'brand', label: 'Brand', icon: AppIcons.contentTab.brand },
  { key: 'booking', label: 'Booking', icon: AppIcons.contentTab.booking },
  { key: 'onboard', label: 'Onboard', icon: AppIcons.contentTab.onboard },
  { key: 'legal', label: 'Legal', icon: AppIcons.contentTab.legal },
];

const CONTENT_TAB_HINTS: Record<string, { title: string; body: string }> = {
  promo: {
    title: 'Home promo banner',
    body: 'Toggle visibility, headline, CTA label, and which service the banner links to.',
  },
  home: {
    title: 'Home screen copy',
    body: 'Search placeholder, section titles, featured service, and category filter chips.',
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

const DEFAULT_CONFIG: HomeConfig = {
  sectionTitles: { services: 'Our Services', popular: 'Popular Now' },
  searchPlaceholder: 'Search services…',
  servicesSubtitle: 'Trusted pest control & home services',
  servicesActionLabel: 'View all',
  popularActionLabel: 'See more',
  categoryChips: [
    { label: 'All' },
    { label: 'Residential', category: 'residential' },
    { label: 'Commercial', category: 'commercial' },
    { label: 'Cleaning', category: 'cleaning' },
  ],
};

const DEFAULT_APP: AppConfig = {
  support: { phone: '', email: '', whatsapp: '', hours: '' },
  branding: { name: 'Mr Antidot', tagline: '' },
  trust: { guaranteeText: '', badges: [] },
  onboarding: { slides: [], trustChips: [] },
  legal: { termsMarkdown: '', privacyMarkdown: '' },
  aboutMarkdown: '',
  faq: [],
  booking: DEFAULT_BOOKING_COPY,
};

export default function AdminContentScreen() {
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const { loading, error, runLoad, reload } = useScreenLoad();
  const [promo, setPromo] = useState<HomePromo | null>(null);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(DEFAULT_CONFIG);
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_APP);
  const [services, setServices] = useState<Service[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(CONTENT_TABS[0].key);

  const load = useCallback(async () => {
    const [homeRes, appRes, svcRes] = await Promise.all([
      api.get<{ promo: HomePromo; homeConfig: HomeConfig }>('/content/admin/home', screenLoadConfig),
      api.get<{ app: AppConfig }>('/content/admin/app', screenLoadConfig),
      api.get<{ services: Service[] }>('/services', {
        ...screenLoadConfig,
        params: { includeInactive: '1' },
      }),
    ]);
    setPromo(homeRes.data.promo);
    setHomeConfig(homeRes.data.homeConfig ?? DEFAULT_CONFIG);
    setAppConfig({
      ...(appRes.data.app ?? DEFAULT_APP),
      booking: getBookingCopy(appRes.data.app?.booking),
    });
    setServices(svcRes.data.services);
  }, []);

  useEffect(() => {
    void runLoad(load, 'Could not load content');
  }, [load, runLoad]);

  useEffect(() => {
    if (tabParam && CONTENT_TABS.some((t) => t.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  async function save() {
    if (!promo) return;
    setSaving(true);
    try {
      const [homeRes, appRes] = await Promise.all([
        api.patch<{ promo: HomePromo; homeConfig: HomeConfig }>('/content/admin/home', {
          ...promo,
          homeConfig,
        }),
        api.patch<{ app: AppConfig }>('/content/admin/app', appConfig),
      ]);
      setPromo(homeRes.data.promo);
      setHomeConfig(homeRes.data.homeConfig);
      setAppConfig({
        ...appRes.data.app,
        booking: getBookingCopy(appRes.data.app?.booking),
      });
      Toast.show({ type: 'success', text1: 'Content saved' });
    } catch {
      // interceptor handles toast
    } finally {
      setSaving(false);
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

  if (loading && !promo) return <Spinner fullScreen />;

  if (error || !promo) {
    return (
      <AdminListShell title="App content" subtitle="Error">
        <ListEmptyRetry message={error ?? 'Could not load'} onRetry={() => void reload(load, error ?? undefined)} />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell
      title="App content"
      subtitle="Home, booking, legal & more"
      keyboardAvoid
      stickyFooter={
        <StickyActionBar>
          <Button title="Save" variant="premium" onPress={save} loading={saving} />
        </StickyActionBar>
      }
    >
      <AdminSectionTabs tabs={CONTENT_TABS} active={activeTab} onChange={setActiveTab} />
      {CONTENT_TAB_HINTS[activeTab] ? (
        <AdminTabHint title={CONTENT_TAB_HINTS[activeTab].title} body={CONTENT_TAB_HINTS[activeTab].body} />
      ) : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={adminListShellStyles.scrollWithFooter}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'promo' ? (
          <>
            <AdminSectionTitle title="Promo banner" hint="Live preview below — save to publish" />
        <PromoBanner promo={promo} />
            <AdminFormCard>
              <View style={styles.toggleRow}>
                <View style={styles.flex}>
                  <Text style={styles.toggleLabel}>Show on home</Text>
                </View>
                <ToggleSwitch value={promo.active} onToggle={() => setPromo({ ...promo, active: !promo.active })} />
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
            <AdminSectionTitle title="Home screen" hint="Titles, search & category filters" />
            <AdminFormCard>
              <IconInput
                label="Search placeholder"
                value={homeConfig.searchPlaceholder}
                onChangeText={(searchPlaceholder) => patchHome({ searchPlaceholder })}
              />
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
              <Text style={styles.label}>Featured “Popular” service</Text>
              <ServiceChips
                services={services}
                selectedId={homeConfig.featuredServiceId}
                onSelect={(featuredServiceId) => patchHome({ featuredServiceId })}
              />
            </AdminFormCard>

            <AdminFormCard>
              <View style={styles.blockHead}>
                <Text style={styles.blockTitle}>Category filters</Text>
                <Pressable style={styles.addPill} onPress={addChip}>
                  <Plus size={14} color={colors.green} />
                  <Text style={styles.addPillText}>Add</Text>
                </Pressable>
              </View>
              {homeConfig.categoryChips.map((chip, i) => (
                <View key={i} style={styles.chipRow}>
                  <View style={styles.flex}>
                    <IconInput label="Label" value={chip.label} onChangeText={(label) => setChip(i, { label })} />
                    <IconInput
                      label="Category slug"
                      value={chip.category ?? ''}
                      autoCapitalize="none"
                      onChangeText={(category) => setChip(i, { category })}
                    />
                  </View>
                  <Pressable style={styles.removeBtn} onPress={() => removeChip(i)}>
                    <Trash2 size={16} color={colors.error} />
                  </Pressable>
                </View>
              ))}
            </AdminFormCard>
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
                  <Plus size={14} color={colors.green} />
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
                    <Trash2 size={16} color={colors.error} />
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
              <IconInput
                label="About (markdown)"
                multiline
                value={appConfig.aboutMarkdown}
                onChangeText={(aboutMarkdown) => setAppConfig((a) => ({ ...a, aboutMarkdown }))}
              />
              <IconInput
                label="Terms of Service (markdown)"
                multiline
                value={appConfig.legal.termsMarkdown}
                onChangeText={(termsMarkdown) => setAppConfig((a) => ({ ...a, legal: { ...a.legal, termsMarkdown } }))}
              />
              <IconInput
                label="Privacy Policy (markdown)"
                multiline
                value={appConfig.legal.privacyMarkdown}
                onChangeText={(privacyMarkdown) =>
                  setAppConfig((a) => ({ ...a, legal: { ...a.legal, privacyMarkdown } }))
                }
              />
              <View style={styles.blockHead}>
                <Text style={styles.blockTitle}>FAQ</Text>
                <Pressable
                  style={styles.addPill}
                  onPress={() => setAppConfig((a) => ({ ...a, faq: [...a.faq, { q: '', a: '' }] }))}
                >
                  <Plus size={14} color={colors.green} />
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
                    onPress={() => setAppConfig((a) => ({ ...a, faq: a.faq.filter((_, idx) => idx !== i) }))}
                  >
                    <Trash2 size={16} color={colors.error} />
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

function StringListEditor({
  title,
  items,
  onChange,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <View style={styles.listEditor}>
      <View style={styles.blockHead}>
        <Text style={styles.label}>{title}</Text>
        <Pressable style={styles.addPill} onPress={() => onChange([...items, ''])}>
          <Plus size={14} color={colors.green} />
          <Text style={styles.addPillText}>Add</Text>
        </Pressable>
      </View>
      {items.map((item, i) => (
        <View key={i} style={styles.tagRow}>
          <IconInput
            label={`Item ${i + 1}`}
            value={item}
            onChangeText={(v) => {
              const next = [...items];
              next[i] = v;
              onChange(next);
            }}
          />
          <Pressable style={styles.tagRemove} onPress={() => onChange(items.filter((_, idx) => idx !== i))}>
            <X size={15} color={colors.muted} />
          </Pressable>
        </View>
      ))}
    </View>
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
        <Text style={styles.chipText}>None</Text>
      </Pressable>
      {services.map((s) => (
        <Pressable
          key={s.id}
          style={[styles.chip, selectedId === s.id && styles.chipOn]}
          onPress={() => onSelect(s.id)}
        >
          <Text style={styles.chipText}>{s.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  scroll: { flex: 1 },
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
  toggleLabel: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, marginTop: spacing.sm, marginBottom: 8 },
  chips: { flexDirection: 'row', marginBottom: spacing.sm },
  chip: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  chipOn: { backgroundColor: colors.soft },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.soft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  addPillText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.green },
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
  listEditor: { marginTop: spacing.sm },
  tagRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tagRemove: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
  },
});


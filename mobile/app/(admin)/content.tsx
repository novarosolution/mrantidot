import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Plus, Trash2, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { AdminListShell } from '@/components/kit/AdminListShell';
import { IconInput } from '@/components/kit/IconInput';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { PromoBanner } from '@/components/ui/PromoBanner';
import { api, screenLoadConfig } from '@/lib/api';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { AppConfig, BookingCopyConfig, HomeConfig, HomePromo, Service } from '@/types/api';
import { DEFAULT_BOOKING_COPY } from '@/lib/schedule-copy';
import { colors, design, fonts, spacing } from '@/constants/theme';

const DEFAULT_CONFIG: HomeConfig = {
  sectionTitles: { services: 'Our Services', popular: 'Popular Now' },
  searchPlaceholder: 'Search services…',
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
  const { loading, error, runLoad, reload } = useScreenLoad();
  const [promo, setPromo] = useState<HomePromo | null>(null);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(DEFAULT_CONFIG);
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_APP);
  const [services, setServices] = useState<Service[]>([]);
  const [saving, setSaving] = useState(false);

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
    setAppConfig(appRes.data.app ?? DEFAULT_APP);
    setServices(svcRes.data.services);
  }, []);

  useEffect(() => {
    void runLoad(load, 'Could not load content');
  }, [load, runLoad]);

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
      setAppConfig(appRes.data.app);
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
    <AdminListShell title="App content" subtitle="Manage everything customers see">
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Promo banner */}
        <Text style={styles.section}>Promo banner</Text>
        <PromoBanner
          promo={promo}
          onPress={() => {
            if (promo.serviceId) router.push(`/service/${promo.serviceId}`);
          }}
        />
        <Card variant="premium" style={styles.form}>
          <View style={styles.toggleRow}>
            <View style={styles.flex}>
              <Text style={styles.toggleLabel}>Show on customer home</Text>
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
          <Text style={styles.label}>Banner links to service</Text>
          <ServiceChips
            services={services}
            selectedId={promo.serviceId}
            onSelect={(serviceId) => setPromo({ ...promo, serviceId })}
          />
        </Card>

        {/* Home sections */}
        <Text style={styles.section}>Home screen</Text>
        <Card variant="premium" style={styles.form}>
          <IconInput
            label="Search placeholder"
            value={homeConfig.searchPlaceholder}
            onChangeText={(searchPlaceholder) => patchHome({ searchPlaceholder })}
          />
          <IconInput
            label="Services section title"
            value={homeConfig.sectionTitles.services}
            onChangeText={(services) =>
              patchHome({ sectionTitles: { ...homeConfig.sectionTitles, services } })
            }
          />
          <IconInput
            label="Services action label"
            value={homeConfig.servicesActionLabel}
            onChangeText={(servicesActionLabel) => patchHome({ servicesActionLabel })}
          />
          <IconInput
            label="Popular section title"
            value={homeConfig.sectionTitles.popular}
            onChangeText={(popular) =>
              patchHome({ sectionTitles: { ...homeConfig.sectionTitles, popular } })
            }
          />
          <IconInput
            label="Popular action label"
            value={homeConfig.popularActionLabel}
            onChangeText={(popularActionLabel) => patchHome({ popularActionLabel })}
          />
          <Text style={styles.label}>Featured “Popular” service</Text>
          <ServiceChips
            services={services}
            selectedId={homeConfig.featuredServiceId}
            onSelect={(featuredServiceId) => patchHome({ featuredServiceId })}
          />
        </Card>

        {/* Category chips */}
        <Card variant="premium" style={styles.form}>
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
                  label="Category slug (blank = All)"
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
        </Card>

        {/* Branding */}
        <Text style={styles.section}>Branding</Text>
        <Card variant="premium" style={styles.form}>
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
        </Card>

        {/* Support */}
        <Text style={styles.section}>Support contact</Text>
        <Card variant="premium" style={styles.form}>
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
        </Card>

        {/* Trust */}
        <Text style={styles.section}>Trust & guarantee</Text>
        <Card variant="premium" style={styles.form}>
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
        </Card>

        {/* Booking schedule copy */}
        <Text style={styles.section}>Booking & schedule</Text>
        <Card variant="premium" style={styles.form}>
          <Text style={styles.blockHint}>
            Customer and admin messages for schedule requests, pending bookings, and confirmation.
          </Text>
          {(
            [
              ['scheduleStepTitle', 'Book wizard — step title'],
              ['scheduleStepSubtitle', 'Book wizard — step subtitle'],
              ['standardModeLabel', 'Standard mode label'],
              ['customModeLabel', 'Custom mode label'],
              ['customNotesPlaceholder', 'Custom notes placeholder'],
              ['pendingCustomerTitle', 'Customer pending card title'],
              ['pendingCustomerHint', 'Customer pending card hint'],
              ['pendingFactsSubtitle', 'Booking facts pending subtitle'],
              ['pendingReviewNote', 'Review step pending note'],
              ['requestSubmittedToast', 'Success toast after submit'],
              ['adminRequestTitle', 'Admin request card title'],
              ['adminConfirmTitle', 'Admin confirm modal title'],
              ['adminConfirmHint', 'Admin confirm modal hint'],
              ['adminConfirmButton', 'Admin confirm button label'],
            ] as const
          ).map(([key, label]) => (
            <IconInput
              key={key}
              label={label}
              multiline={key.includes('Hint') || key.includes('Note') || key.includes('Subtitle')}
              value={appConfig.booking?.[key] ?? DEFAULT_BOOKING_COPY[key]}
              onChangeText={(value) =>
                setAppConfig((a) => ({
                  ...a,
                  booking: {
                    ...(a.booking ?? DEFAULT_BOOKING_COPY),
                    [key]: value,
                  } as BookingCopyConfig,
                }))
              }
            />
          ))}
        </Card>

        {/* Onboarding */}
        <Text style={styles.section}>Onboarding</Text>
        <Card variant="premium" style={styles.form}>
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
        </Card>

        {/* Legal & Help */}
        <Text style={styles.section}>Legal & help</Text>
        <Card variant="premium" style={styles.form}>
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
        </Card>
      </ScrollView>

      <StickyActionBar>
        <Button title="Save all content" variant="premium" onPress={save} loading={saving} />
      </StickyActionBar>
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
  scroll: { padding: spacing.md, paddingBottom: 120 },
  section: { ...design.sectionTitle, marginTop: spacing.md, marginBottom: spacing.sm },
  form: { padding: spacing.md, marginTop: spacing.sm },
  blockHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  blockTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  blockHint: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, lineHeight: 18, marginBottom: spacing.sm },
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

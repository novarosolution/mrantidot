import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminFilterChips, AdminFormCard, AdminTabHint } from '@/components/kit/AdminPageKit';
import { AdminFormSkeleton } from '@/components/kit/AdminSkeletons';
import { IconInput } from '@/components/kit/IconInput';
import { ImageField, useBusyCounter } from '@/components/kit/ImageField';
import { ListEditor, type ListSetter } from '@/components/kit/ListEditor';
import { animateNextLayout, moveItem, ReorderButtons } from '@/components/kit/ReorderButtons';
import { StringListEditor } from '@/components/kit/StringListEditor';
import { WebsiteIconPicker } from '@/components/kit/WebsiteIconPicker';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { websiteIcon } from '@/constants/websiteAdmin';
import { api, screenLoadConfig } from '@/lib/api';
import { haptic, stagger } from '@/lib/motion';
import { adminRoutes } from '@/lib/routes';
import { useWebsiteConfig } from '@/lib/useWebsiteConfig';
import type {
  Service,
  WebsiteClient,
  WebsiteIconCard,
  WebsiteLists,
  WebsiteScienceStep,
  WebsiteSector,
  WebsiteStat,
} from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

type ListKey = keyof WebsiteLists;

const TABS: { key: ListKey; label: string; hint: string; title: string; body: string }[] = [
  { key: 'stats', label: 'Numbers', title: 'Numbers', hint: 'Home stats strip and About page', body: 'Big numbers like "8+ years" — value on top, label below. Up to 8.' },
  { key: 'why', label: 'Why us', title: 'Why choose us', hint: 'Reasons with an icon', body: 'Short reasons people trust you. Each has a title, a sentence and an icon. Up to 8.' },
  { key: 'steps', label: 'Steps', title: 'How it works', hint: 'Your process, in order', body: 'The steps of a visit from first call to follow-up. Up to 8.' },
  { key: 'sectors', label: 'Sectors', title: 'Sectors we serve', hint: 'Industries with an icon', body: 'Places you work in — hospitals, hotels, offices… Up to 16.' },
  { key: 'science', label: 'Method', title: 'Our method', hint: 'About page science steps', body: 'How a treatment is planned, step by step. Up to 8.' },
  { key: 'aboutPoints', label: 'Highlights', title: 'About highlights', hint: 'Ticked points on About', body: 'Short ticked points beside the about intro. Up to 12.' },
  { key: 'heroChips', label: 'Hero services', title: 'Hero quick picks', hint: 'Service chips under the headline', body: 'Pick up to 8 live services to show as quick buttons in the hero. Leave empty to use the most popular ones.' },
  { key: 'clients', label: 'Clients', title: 'Trusted by', hint: 'Client logos on the home page', body: 'Logos of businesses you work for, shown as a moving strip on the home page. Square or wide PNG logos work best. Up to 24.' },
];

/* ---------- row fields (module-level so rows stay memoised) ---------- */

function statFields(item: WebsiteStat, update: (p: Partial<WebsiteStat>) => void) {
  return (
    <>
      <IconInput label="Value" value={item.value} maxLength={20} placeholder="e.g. 8+" onChangeText={(value) => update({ value })} />
      <IconInput label="Label" value={item.label} maxLength={80} placeholder="e.g. Years of experience" onChangeText={(label) => update({ label })} />
    </>
  );
}

function iconCardFields(item: WebsiteIconCard, update: (p: Partial<WebsiteIconCard>) => void) {
  return (
    <>
      <IconInput label="Title" value={item.title} maxLength={80} onChangeText={(title) => update({ title })} />
      <IconInput label="Text" value={item.text} maxLength={300} multiline onChangeText={(text) => update({ text })} />
      <WebsiteIconPicker value={item.icon} onChange={(icon) => update({ icon })} />
    </>
  );
}

function sectorFields(item: WebsiteSector, update: (p: Partial<WebsiteSector>) => void) {
  return (
    <>
      <IconInput label="Name" value={item.name} maxLength={80} placeholder="e.g. Hotels & hospitality" onChangeText={(name) => update({ name })} />
      <WebsiteIconPicker value={item.icon} onChange={(icon) => update({ icon })} />
    </>
  );
}

function scienceFields(item: WebsiteScienceStep, update: (p: Partial<WebsiteScienceStep>) => void) {
  return (
    <>
      <IconInput label="Title" value={item.title} maxLength={80} onChangeText={(title) => update({ title })} />
      <IconInput label="Text" value={item.text} maxLength={300} multiline onChangeText={(text) => update({ text })} />
    </>
  );
}

const clientTitle = (c: WebsiteClient, i: number) => c.name.trim() || `Client ${i + 1}`;
const clientSub = (c: WebsiteClient) => (c.logo ? undefined : 'No logo yet — open to add one');

const statTitle = (s: WebsiteStat, i: number) => [s.value, s.label].filter(Boolean).join(' · ') || `Number ${i + 1}`;
const cardTitle = (c: { title: string }, i: number) => c.title.trim() || `Item ${i + 1}`;
const cardSub = (c: { text: string }) => c.text.trim() || undefined;
const sectorTitle = (s: WebsiteSector, i: number) => s.name.trim() || `Sector ${i + 1}`;
const iconOf = (c: { icon: string }) => websiteIcon(c.icon);

/* ---------- hero services picker ---------- */

const HeroChipsEditor = memo(function HeroChipsEditor({
  ids,
  services,
  servicesError,
  onChange,
}: {
  ids: string[];
  services: Service[] | null;
  servicesError: boolean;
  onChange: (ids: string[]) => void;
}) {
  const byId = useMemo(() => new Map((services ?? []).map((s) => [s.id, s])), [services]);
  const available = (services ?? []).filter((s) => !ids.includes(s.id));
  const full = ids.length >= 8;

  return (
    <View>
      <Text style={styles.pickTitle}>On the website · {ids.length}/8</Text>
      {ids.length === 0 ? <Text style={styles.empty}>None picked — the website shows its default services.</Text> : null}
      <View style={styles.picked}>
        {ids.map((id, index) => {
          const svc = byId.get(id);
          return (
            <View key={id} style={styles.pickedRow}>
              <View style={styles.pickedNum}>
                <Text style={styles.pickedNumText}>{index + 1}</Text>
              </View>
              <Text style={[styles.pickedName, !svc && styles.missing]} numberOfLines={1}>
                {svc ? svc.name : services ? 'Service no longer live' : 'Loading…'}
              </Text>
              <ReorderButtons
                index={index}
                count={ids.length}
                onMove={(from, to) => onChange(moveItem(ids, from, to))}
                label={svc?.name}
              />
              <Pressable
                onPress={() => {
                  haptic('select');
                  animateNextLayout();
                  onChange(ids.filter((x) => x !== id));
                }}
                hitSlop={6}
                style={({ pressed }) => [styles.pickedRemove, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${svc?.name ?? 'service'}`}
              >
                <X size={15} color={colors.error} strokeWidth={2.4} />
              </Pressable>
            </View>
          );
        })}
      </View>

      <Text style={[styles.pickTitle, styles.mt]}>Live services</Text>
      {servicesError ? <Text style={styles.empty}>Could not load services. Pull back and open this screen again.</Text> : null}
      {services && available.length === 0 ? <Text style={styles.empty}>Every live service is already picked.</Text> : null}
      <View style={styles.chipWrap}>
        {available.map((s) => (
          <Pressable
            key={s.id}
            disabled={full}
            onPress={() => {
              haptic('select');
              animateNextLayout();
              onChange([...ids, s.id]);
            }}
            style={({ pressed }) => [styles.addChip, full && styles.addChipOff, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Add ${s.name}`}
          >
            <Plus size={13} color={full ? ui.textTertiary : ui.brand} strokeWidth={2.6} />
            <Text style={[styles.addChipText, full && styles.addChipTextOff]} numberOfLines={1}>
              {s.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
});

/* ---------- validation ---------- */

function cleanLists(l: WebsiteLists): WebsiteLists {
  return {
    stats: l.stats.map((s) => ({ value: s.value.trim(), label: s.label.trim() })),
    why: l.why.map((s) => ({ ...s, title: s.title.trim(), text: s.text.trim() })),
    steps: l.steps.map((s) => ({ ...s, title: s.title.trim(), text: s.text.trim() })),
    sectors: l.sectors.map((s) => ({ ...s, name: s.name.trim() })),
    science: l.science.map((s) => ({ title: s.title.trim(), text: s.text.trim() })),
    aboutPoints: l.aboutPoints.map((s) => s.trim()).filter(Boolean),
    heroChips: l.heroChips,
    clients: l.clients.map((c) => ({ name: c.name.trim(), logo: c.logo })),
  };
}

function firstProblem(l: WebsiteLists): { tab: ListKey; message: string } | null {
  if (l.stats.some((s) => !s.value || !s.label)) return { tab: 'stats', message: 'Every number needs a value and a label' };
  if (l.why.some((s) => !s.title)) return { tab: 'why', message: 'Every reason needs a title' };
  if (l.steps.some((s) => !s.title)) return { tab: 'steps', message: 'Every step needs a title' };
  if (l.sectors.some((s) => !s.name)) return { tab: 'sectors', message: 'Every sector needs a name' };
  if (l.science.some((s) => !s.title)) return { tab: 'science', message: 'Every method step needs a title' };
  if (l.clients.some((c) => !c.name || !c.logo)) return { tab: 'clients', message: 'Every client needs a name and a logo' };
  return null;
}

/* ---------- screen ---------- */

export default function WebsiteListsScreen() {
  const [lists, setLists] = useState<WebsiteLists | null>(null);
  const [tab, setTab] = useState<ListKey>('stats');
  const [services, setServices] = useState<Service[] | null>(null);
  const [servicesError, setServicesError] = useState(false);
  const { website, loading, error, saving, save, retry } = useWebsiteConfig(useCallback((w) => setLists(w.lists), []));
  const [uploading, onBusyChange] = useBusyCounter();

  useEffect(() => {
    let alive = true;
    api
      .get<{ services: Service[] }>('/services', screenLoadConfig)
      .then(({ data }) => {
        if (alive) setServices(data.services.filter((s) => s.active !== false));
      })
      .catch(() => {
        if (alive) setServicesError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const setStats: ListSetter<WebsiteStat> = useCallback((fn) => setLists((l) => l && { ...l, stats: fn(l.stats) }), []);
  const setWhy: ListSetter<WebsiteIconCard> = useCallback((fn) => setLists((l) => l && { ...l, why: fn(l.why) }), []);
  const setSteps: ListSetter<WebsiteIconCard> = useCallback((fn) => setLists((l) => l && { ...l, steps: fn(l.steps) }), []);
  const setSectors: ListSetter<WebsiteSector> = useCallback((fn) => setLists((l) => l && { ...l, sectors: fn(l.sectors) }), []);
  const setScience: ListSetter<WebsiteScienceStep> = useCallback(
    (fn) => setLists((l) => l && { ...l, science: fn(l.science) }),
    [],
  );
  const setAboutPoints = useCallback((aboutPoints: string[]) => setLists((l) => l && { ...l, aboutPoints }), []);
  const setHeroChips = useCallback((heroChips: string[]) => setLists((l) => l && { ...l, heroChips }), []);
  const setClients: ListSetter<WebsiteClient> = useCallback((fn) => setLists((l) => l && { ...l, clients: fn(l.clients) }), []);
  const clientFields = useCallback(
    (item: WebsiteClient, update: (p: Partial<WebsiteClient>) => void) => (
      <>
        <IconInput label="Business name" value={item.name} maxLength={60} placeholder="e.g. Tea Post" onChangeText={(name) => update({ name })} />
        <ImageField
          label="Logo"
          value={{ url: item.logo, alt: item.name }}
          onChange={(img) => update({ logo: img.url })}
          aspectRatio={1}
          requireAlt={false}
          onBusyChange={onBusyChange}
        />
      </>
    ),
    [onBusyChange],
  );

  const dirty = useMemo(
    () => Boolean(website && lists && JSON.stringify(lists) !== JSON.stringify(website.lists)),
    [website, lists],
  );

  async function onSave() {
    if (!lists) return;
    const clean = cleanLists(lists);
    const problem = firstProblem(clean);
    if (problem) {
      haptic('error');
      setTab(problem.tab);
      Toast.show({ type: 'error', text1: problem.message, text2: 'Fill it in or remove the item' });
      return;
    }
    await save({ lists: clean }, 'Lists saved');
  }

  if (loading || (!lists && !error)) {
    return (
      <AdminListShell title="Lists" subtitle="Numbers, reasons, steps and more" backFallback={adminRoutes.website}>
        <AdminFormSkeleton cards={[3, 3]} />
      </AdminListShell>
    );
  }

  if (error || !lists) {
    return (
      <AdminListShell title="Lists" subtitle="Could not load" backFallback={adminRoutes.website}>
        <ListEmptyRetry message={error ?? undefined} onRetry={() => void retry()} />
      </AdminListShell>
    );
  }

  const meta = TABS.find((t) => t.key === tab) ?? TABS[0]!;

  return (
    <AdminListShell
      title="Lists"
      subtitle="Numbers, reasons, steps and more"
      backFallback={adminRoutes.website}
      keyboardAvoid
      stickyFooter={
        <StickyActionBar>
          <Button
            title={uploading ? 'Uploading logo…' : dirty ? 'Save lists' : 'Saved'}
            variant="premium"
            loading={saving}
            disabled={!dirty || saving || uploading}
            onPress={() => void onSave()}
          />
        </StickyActionBar>
      }
    >
      <ScrollView
        contentContainerStyle={adminListShellStyles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeSlideIn delay={stagger(0)} slideFrom={14}>
          <View style={styles.chips}>
            <AdminFilterChips
              inset
              chips={TABS.map((t) => ({ key: t.key, label: `${t.label} (${lists[t.key].length})` }))}
              selected={tab}
              onSelect={(k) => setTab(k as ListKey)}
            />
          </View>
          <AdminTabHint title={meta.title} body={meta.body} />
        </FadeSlideIn>

        <FadeSlideIn key={tab} delay={stagger(1)} slideFrom={10}>
          <AdminFormCard>
            {tab === 'stats' ? (
              <ListEditor
                title="Numbers"
                hint={meta.hint}
                items={lists.stats}
                setItems={setStats}
                makeItem={() => ({ value: '', label: '' })}
                max={8}
                itemTitle={statTitle}
                renderFields={statFields}
                addLabel="Add number"
              />
            ) : null}
            {tab === 'why' ? (
              <ListEditor
                title="Why choose us"
                hint={meta.hint}
                items={lists.why}
                setItems={setWhy}
                makeItem={() => ({ title: '', text: '', icon: 'badge' })}
                max={8}
                itemTitle={cardTitle}
                itemSubtitle={cardSub}
                itemIcon={iconOf}
                renderFields={iconCardFields}
                addLabel="Add reason"
              />
            ) : null}
            {tab === 'steps' ? (
              <ListEditor
                title="How it works"
                hint={meta.hint}
                items={lists.steps}
                setItems={setSteps}
                makeItem={() => ({ title: '', text: '', icon: 'clipboard' })}
                max={8}
                itemTitle={cardTitle}
                itemSubtitle={cardSub}
                itemIcon={iconOf}
                renderFields={iconCardFields}
                addLabel="Add step"
              />
            ) : null}
            {tab === 'sectors' ? (
              <ListEditor
                title="Sectors we serve"
                hint={meta.hint}
                items={lists.sectors}
                setItems={setSectors}
                makeItem={() => ({ name: '', icon: 'building' })}
                max={16}
                itemTitle={sectorTitle}
                itemIcon={iconOf}
                renderFields={sectorFields}
                addLabel="Add sector"
              />
            ) : null}
            {tab === 'science' ? (
              <ListEditor
                title="Our method"
                hint={meta.hint}
                items={lists.science}
                setItems={setScience}
                makeItem={() => ({ title: '', text: '' })}
                max={8}
                itemTitle={cardTitle}
                itemSubtitle={cardSub}
                renderFields={scienceFields}
                addLabel="Add method step"
              />
            ) : null}
            {tab === 'aboutPoints' ? (
              <StringListEditor
                title={`About highlights · ${lists.aboutPoints.length}/12`}
                items={lists.aboutPoints}
                onChange={setAboutPoints}
                max={12}
                placeholder="e.g. Eco-safe treatments"
                fill
              />
            ) : null}
            {tab === 'clients' ? (
              <ListEditor
                title="Clients"
                hint={meta.hint}
                items={lists.clients}
                setItems={setClients}
                makeItem={() => ({ name: '', logo: '' })}
                max={24}
                itemTitle={clientTitle}
                itemSubtitle={clientSub}
                renderFields={clientFields}
                addLabel="Add client"
              />
            ) : null}
            {tab === 'heroChips' ? (
              <HeroChipsEditor
                ids={lists.heroChips}
                services={services}
                servicesError={servicesError}
                onChange={setHeroChips}
              />
            ) : null}
          </AdminFormCard>
        </FadeSlideIn>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  chips: { marginTop: spacing.sm },
  pickTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: ui.text, marginBottom: spacing.sm },
  mt: { marginTop: spacing.md },
  empty: { fontFamily: fonts.body, fontSize: 13, color: ui.textSecondary, marginBottom: spacing.sm },
  picked: { gap: 8 },
  pickedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  pickedNum: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickedNumText: { fontFamily: fonts.bodyBold, fontSize: 12, color: ui.brand },
  pickedName: { flex: 1, minWidth: 0, fontFamily: fonts.bodySemi, fontSize: 14, color: ui.text },
  missing: { color: colors.error },
  pickedRemove: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  addChipOff: { backgroundColor: ui.surfaceMuted },
  addChipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text, flexShrink: 1 },
  addChipTextOff: { color: ui.textTertiary },
  pressed: { opacity: 0.75 },
});

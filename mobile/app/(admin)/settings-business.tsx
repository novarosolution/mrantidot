import axios from 'axios';
import { useNavigation } from 'expo-router';
import type { NativeStackNavigationProp } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminFilterChips, AdminFormCard, AdminTabHint } from '@/components/kit/AdminPageKit';
import { AdminFormSkeleton } from '@/components/kit/AdminSkeletons';
import { ListsSection, listsProblem } from '@/components/settings/ListsSection';
import { MessagesSection } from '@/components/settings/MessagesSection';
import {
  AppStatusSection,
  appStatusProblem,
  BookingRulesSection,
  CustomersSection,
  PaymentsSection,
  TaxInvoiceSection,
} from '@/components/settings/RuleSections';
import { ServiceAreaSection, serviceAreaProblem } from '@/components/settings/ServiceAreaSection';
import { SlotsSection } from '@/components/settings/SlotsSection';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { DEFAULT_BUSINESS_SETTINGS } from '@/constants/businessSettingsDefaults';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { setBusinessSettings } from '@/lib/businessSettings';
import { confirmAsync } from '@/lib/confirm';
import { haptic, stagger } from '@/lib/motion';
import { adminRoutes } from '@/lib/routes';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { AdminBusinessSettings, BusinessSettingsPatch } from '@/types/api';
import { spacing } from '@/constants/theme';

/** Everything the admin edits (the saved copy minus its version stamp). */
type Draft = Omit<AdminBusinessSettings, 'updatedAt'>;
type Group = keyof Draft;
type SectionKey = 'tax' | 'slots' | 'booking' | 'lists' | 'area' | 'payments' | 'customers' | 'messages' | 'app';

const SECTIONS: { key: SectionKey; label: string; groups: Group[]; title: string; body: string }[] = [
  { key: 'tax', label: 'Tax & invoice', groups: ['tax', 'invoice'], title: 'Tax & invoice', body: 'The GST rate on every booking and the business details printed on invoices.' },
  { key: 'slots', label: 'Time slots', groups: ['slots'], title: 'Time slots', body: 'Visit windows customers can choose in the app and on the website.' },
  { key: 'booking', label: 'Booking rules', groups: ['booking'], title: 'Booking rules', body: 'How soon and how far ahead people can book, cut-offs for changes, and the confirm / assign workflow.' },
  { key: 'lists', label: 'Lists', groups: ['lists'], title: 'Lists', body: 'Categories, property types, pest names, review tags and leave types used across the apps and the website.' },
  { key: 'area', label: 'Service area', groups: ['serviceArea'], title: 'Service area', body: 'Where you take bookings — anywhere, or only in the cities and pincodes you list.' },
  { key: 'payments', label: 'Payments', groups: ['payments'], title: 'Payments', body: 'Ways customers can pay, what they are called and which one comes first.' },
  { key: 'customers', label: 'Customers', groups: ['customers'], title: 'Customers', body: 'When a customer is marked VIP in the admin lists.' },
  { key: 'messages', label: 'Messages', groups: ['messages'], title: 'Messages', body: 'Notification texts for each step of a visit — for customers, technicians and admins.' },
  { key: 'app', label: 'App status', groups: ['app'], title: 'App status', body: 'Maintenance mode and the oldest app version that may still be used.' },
];

const GROUPS: Group[] = ['tax', 'invoice', 'slots', 'booking', 'lists', 'serviceArea', 'payments', 'customers', 'app', 'messages'];

function toDraft(s: AdminBusinessSettings): Draft {
  const { updatedAt: _updatedAt, ...rest } = s;
  return rest;
}

const inRange = (n: number, min: number, max: number) => Number.isFinite(n) && n >= min && n <= max;

/** First thing to fix before saving, and the section it lives in. */
function firstProblem(d: Draft): { tab: SectionKey; message: string } | null {
  if (!inRange(d.tax.gstPercent, 0, 40)) return { tab: 'tax', message: 'GST rate must be between 0 and 40%' };
  if (!d.invoice.prefix.trim()) return { tab: 'tax', message: 'Add an invoice number prefix' };
  if (!d.slots.some((s) => s.active)) return { tab: 'slots', message: 'Switch at least one time slot on' };
  const b = d.booking;
  if (
    !inRange(b.leadMinutes, 0, 4320) ||
    !inRange(b.horizonDays, 1, 365) ||
    !inRange(b.pickerDays, 1, 60) ||
    !inRange(b.cancelCutoffHours, 0, 168) ||
    !inRange(b.rescheduleCutoffHours, 0, 168) ||
    !inRange(b.maxReschedules, 0, 20)
  ) {
    return { tab: 'booking', message: 'A booking rule is out of range' };
  }
  const lists = listsProblem(d.lists);
  if (lists) return { tab: 'lists', message: lists };
  const area = serviceAreaProblem(d.serviceArea);
  if (area) return { tab: 'area', message: area };
  if (!d.payments.methods.some((m) => m.active)) return { tab: 'payments', message: 'Keep at least one payment method on' };
  if (d.payments.methods.some((m) => !m.label.trim())) return { tab: 'payments', message: 'Every payment method needs a name' };
  if (!inRange(d.customers.vipSpend, 0, 10_000_000) || !inRange(d.customers.vipBookings, 0, 1000)) {
    return { tab: 'customers', message: 'A VIP threshold is out of range' };
  }
  const app = appStatusProblem(d.app);
  if (app) return { tab: 'app', message: app };
  return null;
}

/** Trims what people type before it goes to the server. */
function cleanGroup<G extends Group>(group: G, value: Draft[G]): Draft[G] {
  const trimLabels = <T extends { label: string }>(items: T[]) => items.map((i) => ({ ...i, label: i.label.trim() }));
  switch (group) {
    case 'invoice': {
      const v = value as Draft['invoice'];
      return { legalName: v.legalName.trim(), gstin: v.gstin.trim(), address: v.address.trim(), prefix: v.prefix.trim(), footer: v.footer.trim() } as Draft[G];
    }
    case 'lists': {
      const v = value as Draft['lists'];
      return {
        ...v,
        categories: trimLabels(v.categories),
        propertyTypes: trimLabels(v.propertyTypes),
        pestTypes: trimLabels(v.pestTypes),
        leaveTypes: trimLabels(v.leaveTypes),
        reviewTags: v.reviewTags.map((t) => t.trim()).filter(Boolean),
      } as Draft[G];
    }
    case 'payments': {
      const v = value as Draft['payments'];
      return { methods: trimLabels(v.methods) } as Draft[G];
    }
    case 'app': {
      const v = value as Draft['app'];
      return { ...v, maintenanceMessage: v.maintenanceMessage.trim(), minVersion: v.minVersion.trim(), iosUrl: v.iosUrl.trim(), androidUrl: v.androidUrl.trim() } as Draft[G];
    }
    case 'messages': {
      const v = value as Draft['messages'];
      return Object.fromEntries(Object.entries(v).map(([k, m]) => [k, { title: m.title.trim(), body: m.body.trim() }])) as Draft[G];
    }
    default:
      return value;
  }
}

function savedAt(iso?: string): string {
  if (!iso) return 'Not saved yet';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Saved';
  return `Saved ${d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`;
}

export default function BusinessSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const [saved, setSaved] = useState<AdminBusinessSettings | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [defaults, setDefaults] = useState<Draft | null>(null);
  const [tab, setTab] = useState<SectionKey>('tax');
  const [saving, setSaving] = useState(false);
  const { loading, error, runLoad, reload } = useScreenLoad();

  const apply = useCallback((next: AdminBusinessSettings) => {
    setSaved(next);
    setDraft(toDraft(next));
  }, []);

  const load = useCallback(async () => {
    const { data } = await api.get<{ settings: AdminBusinessSettings; defaults?: Draft }>('/settings/admin', {
      ...screenLoadConfig,
      skipCache: true,
    });
    apply(data.settings);
    if (data.defaults) setDefaults(data.defaults);
  }, [apply]);

  useEffect(() => {
    void runLoad(load, 'Could not load business settings');
  }, [load, runLoad]);

  const dirtyGroups = useMemo(
    () => (saved && draft ? GROUPS.filter((g) => JSON.stringify(draft[g]) !== JSON.stringify(saved[g])) : []),
    [saved, draft],
  );
  const dirty = dirtyGroups.length > 0;
  const dirtySections = new Set(SECTIONS.filter((s) => s.groups.some((g) => dirtyGroups.includes(g))).map((s) => s.key));

  /* ---------- unsaved-changes guard ---------- */
  const guard = useRef({ dirty: false, saving: false });
  guard.current = { dirty, saving };

  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (!guard.current.dirty || guard.current.saving) return;
      e.preventDefault();
      void confirmAsync({
        title: 'Discard your changes?',
        message: 'Your business settings changes are not saved yet.',
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

  /* ---------- editing ---------- */
  const setGroup = useCallback(<G extends Group>(group: G, value: Draft[G]) => {
    setDraft((d) => (d ? { ...d, [group]: value } : d));
  }, []);
  const onTax = useCallback((v: Draft['tax']) => setGroup('tax', v), [setGroup]);
  const onInvoice = useCallback((v: Draft['invoice']) => setGroup('invoice', v), [setGroup]);
  const onSlots = useCallback((v: Draft['slots']) => setGroup('slots', v), [setGroup]);
  const onBooking = useCallback((v: Draft['booking']) => setGroup('booking', v), [setGroup]);
  const onLists = useCallback((v: Draft['lists']) => setGroup('lists', v), [setGroup]);
  const onArea = useCallback((v: Draft['serviceArea']) => setGroup('serviceArea', v), [setGroup]);
  const onPayments = useCallback((methods: Draft['payments']['methods']) => setGroup('payments', { methods }), [setGroup]);
  const onCustomers = useCallback((v: Draft['customers']) => setGroup('customers', v), [setGroup]);
  const onMessages = useCallback((v: Draft['messages']) => setGroup('messages', v), [setGroup]);
  const onApp = useCallback((v: Draft['app']) => setGroup('app', v), [setGroup]);

  async function onSave() {
    if (!draft || !saved || !dirty) return;
    const problem = firstProblem(draft);
    if (problem) {
      haptic('error');
      setTab(problem.tab);
      Toast.show({ type: 'error', text1: problem.message, text2: 'Fix it, then save again' });
      return;
    }
    const patch: BusinessSettingsPatch = { updatedAt: saved.updatedAt };
    for (const g of dirtyGroups) (patch as Record<string, unknown>)[g] = cleanGroup(g, draft[g]);
    setSaving(true);
    try {
      const { data } = await api.patch<{ settings: AdminBusinessSettings }>('/settings/admin', patch, { skipErrorToast: true });
      apply(data.settings);
      // The rest of this app uses the public part straight away (no notification texts).
      const { messages: _messages, ...publicPart } = data.settings;
      setBusinessSettings(publicPart);
      haptic('success');
      Toast.show({ type: 'success', text1: 'Business settings saved', text2: 'Booking rules apply now; apps and the website update within a minute' });
    } catch (err) {
      haptic('error');
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        Toast.show({ type: 'error', text1: 'Someone else saved meanwhile', text2: 'Loaded their version — please make your change again' });
        await reload(load, 'Could not load business settings');
        return;
      }
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not save business settings') });
    } finally {
      setSaving(false);
    }
  }

  function onDiscard() {
    if (!saved) return;
    void confirmAsync({
      title: 'Discard your changes?',
      message: `${dirtyGroups.length} ${dirtyGroups.length === 1 ? 'section goes' : 'sections go'} back to the saved settings.`,
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      destructive: true,
    }).then((ok) => {
      if (!ok) return;
      haptic('warning');
      setDraft(toDraft(saved));
    });
  }

  if (loading || (!draft && !error)) {
    return (
      <AdminListShell title="Business settings" subtitle="Loading…" backFallback={adminRoutes.team}>
        <AdminFormSkeleton cards={[3, 3, 2]} />
      </AdminListShell>
    );
  }

  if (error || !draft || !saved) {
    return (
      <AdminListShell title="Business settings" subtitle="Could not load" backFallback={adminRoutes.team}>
        <ListEmptyRetry message={error ?? undefined} onRetry={() => void reload(load, 'Could not load business settings')} />
      </AdminListShell>
    );
  }

  const meta = SECTIONS.find((s) => s.key === tab) ?? SECTIONS[0]!;
  const fallbackLists = defaults?.lists ?? DEFAULT_BUSINESS_SETTINGS.lists;

  return (
    <AdminListShell
      title="Business settings"
      subtitle={dirty ? `${dirtyGroups.length} unsaved ${dirtyGroups.length === 1 ? 'change' : 'changes'}` : savedAt(saved.updatedAt)}
      backFallback={adminRoutes.team}
      keyboardAvoid
      stickyFooter={
        <StickyActionBar row={dirty}>
          {dirty ? (
            <View style={styles.secondary}>
              <Button title="Discard" variant="outline" disabled={saving} onPress={onDiscard} />
            </View>
          ) : null}
          <View style={dirty ? styles.primary : undefined}>
            <Button
              title={dirty ? 'Save changes' : 'All saved'}
              variant="premium"
              loading={saving}
              disabled={!dirty || saving}
              onPress={() => void onSave()}
            />
          </View>
        </StickyActionBar>
      }
    >
      <ScrollView
        contentContainerStyle={adminListShellStyles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeSlideIn delay={stagger(0)} slideFrom={14}>
          <View style={styles.tabs}>
            <AdminFilterChips
              inset
              chips={SECTIONS.map((s) => ({ key: s.key, label: dirtySections.has(s.key) ? `${s.label} •` : s.label }))}
              selected={tab}
              onSelect={(k) => setTab(k as SectionKey)}
            />
          </View>
          <AdminTabHint title={meta.title} body={meta.body} />
        </FadeSlideIn>

        <FadeSlideIn key={tab} delay={stagger(1)} slideFrom={10}>
          {tab === 'messages' ? (
            <MessagesSection messages={draft.messages} defaults={defaults?.messages} onChange={onMessages} />
          ) : (
            <AdminFormCard>
              {tab === 'tax' ? <TaxInvoiceSection tax={draft.tax} invoice={draft.invoice} onTax={onTax} onInvoice={onInvoice} /> : null}
              {tab === 'slots' ? <SlotsSection slots={draft.slots} onChange={onSlots} /> : null}
              {tab === 'booking' ? <BookingRulesSection booking={draft.booking} onChange={onBooking} /> : null}
              {tab === 'lists' ? <ListsSection lists={draft.lists} defaults={fallbackLists} onChange={onLists} /> : null}
              {tab === 'area' ? <ServiceAreaSection area={draft.serviceArea} onChange={onArea} /> : null}
              {tab === 'payments' ? (
                <PaymentsSection
                  methods={draft.payments.methods}
                  defaults={defaults?.payments.methods ?? DEFAULT_BUSINESS_SETTINGS.payments.methods}
                  onChange={onPayments}
                />
              ) : null}
              {tab === 'customers' ? <CustomersSection customers={draft.customers} onChange={onCustomers} /> : null}
              {tab === 'app' ? <AppStatusSection app={draft.app} onChange={onApp} /> : null}
            </AdminFormCard>
          )}
        </FadeSlideIn>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  tabs: { marginTop: spacing.sm },
  secondary: { flex: 1 },
  primary: { flex: 2 },
});

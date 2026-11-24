import type { LucideIcon } from 'lucide-react-native';
import { Globe, HardHat, Megaphone, TicketPercent, UserRound, UsersRound, Wrench, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminListShell, AdminSectionTitle, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminFilterChips, AdminFormCard, AdminSearchField } from '@/components/kit/AdminPageKit';
import { NotificationRow } from '@/components/kit/NotificationRow';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { confirmAsync } from '@/lib/confirm';
import { haptic } from '@/lib/motion';
import { adminRoutes } from '@/lib/routes';
import { formatTimeAgo } from '@/lib/time-ago';
import {
  BROADCAST_BODY_MAX,
  BROADCAST_TITLE_MAX,
  BROADCASTS_PER_HOUR,
  type AdminUserSearchResult,
  type BroadcastAudience,
  type BroadcastInput,
  type BroadcastLinkKind,
  type BroadcastListResponse,
  type BroadcastPreview,
  type BroadcastRecord,
} from '@/types/adminOps';
import type { AppNotification, Service } from '@/types/api';
import { colors, fonts, radii, spacing, ui } from '@/constants/theme';

const AUDIENCES: { key: BroadcastAudience; label: string; hint: string; icon: LucideIcon }[] = [
  { key: 'customers', label: 'All customers', hint: 'Every active customer account', icon: UsersRound },
  { key: 'technicians', label: 'All technicians', hint: 'Every active technician', icon: HardHat },
  { key: 'everyone', label: 'Everyone', hint: 'Customers and technicians', icon: Megaphone },
  { key: 'user', label: 'One person', hint: 'Search by name or phone', icon: UserRound },
];

const LINKS: { key: BroadcastLinkKind; label: string }[] = [
  { key: 'none', label: 'No link' },
  { key: 'service', label: 'A service' },
  { key: 'offers', label: 'Offers' },
  { key: 'url', label: 'Web page' },
];

const AUDIENCE_NOUN: Record<Exclude<BroadcastAudience, 'user'>, [string, string]> = {
  customers: ['customer', 'customers'],
  technicians: ['technician', 'technicians'],
  everyone: ['person', 'people'],
};

const HTTPS_URL = /^https:\/\/[^\s/?#]+\.[^\s/?#]+(?:[/?#]\S*)?$/i;

function audienceLabel(b: BroadcastRecord): string {
  if (b.audience === 'user') return b.user?.name ? `To ${b.user.name}` : 'To one person';
  return AUDIENCES.find((a) => a.key === b.audience)?.label ?? b.audience;
}

function linkLabel(b: BroadcastRecord): string | null {
  if (!b.link) return null;
  if (b.link.kind === 'offers') return 'Opens Offers';
  if (b.link.kind === 'service') return `Opens ${b.link.label || 'a service'}`;
  return `Opens ${b.link.label || b.link.url || 'a web page'}`;
}

/** Linkify/preview chip under the preview notification. */
function LinkTag({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <View style={styles.linkTag}>
      <Icon size={13} color={colors.forest} strokeWidth={2.3} />
      <Text style={styles.linkTagText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Admin broadcast — an in-app notice to all customers, all technicians, everyone, or one person,
 * with an optional link (a service, the offers screen or an https page). Shows a live preview and
 * the recipient count, confirms before sending, and lists past broadcasts with read counts.
 */
export default function BroadcastScreen() {
  const [audience, setAudience] = useState<BroadcastAudience>('customers');
  const [person, setPerson] = useState<AdminUserSearchResult | null>(null);
  const [personQuery, setPersonQuery] = useState('');
  const [personResults, setPersonResults] = useState<AdminUserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkKind, setLinkKind] = useState<BroadcastLinkKind>('none');
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [services, setServices] = useState<Service[] | null>(null);
  const [touched, setTouched] = useState(false);

  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  const [sending, setSending] = useState(false);

  const [history, setHistory] = useState<BroadcastRecord[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyMore, setHistoryMore] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchId = useRef(0);

  const loadHistory = useCallback(async (page = 1) => {
    const { data } = await api.get<BroadcastListResponse>('/admin/broadcast', {
      ...screenLoadConfig,
      params: { page, limit: 10 },
    });
    setHistory((prev) => {
      if (page === 1) return data.broadcasts;
      const seen = new Set(prev.map((b) => b.id));
      return [...prev, ...data.broadcasts.filter((b) => !seen.has(b.id))];
    });
    setHistoryTotal(data.total);
    setHistoryPage(page);
    setHistoryMore(data.hasMore);
    setHistoryError(null);
  }, []);

  useEffect(() => {
    loadHistory(1)
      .catch((err) => setHistoryError(getApiErrorMessage(err, 'Could not load past broadcasts')))
      .finally(() => setHistoryLoading(false));
  }, [loadHistory]);

  // Active services for the "A service" link (loaded the first time it's picked).
  useEffect(() => {
    if (linkKind !== 'service' || services) return;
    api
      .get<{ services: Service[] }>('/services', screenLoadConfig)
      .then(({ data }) => setServices(data.services.filter((s) => s.active !== false)))
      .catch(() => setServices([]));
  }, [linkKind, services]);

  // People search for "One person".
  useEffect(() => {
    if (audience !== 'user' || person) return;
    const q = personQuery.trim();
    if (q.length < 2) {
      setPersonResults([]);
      setSearching(false);
      return;
    }
    const id = ++searchId.current;
    setSearching(true);
    const t = setTimeout(() => {
      api
        .get<{ users: AdminUserSearchResult[] }>('/admin/user-search', { ...screenLoadConfig, params: { q, limit: 8 } })
        .then(({ data }) => {
          if (id === searchId.current) setPersonResults(data.users);
        })
        .catch(() => {
          if (id === searchId.current) setPersonResults([]);
        })
        .finally(() => {
          if (id === searchId.current) setSearching(false);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [audience, person, personQuery]);

  // How many people this would reach.
  useEffect(() => {
    if (audience === 'user' && !person) {
      setCount(null);
      return;
    }
    let alive = true;
    setCounting(true);
    api
      .get<BroadcastPreview>('/admin/broadcast/preview', {
        ...screenLoadConfig,
        params: { audience, ...(audience === 'user' && person ? { userId: person.id } : {}) },
      })
      .then(({ data }) => {
        if (alive) setCount(data.count);
      })
      .catch(() => {
        if (alive) setCount(null);
      })
      .finally(() => {
        if (alive) setCounting(false);
      });
    return () => {
      alive = false;
    };
  }, [audience, person]);

  const service = services?.find((s) => s.id === serviceId);
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const trimmedUrl = url.trim();

  const problems = useMemo(() => {
    const list: string[] = [];
    if (audience === 'user' && !person) list.push('Pick the person to send this to.');
    if (!trimmedTitle) list.push('Add a title.');
    if (!trimmedBody) list.push('Add a message.');
    if (linkKind === 'service' && !serviceId) list.push('Pick the service to link to.');
    if (linkKind === 'url' && !HTTPS_URL.test(trimmedUrl)) list.push('Enter a full web address starting with https://');
    if (count === 0) list.push('Nobody matches this audience yet.');
    return list;
  }, [audience, person, trimmedTitle, trimmedBody, linkKind, serviceId, trimmedUrl, count]);

  const reachText =
    audience === 'user'
      ? person
        ? `Goes to ${person.name}`
        : 'Pick a person'
      : count === null
        ? counting
          ? 'Counting recipients…'
          : 'Recipients unknown'
        : `Reaches ${count.toLocaleString('en-IN')} ${AUDIENCE_NOUN[audience][count === 1 ? 0 : 1]}`;

  const previewItem: AppNotification = {
    id: 'preview',
    title: trimmedTitle || 'Your title',
    body: trimmedBody || 'Your message shows here.',
    type: 'broadcast',
    read: false,
    createdAt: new Date().toISOString(),
  };

  const previewLink =
    linkKind === 'service'
      ? { icon: Wrench, label: service ? `Opens ${service.name}` : 'Opens a service' }
      : linkKind === 'offers'
        ? { icon: TicketPercent, label: 'Opens Offers' }
        : linkKind === 'url'
          ? { icon: Globe, label: trimmedUrl ? `Opens ${trimmedUrl.replace(/^https:\/\//i, '')}` : 'Opens a web page' }
          : null;

  function resetForm() {
    setTitle('');
    setBody('');
    setLinkKind('none');
    setServiceId(null);
    setUrl('');
    setTouched(false);
  }

  async function send() {
    setTouched(true);
    if (problems.length > 0) {
      haptic('error');
      Toast.show({ type: 'error', text1: 'Not ready to send', text2: problems[0] });
      return;
    }
    const who =
      audience === 'user'
        ? person?.name ?? 'this person'
        : count !== null
          ? `${count.toLocaleString('en-IN')} ${AUDIENCE_NOUN[audience][count === 1 ? 0 : 1]}`
          : AUDIENCES.find((a) => a.key === audience)?.label.toLowerCase() ?? 'everyone';
    const ok = await confirmAsync({
      title: `Send to ${who}?`,
      message: `“${trimmedTitle}” goes to their in-app notifications right away. This can't be unsent.`,
      confirmLabel: 'Send now',
      cancelLabel: 'Back',
    });
    if (!ok) return;

    const payload: BroadcastInput = {
      audience,
      ...(audience === 'user' && person ? { userId: person.id } : {}),
      title: trimmedTitle,
      body: trimmedBody,
      link:
        linkKind === 'service'
          ? { kind: 'service', serviceId: serviceId ?? undefined }
          : linkKind === 'url'
            ? { kind: 'url', url: trimmedUrl }
            : { kind: linkKind },
    };
    setSending(true);
    try {
      const { data } = await api.post<{ broadcast: BroadcastRecord; recipientCount: number }>('/admin/broadcast', payload);
      haptic('success');
      Toast.show({
        type: 'success',
        text1: 'Broadcast sent',
        text2: `Delivered to ${data.recipientCount.toLocaleString('en-IN')} ${data.recipientCount === 1 ? 'person' : 'people'}.`,
      });
      resetForm();
      setHistory((prev) => [data.broadcast, ...prev.filter((b) => b.id !== data.broadcast.id)]);
      setHistoryTotal((n) => n + 1);
    } catch {
      // The interceptor shows the server's message (e.g. the hourly limit).
      haptic('error');
    } finally {
      setSending(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await loadHistory(1);
    } catch (err) {
      setHistoryError(getApiErrorMessage(err, 'Could not load past broadcasts'));
    } finally {
      setRefreshing(false);
    }
  }

  async function loadMoreHistory() {
    if (loadingMore || !historyMore) return;
    setLoadingMore(true);
    try {
      await loadHistory(historyPage + 1);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not load more broadcasts' });
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <AdminListShell
      title="Broadcast"
      subtitle="Send a notice to customers or technicians"
      backFallback={adminRoutes.team}
      keyboardAvoid
      stickyFooter={
        <StickyActionBar>
          <Button
            title={sending ? 'Sending…' : 'Review & send'}
            variant="premium"
            onPress={() => void send()}
            loading={sending}
            disabled={sending}
          />
        </StickyActionBar>
      }
    >
      <ScrollView
        contentContainerStyle={adminListShellStyles.form}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.green} />}
      >
        <AdminSectionTitle title="Who gets it" hint={`In-app notification · up to ${BROADCASTS_PER_HOUR} broadcasts an hour`} />
        <AdminFormCard>
          <View style={styles.audienceGrid}>
            {AUDIENCES.map((a) => {
              const on = audience === a.key;
              const Icon = a.icon;
              return (
                <Pressable
                  key={a.key}
                  onPress={() => {
                    haptic('select');
                    setAudience(a.key);
                  }}
                  style={({ pressed }) => [styles.audience, on && styles.audienceOn, pressed && styles.pressed]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${a.label}. ${a.hint}`}
                >
                  <View style={[styles.audienceIcon, on && styles.audienceIconOn]}>
                    <Icon size={18} color={on ? colors.white : colors.forest} strokeWidth={2.2} />
                  </View>
                  <Text style={[styles.audienceLabel, on && styles.audienceLabelOn]} numberOfLines={1}>
                    {a.label}
                  </Text>
                  <Text style={styles.audienceHint} numberOfLines={2}>
                    {a.hint}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {audience === 'user' ? (
            <View style={styles.personBlock}>
              {person ? (
                <View style={styles.personPicked}>
                  <View style={styles.personText}>
                    <Text style={styles.personName} numberOfLines={1}>
                      {person.name}
                    </Text>
                    <Text style={styles.personMeta} numberOfLines={1}>
                      {[person.role, person.phone, person.email].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setPerson(null);
                      setPersonQuery('');
                    }}
                    hitSlop={8}
                    style={({ pressed }) => [styles.personClear, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${person.name}`}
                  >
                    <X size={14} color={colors.white} strokeWidth={3} />
                  </Pressable>
                </View>
              ) : (
                <>
                  <AdminSearchField value={personQuery} onChangeText={setPersonQuery} placeholder="Name, phone or email" />
                  {searching ? <ActivityIndicator style={styles.searchSpinner} size="small" color={colors.forest} /> : null}
                  {!searching && personQuery.trim().length >= 2 && personResults.length === 0 ? (
                    <Text style={styles.muted}>No one matches “{personQuery.trim()}”.</Text>
                  ) : null}
                  {personResults.map((u) => (
                    <Pressable
                      key={u.id}
                      onPress={() => {
                        haptic('select');
                        setPerson(u);
                      }}
                      style={({ pressed }) => [styles.result, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Send to ${u.name}, ${u.role}`}
                    >
                      <Text style={styles.resultName} numberOfLines={1}>
                        {u.name}
                      </Text>
                      <Text style={styles.resultMeta} numberOfLines={1}>
                        {[u.role, u.phone, u.city].filter(Boolean).join(' · ')}
                      </Text>
                    </Pressable>
                  ))}
                </>
              )}
            </View>
          ) : null}

          <View style={styles.reach}>
            {counting ? <ActivityIndicator size="small" color={colors.forest} /> : null}
            <Text style={styles.reachText}>{reachText}</Text>
          </View>
        </AdminFormCard>

        <AdminSectionTitle title="Message" hint="Short and clear — it shows in the notification list" />
        <AdminFormCard>
          <Input
            label="Title"
            value={title}
            onChangeText={(t) => setTitle(t.slice(0, BROADCAST_TITLE_MAX))}
            placeholder="e.g. Monsoon pest check — 20% off"
            maxLength={BROADCAST_TITLE_MAX}
            error={touched && !trimmedTitle ? 'Add a title' : undefined}
            hint={`${title.length}/${BROADCAST_TITLE_MAX}`}
          />
          <Input
            label="Message"
            value={body}
            onChangeText={(t) => setBody(t.slice(0, BROADCAST_BODY_MAX))}
            placeholder="What should people know?"
            multiline
            maxLength={BROADCAST_BODY_MAX}
            error={touched && !trimmedBody ? 'Add a message' : undefined}
            hint={`${body.length}/${BROADCAST_BODY_MAX}`}
            style={styles.multiline}
          />

          <Text style={styles.fieldLabel}>When tapped, open</Text>
          <AdminFilterChips chips={LINKS} selected={linkKind} onSelect={(k) => setLinkKind(k as BroadcastLinkKind)} />

          {linkKind === 'service' ? (
            services === null ? (
              <ActivityIndicator style={styles.searchSpinner} size="small" color={colors.forest} />
            ) : services.length === 0 ? (
              <Text style={styles.muted}>No active services to link to.</Text>
            ) : (
              <View style={styles.serviceList}>
                {services.map((s) => {
                  const on = s.id === serviceId;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => setServiceId(s.id)}
                      style={({ pressed }) => [styles.serviceRow, on && styles.serviceRowOn, pressed && styles.pressed]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={[styles.serviceName, on && styles.serviceNameOn]} numberOfLines={1}>
                        {s.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )
          ) : null}
          {touched && linkKind === 'service' && !serviceId ? <Text style={styles.error}>Pick the service to link to.</Text> : null}

          {linkKind === 'url' ? (
            <Input
              label="Web address"
              value={url}
              onChangeText={setUrl}
              placeholder="https://mrantidot.com/offers"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              error={touched && !HTTPS_URL.test(trimmedUrl) ? 'Use a full address starting with https://' : undefined}
              containerStyle={styles.urlInput}
            />
          ) : null}
        </AdminFormCard>

        <AdminSectionTitle title="Preview" hint="How it appears in their notifications" />
        <View style={styles.previewWrap}>
          <NotificationRow item={previewItem} />
          {previewLink ? <LinkTag icon={previewLink.icon} label={previewLink.label} /> : null}
        </View>

        <AdminSectionTitle title="Sent broadcasts" hint={historyTotal > 0 ? `${historyTotal} sent` : undefined} />
        <View style={styles.history}>
          {historyLoading ? (
            <ActivityIndicator style={styles.searchSpinner} color={colors.forest} />
          ) : historyError && history.length === 0 ? (
            <View style={styles.historyEmpty}>
              <Text style={styles.muted}>{historyError}</Text>
              <Button title="Try again" variant="secondary" size="sm" fullWidth={false} onPress={() => void onRefresh()} />
            </View>
          ) : history.length === 0 ? (
            <Text style={styles.muted}>Nothing sent yet. Your broadcasts and how many people read them show here.</Text>
          ) : (
            <>
              {history.map((b) => {
                const link = linkLabel(b);
                const readPct = b.recipientCount > 0 ? Math.round((b.readCount / b.recipientCount) * 100) : 0;
                return (
                  <View key={b.id} style={styles.sent}>
                    <View style={styles.sentHead}>
                      <Text style={styles.sentTitle} numberOfLines={1}>
                        {b.title}
                      </Text>
                      <Text style={styles.sentWhen}>{formatTimeAgo(b.createdAt)}</Text>
                    </View>
                    <Text style={styles.sentBody} numberOfLines={3}>
                      {b.body}
                    </Text>
                    <Text style={styles.sentMeta} numberOfLines={2}>
                      {[audienceLabel(b), `by ${b.sender.name}`, link].filter(Boolean).join(' · ')}
                    </Text>
                    <View style={styles.readRow}>
                      <View style={styles.readTrack}>
                        <View style={[styles.readFill, { width: `${Math.min(100, readPct)}%` }]} />
                      </View>
                      <Text style={styles.readText}>
                        Read by {b.readCount.toLocaleString('en-IN')} of {b.recipientCount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                );
              })}
              {historyMore ? (
                <Button
                  title="Show older"
                  variant="secondary"
                  size="sm"
                  loading={loadingMore}
                  onPress={() => void loadMoreHistory()}
                  style={styles.more}
                />
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  audienceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  audience: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  audienceOn: { borderColor: colors.forest, backgroundColor: colors.soft },
  audienceIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
    marginBottom: 8,
  },
  audienceIconOn: { backgroundColor: colors.forest },
  audienceLabel: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ink },
  audienceLabelOn: { color: colors.forest },
  audienceHint: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16, color: ui.textSecondary, marginTop: 2 },
  pressed: { opacity: 0.85 },
  personBlock: { marginTop: spacing.md, gap: 8 },
  personPicked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.soft,
  },
  personText: { flex: 1, minWidth: 0 },
  personName: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  personMeta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  personClear: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSpinner: { marginVertical: spacing.sm },
  result: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  resultName: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ink },
  resultMeta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  reach: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md },
  reachText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  fieldLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textSecondary, marginTop: spacing.xs, marginBottom: 4 },
  serviceList: { gap: 6, marginTop: spacing.sm },
  serviceRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  serviceRowOn: { borderColor: colors.forest, backgroundColor: colors.soft },
  serviceName: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ink },
  serviceNameOn: { fontFamily: fonts.bodySemi, color: colors.forest },
  urlInput: { marginTop: spacing.sm },
  error: { fontFamily: fonts.body, fontSize: 12, color: colors.error, marginTop: 6 },
  muted: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.muted },
  previewWrap: { paddingHorizontal: spacing.md, gap: 8 },
  linkTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.soft,
  },
  linkTagText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest, flexShrink: 1 },
  history: { paddingHorizontal: spacing.md, gap: 10, paddingBottom: spacing.md },
  historyEmpty: { gap: spacing.sm, alignItems: 'flex-start' },
  sent: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  sentHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sentTitle: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  sentWhen: { fontFamily: fonts.body, fontSize: 12, color: ui.textTertiary },
  sentBody: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.ink, marginTop: 4 },
  sentMeta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 6 },
  readRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  readTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.greyBg, overflow: 'hidden' },
  readFill: { height: 6, borderRadius: 3, backgroundColor: colors.green },
  readText: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: ui.textSecondary },
  more: { marginTop: 2 },
});

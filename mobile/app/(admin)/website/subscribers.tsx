import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Share2, Trash2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { AdminEntrance, AdminListShell, adminListShellStyles, useListEntrance } from '@/components/kit/AdminListShell';
import { AdminFilterChips, AdminSearchField, AdminStatStrip } from '@/components/kit/AdminPageKit';
import { AdminListSkeleton } from '@/components/kit/AdminSkeletons';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { haptic } from '@/lib/motion';
import { adminRoutes } from '@/lib/routes';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { Subscriber } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { confirmAsync } from '@/lib/confirm';
import { shareTextFile } from '@/lib/shareFile';

/** Browsers download the list as a text file; phones open the share sheet. */
const IS_WEB = Platform.OS === 'web';

type Filter = 'all' | 'active' | 'off';

function joined(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `Joined ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

const SubscriberRow = memo(function SubscriberRow({
  sub,
  onToggle,
  onDelete,
}: {
  sub: Subscriber;
  onToggle: (s: Subscriber) => void;
  onDelete: (s: Subscriber) => void;
}) {
  return (
    <View style={[styles.row, !sub.active && styles.rowOff]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(sub.email[0] ?? '@').toUpperCase()}</Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.email, !sub.active && styles.emailOff]} numberOfLines={1} selectable>
          {sub.email}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {sub.active ? 'Subscribed' : 'Unsubscribed'} · {joined(sub.createdAt)}
        </Text>
      </View>
      <ToggleSwitch
        value={sub.active}
        onToggle={() => onToggle(sub)}
        accessibilityLabel={sub.active ? `Unsubscribe ${sub.email}` : `Resubscribe ${sub.email}`}
      />
      <Pressable
        onPress={() => onDelete(sub)}
        hitSlop={6}
        style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${sub.email}`}
      >
        <Trash2 size={16} color={colors.error} strokeWidth={2.3} />
      </Pressable>
    </View>
  );
});

export default function WebsiteSubscribersScreen() {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const query = useDebouncedValue(search.trim().toLowerCase(), 200);
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();
  const entrance = useListEntrance(!loading);

  const load = useCallback(async () => {
    const { data } = await api.get<{ subscribers: Subscriber[] }>('/website/admin/subscribers', {
      ...screenLoadConfig,
      skipCache: true,
    });
    setSubs(data.subscribers);
  }, []);

  useEffect(() => {
    void runLoad(load, 'Could not load subscribers');
  }, [load, runLoad]);

  const activeCount = useMemo(() => subs.filter((s) => s.active).length, [subs]);
  const visible = useMemo(() => {
    const byFilter = filter === 'all' ? subs : subs.filter((s) => (filter === 'active' ? s.active : !s.active));
    return query ? byFilter.filter((s) => s.email.includes(query)) : byFilter;
  }, [subs, filter, query]);

  const onToggle = useCallback(async (s: Subscriber) => {
    const next = !s.active;
    haptic('select');
    setSubs((prev) => prev.map((x) => (x.id === s.id ? { ...x, active: next } : x)));
    try {
      await api.patch(`/website/admin/subscribers/${s.id}`, { active: next }, { skipErrorToast: true });
    } catch (err) {
      setSubs((prev) => prev.map((x) => (x.id === s.id ? { ...x, active: s.active } : x)));
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not update the subscriber') });
    }
  }, []);

  const onDelete = useCallback((s: Subscriber) => {
    void confirmAsync({
      title: 'Delete subscriber?',
      message: `${s.email} will be removed from the list for good.`,
      confirmLabel: 'Delete',
      destructive: true,
    }).then(async (ok) => {
      if (!ok) return;
      try {
        await api.delete(`/website/admin/subscribers/${s.id}`, { skipErrorToast: true });
        haptic('success');
        setSubs((prev) => prev.filter((x) => x.id !== s.id));
        Toast.show({ type: 'success', text1: 'Subscriber deleted' });
      } catch (err) {
        haptic('error');
        Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not delete the subscriber') });
      }
    });
  }, []);

  const shareActive = useCallback(async () => {
    const emails = subs.filter((s) => s.active).map((s) => s.email);
    if (emails.length === 0) {
      Toast.show({ type: 'info', text1: 'No active subscribers to share' });
      return;
    }
    haptic('tap');
    try {
      await shareTextFile({
        filename: `mrantidot-subscribers-${new Date().toISOString().slice(0, 10)}.txt`,
        title: 'Newsletter subscribers',
        mimeType: 'text/plain',
        content: emails.join('\n'),
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not open the share sheet' });
    }
  }, [subs]);

  const header = useMemo(
    () => (
      <FadeSlideIn slideFrom={14}>
        <View style={styles.headerBlock}>
          <AdminStatStrip
            flush
            items={[
              { label: 'Total', value: subs.length },
              { label: 'Active', value: activeCount, color: colors.forest },
              { label: 'Unsubscribed', value: subs.length - activeCount, color: colors.muted },
            ]}
          />
          <AdminSearchField value={search} onChangeText={setSearch} placeholder="Search email" />
          <View style={styles.chipsWrap}>
            <AdminFilterChips
              inset
              chips={[
                { key: 'all', label: `All (${subs.length})` },
                { key: 'active', label: `Active (${activeCount})` },
                { key: 'off', label: `Unsubscribed (${subs.length - activeCount})` },
              ]}
              selected={filter}
              onSelect={(k) => setFilter(k as Filter)}
            />
          </View>
        </View>
      </FadeSlideIn>
    ),
    [subs.length, activeCount, search, filter],
  );

  if (loading) {
    return (
      <AdminListShell title="Subscribers" subtitle="Newsletter emails" backFallback={adminRoutes.website}>
        <AdminListSkeleton variant="person" strip stripCells={3} search chips rows={6} />
      </AdminListShell>
    );
  }

  if (error && subs.length === 0) {
    return (
      <AdminListShell title="Subscribers" subtitle="Could not load" backFallback={adminRoutes.website}>
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  const shareBtn = (
    <Pressable
      onPress={() => void shareActive()}
      style={({ pressed }) => [styles.shareBtn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={IS_WEB ? 'Download active subscriber emails' : 'Share active subscriber emails'}
      hitSlop={6}
    >
      <Share2 size={16} color={colors.white} strokeWidth={2.4} />
      <Text style={styles.shareText}>{IS_WEB ? 'Download' : 'Share'}</Text>
    </Pressable>
  );

  return (
    <AdminListShell
      title="Subscribers"
      subtitle={`${activeCount} active · newsletter`}
      backFallback={adminRoutes.website}
      rightAction={shareBtn}
    >
      <FlatList
        data={visible}
        keyExtractor={(s) => s.id}
        {...ADMIN_LIST_PERF}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />}
        contentContainerStyle={visible.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        ListEmptyComponent={
          <EmptyState
            title={query ? 'No matching emails' : 'No subscribers yet'}
            message={query ? 'Try another search' : 'People who join the newsletter on the website appear here'}
          />
        }
        renderItem={({ item, index }) => (
          <AdminEntrance index={index + 1} play={entrance(index)}>
            <SubscriberRow sub={item} onToggle={onToggle} onDelete={onDelete} />
          </AdminEntrance>
        )}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  headerBlock: { marginBottom: spacing.xs, gap: spacing.sm },
  chipsWrap: { marginHorizontal: -spacing.md, marginTop: -spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    marginBottom: spacing.sm,
    ...ui.shadow,
  },
  rowOff: { backgroundColor: ui.surfaceMuted },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.brand },
  body: { flex: 1, minWidth: 0 },
  email: { fontFamily: fonts.bodySemi, fontSize: 14, color: ui.text },
  emailOff: { color: ui.textSecondary },
  meta: { fontFamily: fonts.body, fontSize: 11.5, color: ui.textTertiary, marginTop: 2 },
  delete: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: ui.brand,
  },
  shareText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.white },
  pressed: { opacity: 0.8 },
});

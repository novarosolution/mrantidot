import { Bell, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { NotificationRow } from '@/components/kit/NotificationRow';
import { TechScreen, TechScreenList } from '@/components/kit/TechScreenKit';
import { TechConfirmSheet } from '@/components/tech/TechConfirmSheet';
import { TechNotificationsSkeleton } from '@/components/tech/TechSkeletons';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PressableScale } from '@/components/ui/PressableScale';
import { fillCopy } from '@/constants/customerUiCopy';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { api, screenLoadConfig } from '@/lib/api';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { haptic, stagger } from '@/lib/motion';
import { appPush, techGoBack, techRoutes } from '@/lib/routes';
import { techErrorText } from '@/lib/techLabels';
import { appToast } from '@/lib/toast';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import type { AppNotification, NotificationsPage } from '@/types/api';

const PAGE_SIZE = 30;

/** The https page a broadcast links to, if any: the only kind of link a technician can open. */
function webLink(n: AppNotification): string | null {
  const url = n.link?.kind === 'url' ? n.link.url?.trim() : undefined;
  return url && /^https:\/\//i.test(url) ? url : null;
}

/** Service and offers links point at customer screens, so the row shows no pill or chevron for them here. */
function forTech(n: AppNotification): AppNotification {
  return n.link && n.link.kind !== 'url' ? { ...n, link: undefined } : n;
}

/**
 * Technician inbox: job updates (assigned, rescheduled, cancelled…) and broadcasts from the office.
 * Newest first with cursor paging. A tap opens the job or the broadcast's web page; read all,
 * clear read and delete one. Server: routes/notifications.routes.ts.
 */
export default function TechNotificationsScreen() {
  const copy = useCustomerUiCopy();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<NotificationsPage['nextCursor']>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ err: unknown } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  /** Bumped by every first-page load, so an older page that arrives late can't land on top of a refresh. */
  const generation = useRef(0);

  const loadFirst = useCallback(async () => {
    const gen = ++generation.current;
    const { data } = await api.get<NotificationsPage>('/notifications', {
      ...screenLoadConfig,
      params: { limit: PAGE_SIZE },
      skipCache: true,
    });
    if (gen !== generation.current) return;
    setItems(data.notifications);
    setUnreadCount(data.unreadCount);
    setTotal(data.total ?? data.notifications.length);
    setCursor(data.nextCursor ?? null);
    setLoadError(null);
  }, []);

  useEffect(() => {
    loadFirst()
      .catch((err: unknown) => setLoadError({ err }))
      .finally(() => setLoading(false));
  }, [loadFirst]);

  useStaleFocusRefresh(() => loadFirst().catch(() => undefined), 45_000);

  function retry() {
    setLoading(true);
    loadFirst()
      .catch((err: unknown) => setLoadError({ err }))
      .finally(() => setLoading(false));
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await loadFirst();
    } catch (err) {
      appToast.error(copy.techNotificationsLoadError, techErrorText(copy, err));
    } finally {
      setRefreshing(false);
    }
  }

  async function loadMore() {
    if (!cursor || loadingMore) return;
    const gen = generation.current;
    setLoadingMore(true);
    try {
      const { data } = await api.get<NotificationsPage>('/notifications', {
        ...screenLoadConfig,
        params: { limit: PAGE_SIZE, before: cursor.before, beforeId: cursor.beforeId },
        skipCache: true,
      });
      if (gen !== generation.current) return;
      setItems((prev) => {
        const seen = new Set(prev.map((n) => n.id));
        return [...prev, ...data.notifications.filter((n) => !seen.has(n.id))];
      });
      setCursor(data.nextCursor ?? null);
      setUnreadCount(data.unreadCount);
      if (typeof data.total === 'number') setTotal(data.total);
    } catch {
      // Keep what is shown; reaching the end of the list again retries.
    } finally {
      setLoadingMore(false);
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    const before = items;
    const prevUnread = unreadCount;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await api.patch('/notifications/read-all');
      haptic('success');
    } catch (err) {
      haptic('error');
      setItems(before);
      setUnreadCount(prevUnread);
      appToast.error(copy.techNotificationsUpdateError, techErrorText(copy, err));
    } finally {
      setMarkingAll(false);
    }
  }

  async function clearRead() {
    setClearing(true);
    try {
      await api.delete('/notifications/read');
      haptic('success');
      appToast.success(copy.techNotificationsCleared);
      await loadFirst().catch(() => undefined);
    } catch (err) {
      haptic('error');
      appToast.error(copy.techNotificationsUpdateError, techErrorText(copy, err));
    } finally {
      setClearing(false);
      setClearOpen(false);
    }
  }

  async function remove(n: AppNotification) {
    if (deleting) return;
    setDeleting(n.id);
    try {
      await api.delete(`/notifications/${n.id}`);
      haptic('success');
      setItems((prev) => prev.filter((x) => x.id !== n.id));
      setTotal((t) => Math.max(0, t - 1));
      if (!n.read) setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      haptic('error');
      appToast.error(copy.techNotificationsUpdateError, techErrorText(copy, err));
    } finally {
      setDeleting(null);
    }
  }

  function markRead(n: AppNotification) {
    if (n.read) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setUnreadCount((c) => Math.max(0, c - 1));
    void api.patch(`/notifications/${n.id}/read`).catch(() => {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: false } : x)));
      setUnreadCount((c) => c + 1);
    });
  }

  function openItem(n: AppNotification) {
    markRead(n);
    if (n.bookingId) {
      appPush(techRoutes.job(n.bookingId));
      return;
    }
    const url = webLink(n);
    if (url) void Linking.openURL(url).catch(() => appToast.error(copy.techNotificationsLinkError));
  }

  const failed = loadError !== null && items.length === 0;
  // A non-breaking space keeps the subtitle line reserved while the counts are unknown, so the header doesn't jump.
  const subtitle =
    loading || failed
      ? ' '
      : unreadCount > 0
        ? fillCopy(copy.techNotificationsUnread, { count: unreadCount })
        : copy.techNotificationsCaughtUp;

  const header = (
    <CustomerPageHeader
      variant="premium"
      title={copy.techNotificationsTitle}
      subtitle={subtitle}
      showBack
      onBack={() => techGoBack(techRoutes.home)}
    />
  );

  if (loading) {
    return (
      <TechScreen header={header}>
        <TechNotificationsSkeleton />
      </TechScreen>
    );
  }

  if (failed) {
    return (
      <TechScreen header={header}>
        <ListEmptyRetry
          title={copy.techNotificationsLoadError}
          message={techErrorText(copy, loadError.err)}
          retryLabel={copy.techRetry}
          onRetry={retry}
        />
      </TechScreen>
    );
  }

  const readCount = Math.max(0, total - unreadCount);
  const actions =
    readCount > 0 || unreadCount > 0 ? (
      <View style={styles.actions}>
        {readCount > 0 ? (
          <ActionChip label={copy.techNotificationsClearRead} disabled={clearing} onPress={() => setClearOpen(true)} />
        ) : null}
        {unreadCount > 0 ? (
          <ActionChip primary label={copy.techNotificationsReadAll} busy={markingAll} onPress={() => void markAllRead()} />
        ) : null}
      </View>
    ) : null;

  const footer =
    items.length === 0 ? null : loadingMore ? (
      <ActivityIndicator style={styles.footer} color={ui.brand} />
    ) : (
      <Text style={styles.footerText}>
        {cursor ? fillCopy(copy.techNotificationsShowing, { shown: items.length, total }) : copy.techNotificationsEnd}
      </Text>
    );

  return (
    <TechScreen header={header}>
      <TechScreenList
        data={items}
        keyExtractor={(n) => n.id}
        {...CUSTOMER_LIST_PERF}
        empty={items.length === 0}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={ui.brand} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => void loadMore()}
        ListHeaderComponent={actions}
        ListEmptyComponent={
          <EmptyState icon={Bell} title={copy.techNotificationsEmptyTitle} message={copy.techNotificationsEmptyText} />
        }
        ListFooterComponent={footer}
        renderItem={({ item, index }) => {
          // Read rows with nothing to open stay static; unread ones are tappable so a tap marks them read.
          const canOpen = !item.read || !!item.bookingId || webLink(item) !== null;
          return (
            <FadeSlideIn delay={stagger(index)} slideFrom={12} disabled={index > 6}>
              <View style={styles.itemRow}>
                <View style={styles.itemMain}>
                  <NotificationRow item={forTech(item)} onPress={canOpen ? () => openItem(item) : undefined} />
                </View>
                <Pressable
                  onPress={() => void remove(item)}
                  disabled={deleting !== null}
                  hitSlop={6}
                  style={({ pressed }) => [styles.deleteBtn, (pressed || deleting === item.id) && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={fillCopy(copy.techNotificationsDeleteA11y, { title: item.title })}
                >
                  {deleting === item.id ? (
                    <ActivityIndicator size="small" color={ui.textTertiary} />
                  ) : (
                    <Trash2 size={16} color={ui.textTertiary} strokeWidth={2.2} />
                  )}
                </Pressable>
              </View>
            </FadeSlideIn>
          );
        }}
      />
      <TechConfirmSheet
        visible={clearOpen}
        title={copy.techNotificationsClearTitle}
        message={copy.techNotificationsClearText}
        confirmLabel={copy.techNotificationsClearConfirm}
        cancelLabel={copy.techCancel}
        destructive
        loading={clearing}
        onConfirm={() => void clearRead()}
        onClose={() => setClearOpen(false)}
      />
    </TechScreen>
  );
}

function ActionChip({
  label,
  onPress,
  primary = false,
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  busy?: boolean;
  disabled?: boolean;
}) {
  const off = busy || disabled;
  return (
    <PressableScale
      onPress={onPress}
      disabled={off}
      scaleTo={0.95}
      haptic="tap"
      hitSlop={6}
      style={[styles.chip, primary && styles.chipPrimary, off && styles.chipOff]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled: off }}
    >
      {busy ? (
        <ActivityIndicator size="small" color={primary ? colors.white : ui.brand} />
      ) : (
        <Text style={[styles.chipText, primary && styles.chipTextPrimary]}>{label}</Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: spacing.sm },
  chip: {
    height: 34,
    minWidth: 76,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipPrimary: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipOff: { opacity: 0.7 },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.ink },
  chipTextPrimary: { color: colors.white },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  itemMain: { flex: 1, minWidth: 0 },
  deleteBtn: {
    width: 36,
    height: 36,
    marginTop: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  footer: { paddingVertical: spacing.md },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: ui.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});

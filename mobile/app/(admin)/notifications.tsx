import { Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminEntrance, AdminListShell, adminListShellStyles, useListEntrance } from '@/components/kit/AdminListShell';
import { AdminStatStrip } from '@/components/kit/AdminPageKit';
import { AdminListSkeleton } from '@/components/kit/AdminSkeletons';
import { NotificationRow } from '@/components/kit/NotificationRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { confirmAsync } from '@/lib/confirm';
import { bookingDetailPath, adminRoutes, appPush } from '@/lib/routes';
import { useAuth } from '@/context/AuthContext';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { haptic } from '@/lib/motion';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import type { AppNotification, NotificationsPage } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

const PAGE_SIZE = 30;

/**
 * Admin inbox — newest first with infinite scroll (cursor paging), mark read / read all,
 * delete one or clear everything already read. Server: routes/notifications.routes.ts.
 */
export default function AdminNotificationsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<NotificationsPage['nextCursor']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const generation = useRef(0);
  const entrance = useListEntrance(!loading);

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
    setError(null);
  }, []);

  useEffect(() => {
    loadFirst()
      .catch((err) => setError(getApiErrorMessage(err, 'Could not load notifications')))
      .finally(() => setLoading(false));
  }, [loadFirst]);

  useStaleFocusRefresh(() => loadFirst().catch(() => undefined), 45_000);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await loadFirst();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load notifications'));
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
      // Keep the list; scrolling again retries.
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
    } catch {
      haptic('error');
      setItems(before);
      setUnreadCount(prevUnread);
    } finally {
      setMarkingAll(false);
    }
  }

  async function clearRead() {
    const readTotal = Math.max(0, total - unreadCount) || items.filter((n) => n.read).length;
    if (readTotal === 0) return;
    const ok = await confirmAsync({
      title: 'Clear read notifications?',
      message: `Deletes ${readTotal} read notification${readTotal === 1 ? '' : 's'}. Unread ones stay.`,
      confirmLabel: 'Clear',
      cancelLabel: 'Keep',
      destructive: true,
    });
    if (!ok) return;
    setClearing(true);
    try {
      const { data } = await api.delete<{ deleted: number }>('/notifications/read');
      haptic('success');
      Toast.show({ type: 'success', text1: `Cleared ${data.deleted} notification${data.deleted === 1 ? '' : 's'}` });
      await loadFirst();
    } catch {
      haptic('error');
    } finally {
      setClearing(false);
    }
  }

  async function remove(n: AppNotification) {
    setDeleting(n.id);
    try {
      await api.delete(`/notifications/${n.id}`);
      haptic('success');
      setItems((prev) => prev.filter((x) => x.id !== n.id));
      setTotal((t) => Math.max(0, t - 1));
      if (!n.read) setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      haptic('error');
    } finally {
      setDeleting(null);
    }
  }

  function openItem(n: AppNotification) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      void api.patch(`/notifications/${n.id}/read`).catch(() => {
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: false } : x)));
        setUnreadCount((c) => c + 1);
      });
    }
    if (n.bookingId) {
      appPush(bookingDetailPath(user?.role, n.bookingId));
      return;
    }
    // Broadcast links (an admin can also be sent a broadcast).
    if (n.link?.kind === 'service' && n.link.serviceId) {
      appPush({ pathname: adminRoutes.serviceEdit, params: { id: n.link.serviceId } });
    } else if (n.link?.kind === 'offers') {
      appPush(adminRoutes.offers);
    } else if (n.link?.kind === 'url' && n.link.url && /^https:\/\//i.test(n.link.url)) {
      void Linking.openURL(n.link.url).catch(() => Toast.show({ type: 'error', text1: 'Could not open the link' }));
    }
  }

  const hasUnread = unreadCount > 0;
  const readCount = Math.max(0, total - unreadCount);

  if (loading) {
    return (
      <AdminListShell title="Notifications" subtitle="Alerts & activity">
        <AdminListSkeleton variant="notification" strip stripCells={3} rows={6} />
      </AdminListShell>
    );
  }

  if (error && items.length === 0) {
    return (
      <AdminListShell title="Notifications" subtitle="Error">
        <ListEmptyRetry
          message={error}
          onRetry={() => {
            setLoading(true);
            loadFirst()
              .catch((err) => setError(getApiErrorMessage(err, 'Could not load notifications')))
              .finally(() => setLoading(false));
          }}
        />
      </AdminListShell>
    );
  }

  const headerActions = (
    <View style={styles.headerActions}>
      {readCount > 0 ? (
        <Pressable
          onPress={() => void clearRead()}
          disabled={clearing}
          style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Delete all read notifications"
          hitSlop={6}
        >
          <Text style={styles.clearText}>{clearing ? '…' : 'Clear read'}</Text>
        </Pressable>
      ) : null}
      {hasUnread ? (
        <Pressable
          onPress={() => void markAllRead()}
          disabled={markingAll}
          style={({ pressed }) => [styles.markAll, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Mark all notifications as read"
          hitSlop={6}
        >
          <Text style={styles.markAllText}>{markingAll ? '…' : 'Read all'}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <AdminListShell
      title="Notifications"
      subtitle={hasUnread ? `${unreadCount} unread` : 'All caught up'}
      rightAction={readCount > 0 || hasUnread ? headerActions : undefined}
    >
      <FadeSlideIn slideFrom={14}>
        <View style={styles.stripWrap}>
          <AdminStatStrip
            items={[
              { label: 'Total', value: total },
              { label: 'Unread', value: unreadCount, color: unreadCount > 0 ? colors.forest : undefined },
              { label: 'Read', value: readCount },
            ]}
          />
        </View>
      </FadeSlideIn>
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        {...ADMIN_LIST_PERF}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.green} />}
        contentContainerStyle={items.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        onEndReachedThreshold={0.4}
        onEndReached={() => void loadMore()}
        ListEmptyComponent={<EmptyState title="No notifications" message="New bookings and jobs will appear here" />}
        ListFooterComponent={
          items.length === 0 ? null : loadingMore ? (
            <ActivityIndicator style={styles.footer} color={colors.forest} />
          ) : (
            <Text style={styles.footerText}>
              {cursor ? `Showing ${items.length} of ${total}` : `That's everything · ${total}`}
            </Text>
          )
        }
        renderItem={({ item, index }) => (
          <AdminEntrance index={index + 1} play={entrance(index)}>
            <View style={styles.itemRow}>
              <View style={styles.itemMain}>
                <NotificationRow item={item} onPress={() => openItem(item)} />
              </View>
              <Pressable
                onPress={() => void remove(item)}
                disabled={deleting === item.id}
                hitSlop={6}
                style={({ pressed }) => [styles.deleteBtn, (pressed || deleting === item.id) && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Delete notification: ${item.title}`}
              >
                {deleting === item.id ? (
                  <ActivityIndicator size="small" color={ui.textTertiary} />
                ) : (
                  <Trash2 size={16} color={ui.textTertiary} strokeWidth={2.2} />
                )}
              </Pressable>
            </View>
          </AdminEntrance>
        )}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  stripWrap: { paddingTop: spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  markAll: {
    backgroundColor: colors.forest,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  clearText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink },
  pressed: { opacity: 0.6 },
  markAllText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.white },
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
  footer: { paddingVertical: spacing.md },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: ui.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});

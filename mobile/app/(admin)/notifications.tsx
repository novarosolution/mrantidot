import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AdminEntrance, AdminListShell, adminListShellStyles, useListEntrance } from '@/components/kit/AdminListShell';
import { AdminStatStrip } from '@/components/kit/AdminPageKit';
import { AdminListSkeleton } from '@/components/kit/AdminSkeletons';
import { NotificationRow } from '@/components/kit/NotificationRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { api, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { bookingDetailPath, appPush } from '@/lib/routes';
import { useAuth } from '@/context/AuthContext';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { haptic } from '@/lib/motion';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import type { AppNotification } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

export default function AdminNotificationsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [markingAll, setMarkingAll] = useState(false);
  const { loading, error, refreshing, runLoad, refresh, reload } = useScreenLoad();
  const entrance = useListEntrance(!loading);

  const load = useCallback(async (skipCache = false) => {
    const { data } = await api.get<{ notifications: AppNotification[] }>('/notifications', {
      ...screenLoadConfig,
      cacheTtlMs: CACHE_TTL.notifications,
      ...(skipCache ? { skipCache: true as const } : {}),
    });
    setItems(data.notifications);
  }, []);

  useEffect(() => {
    void runLoad(() => load(), 'Could not load notifications');
  }, [load, runLoad]);

  useStaleFocusRefresh(() => refresh(() => load(true)), 45_000);

  async function markAllRead() {
    setMarkingAll(true);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.patch('/notifications/read-all');
      haptic('success');
    } catch {
      haptic('error');
      void load().catch(() => undefined);
    } finally {
      setMarkingAll(false);
    }
  }

  function openItem(n: AppNotification) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      void api.patch(`/notifications/${n.id}/read`).catch(() => {
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: false } : x)));
      });
    }
    if (n.bookingId) {
      appPush(bookingDetailPath(user?.role, n.bookingId));
    }
  }

  const unreadCount = items.filter((n) => !n.read).length;
  const hasUnread = unreadCount > 0;

  if (loading) {
    return (
      <AdminListShell title="Notifications" subtitle="Alerts & activity">
        <AdminListSkeleton variant="notification" strip stripCells={3} rows={6} />
      </AdminListShell>
    );
  }

  if (error) {
    return (
      <AdminListShell title="Notifications" subtitle="Error">
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  const markAllBtn = hasUnread ? (
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
  ) : undefined;

  return (
    <AdminListShell
      title="Notifications"
      subtitle={hasUnread ? `${unreadCount} unread` : 'All caught up'}
      rightAction={markAllBtn}
    >
      <FadeSlideIn slideFrom={14}>
        <View style={styles.stripWrap}>
          <AdminStatStrip
            items={[
              { label: 'Total', value: items.length },
              { label: 'Unread', value: unreadCount, color: unreadCount > 0 ? colors.forest : undefined },
              { label: 'Read', value: items.length - unreadCount },
            ]}
          />
        </View>
      </FadeSlideIn>
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        {...ADMIN_LIST_PERF}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
        }
        contentContainerStyle={items.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        ListEmptyComponent={<EmptyState title="No notifications" message="New bookings and jobs will appear here" />}
        renderItem={({ item, index }) => (
          <AdminEntrance index={index + 1} play={entrance(index)}>
            <NotificationRow item={item} onPress={() => openItem(item)} />
          </AdminEntrance>
        )}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  stripWrap: { paddingTop: spacing.sm },
  markAll: {
    backgroundColor: colors.forest,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  pressed: { opacity: 0.88 },
  markAllText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.white },
});

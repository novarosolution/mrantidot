import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminStatStrip } from '@/components/kit/AdminPageKit';
import { NotificationRow } from '@/components/kit/NotificationRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, screenLoadConfig } from '@/lib/api';
import { bookingDetailPath } from '@/lib/routes';
import { useAuth } from '@/context/AuthContext';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { AppNotification } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

export default function AdminNotificationsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [markingAll, setMarkingAll] = useState(false);
  const { loading, error, refreshing, runLoad, refresh, reload } = useScreenLoad();

  const load = useCallback(async () => {
    const { data } = await api.get<{ notifications: AppNotification[] }>('/notifications', screenLoadConfig);
    setItems(data.notifications);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void runLoad(load, 'Could not load notifications');
    }, [load, runLoad]),
  );

  async function markAllRead() {
    setMarkingAll(true);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.patch('/notifications/read-all');
    } catch {
      void load();
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
      router.push(bookingDetailPath(user?.role, n.bookingId) as never);
    }
  }

  const unreadCount = items.filter((n) => !n.read).length;
  const hasUnread = unreadCount > 0;

  if (loading) return <Spinner fullScreen />;

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
      <AdminStatStrip
        items={[
          { label: 'Total', value: items.length },
          { label: 'Unread', value: unreadCount, color: unreadCount > 0 ? colors.amberInk : colors.forest },
          { label: 'Read', value: items.length - unreadCount },
        ]}
      />
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        {...ADMIN_LIST_PERF}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
        }
        contentContainerStyle={items.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        ListEmptyComponent={<EmptyState title="No notifications" message="New bookings and jobs will appear here" />}
        renderItem={({ item }) => <NotificationRow item={item} onPress={() => void openItem(item)} />}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  markAll: {
    backgroundColor: colors.forest,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  pressed: { opacity: 0.88 },
  markAllText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.white },
});

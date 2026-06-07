import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { CustomerListShell, listShellStyles } from '@/components/kit/CustomerListShell';
import { NotificationRow } from '@/components/kit/NotificationRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { bookingDetailPath } from '@/lib/routes';
import { useAuth } from '@/context/AuthContext';
import type { AppNotification } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    const { data } = await api.get<{ notifications: AppNotification[] }>('/notifications', screenLoadConfig);
    setItems(data.notifications);
  }, []);

  useEffect(() => {
    safeAsync(async () => {
      try {
        await load();
      } catch (err) {
        setLoadError(getApiErrorMessage(err, 'Could not load notifications'));
      } finally {
        setLoading(false);
      }
    });
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Could not refresh'));
    } finally {
      setRefreshing(false);
    }
  }

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

  const hasUnread = items.some((n) => !n.read);

  return (
    <CustomerListShell
      title="Notifications"
      rightAction={
        hasUnread ? (
          <Pressable onPress={markAllRead} disabled={markingAll} style={styles.markAll}>
            <Text style={styles.markAllText}>{markingAll ? '…' : 'Mark all'}</Text>
          </Pressable>
        ) : undefined
      }
    >
      {loading ? (
        <Spinner />
      ) : loadError && items.length === 0 ? (
        <ListEmptyRetry message={loadError} onRetry={() => safeAsync(load)} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          {...CUSTOMER_LIST_PERF}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
          contentContainerStyle={items.length === 0 ? listShellStyles.empty : listShellStyles.list}
          ListEmptyComponent={<EmptyState title="No notifications" message="You're all caught up" />}
          renderItem={({ item }) => (
            <NotificationRow item={item} onPress={() => void openItem(item)} />
          )}
        />
      )}
    </CustomerListShell>
  );
}

const styles = StyleSheet.create({
  markAll: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  markAllText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.green },
});

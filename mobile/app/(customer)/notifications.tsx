import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { CustomerListShell, listShellStyles } from '@/components/kit/CustomerListShell';
import { NotificationRow } from '@/components/kit/NotificationRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { CACHE_TTL } from '@/lib/apiCache';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { bookingDetailPath, appPush } from '@/lib/routes';
import { useAuth } from '@/context/AuthContext';
import type { AppNotification } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

export default function NotificationsScreen() {
  const ui = useCustomerUiCopy();
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    const { data } = await api.get<{ notifications: AppNotification[] }>('/notifications', {
      ...screenLoadConfig,
      cacheTtlMs: CACHE_TTL.notifications,
    });
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
      appPush(bookingDetailPath(user?.role, n.bookingId));
    }
  }

  const hasUnread = items.some((n) => !n.read);

  return (
    <CustomerListShell
      title={ui.notificationsScreenTitle}
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
        <ListEmptyRetry
          message={loadError}
          onRetry={() => safeAsync(load, undefined, (msg) => setLoadError(msg))}
        />
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

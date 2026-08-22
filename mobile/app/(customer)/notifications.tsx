import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { CustomerListShell, listShellStyles } from '@/components/kit/CustomerListShell';
import { NotificationRow } from '@/components/kit/NotificationRow';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenState } from '@/components/ui/ScreenState';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { CACHE_TTL } from '@/lib/apiCache';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { bookingDetailPath, appPush } from '@/lib/routes';
import { useAuth } from '@/context/AuthContext';
import type { AppNotification } from '@/types/api';
import { colors, fonts, surfaces } from '@/constants/theme';

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
        Toast.show({ type: 'error', text1: 'Could not mark as read' });
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
          <Pressable
            onPress={markAllRead}
            disabled={markingAll}
            style={({ pressed }) => [styles.markAll, pressed && styles.markAllPressed]}
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
          >
            <PremiumIcon icon={AppIcons.ui.check} variant="plain" size={13} color={colors.forest} strokeWidth={2.6} />
            <Text style={styles.markAllText}>{markingAll ? '…' : 'Mark all'}</Text>
          </Pressable>
        ) : undefined
      }
    >
      <ScreenState
        embedded
        loading={loading}
        error={loadError && items.length === 0 ? loadError : null}
        onRetry={() => safeAsync(load, undefined, (msg) => setLoadError(msg))}
        loadingLabel="Loading notifications…"
      >
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          {...CUSTOMER_LIST_PERF}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
          contentContainerStyle={items.length === 0 ? listShellStyles.empty : listShellStyles.list}
          ListEmptyComponent={
            <EmptyState title={ui.notificationsEmptyTitle} message={ui.notificationsEmptyMessage} />
          }
          renderItem={({ item }) => (
            <NotificationRow item={item} onPress={() => void openItem(item)} />
          )}
        />
      </ScreenState>
    </CustomerListShell>
  );
}

const styles = StyleSheet.create({
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  markAllPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  markAllText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.forest },
});

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { CustomerListShell, listShellStyles } from '@/components/kit/CustomerListShell';
import { NotificationRow, type NotificationGroupPos } from '@/components/kit/NotificationRow';
import { SegmentedTabs } from '@/components/kit/SegmentedTabs';
import { groupNotificationsByDay } from '@/lib/notificationGroups';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenState } from '@/components/ui/ScreenState';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { CACHE_TTL } from '@/lib/apiCache';
import { bookingDetailPath, appPush } from '@/lib/routes';
import { useAuth } from '@/context/AuthContext';
import type { AppNotification } from '@/types/api';
import { fonts, spacing, ui as themeUi } from '@/constants/theme';
import { TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';

export default function NotificationsScreen() {
  const ui = useCustomerUiCopy();
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

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

  useStaleFocusRefresh(() => load().catch(() => undefined), 3_000);

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

  const unreadCount = items.filter((n) => !n.read).length;
  const hasUnread = unreadCount > 0;
  const sections = useMemo(
    () => groupNotificationsByDay(filter === 'unread' ? items.filter((n) => !n.read) : items),
    [filter, items],
  );

  return (
    <CustomerListShell
      title={ui.notificationsScreenTitle}
      subtitle={items.length === 0 ? undefined : hasUnread ? `${unreadCount} unread` : 'All caught up'}
      rightAction={
        hasUnread ? (
          <Pressable
            onPress={markAllRead}
            disabled={markingAll}
            style={({ pressed }) => [styles.markAll, pressed && styles.markAllPressed]}
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
          >
            <PremiumIcon icon={AppIcons.ui.check} variant="plain" size={13} color={themeUi.brand} strokeWidth={2.6} />
            <Text style={styles.markAllText}>{markingAll ? '…' : 'Mark all read'}</Text>
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
        <SectionList
          sections={sections}
          keyExtractor={(n) => n.id}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeUi.brand} />}
          contentContainerStyle={sections.length === 0 ? listShellStyles.empty : styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            items.length > 0 ? (
              <View style={styles.filterWrap}>
                <SegmentedTabs
                  tabs={[
                    { key: 'all', label: 'All', count: items.length },
                    { key: 'unread', label: 'Unread', count: unreadCount },
                  ]}
                  selected={filter}
                  onSelect={setFilter}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            filter === 'unread' && items.length > 0 ? (
              <EmptyState title="You're all caught up" message="No unread notifications right now." />
            ) : (
              <EmptyState title={ui.notificationsEmptyTitle} message={ui.notificationsEmptyMessage} />
            )
          }
          renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
          renderItem={({ item, index, section }) => {
            const last = section.data.length - 1;
            const pos: NotificationGroupPos =
              last === 0 ? 'only' : index === 0 ? 'first' : index === last ? 'last' : 'middle';
            return <NotificationRow item={item} groupPos={pos} onPress={() => void openItem(item)} />;
          }}
          SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
        />
      </ScreenState>
    </CustomerListShell>
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: TAB_BAR_SCROLL_PAD },
  filterWrap: { marginHorizontal: -spacing.md },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: themeUi.textTertiary,
    marginTop: spacing.sm,
    marginLeft: 4,
  },
  sectionGap: { height: 10 },
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: themeUi.brandSoft,
    borderWidth: 1,
    borderColor: themeUi.hairline,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  markAllPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  markAllText: { fontFamily: fonts.bodyBold, fontSize: 12, color: themeUi.brand },
});

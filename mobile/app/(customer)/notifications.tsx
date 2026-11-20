import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
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
import { fillCopy } from '@/constants/customerUiCopy';
import { haptic, stagger } from '@/lib/motion';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { ListRowsSkeleton } from '@/components/kit/ScreenSkeletons';

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
    haptic('success');
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
      subtitle={
        items.length === 0
          ? undefined
          : hasUnread
            ? fillCopy(ui.notificationsUnreadSub, { count: unreadCount })
            : ui.notificationsCaughtUpSub
      }
      rightAction={
        hasUnread ? (
          <PressableScale
            onPress={markAllRead}
            disabled={markingAll}
            style={styles.markAll}
            accessibilityRole="button"
            accessibilityLabel={ui.notificationsMarkAll}
          >
            <PremiumIcon icon={AppIcons.ui.check} variant="plain" size={13} color={themeUi.brand} strokeWidth={2.6} />
            <Text style={styles.markAllText}>{markingAll ? '…' : ui.notificationsMarkAll}</Text>
          </PressableScale>
        ) : undefined
      }
    >
      <ScreenState
        embedded
        loading={loading}
        error={loadError && items.length === 0 ? loadError : null}
        onRetry={() => safeAsync(load, undefined, (msg) => setLoadError(msg))}
        skeleton={<ListRowsSkeleton rows={5} />}
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
                    { key: 'all', label: ui.notificationsFilterAll, count: items.length },
                    { key: 'unread', label: ui.notificationsFilterUnread, count: unreadCount },
                  ]}
                  selected={filter}
                  onSelect={(key) => {
                    if (key !== filter) haptic('select');
                    setFilter(key);
                  }}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            filter === 'unread' && items.length > 0 ? (
              <EmptyState title={ui.notificationsUnreadEmptyTitle} message={ui.notificationsUnreadEmptyMessage} />
            ) : (
              <EmptyState title={ui.notificationsEmptyTitle} message={ui.notificationsEmptyMessage} />
            )
          }
          renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
          renderItem={({ item, index, section }) => {
            const last = section.data.length - 1;
            const pos: NotificationGroupPos =
              last === 0 ? 'only' : index === 0 ? 'first' : index === last ? 'last' : 'middle';
            // Only the first screenful animates in; later rows render straight away.
            const order = sections.slice(0, sections.indexOf(section)).reduce((n, s) => n + s.data.length, 0) + index;
            return (
              <FadeSlideIn delay={stagger(order)} slideFrom={12} disabled={order > 6}>
                <NotificationRow item={item} groupPos={pos} onPress={() => void openItem(item)} />
              </FadeSlideIn>
            );
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
  markAllText: { fontFamily: fonts.bodyBold, fontSize: 12, color: themeUi.brand },
});

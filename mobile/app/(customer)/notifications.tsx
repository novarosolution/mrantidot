import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
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
import { bookingDetailPath, customerRoutes, sharedRoutes, appPush } from '@/lib/routes';
import { openExternalUrl } from '@/lib/contact';
import { useAuth } from '@/context/AuthContext';
import type { AppNotification, NotificationsPage } from '@/types/api';
import { radii, spacing, typeScale, ui as themeUi } from '@/constants/theme';

/** Gap between day groups — a stable component (an inline arrow would remount every render). */
function SectionGap() {
  return <View style={styles.sectionGap} />;
}
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
  /** Server totals — the list holds one page at a time, so counts come from the API, not the array. */
  const [serverUnread, setServerUnread] = useState<number | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const cursor = useRef<NotificationsPage['nextCursor']>(null);
  const moreInFlight = useRef(false);

  const applyCounts = (data: NotificationsPage) => {
    setServerUnread(typeof data.unreadCount === 'number' ? data.unreadCount : null);
    setServerTotal(typeof data.total === 'number' ? data.total : null);
    cursor.current = data.hasMore && data.nextCursor ? data.nextCursor : null;
  };

  const load = useCallback(async () => {
    setLoadError(null);
    const { data } = await api.get<NotificationsPage>('/notifications', {
      ...screenLoadConfig,
      cacheTtlMs: CACHE_TTL.notifications,
    });
    setItems(data.notifications);
    applyCounts(data);
  }, []);

  /** Older notifications, 50 at a time, when the customer reaches the end of the list. */
  const loadMore = useCallback(async () => {
    const next = cursor.current;
    if (!next || moreInFlight.current) return;
    moreInFlight.current = true;
    setLoadingMore(true);
    try {
      const { data } = await api.get<NotificationsPage>('/notifications', {
        ...screenLoadConfig,
        params: { before: next.before, beforeId: next.beforeId },
      });
      setItems((prev) => {
        const seen = new Set(prev.map((n) => n.id));
        return [...prev, ...data.notifications.filter((n) => !seen.has(n.id))];
      });
      applyCounts(data);
    } catch {
      // Keep what is on screen; the next scroll to the end tries again.
    } finally {
      moreInFlight.current = false;
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    safeAsync(async () => {
      try {
        await load();
      } catch (err) {
        setLoadError(getApiErrorMessage(err, ui.notifLoadFailed));
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
      setLoadError(getApiErrorMessage(err, ui.homeRefreshFailed));
    } finally {
      setRefreshing(false);
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    haptic('success');
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setServerUnread(0);
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
      setServerUnread((c) => (c == null ? c : Math.max(0, c - 1)));
      void api.patch(`/notifications/${n.id}/read`).catch(() => {
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: false } : x)));
        setServerUnread((c) => (c == null ? c : c + 1));
        Toast.show({ type: 'error', text1: ui.notifMarkFailed });
      });
    }
    if (n.bookingId) {
      haptic('tap');
      appPush(bookingDetailPath(user?.role, n.bookingId));
      return;
    }
    // Admin broadcasts can point at a service, the offers screen or a web page.
    const link = n.link;
    if (!link) return;
    if (link.kind === 'service' && link.serviceId) {
      haptic('tap');
      appPush(sharedRoutes.service(link.serviceId));
    } else if (link.kind === 'offers') {
      haptic('tap');
      appPush(customerRoutes.offers);
    } else if (link.kind === 'url' && link.url) {
      if (openExternalUrl(link.url, ui)) haptic('tap');
    }
  }

  const localUnread = items.filter((n) => !n.read).length;
  const unreadCount = serverUnread ?? localUnread;
  const hasUnread = unreadCount > 0;
  const sections = useMemo(
    () => groupNotificationsByDay(filter === 'unread' ? items.filter((n) => !n.read) : items, new Date(), ui),
    [filter, items, ui],
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
            hitSlop={4}
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
                    { key: 'all', label: ui.notificationsFilterAll, count: Math.max(serverTotal ?? 0, items.length) },
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
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {section.title}
            </Text>
          )}
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
          SectionSeparatorComponent={SectionGap}
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.more} accessibilityLabel={ui.notifLoadingMoreA11y}>
                <ActivityIndicator color={themeUi.brand} />
              </View>
            ) : null
          }
        />
      </ScreenState>
    </CustomerListShell>
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: TAB_BAR_SCROLL_PAD },
  filterWrap: { marginHorizontal: -spacing.md },
  sectionTitle: { ...typeScale.label, color: themeUi.textTertiary, marginTop: spacing.sm, marginLeft: 4 },
  sectionGap: { height: 10 },
  more: { paddingVertical: spacing.md, alignItems: 'center' },
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: themeUi.brandSoft,
    borderWidth: 1,
    borderColor: themeUi.hairline,
    paddingHorizontal: 14,
    minHeight: 40,
    borderRadius: radii.pill,
  },
  markAllText: { ...typeScale.captionStrong, fontFamily: typeScale.button.fontFamily, color: themeUi.brand },
});

import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminListShell, AdminSectionTitle, adminListShellStyles } from '@/components/kit/AdminListShell';
import { JobVisitCard } from '@/components/kit/JobVisitCard';
import { MetricDetailSheet } from '@/components/kit/MetricDetailSheet';
import { TechnicianAnalyticsTab } from '@/components/kit/TechnicianAnalyticsTab';
import { TechnicianDayCalendar } from '@/components/kit/TechnicianDayCalendar';
import {
  TechnicianProfileHeader,
  TechnicianReviewCard,
  type TechnicianViewMode,
} from '@/components/kit/TechnicianProfileKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { type BadgeTone } from '@/components/ui/StatusBadge';
import { api, screenLoadConfig } from '@/lib/api';
import { localDateKey } from '@/lib/dates';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { paramString } from '@/lib/routeParams';
import { buildMetricDetailRows, metricSheetMeta } from '@/lib/technician-metrics';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { isAccountDisabled } from '@/lib/user-helpers';
import type { Booking, TechnicianDetailResponse, TechnicianMetricKey, User } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

type MetricSheetState = {
  visible: boolean;
  key: TechnicianMetricKey;
  weekIndex?: number;
};

function techStatus(u: User): { label: string; tone: BadgeTone } {
  if (u.disabled === true) return { label: 'Disabled', tone: 'danger' };
  if (u.available === false) return { label: 'Off duty', tone: 'warning' };
  return { label: 'Available', tone: 'success' };
}

type JobSection = { key: string; title: string; data: Booking[] };

function groupBookings(
  bookings: Booking[],
  today: string,
  statusFilter?: string | null,
): JobSection[] {
  let scoped = bookings;
  if (statusFilter === 'active') {
    scoped = bookings.filter((b) =>
      ['confirmed', 'in_progress', 'awaiting_verification'].includes(b.status),
    );
  } else if (statusFilter) {
    scoped = bookings.filter((b) => b.status === statusFilter);
  }

  const active = scoped.filter((b) => !['completed', 'cancelled'].includes(b.status));
  const past = scoped.filter((b) => ['completed', 'cancelled'].includes(b.status));
  const todayJobs = active.filter((b) => b.schedule.date === today);
  const upcoming = active.filter((b) => b.schedule.date > today);
  const sections: JobSection[] = [];
  if (todayJobs.length) {
    sections.push({ key: 'today', title: `Today (${todayJobs.length})`, data: todayJobs });
  }
  if (upcoming.length) {
    sections.push({ key: 'upcoming', title: `Upcoming (${upcoming.length})`, data: upcoming });
  }
  if (past.length) {
    sections.push({ key: 'past', title: `Past (${past.length})`, data: past });
  }
  if (statusFilter && sections.length === 0 && scoped.length > 0) {
    sections.push({ key: 'filtered', title: `Filtered (${scoped.length})`, data: scoped });
  }
  return sections;
}

export default function AdminTechnicianDetailScreen() {
  const id = paramString(useLocalSearchParams<{ id: string | string[] }>().id);
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();
  const [detail, setDetail] = useState<TechnicianDetailResponse | null>(null);
  const [viewMode, setViewMode] = useState<TechnicianViewMode>('calendar');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [listStatusFilter, setListStatusFilter] = useState<string | null>(null);
  const [metricSheet, setMetricSheet] = useState<MetricSheetState>({
    visible: false,
    key: 'active',
  });

  const load = useCallback(async () => {
    if (!id) throw new Error('Technician not found');
    const { data } = await api.get<TechnicianDetailResponse>(
      `/admin/technicians/${id}/detail`,
      { ...screenLoadConfig, params: { month } },
    );
    setDetail(data);
  }, [id, month]);

  useFocusEffect(
    useCallback(() => {
      void runLoad(load, 'Could not load technician');
    }, [load, runLoad]),
  );

  const today = localDateKey();
  const sections = useMemo(
    () => (detail ? groupBookings(detail.bookings, today, listStatusFilter) : []),
    [detail, today, listStatusFilter],
  );

  function openMetric(key: TechnicianMetricKey, weekIndex?: number) {
    setViewMode('analytics');
    setMetricSheet({ visible: true, key, weekIndex });
  }

  function closeMetricSheet() {
    setMetricSheet((s) => ({ ...s, visible: false }));
  }

  function openBooking(bookingId: string) {
    closeMetricSheet();
    router.push(`/(admin)/booking/${bookingId}`);
  }

  function viewInList(status?: string) {
    closeMetricSheet();
    if (status) {
      setListStatusFilter(status);
      setViewMode('list');
    }
  }

  function overrideAttendance(date: string) {
    if (!id) return;
    Alert.alert('Update attendance', date, [
      {
        text: 'Mark came',
        onPress: () =>
          void api
            .put(`/admin/technicians/${id}/attendance/${date}`, { status: 'present' })
            .then(() => {
              Toast.show({ type: 'success', text1: 'Marked as came' });
              return load();
            }),
      },
      {
        text: 'Did not come',
        onPress: () =>
          void api
            .put(`/admin/technicians/${id}/attendance/${date}`, { status: 'absent' })
            .then(() => {
              Toast.show({ type: 'success', text1: 'Marked as absent' });
              return load();
            }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function handleViewModeChange(mode: TechnicianViewMode) {
    if (mode === 'list') setListStatusFilter(null);
    setViewMode(mode);
  }

  if (loading && !detail) return <Spinner fullScreen />;

  if (error || !detail) {
    return (
      <AdminListShell title="Technician" subtitle="Error">
        <ListEmptyRetry message={error ?? 'Technician not found'} onRetry={() => void reload(load, error ?? undefined)} />
      </AdminListShell>
    );
  }

  const { technician, stats, reviews, calendar, bookings, attendance = {} } = detail;
  const st = techStatus(technician);
  const isDisabled = isAccountDisabled(technician);
  const awaitingVerify = bookings.filter((b) => b.status === 'awaiting_verification').length;
  const inProgress = bookings.filter((b) => b.status === 'in_progress').length;

  const sheetMeta = metricSheetMeta(metricSheet.key, detail, metricSheet.weekIndex);
  const sheetRows = buildMetricDetailRows(
    metricSheet.key,
    detail,
    metricSheet.weekIndex,
    openBooking,
  );

  const profileHeader = (
    <TechnicianProfileHeader
      technician={technician}
      stats={stats}
      inProgress={inProgress}
      awaitingVerify={awaitingVerify}
      statusLabel={st.label}
      statusTone={st.tone}
      isDisabled={isDisabled}
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      onMetricPress={openMetric}
      compact={viewMode === 'analytics'}
      onCall={technician.phone ? () => void Linking.openURL(`tel:${technician.phone}`) : undefined}
      onEdit={() => router.push({ pathname: '/(admin)/user-edit', params: { id: technician.id } })}
      onPending={() => router.push('/(admin)/bookings?status=pending')}
      onAssign={() => router.push('/(admin)/bookings')}
    />
  );

  const scrollContentStyle = styles.scrollBody;

  const metricSheetEl = (
    <MetricDetailSheet
      visible={metricSheet.visible}
      title={sheetMeta.title}
      message={sheetMeta.message}
      rows={sheetRows}
      onClose={closeMetricSheet}
      actionLabel={sheetMeta.actionLabel}
      onAction={() => {
        if (metricSheet.key === 'pending_global') {
          closeMetricSheet();
          router.push('/(admin)/bookings?status=pending');
          return;
        }
        if (sheetMeta.listStatus) {
          viewInList(sheetMeta.listStatus);
        }
      }}
    />
  );

  const reviewsBlock =
    reviews.length > 0 ? (
      <View style={styles.reviewsBlock}>
        <AdminSectionTitle title="Recent reviews" hint="Customer feedback for this technician" />
        {reviews.map((r) => (
          <TechnicianReviewCard key={r.id} stars={r.stars} comment={r.comment} tags={r.tags} />
        ))}
      </View>
    ) : null;

  if (viewMode === 'analytics') {
    return (
      <>
        <AdminListShell title={technician.name} subtitle="Technician profile">
          <ScrollView
            style={styles.flexList}
            contentContainerStyle={scrollContentStyle}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.profileWrap}>{profileHeader}</View>
            <TechnicianAnalyticsTab
              detail={detail}
              month={month}
              today={today}
              onMonthChange={setMonth}
              onMetricPress={openMetric}
              onOpenBooking={openBooking}
            />
          </ScrollView>
        </AdminListShell>
        {metricSheetEl}
      </>
    );
  }

  if (viewMode === 'calendar') {
    return (
      <>
        <AdminListShell title={technician.name} subtitle="Technician profile">
          <ScrollView
            style={styles.flexList}
            contentContainerStyle={scrollContentStyle}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.profileWrap}>{profileHeader}</View>
            <AdminSectionTitle title="Schedule" hint="Tap a day to view jobs or update attendance" />
            <View style={styles.calendarWrap}>
              <TechnicianDayCalendar
                calendar={calendar}
                attendance={attendance}
                bookings={bookings}
                onPressBooking={openBooking}
                onPressDay={overrideAttendance}
                monthKey={month}
                onMonthChange={setMonth}
              />
            </View>
            {reviewsBlock}
          </ScrollView>
        </AdminListShell>
        {metricSheetEl}
      </>
    );
  }

  return (
    <>
      <AdminListShell title={technician.name} subtitle="Technician profile">
        <SectionList
          style={styles.flexList}
          sections={sections}
          keyExtractor={(b) => b.id}
          {...ADMIN_LIST_PERF}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <>
              <View style={styles.profileWrap}>{profileHeader}</View>
              {listStatusFilter ? (
                <View style={styles.filterBar}>
                  <Text style={styles.filterText}>Filtered by status</Text>
                  <Pressable onPress={() => setListStatusFilter(null)}>
                    <Text style={styles.filterClear}>Clear</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
          }
          contentContainerStyle={
            sections.length === 0
              ? [adminListShellStyles.empty, { paddingBottom: TAB_BAR_PAD }]
              : [adminListShellStyles.list, { paddingBottom: TAB_BAR_PAD }]
          }
          ListEmptyComponent={
            <EmptyState
              title={listStatusFilter ? 'No jobs in this filter' : 'No jobs assigned yet'}
              message={
                listStatusFilter
                  ? 'Try clearing the filter or pick another status from Analytics.'
                  : 'Assign this technician from the Bookings tab when a customer booking is confirmed.'
              }
            />
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <JobVisitCard booking={item} today={today} onPress={() => openBooking(item.id)} />
          )}
          ListFooterComponent={reviewsBlock}
        />
      </AdminListShell>
      {metricSheetEl}
    </>
  );
}

const TAB_BAR_PAD = 96;

const styles = StyleSheet.create({
  flexList: { flex: 1 },
  scrollBody: { paddingBottom: TAB_BAR_PAD },
  profileWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  calendarWrap: { paddingHorizontal: spacing.md },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.secondarySoft,
    marginHorizontal: spacing.md,
  },
  filterText: { fontFamily: fonts.body, fontSize: 12, color: colors.secondaryInk },
  filterClear: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  sectionHeader: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.forest,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  reviewsBlock: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.lg },
});

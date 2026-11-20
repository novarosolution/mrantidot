import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {
  AdminEntrance,
  AdminListShell,
  AdminSectionTitle,
  useListEntrance,
} from '@/components/kit/AdminListShell';
import { AdminProfileSkeleton } from '@/components/kit/AdminSkeletons';
import { JobVisitCard } from '@/components/kit/JobVisitCard';
import { MetricDetailSheet } from '@/components/kit/MetricDetailSheet';
import { AdminActionSheet } from '@/components/kit/AdminActionSheet';
import { chooseAsync } from '@/lib/confirm';
import { TechnicianAnalyticsTab } from '@/components/kit/TechnicianAnalyticsTab';
import { TechnicianDayCalendar } from '@/components/kit/TechnicianDayCalendar';
import {
  TechnicianProfileHeader,
  TechnicianReviewCard,
  type TechnicianViewMode,
} from '@/components/kit/TechnicianProfileKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { type BadgeTone } from '@/components/ui/StatusBadge';
import { api, screenLoadConfig } from '@/lib/api';
import { localDateKey } from '@/lib/dates';
import { haptic } from '@/lib/motion';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { adminRoutes, appPush } from '@/lib/routes';
import { paramString } from '@/lib/routeParams';
import { buildMetricDetailRows, metricSheetMeta } from '@/lib/technician-metrics';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { isAccountDisabled } from '@/lib/user-helpers';
import type { Booking, TechnicianDetailResponse, TechnicianMetricKey, User } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

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
  const [month, setMonth] = useState(() => localDateKey().slice(0, 7));
  const [listStatusFilter, setListStatusFilter] = useState<string | null>(null);
  /** Web only — the day whose attendance sheet is open (browsers have no multi-button alert). */
  const [attendanceDate, setAttendanceDate] = useState<string | null>(null);
  const [metricSheet, setMetricSheet] = useState<MetricSheetState>({
    visible: false,
    key: 'active',
  });
  // Sections animate on the first paint only — switching Calendar / Analytics / List (which
  // remounts parts of the tree) never replays them. Job rows stagger on the first List visit.
  const firstPaint = useListEntrance(Boolean(detail));
  const entrance = useListEntrance(Boolean(detail) && viewMode === 'list');

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
    appPush(adminRoutes.booking(bookingId));
  }

  function viewInList(status?: string) {
    closeMetricSheet();
    if (status) {
      setListStatusFilter(status);
      setViewMode('list');
    }
  }

  function setAttendance(date: string, status: 'present' | 'absent') {
    if (!id) return;
    void api
      .put(`/admin/technicians/${id}/attendance/${date}`, { status })
      .then(() => {
        haptic('success');
        Toast.show({ type: 'success', text1: status === 'present' ? 'Marked as came' : 'Marked as absent' });
        return load();
      })
      .catch(() => haptic('error'));
  }

  function overrideAttendance(date: string) {
    if (!id) return;
    if (Platform.OS === 'web') {
      setAttendanceDate(date);
      return;
    }
    void chooseAsync({
      title: 'Update attendance',
      message: date,
      options: [
        { label: 'Mark came', value: 'present' },
        { label: 'Absent', value: 'absent' },
      ],
    }).then((status) => {
      if (status) setAttendance(date, status);
    });
  }

  function handleViewModeChange(mode: TechnicianViewMode) {
    if (mode !== viewMode) haptic('select');
    if (mode === 'list') setListStatusFilter(null);
    setViewMode(mode);
  }

  if (loading && !detail) {
    return (
      <AdminListShell title="Technician" subtitle="Technician profile" backFallback={adminRoutes.technicians}>
        <AdminProfileSkeleton variant="technician" />
      </AdminListShell>
    );
  }

  if (error || !detail) {
    return (
      <AdminListShell title="Technician" subtitle="Error" backFallback={adminRoutes.technicians}>
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
      onEdit={() =>
        appPush({
          pathname: adminRoutes.userEdit,
          params: { id: technician.id, returnTo: adminRoutes.technician(technician.id) },
        })
      }
      onPending={() => appPush(adminRoutes.bookingsFiltered({ status: 'pending' }))}
      onAssign={() => appPush(adminRoutes.bookings)}
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
          appPush(adminRoutes.bookingsFiltered({ status: 'pending' }));
          return;
        }
        if (sheetMeta.listStatus) {
          viewInList(sheetMeta.listStatus);
        }
      }}
    />
  );

  const attendanceSheetEl =
    Platform.OS === 'web' ? (
      <AdminActionSheet
        visible={attendanceDate != null}
        title="Update attendance"
        message={attendanceDate ?? undefined}
        onClose={() => setAttendanceDate(null)}
        options={[
          { key: 'present', label: 'Mark came', onPress: () => attendanceDate && setAttendance(attendanceDate, 'present') },
          { key: 'absent', label: 'Absent', onPress: () => attendanceDate && setAttendance(attendanceDate, 'absent') },
        ]}
      />
    ) : null;

  const reviewsBlock =
    reviews.length > 0 ? (
      <AdminEntrance index={3} play={firstPaint(3)}>
        <View style={styles.reviewsBlock}>
          {/* flush: the block already carries the 16pt gutter (the title used to sit at 32pt). */}
          <AdminSectionTitle flush title="Recent reviews" hint="Customer feedback for this technician" />
          {reviews.map((r) => (
            <TechnicianReviewCard key={r.id} stars={r.stars} comment={r.comment} tags={r.tags} />
          ))}
        </View>
      </AdminEntrance>
    ) : null;

  const profileBlock = (
    <AdminEntrance index={0} play={firstPaint(0)}>
      <View style={styles.profileWrap}>{profileHeader}</View>
    </AdminEntrance>
  );

  if (viewMode === 'analytics') {
    return (
      <>
        <AdminListShell title={technician.name} subtitle="Technician profile" backFallback={adminRoutes.technicians}>
          <ScrollView
            style={styles.flexList}
            contentContainerStyle={scrollContentStyle}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {profileBlock}
            <AdminEntrance index={1} play={firstPaint(1)}>
              <TechnicianAnalyticsTab
                detail={detail}
                month={month}
                today={today}
                onMonthChange={setMonth}
                onMetricPress={openMetric}
                onOpenBooking={openBooking}
              />
            </AdminEntrance>
          </ScrollView>
        </AdminListShell>
        {metricSheetEl}
        {attendanceSheetEl}
      </>
    );
  }

  if (viewMode === 'calendar') {
    return (
      <>
        <AdminListShell title={technician.name} subtitle="Technician profile" backFallback={adminRoutes.technicians}>
          <ScrollView
            style={styles.flexList}
            contentContainerStyle={scrollContentStyle}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {profileBlock}
            <AdminEntrance index={1} play={firstPaint(1)}>
              <AdminSectionTitle title="Schedule" hint="Tap a day to view jobs or update attendance" />
            </AdminEntrance>
            <AdminEntrance index={2} play={firstPaint(2)}>
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
            </AdminEntrance>
            {reviewsBlock}
          </ScrollView>
        </AdminListShell>
        {metricSheetEl}
        {attendanceSheetEl}
      </>
    );
  }

  return (
    <>
      <AdminListShell title={technician.name} subtitle="Technician profile" backFallback={adminRoutes.technicians}>
        <SectionList
          style={styles.flexList}
          sections={sections}
          keyExtractor={(b) => b.id}
          {...ADMIN_LIST_PERF}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <>
              {profileBlock}
              {listStatusFilter ? (
                <View style={styles.filterBar}>
                  <Text style={styles.filterText}>Filtered by status</Text>
                  <Pressable
                    onPress={() => setListStatusFilter(null)}
                    hitSlop={8}
                    style={({ pressed }) => pressed && styles.clearPressed}
                    accessibilityRole="button"
                    accessibilityLabel="Clear status filter"
                  >
                    <Text style={styles.filterClear}>Clear</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
          }
          // No side padding on the container: the profile header, filter bar, section headers and
          // rows each bring their own 16pt gutter, matching the calendar and analytics views.
          contentContainerStyle={[styles.scrollBody, sections.length === 0 && styles.emptyGrow]}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                title={listStatusFilter ? 'No jobs in this filter' : 'No jobs assigned yet'}
                message={
                  listStatusFilter
                    ? 'Try clearing the filter or pick another status from Analytics.'
                    : 'Assign this technician from the Bookings tab when a customer booking is confirmed.'
                }
              />
            </View>
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item, index }) => (
            <View style={styles.rowGutter}>
              <AdminEntrance index={index + 1} play={entrance(index)}>
                <JobVisitCard booking={item} today={today} onPress={() => openBooking(item.id)} />
              </AdminEntrance>
            </View>
          )}
          ListFooterComponent={reviewsBlock}
        />
      </AdminListShell>
      {metricSheetEl}
      {attendanceSheetEl}
    </>
  );
}

const TAB_BAR_PAD = 96;

const styles = StyleSheet.create({
  flexList: { flex: 1 },
  scrollBody: { paddingBottom: TAB_BAR_PAD },
  emptyGrow: { flexGrow: 1 },
  emptyWrap: { flex: 1, paddingHorizontal: spacing.md },
  rowGutter: { paddingHorizontal: spacing.md },
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    marginHorizontal: spacing.md,
  },
  filterText: { fontFamily: fonts.body, fontSize: 12, color: colors.secondaryInk },
  filterClear: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  clearPressed: { opacity: 0.6 },
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

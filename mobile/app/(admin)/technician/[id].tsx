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
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { JobVisitCard } from '@/components/kit/JobVisitCard';
import { MetricDetailSheet } from '@/components/kit/MetricDetailSheet';
import { TechnicianAnalyticsTab } from '@/components/kit/TechnicianAnalyticsTab';
import { TechnicianDayCalendar } from '@/components/kit/TechnicianDayCalendar';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { RatingStars } from '@/components/ui/RatingStars';
import { Spinner } from '@/components/ui/Spinner';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { api, screenLoadConfig } from '@/lib/api';
import { localDateKey } from '@/lib/dates';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { paramString } from '@/lib/routeParams';
import {
  buildMetricDetailRows,
  metricSheetMeta,
} from '@/lib/technician-metrics';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { isAccountDisabled } from '@/lib/user-helpers';
import type { Booking, Review, TechnicianDetailResponse, TechnicianMetricKey, User } from '@/types/api';
import { colors, fonts, spacing, surfaces } from '@/constants/theme';

type ViewMode = 'calendar' | 'list' | 'analytics';

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
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
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

  const summary = (
    <View style={styles.summary}>
      <View style={styles.statusRow}>
        <StatusBadge label={st.label} tone={st.tone} />
        {isDisabled ? <Text style={styles.disabledHint}>Account disabled</Text> : null}
      </View>
      <Text style={styles.meta}>{technician.email}</Text>
      {technician.phone ? <Text style={styles.meta}>{technician.phone}</Text> : null}
      {technician.city ? <Text style={styles.meta}>{technician.city}</Text> : null}
      <View style={styles.statsGrid}>
        <Pressable style={styles.statBox} onPress={() => setViewMode('list')}>
          <Text style={styles.statVal}>
            {technician.rating && technician.rating > 0 ? `★ ${technician.rating.toFixed(1)}` : '—'}
          </Text>
          <Text style={styles.statLabel}>Rating</Text>
        </Pressable>
        <Pressable style={styles.statBox} onPress={() => openMetric('active')}>
          <Text style={styles.statVal}>{stats.activeJobs}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </Pressable>
        <Pressable style={styles.statBox} onPress={() => openMetric('in_progress')}>
          <Text style={styles.statVal}>{inProgress}</Text>
          <Text style={styles.statLabel}>In progress</Text>
        </Pressable>
        <Pressable style={styles.statBox} onPress={() => openMetric('verify')}>
          <Text style={styles.statVal}>{awaitingVerify}</Text>
          <Text style={styles.statLabel}>Verify</Text>
        </Pressable>
        <Pressable style={styles.statBox} onPress={() => openMetric('completed')}>
          <Text style={styles.statVal}>{stats.completedJobs}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </Pressable>
        <Pressable style={styles.statBox} onPress={() => openMetric('earnings')}>
          <Text style={styles.statVal}>₹{stats.earnings}</Text>
          <Text style={styles.statLabel}>Earnings</Text>
        </Pressable>
      </View>
      <Text style={styles.metaLine}>
        {stats.totalJobs} total jobs
        {stats.lastJobDate ? ` · Last job ${stats.lastJobDate}` : ''}
        {stats.reviewCount > 0 ? ` · ${stats.reviewCount} reviews` : ''}
      </Text>
      <View style={styles.actions}>
        {technician.phone ? (
          <Pressable onPress={() => void Linking.openURL(`tel:${technician.phone}`)}>
            <Text style={styles.link}>Call</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => router.push({ pathname: '/(admin)/user-edit', params: { id: technician.id } })}
        >
          <Text style={styles.link}>Edit account</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(admin)/bookings?status=pending')}>
          <Text style={styles.link}>Pending bookings</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(admin)/bookings')}>
          <Text style={styles.link}>Assign from bookings</Text>
        </Pressable>
      </View>
      <View style={styles.modeRow}>
        <Chip label="Calendar" selected={viewMode === 'calendar'} onPress={() => setViewMode('calendar')} />
        <Chip
          label="List"
          selected={viewMode === 'list'}
          onPress={() => {
            setListStatusFilter(null);
            setViewMode('list');
          }}
        />
        <Chip label="Analytics" selected={viewMode === 'analytics'} onPress={() => setViewMode('analytics')} />
      </View>
    </View>
  );

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

  if (viewMode === 'analytics') {
    return (
      <>
        <AdminListShell title={technician.name} subtitle="Technician profile" headerExtra={summary}>
          <ScrollView
            contentContainerStyle={styles.scrollBody}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
            }
          >
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
        <AdminListShell title={technician.name} subtitle="Technician profile" headerExtra={summary}>
          <ScrollView
            contentContainerStyle={styles.scrollBody}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
            }
          >
            <TechnicianDayCalendar
              calendar={calendar}
              attendance={attendance}
              bookings={bookings}
              onPressBooking={openBooking}
              onPressDay={overrideAttendance}
              monthKey={month}
              onMonthChange={setMonth}
            />
            {reviews.length > 0 ? (
              <View style={styles.reviewsBlock}>
                <Text style={styles.sectionTitle}>Recent reviews</Text>
                {reviews.map((r) => (
                  <ReviewRow key={r.id} review={r} />
                ))}
              </View>
            ) : null}
          </ScrollView>
        </AdminListShell>
        {metricSheetEl}
      </>
    );
  }

  return (
    <>
      <AdminListShell title={technician.name} subtitle="Technician profile" headerExtra={summary}>
        {listStatusFilter ? (
          <View style={styles.filterBar}>
            <Text style={styles.filterText}>Filtered by status</Text>
            <Pressable onPress={() => setListStatusFilter(null)}>
              <Text style={styles.link}>Clear</Text>
            </Pressable>
          </View>
        ) : null}
        <SectionList
          sections={sections}
          keyExtractor={(b) => b.id}
          {...ADMIN_LIST_PERF}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
          }
          contentContainerStyle={
            sections.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list
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
          ListFooterComponent={
            reviews.length > 0 ? (
              <View style={styles.reviewsBlock}>
                <Text style={styles.sectionTitle}>Recent reviews</Text>
                {reviews.map((r) => (
                  <ReviewRow key={r.id} review={r} />
                ))}
              </View>
            ) : null
          }
        />
      </AdminListShell>
      {metricSheetEl}
    </>
  );
}

function ReviewRow({ review }: { review: Review }) {
  return (
    <View style={styles.reviewCard}>
      <RatingStars value={review.stars} size={16} />
      {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
      {review.tags.length > 0 ? (
        <Text style={styles.reviewTags}>{review.tags.join(' · ')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  disabledHint: { fontFamily: fonts.body, fontSize: 11, color: surfaces.tintDangerInk },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  statBox: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: colors.soft,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  statVal: { fontFamily: fonts.displayExtra, fontSize: 13, color: colors.green },
  statLabel: { fontFamily: fonts.body, fontSize: 9, color: colors.muted, marginTop: 2 },
  metaLine: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 10 },
  link: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.secondaryDark },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    backgroundColor: colors.card,
    padding: 4,
    borderRadius: 14,
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.secondarySoft,
  },
  filterText: { fontFamily: fonts.body, fontSize: 12, color: colors.secondaryInk },
  scrollBody: { padding: spacing.md, paddingBottom: spacing.xl },
  sectionHeader: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.forest,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.ink,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  reviewsBlock: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewComment: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, marginTop: 6 },
  reviewTags: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 4 },
});

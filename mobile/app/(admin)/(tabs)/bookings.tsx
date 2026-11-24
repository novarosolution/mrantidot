import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { TableText, TableTwoLine, type AdminTableColumn } from '@/components/admin/AdminDataTable';
import { FilterButton, FilterRow, FilterSummary, SearchPickerSheet, SegmentedToggle } from '@/components/admin/AdminFilterBar';
import { AdminPagedList, useAdminPagedList } from '@/components/admin/AdminPagedList';
import {
  DateRangePicker,
  FILTER_RANGE_PRESETS,
  formatRangeLabel,
  rangeValueFrom,
  resolveDateRange,
  type DateRangeValue,
} from '@/components/admin/DateRangePicker';
import { formatINR } from '@/components/charts/chartFormat';
import { AdminActionSheet, type ActionSheetOption } from '@/components/kit/AdminActionSheet';
import { AdminBookingListCard } from '@/components/kit/AdminBookingListCard';
import { AdminFilterChips, AdminSearchField } from '@/components/kit/AdminPageKit';
import { AdminScreenHeader } from '@/components/kit/AdminScreenHeader';
import { AdminTabScreen } from '@/components/kit/AdminScreenKit';
import { TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { bookingRef, formatDayKey } from '@/components/kit/format';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { api, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import {
  bookingCustomerName,
  bookingScheduleDisplay,
  bookingServiceName,
  bookingStatusLabel,
} from '@/lib/booking-helpers';
import { notify } from '@/lib/confirm';
import { haptic } from '@/lib/motion';
import { paramString } from '@/lib/routeParams';
import { adminRoutes, appPush } from '@/lib/routes';
import { paymentLabel } from '@/lib/settingsLabels';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';
import { assignableTechnicians } from '@/lib/user-helpers';
import { userInitial } from '@/lib/userInitials';
import { useWideWebLayout } from '@/lib/webAdmin';
import type { AdminBookingsPage, AdminCustomersPage, BookingListStatusCounts, ListSort } from '@/types/adminLists';
import type { Booking, BookingStatus, Service, User } from '@/types/api';

const STATUS_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'awaiting_verification', label: 'Verify' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
] as const;

const STATUS_VALUES = new Set<string>([
  'pending',
  'confirmed',
  'in_progress',
  'awaiting_verification',
  'completed',
  'cancelled',
  'active',
  'live',
  'closed',
]);

type PaymentFilter = '' | 'unpaid' | 'paid' | 'refunded';
type SourceFilter = '' | 'app' | 'website' | 'admin' | 'unknown';
type DateField = 'visit' | 'created' | 'completed';

const SOURCE_LABELS: Record<Exclude<SourceFilter, ''>, string> = {
  app: 'App',
  website: 'Website',
  admin: 'Admin (on behalf)',
  unknown: 'Not recorded',
};

const PAYMENT_FILTER_LABELS: Record<Exclude<PaymentFilter, ''>, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  refunded: 'Refunded',
};

const SORT_OPTIONS: { key: string; label: string; sort: ListSort }[] = [
  { key: 'created-desc', label: 'Newest booked first', sort: { key: 'created', order: 'desc' } },
  { key: 'created-asc', label: 'Oldest booked first', sort: { key: 'created', order: 'asc' } },
  { key: 'visit-asc', label: 'Visit date · soonest', sort: { key: 'visit', order: 'asc' } },
  { key: 'visit-desc', label: 'Visit date · latest', sort: { key: 'visit', order: 'desc' } },
  { key: 'amount-desc', label: 'Amount · highest', sort: { key: 'amount', order: 'desc' } },
  { key: 'amount-asc', label: 'Amount · lowest', sort: { key: 'amount', order: 'asc' } },
];

const DEFAULT_SORT: ListSort = { key: 'created', order: 'desc' };

type Named = { id: string; name: string };

/** Valid status filter from a deep link: a chip key, a group, or a comma list of statuses. */
function parseStatusParam(raw: string | undefined): string {
  if (!raw) return 'all';
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0 || parts.every((p) => p === 'all')) return 'all';
  return parts.every((p) => STATUS_VALUES.has(p)) ? parts.join(',') : 'all';
}

function parseDateField(raw: string | undefined): DateField {
  return raw === 'created' || raw === 'completed' ? raw : 'visit';
}

function statusFilterLabel(status: string): string {
  if (status === 'active') return 'Active';
  if (status === 'live') return 'On site / verify';
  if (status === 'closed') return 'Closed';
  return status
    .split(',')
    .map((s) => bookingStatusLabel(s as BookingStatus))
    .join(', ');
}

function personOf(value: Booking['customer'] | Booking['technician']): User | null {
  return value && typeof value === 'object' ? value : null;
}

function paymentStatusText(b: Booking): { text: string; color: string } | null {
  if (b.status === 'cancelled') return b.paymentStatus === 'refunded' ? { text: 'Refunded', color: ui.textSecondary } : null;
  if (b.paymentStatus === 'paid') return { text: 'Paid', color: colors.forest };
  if (b.paymentStatus === 'refunded') return { text: 'Refunded', color: ui.textSecondary };
  return { text: 'Unpaid', color: b.status === 'completed' ? colors.warning : ui.textTertiary };
}

export default function AdminBookingsScreen() {
  const { user } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const wide = useWideWebLayout();
  const params = useLocalSearchParams<{
    status?: string;
    serviceId?: string;
    technicianId?: string;
    customerId?: string;
    paymentStatus?: string;
    from?: string;
    to?: string;
    q?: string;
    dateField?: string;
  }>();

  const paramValues = useMemo(
    () => ({
      status: paramString(params.status),
      serviceId: paramString(params.serviceId),
      technicianId: paramString(params.technicianId),
      customerId: paramString(params.customerId),
      paymentStatus: paramString(params.paymentStatus),
      from: paramString(params.from),
      to: paramString(params.to),
      q: paramString(params.q),
      dateField: paramString(params.dateField),
    }),
    [
      params.status,
      params.serviceId,
      params.technicianId,
      params.customerId,
      params.paymentStatus,
      params.from,
      params.to,
      params.q,
      params.dateField,
    ],
  );

  const [status, setStatus] = useState(() => parseStatusParam(paramValues.status));
  const [technician, setTechnician] = useState<Named | null>(() =>
    paramValues.technicianId ? { id: paramValues.technicianId, name: paramValues.technicianId === 'unassigned' ? 'Unassigned' : 'Selected' } : null,
  );
  const [customer, setCustomer] = useState<Named | null>(() =>
    paramValues.customerId ? { id: paramValues.customerId, name: 'Selected' } : null,
  );
  const [service, setService] = useState<Named | null>(() =>
    paramValues.serviceId ? { id: paramValues.serviceId, name: 'Selected' } : null,
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentFilter>(() =>
    paramValues.paymentStatus && paramValues.paymentStatus in PAYMENT_FILTER_LABELS ? (paramValues.paymentStatus as PaymentFilter) : '',
  );
  const [dateValue, setDateValue] = useState<DateRangeValue>(() => rangeValueFrom(paramValues.from, paramValues.to));
  const [dateField, setDateField] = useState<DateField>(() => parseDateField(paramValues.dateField));
  const [source, setSource] = useState<SourceFilter>('');
  const [search, setSearch] = useState(paramValues.q ?? '');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [sort, setSort] = useState<ListSort>(DEFAULT_SORT);

  const [techs, setTechs] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [sheet, setSheet] = useState<null | 'technician' | 'service' | 'payment' | 'source' | 'sort' | 'customer'>(null);
  const [assignTarget, setAssignTarget] = useState<Booking | null>(null);
  const countsRef = useRef<BookingListStatusCounts | undefined>(undefined);

  // A new deep link (e.g. from the dashboard) replaces every filter with the ones it carries.
  const paramsKey = JSON.stringify(paramValues);
  const lastParamsKey = useRef(paramsKey);
  useEffect(() => {
    if (lastParamsKey.current === paramsKey) return;
    lastParamsKey.current = paramsKey;
    setStatus(parseStatusParam(paramValues.status));
    setTechnician(
      paramValues.technicianId
        ? { id: paramValues.technicianId, name: paramValues.technicianId === 'unassigned' ? 'Unassigned' : 'Selected' }
        : null,
    );
    setCustomer(paramValues.customerId ? { id: paramValues.customerId, name: 'Selected' } : null);
    setService(paramValues.serviceId ? { id: paramValues.serviceId, name: 'Selected' } : null);
    setPaymentStatus(
      paramValues.paymentStatus && paramValues.paymentStatus in PAYMENT_FILTER_LABELS ? (paramValues.paymentStatus as PaymentFilter) : '',
    );
    setDateValue(rangeValueFrom(paramValues.from, paramValues.to));
    setDateField(parseDateField(paramValues.dateField));
    setSearch(paramValues.q ?? '');
  }, [paramsKey, paramValues]);

  const range = resolveDateRange(dateValue);

  const query = useMemo(() => {
    const q: Record<string, string> = { sort: sort.key, order: sort.order };
    if (status !== 'all') q.status = status;
    if (technician) q.technicianId = technician.id;
    if (customer) q.customerId = customer.id;
    if (service) q.serviceId = service.id;
    if (paymentStatus) q.paymentStatus = paymentStatus;
    if (source) q.source = source;
    if (range) {
      q.from = range.from;
      q.to = range.to;
      q.dateField = dateField;
    }
    const text = debouncedSearch.trim();
    if (text) q.q = text;
    return q;
  }, [sort, status, technician, customer, service, paymentStatus, source, range?.from, range?.to, dateField, debouncedSearch]);

  const fetchPage = useCallback(
    async (page: number, limit: number, opts: { skipCache: boolean }) => {
      const { data } = await api.get<AdminBookingsPage>('/bookings', {
        ...screenLoadConfig,
        params: { ...query, page, limit, ...(page === 1 ? { withCounts: 1 } : {}) },
        ...(opts.skipCache ? { skipCache: true } : { cacheTtlMs: CACHE_TTL.bookingsList }),
      });
      if (data.statusCounts) countsRef.current = data.statusCounts;
      return { items: data.bookings, meta: data, extra: countsRef.current };
    },
    [query],
  );

  const list = useAdminPagedList<Booking, BookingListStatusCounts | undefined>({
    fetchPage,
    deps: [query],
    keyOf: (b) => b.id,
    errorMessage: 'Could not load bookings',
  });

  useStaleFocusRefresh(() => list.refresh(), 3_000);

  // Technicians (assign + filter) and services (filter) — loaded once.
  useEffect(() => {
    let cancelled = false;
    api
      .get<{ technicians: User[] }>('/admin/technicians', { ...screenLoadConfig, cacheTtlMs: CACHE_TTL.profile })
      .then(({ data }) => {
        if (!cancelled) setTechs(data.technicians);
      })
      .catch(() => {
        if (!cancelled) Toast.show({ type: 'info', text1: 'Could not load technicians' });
      });
    api
      .get<{ services: Service[] }>('/services', {
        ...screenLoadConfig,
        params: { includeInactive: 1 },
        cacheTtlMs: CACHE_TTL.services,
      })
      .then(({ data }) => {
        if (!cancelled) setServices(data.services ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // Names for ids that came from a deep link.
  useEffect(() => {
    if (technician && technician.name === 'Selected') {
      const t = techs.find((x) => x.id === technician.id);
      if (t) setTechnician({ id: t.id, name: t.name });
    }
  }, [techs, technician]);
  useEffect(() => {
    if (service && service.name === 'Selected') {
      const s = services.find((x) => x.id === service.id);
      if (s) setService({ id: s.id, name: s.name });
    }
  }, [services, service]);
  useEffect(() => {
    if (customer && customer.name === 'Selected') {
      const found = list.items.map((b) => personOf(b.customer)).find((c) => c?.id === customer.id);
      if (found) setCustomer({ id: found.id, name: found.name });
    }
  }, [list.items, customer]);

  const counts = list.extra;
  const statusChips = STATUS_CHIPS.map((c) => ({
    key: c.key,
    label: counts ? `${c.label} ${counts[c.key as keyof BookingListStatusCounts] ?? 0}` : c.label,
  }));
  const chipSelected = STATUS_CHIPS.some((c) => c.key === status) ? status : '';

  const clearAll = useCallback(() => {
    setStatus('all');
    setTechnician(null);
    setCustomer(null);
    setService(null);
    setPaymentStatus('');
    setSource('');
    setDateValue({ preset: 'all' });
    setDateField('visit');
    setSearch('');
  }, []);

  const summaryParts = useMemo(() => {
    const parts: string[] = [];
    if (status !== 'all') parts.push(statusFilterLabel(status));
    if (range) {
      const field = dateField === 'visit' ? 'visit' : dateField === 'created' ? 'booked' : 'completed';
      parts.push(`${formatRangeLabel(range)} (${field})`);
    }
    if (technician) parts.push(technician.id === 'unassigned' ? 'Unassigned' : technician.name);
    if (customer) parts.push(customer.name === 'Selected' ? 'One customer' : customer.name);
    if (service) parts.push(service.name === 'Selected' ? 'One service' : service.name);
    if (paymentStatus) parts.push(PAYMENT_FILTER_LABELS[paymentStatus]);
    if (source) parts.push(`From ${SOURCE_LABELS[source].toLowerCase()}`);
    if (debouncedSearch.trim()) parts.push(`“${debouncedSearch.trim()}”`);
    return parts;
  }, [status, range, dateField, technician, customer, service, paymentStatus, source, debouncedSearch]);

  const openBooking = useCallback((id: string) => appPush(adminRoutes.booking(id)), []);

  const assign = useCallback(
    (booking: Booking) => {
      if (assignableTechnicians(techs, booking.schedule?.date).length === 0) {
        notify('No technicians available', 'Everyone is disabled or off duty for this visit.');
        return;
      }
      setAssignTarget(booking);
    },
    [techs],
  );

  const assignOptions = useMemo<ActionSheetOption[]>(() => {
    if (!assignTarget) return [];
    return assignableTechnicians(techs, assignTarget.schedule?.date).map((t) => ({
      key: t.id,
      label: t.name,
      subtitle: [t.available === false ? 'Off duty today' : '', t.phone || t.email].filter(Boolean).join(' · ') || undefined,
      onPress: () => {
        void (async () => {
          try {
            await api.patch(`/bookings/${assignTarget.id}/assign`, { technicianId: t.id });
            haptic('success');
            Toast.show({ type: 'success', text1: 'Technician assigned' });
            await list.refresh();
          } catch {
            // interceptor toast
            haptic('error');
          }
        })();
      },
    }));
  }, [assignTarget, techs, list]);

  const technicianOptions = useMemo<ActionSheetOption[]>(
    () => [
      { key: 'any', label: 'Any technician', onPress: () => setTechnician(null) },
      { key: 'unassigned', label: 'Unassigned', subtitle: 'No technician yet', onPress: () => setTechnician({ id: 'unassigned', name: 'Unassigned' }) },
      ...techs.map((t) => ({
        key: t.id,
        label: t.name,
        subtitle: [t.disabled ? 'Disabled' : t.available === false ? 'Off duty' : '', t.phone].filter(Boolean).join(' · ') || undefined,
        onPress: () => setTechnician({ id: t.id, name: t.name }),
      })),
    ],
    [techs],
  );

  const serviceOptions = useMemo<ActionSheetOption[]>(
    () => [
      { key: 'any', label: 'Any service', onPress: () => setService(null) },
      ...services.map((s) => ({
        key: s.id,
        label: s.name,
        subtitle: s.active === false ? 'Hidden from customers' : undefined,
        onPress: () => setService({ id: s.id, name: s.name }),
      })),
    ],
    [services],
  );

  const paymentOptions: ActionSheetOption[] = [
    { key: 'any', label: 'Any payment status', onPress: () => setPaymentStatus('') },
    { key: 'unpaid', label: 'Unpaid', subtitle: 'Includes bookings saved before payment tracking', onPress: () => setPaymentStatus('unpaid') },
    { key: 'paid', label: 'Paid', onPress: () => setPaymentStatus('paid') },
    { key: 'refunded', label: 'Refunded', onPress: () => setPaymentStatus('refunded') },
  ];

  const sourceOptions: ActionSheetOption[] = [
    { key: 'any', label: 'Any source', onPress: () => setSource('') },
    { key: 'app', label: 'App', subtitle: 'Booked in the customer app', onPress: () => setSource('app') },
    { key: 'website', label: 'Website', subtitle: 'Booked on mrantidot.com', onPress: () => setSource('website') },
    { key: 'admin', label: 'Admin (on behalf)', subtitle: 'Created by an admin for a customer', onPress: () => setSource('admin') },
    { key: 'unknown', label: 'Not recorded', subtitle: 'Older bookings saved before the source was tracked', onPress: () => setSource('unknown') },
  ];

  const sortOptions: ActionSheetOption[] = SORT_OPTIONS.map((o) => ({
    key: o.key,
    label: o.label,
    subtitle: o.sort.key === sort.key && o.sort.order === sort.order ? 'Current' : undefined,
    onPress: () => setSort(o.sort),
  }));
  const sortLabel = SORT_OPTIONS.find((o) => o.sort.key === sort.key && o.sort.order === sort.order)?.label;

  const searchCustomers = useCallback(async (q: string) => {
    const { data } = await api.get<AdminCustomersPage>('/admin/customers', {
      ...screenLoadConfig,
      params: { q: q || undefined, limit: 20, sort: q ? 'name' : 'last' },
    });
    return data.customers;
  }, []);

  const columns = useMemo<AdminTableColumn<Booking>[]>(
    () => [
      {
        key: 'created',
        title: 'Booking',
        width: 128,
        sortable: true,
        render: (b) => (
          <TableTwoLine
            title={<Text style={styles.ref}>{bookingRef(b.id)}</Text>}
            sub={
              [
                b.createdAt ? formatDayKey(b.createdAt.slice(0, 10)) : '',
                b.source === 'admin' ? `by ${b.createdByAdmin?.name ?? 'admin'}` : b.source === 'website' ? 'Website' : b.source === 'app' ? 'App' : '',
              ]
                .filter(Boolean)
                .join(' · ') || undefined
            }
          />
        ),
      },
      {
        key: 'service',
        title: 'Service',
        flex: 1.4,
        minWidth: 150,
        render: (b) => (
          <TableTwoLine
            title={bookingServiceName(b)}
            sub={[b.option?.label, b.propertyTypeLabel].filter(Boolean).join(' · ') || undefined}
          />
        ),
      },
      {
        key: 'customer',
        title: 'Customer',
        flex: 1.2,
        minWidth: 130,
        render: (b) => <TableTwoLine title={bookingCustomerName(b)} sub={personOf(b.customer)?.phone} strong={false} />,
      },
      {
        key: 'visit',
        title: 'Visit',
        width: 158,
        sortable: true,
        defaultOrder: 'asc',
        render: (b) => <TableText lines={2}>{bookingScheduleDisplay(b)}</TableText>,
      },
      {
        key: 'technician',
        title: 'Technician',
        flex: 1,
        minWidth: 140,
        render: (b) => {
          const tech = personOf(b.technician);
          return (
            <View style={styles.techCell}>
              {tech ? (
                <TableText>{tech.name}</TableText>
              ) : (
                <TableText color={b.status === 'cancelled' || b.status === 'completed' ? ui.textTertiary : colors.warning}>
                  Unassigned
                </TableText>
              )}
              {b.status === 'confirmed' ? (
                <Button
                  title={tech ? 'Reassign' : 'Assign'}
                  variant={tech ? 'outline' : 'premium'}
                  size="sm"
                  fullWidth={false}
                  style={styles.assignBtn}
                  onPress={() => assign(b)}
                />
              ) : null}
            </View>
          );
        },
      },
      { key: 'status', title: 'Status', width: 158, render: (b) => <StatusPill status={b.status} /> },
      {
        key: 'payment',
        title: 'Payment',
        width: 132,
        render: (b) => {
          const pay = paymentStatusText(b);
          return (
            <View style={styles.twoLine}>
              <TableText muted>{paymentLabel(b.paymentMethod)}</TableText>
              {pay ? <Text style={[styles.payStatus, { color: pay.color }]}>{pay.text}</Text> : null}
            </View>
          );
        },
      },
      {
        key: 'amount',
        title: 'Amount',
        width: 112,
        align: 'right',
        sortable: true,
        render: (b) => <TableText strong>{b.amount?.total != null ? formatINR(b.amount.total) : '—'}</TableText>,
      },
    ],
    [assign],
  );

  const header = (
    <AdminScreenHeader
      title="Bookings"
      subtitle={`${counts?.all ?? list.total} total · assign & track`}
      eyebrow="BOOKINGS"
      userInitial={userInitial(user?.name)}
      unreadCount={unreadCount}
    />
  );

  const filters = (
    <View style={styles.filters}>
      <View style={styles.toolbar}>
        <View style={styles.searchCol}>
          <AdminSearchField value={search} onChangeText={setSearch} placeholder="Search ref, customer, phone, service" />
        </View>
        <View style={styles.newBtnWrap}>
          <Button
            title={wide ? 'New booking' : 'New'}
            variant="premium"
            size="sm"
            fullWidth={false}
            onPress={() =>
              appPush(customer && customer.name !== 'Selected' ? adminRoutes.bookingCreateFor(customer.id) : adminRoutes.bookingCreate)
            }
          />
        </View>
      </View>
      <AdminFilterChips chips={statusChips} selected={chipSelected} onSelect={setStatus} />
      <DateRangePicker
        value={dateValue}
        onChange={(next) => setDateValue(next)}
        presets={FILTER_RANGE_PRESETS}
        allowFuture
        caption={false}
      />
      {range ? (
        <SegmentedToggle<DateField>
          label="Dates by"
          options={[
            { value: 'visit', label: 'Visit' },
            { value: 'created', label: 'Booked' },
            { value: 'completed', label: 'Completed' },
          ]}
          value={dateField}
          onChange={setDateField}
        />
      ) : null}
      <FilterRow>
        <FilterButton
          label="Technician"
          value={technician ? (technician.name === 'Selected' ? 'One technician' : technician.name) : null}
          onPress={() => setSheet('technician')}
          onClear={() => setTechnician(null)}
        />
        <FilterButton
          label="Customer"
          value={customer ? (customer.name === 'Selected' ? 'One customer' : customer.name) : null}
          onPress={() => setSheet('customer')}
          onClear={() => setCustomer(null)}
        />
        <FilterButton
          label="Service"
          value={service ? (service.name === 'Selected' ? 'One service' : service.name) : null}
          onPress={() => setSheet('service')}
          onClear={() => setService(null)}
        />
        <FilterButton
          label="Payment"
          value={paymentStatus ? PAYMENT_FILTER_LABELS[paymentStatus] : null}
          onPress={() => setSheet('payment')}
          onClear={() => setPaymentStatus('')}
        />
        <FilterButton
          label="Source"
          value={source ? SOURCE_LABELS[source] : null}
          onPress={() => setSheet('source')}
          onClear={() => setSource('')}
        />
        {!wide ? <FilterButton label="Sort" value={sortLabel} onPress={() => setSheet('sort')} /> : null}
      </FilterRow>
      <FilterSummary parts={summaryParts} onClear={clearAll} />
    </View>
  );

  return (
    <AdminTabScreen header={header} scroll={false}>
      <AdminPagedList
        list={list}
        columns={columns}
        keyExtractor={(b) => b.id}
        header={filters}
        sort={sort}
        onSortChange={setSort}
        onRowPress={(b) => openBooking(b.id)}
        rowLabel={(b) => `${bookingRef(b.id)}, ${bookingServiceName(b)}, ${bookingCustomerName(b)}. Open booking`}
        noun="bookings"
        emptyTitle="No bookings match"
        emptyMessage={summaryParts.length > 0 ? 'Try another filter, or clear them all.' : 'New bookings appear here.'}
        emptyActionLabel={summaryParts.length > 0 ? 'Clear filters' : undefined}
        onEmptyAction={summaryParts.length > 0 ? clearAll : undefined}
        skeletonVariant="booking"
        bottomPad={TAB_BAR_SCROLL_PAD}
        renderCard={(item) => <AdminBookingListCard item={item} onOpen={openBooking} onAssign={assign} />}
      />

      <AdminActionSheet
        visible={assignTarget !== null}
        title="Assign technician"
        message={assignTarget ? bookingServiceName(assignTarget) : undefined}
        options={assignOptions}
        onClose={() => setAssignTarget(null)}
      />
      <AdminActionSheet
        visible={sheet === 'technician'}
        title="Filter by technician"
        options={technicianOptions}
        onClose={() => setSheet(null)}
      />
      <AdminActionSheet visible={sheet === 'service'} title="Filter by service" options={serviceOptions} onClose={() => setSheet(null)} />
      <AdminActionSheet visible={sheet === 'payment'} title="Payment status" options={paymentOptions} onClose={() => setSheet(null)} />
      <AdminActionSheet visible={sheet === 'source'} title="Booked from" options={sourceOptions} onClose={() => setSheet(null)} />
      <AdminActionSheet visible={sheet === 'sort'} title="Sort bookings" options={sortOptions} onClose={() => setSheet(null)} />
      <SearchPickerSheet
        visible={sheet === 'customer'}
        title="Filter by customer"
        placeholder="Name, phone or email"
        onClose={() => setSheet(null)}
        search={searchCustomers}
        toOption={(c) => ({ key: c.id, title: c.name, subtitle: [c.phone, `${c.bookingCount} bookings`].filter(Boolean).join(' · ') })}
        onPick={(c) => {
          setCustomer({ id: c.id, name: c.name });
          setSheet(null);
        }}
      />
    </AdminTabScreen>
  );
}

const styles = StyleSheet.create({
  filters: { paddingTop: spacing.xs },
  toolbar: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  searchCol: { flex: 1, minWidth: 0 },
  newBtnWrap: { height: 48, justifyContent: 'center' },
  ref: { fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 0.3, color: ui.text },
  techCell: { gap: 6, alignItems: 'flex-start', maxWidth: '100%' },
  assignBtn: { minWidth: 92 },
  twoLine: { gap: 1 },
  payStatus: { fontFamily: fonts.bodySemi, fontSize: 12.5 },
});

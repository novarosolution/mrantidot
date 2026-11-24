import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ArchiveRestore,
  GalleryHorizontal,
  Inbox,
  MailOpen,
  Newspaper,
  Quote,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { AdminDataTable, TableText, TableTwoLine, type AdminTableColumn } from '@/components/admin/AdminDataTable';
import { AdminEntrance, AdminListShell, adminListShellStyles, useListEntrance } from '@/components/kit/AdminListShell';
import { AdminFilterChips } from '@/components/kit/AdminPageKit';
import { AdminListSkeleton } from '@/components/kit/AdminSkeletons';
import { WebsitePhoto } from '@/components/kit/ImageField';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { confirmAsync } from '@/lib/confirm';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { haptic } from '@/lib/motion';
import { adminRoutes } from '@/lib/routes';
import { formatTimeAgo } from '@/lib/time-ago';
import { appToast } from '@/lib/toast';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useWideWebLayout } from '@/lib/webAdmin';
import {
  restoreWebsiteItem,
  TRASH_KIND_LABELS,
  WEBSITE_TRASH_DAYS,
  type WebsiteTrashItem,
  type WebsiteTrashKind,
} from '@/lib/websiteTrash';

type Filter = 'all' | WebsiteTrashKind;

const KIND_ORDER: WebsiteTrashKind[] = ['blog', 'gallery', 'team', 'testimonials', 'messages', 'subscribers'];

const KIND_ICONS: Record<WebsiteTrashKind, LucideIcon> = {
  blog: Newspaper,
  gallery: GalleryHorizontal,
  team: Users,
  testimonials: Quote,
  messages: Inbox,
  subscribers: MailOpen,
};

/** Kinds whose rows have a photo worth showing. */
const HAS_PHOTO = new Set<WebsiteTrashKind>(['blog', 'gallery', 'team', 'testimonials']);

function daysLeft(purgeAt: string): number {
  const ms = new Date(purgeAt).getTime() - Date.now();
  return Number.isNaN(ms) ? WEBSITE_TRASH_DAYS : Math.max(0, Math.ceil(ms / 86_400_000));
}

function keptLabel(item: WebsiteTrashItem): string {
  const left = daysLeft(item.purgeAt);
  return left <= 1 ? 'Last day to restore' : `${left} days left`;
}

function deletedLabel(item: WebsiteTrashItem): string {
  const when = formatTimeAgo(item.deletedAt);
  return item.deletedBy ? `${when} · ${item.deletedBy}` : when;
}

function KindThumb({ item, size = 48 }: { item: WebsiteTrashItem; size?: number }) {
  const Icon = KIND_ICONS[item.kind];
  if (HAS_PHOTO.has(item.kind) && item.photoUrl) {
    return <WebsitePhoto url={item.photoUrl} compact style={[styles.thumb, { width: size, height: size }]} />;
  }
  return (
    <View style={[styles.thumb, styles.thumbIcon, { width: size, height: size }]}>
      <Icon size={size > 40 ? 20 : 17} color={ui.brand} strokeWidth={2} />
    </View>
  );
}

/**
 * Recently deleted (website): blog posts, gallery photos, team members, testimonials, messages and
 * subscribers deleted in the last 30 days. Restore puts an item back where it was (and on the website);
 * after 30 days the server removes it for good. Server: GET /website/admin/trash,
 * POST /website/admin/:kind/:id/restore, DELETE /website/admin/trash/:kind/:id.
 */
export default function WebsiteTrashScreen() {
  const wide = useWideWebLayout();
  const [items, setItems] = useState<WebsiteTrashItem[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();
  const entrance = useListEntrance(!loading);

  const load = useCallback(async () => {
    const { data } = await api.get<{ items: WebsiteTrashItem[] }>('/website/admin/trash', { ...screenLoadConfig, skipCache: true });
    setItems(data.items);
  }, []);

  useEffect(() => {
    void runLoad(load, 'Could not load recently deleted items');
  }, [load, runLoad]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(KIND_ORDER.map((k) => [k, 0])) as Record<WebsiteTrashKind, number>;
    for (const item of items) c[item.kind] += 1;
    return c;
  }, [items]);

  // A filter whose last item was restored falls back to All.
  useEffect(() => {
    if (filter !== 'all' && counts[filter] === 0 && !loading) setFilter('all');
  }, [counts, filter, loading]);

  const visible = useMemo(() => (filter === 'all' ? items : items.filter((i) => i.kind === filter)), [items, filter]);

  const keyOf = (item: WebsiteTrashItem) => `${item.kind}:${item.id}`;

  const restore = useCallback(async (item: WebsiteTrashItem) => {
    setBusy(`${item.kind}:${item.id}`);
    const ok = await restoreWebsiteItem(item.kind, item.id);
    setBusy(null);
    if (ok) setItems((prev) => prev.filter((x) => !(x.kind === item.kind && x.id === item.id)));
  }, []);

  const purge = useCallback(async (item: WebsiteTrashItem) => {
    const ok = await confirmAsync({
      title: 'Delete for good?',
      message: `“${item.title}” will be removed permanently. This can't be undone.`,
      confirmLabel: 'Delete forever',
      destructive: true,
    });
    if (!ok) return;
    setBusy(`${item.kind}:${item.id}`);
    try {
      await api.delete(`/website/admin/trash/${item.kind}/${item.id}`, { skipErrorToast: true });
      haptic('success');
      setItems((prev) => prev.filter((x) => !(x.kind === item.kind && x.id === item.id)));
      appToast.success('Deleted for good');
    } catch (err) {
      haptic('error');
      appToast.error(getApiErrorMessage(err, 'Could not delete it'));
    } finally {
      setBusy(null);
    }
  }, []);

  const chips = useMemo(
    () => [
      { key: 'all', label: `All (${items.length})` },
      ...KIND_ORDER.filter((k) => counts[k] > 0).map((k) => ({ key: k, label: `${TRASH_KIND_LABELS[k].many} (${counts[k]})` })),
    ],
    [counts, items.length],
  );

  const columns = useMemo<AdminTableColumn<WebsiteTrashItem>[]>(
    () => [
      {
        key: 'item',
        title: 'Item',
        flex: 2.2,
        minWidth: 240,
        render: (item) => (
          <View style={styles.itemCell}>
            <KindThumb item={item} size={40} />
            <View style={styles.flex}>
              <TableTwoLine title={item.title} sub={item.subtitle} />
            </View>
          </View>
        ),
      },
      { key: 'kind', title: 'Type', width: 140, render: (item) => <TableText muted>{TRASH_KIND_LABELS[item.kind].one}</TableText> },
      { key: 'deleted', title: 'Deleted', width: 190, render: (item) => <TableText muted>{deletedLabel(item)}</TableText> },
      {
        key: 'kept',
        title: 'Restore by',
        width: 150,
        render: (item) => (
          <TableText color={daysLeft(item.purgeAt) <= 3 ? colors.warning : ui.textSecondary}>{keptLabel(item)}</TableText>
        ),
      },
      {
        key: 'actions',
        title: '',
        width: 236,
        align: 'right',
        render: (item) => (
          <View style={styles.actions}>
            <Button
              title="Delete forever"
              variant="ghost"
              size="sm"
              fullWidth={false}
              disabled={busy !== null}
              onPress={() => void purge(item)}
              textStyle={styles.dangerText}
            />
            <Button
              title="Restore"
              variant="premium"
              size="sm"
              fullWidth={false}
              loading={busy === keyOf(item)}
              disabled={busy !== null}
              onPress={() => void restore(item)}
            />
          </View>
        ),
      },
    ],
    [busy, purge, restore],
  );

  const shellProps = {
    title: 'Recently deleted',
    subtitle: `Website items you can still restore · kept ${WEBSITE_TRASH_DAYS} days`,
    backFallback: adminRoutes.website,
  };

  if (loading) {
    return (
      <AdminListShell {...shellProps}>
        <AdminListSkeleton variant="service" chips rows={5} />
      </AdminListShell>
    );
  }

  if (error && items.length === 0) {
    return (
      <AdminListShell {...shellProps}>
        <ListEmptyRetry message={error} onRetry={() => void reload(load, 'Could not load recently deleted items')} />
      </AdminListShell>
    );
  }

  const empty = (
    <EmptyState
      icon={ArchiveRestore}
      title="Nothing deleted recently"
      message={`Deleted blog posts, photos, team members, testimonials, messages and subscribers wait here for ${WEBSITE_TRASH_DAYS} days so you can bring them back.`}
    />
  );

  const header = (
    <FadeSlideIn slideFrom={14}>
      <View style={styles.headerBlock}>
        <View style={styles.note}>
          <ArchiveRestore size={18} color={colors.forest} strokeWidth={2} />
          <Text style={styles.noteText}>
            Deleted items are hidden from the website. Restore puts them back exactly as they were; after {WEBSITE_TRASH_DAYS} days
            they are removed for good.
          </Text>
        </View>
        {items.length > 0 ? (
          <View style={styles.chipsWrap}>
            <AdminFilterChips inset={!wide} chips={chips} selected={filter} onSelect={(k) => setFilter(k as Filter)} />
          </View>
        ) : null}
      </View>
    </FadeSlideIn>
  );

  if (wide) {
    return (
      <AdminListShell {...shellProps}>
        <ScrollView contentContainerStyle={styles.deskContent}>
          {header}
          {visible.length === 0 ? (
            <View style={styles.deskEmpty}>{empty}</View>
          ) : (
            <AdminDataTable
              columns={columns}
              rows={visible}
              keyExtractor={keyOf}
              emptyTitle="Nothing here"
              rowLabel={(item) => `${TRASH_KIND_LABELS[item.kind].one}: ${item.title}`}
            />
          )}
        </ScrollView>
      </AdminListShell>
    );
  }

  return (
    <AdminListShell {...shellProps}>
      <FlatList
        data={visible}
        keyExtractor={keyOf}
        {...ADMIN_LIST_PERF}
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />}
        contentContainerStyle={visible.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        ListEmptyComponent={empty}
        renderItem={({ item, index }) => {
          const Icon = KIND_ICONS[item.kind];
          const rowBusy = busy === keyOf(item);
          return (
            <AdminEntrance index={index + 1} play={entrance(index)}>
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <KindThumb item={item} />
                  <View style={styles.flex}>
                    <Text style={styles.title} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.subtitle ? (
                      <Text style={styles.subtitle} numberOfLines={2}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                    <View style={styles.metaRow}>
                      <Icon size={12} color={ui.textTertiary} strokeWidth={2.2} />
                      <Text style={styles.meta} numberOfLines={1}>
                        {TRASH_KIND_LABELS[item.kind].one} · {deletedLabel(item)}
                      </Text>
                    </View>
                    <Text style={[styles.kept, daysLeft(item.purgeAt) <= 3 && styles.keptSoon]}>{keptLabel(item)}</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <Button
                    title="Delete forever"
                    variant="dangerOutline"
                    size="sm"
                    fullWidth={false}
                    disabled={busy !== null}
                    onPress={() => void purge(item)}
                    style={styles.flex}
                  />
                  <Button
                    title="Restore"
                    variant="premium"
                    size="sm"
                    fullWidth={false}
                    loading={rowBusy}
                    disabled={busy !== null}
                    onPress={() => void restore(item)}
                    style={styles.flex}
                  />
                </View>
              </View>
            </AdminEntrance>
          );
        }}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  headerBlock: { marginBottom: spacing.sm, gap: spacing.sm },
  chipsWrap: { marginHorizontal: -spacing.md },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: 'rgba(8,123,53,0.12)',
  },
  noteText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: ui.text },
  deskContent: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  deskEmpty: { minHeight: 360 },
  itemCell: { flexDirection: 'row', alignItems: 'center', gap: 12, maxWidth: '100%' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dangerText: { color: colors.error },
  thumb: { borderRadius: 12 },
  thumbIcon: { backgroundColor: ui.brandSoft, alignItems: 'center', justifyContent: 'center' },
  card: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    gap: 12,
    ...ui.shadow,
  },
  cardTop: { flexDirection: 'row', gap: 12 },
  title: { fontFamily: fonts.bodySemi, fontSize: 14.5, lineHeight: 20, color: ui.text },
  subtitle: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17, color: ui.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  meta: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 11.5, color: ui.textTertiary },
  kept: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: ui.textSecondary, marginTop: 3 },
  keptSoon: { color: colors.warning },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
});

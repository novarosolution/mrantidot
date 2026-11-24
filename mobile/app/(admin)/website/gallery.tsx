import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { ArrowUpDown } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { AdminAddButton } from '@/components/kit/AdminAddButton';
import { ADMIN_STICKY_FOOTER_PAD, AdminEntrance, AdminListShell, useListEntrance } from '@/components/kit/AdminListShell';
import { AdminFilterChips, AdminStatStrip } from '@/components/kit/AdminPageKit';
import { AdminListSkeleton } from '@/components/kit/AdminSkeletons';
import { IconInput } from '@/components/kit/IconInput';
import { ImageField, pickAndUploadWebsitePhoto, useBusyCounter, WebsitePhoto } from '@/components/kit/ImageField';
import { ReorderButtons } from '@/components/kit/ReorderButtons';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { WebsiteBadge } from '@/components/kit/WebsiteListCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PressableScale } from '@/components/ui/PressableScale';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { haptic } from '@/lib/motion';
import { adminRoutes } from '@/lib/routes';
import { useReorderMode } from '@/lib/useReorderMode';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { GalleryItem, WebsiteImage } from '@/types/api';
import { adminType, colors, fonts, spacing, ui } from '@/constants/theme';
import { confirmAsync } from '@/lib/confirm';
import { deleteWebsiteItem, useWebsiteItemRestored } from '@/lib/websiteTrash';
import { adminContentWidth } from '@/lib/webAdmin';

const GAP = 10;

type SheetState = { mode: 'new'; image: WebsiteImage } | { mode: 'edit'; item: GalleryItem } | null;

/* ---------- tile ---------- */

const GalleryTile = memo(function GalleryTile({
  item,
  index,
  count,
  width,
  reordering,
  onPress,
  onMove,
}: {
  item: GalleryItem;
  index: number;
  count: number;
  width: number;
  reordering: boolean;
  onPress: (item: GalleryItem) => void;
  onMove: (from: number, to: number) => void;
}) {
  return (
    <PressableScale
      containerStyle={{ width }}
      style={[styles.tile, !item.active && styles.tileOff]}
      scaleTo={0.97}
      disabled={reordering}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title || 'Gallery photo'}${item.active ? '' : ', hidden'}. Edit`}
    >
      <View>
        <WebsitePhoto url={item.image.url} style={[styles.tilePhoto, { height: width }]} />
        <View style={styles.tileBadge}>
          {item.active ? <WebsiteBadge label="SHOWN" tone="live" /> : <WebsiteBadge label="HIDDEN" tone="off" />}
        </View>
        {reordering ? (
          <View style={styles.tilePos}>
            <Text style={styles.tilePosText}>{index + 1}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.tileBody}>
        <Text style={styles.tileTitle} numberOfLines={1}>
          {item.title || 'Untitled'}
        </Text>
        <Text style={styles.tileCat} numberOfLines={1}>
          {item.category || 'No category'}
        </Text>
        {reordering ? (
          <View style={styles.tileReorder}>
            <ReorderButtons index={index} count={count} onMove={onMove} label={item.title || `photo ${index + 1}`} />
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
});

/* ---------- add / edit sheet ---------- */

function GallerySheet({
  state,
  categories,
  onClose,
  onSaved,
  onDeleted,
}: {
  state: SheetState;
  categories: string[];
  onClose: () => void;
  onSaved: (item: GalleryItem, isNew: boolean) => void;
  onDeleted: (id: string) => void;
}) {
  const [image, setImage] = useState<WebsiteImage>({ url: '', alt: '' });
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, onBusyChange] = useBusyCounter();

  useEffect(() => {
    if (!state) return;
    if (state.mode === 'new') {
      setImage(state.image);
      setTitle('');
      setCategory('');
      setActive(true);
    } else {
      setImage(state.item.image);
      setTitle(state.item.title);
      setCategory(state.item.category);
      setActive(state.item.active);
    }
  }, [state]);

  const save = async () => {
    if (!state) return;
    if (!image.url) {
      haptic('error');
      Toast.show({ type: 'error', text1: 'Add a photo first' });
      return;
    }
    const alt = image.alt.trim() || title.trim();
    if (!alt) {
      haptic('error');
      Toast.show({ type: 'error', text1: 'Add alt text or a title', text2: 'Describe what the photo shows' });
      return;
    }
    const body = { image: { url: image.url, alt }, title: title.trim(), category: category.trim(), active };
    setSaving(true);
    try {
      const { data } =
        state.mode === 'new'
          ? await api.post<{ item: GalleryItem }>('/website/admin/gallery', body, { skipErrorToast: true })
          : await api.patch<{ item: GalleryItem }>(`/website/admin/gallery/${state.item.id}`, body, { skipErrorToast: true });
      haptic('success');
      Toast.show({ type: 'success', text1: state.mode === 'new' ? 'Photo added' : 'Photo saved' });
      onSaved(data.item, state.mode === 'new');
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not save the photo') });
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (state?.mode !== 'edit') return;
    const id = state.item.id;
    void confirmAsync({
      title: 'Delete this photo?',
      message: 'It will be taken off the website gallery. You can undo it, or restore it from Recently deleted for 30 days.',
      confirmLabel: 'Delete',
      destructive: true,
    }).then(async (ok) => {
      if (!ok) return;
      if (await deleteWebsiteItem('gallery', id, 'Could not delete the photo')) onDeleted(id);
    });
  };

  return (
    <BottomSheet
      visible={state != null}
      onClose={onClose}
      title={state?.mode === 'new' ? 'New gallery photo' : 'Edit gallery photo'}
      hint="Title and category show under the photo on the website"
      footer={
        <View style={styles.sheetFoot}>
          {state?.mode === 'edit' ? (
            <Button title="Delete" variant="dangerOutline" fullWidth={false} style={styles.footSecondary} onPress={remove} />
          ) : null}
          <Button
            title={uploading ? 'Uploading…' : state?.mode === 'new' ? 'Add to gallery' : 'Save'}
            variant="premium"
            loading={saving}
            disabled={saving || uploading}
            fullWidth={false}
            style={styles.footPrimary}
            onPress={() => void save()}
          />
        </View>
      }
    >
      <ImageField
        label="Photo"
        value={image}
        onChange={setImage}
        aspectRatio={4 / 3}
        removable={false}
        onBusyChange={onBusyChange}
        altPlaceholder="e.g. Fogging treatment at an office"
      />
      <IconInput label="Title" value={title} maxLength={120} onChangeText={setTitle} placeholder="e.g. Office deep cleaning" />
      <IconInput label="Category" value={category} maxLength={60} onChangeText={setCategory} placeholder="e.g. Pest Control" />
      {categories.length > 0 ? (
        <View style={styles.catChips}>
          <AdminFilterChips
            chips={categories.map((c) => ({ key: c, label: c }))}
            selected={category}
            onSelect={setCategory}
          />
        </View>
      ) : null}
      <View style={styles.toggleRow}>
        <View style={styles.flex}>
          <Text style={styles.toggleLabel}>Show on website</Text>
          <Text style={styles.toggleHint}>{active ? 'Visible in the gallery' : 'Hidden — kept here for later'}</Text>
        </View>
        <ToggleSwitch value={active} onToggle={() => setActive((v) => !v)} accessibilityLabel="Show on website" />
      </View>
    </BottomSheet>
  );
}

/* ---------- screen ---------- */

export default function WebsiteGalleryScreen() {
  const width = adminContentWidth(useWindowDimensions().width);
  const cols = width >= 700 ? 3 : 2;
  const tileWidth = Math.floor((width - spacing.md * 2 - GAP * (cols - 1)) / cols);

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [category, setCategory] = useState('all');
  const [sheet, setSheet] = useState<SheetState>(null);
  const [adding, setAdding] = useState<number | null>(null);
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();
  const entrance = useListEntrance(!loading);
  const order = useReorderMode(items, setItems, '/website/admin/gallery/order');
  const reordering = order.reordering;

  const load = useCallback(async () => {
    const { data } = await api.get<{ items: GalleryItem[] }>('/website/admin/gallery', { ...screenLoadConfig, skipCache: true });
    setItems(data.items);
  }, []);

  useEffect(() => {
    void runLoad(load, 'Could not load the gallery');
  }, [load, runLoad]);

  // "Undo" on the delete toast (or Recently deleted) brings a photo back.
  useWebsiteItemRestored('gallery', () => void load().catch(() => undefined));

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [items],
  );
  const shown = items.filter((i) => i.active).length;
  const visible = useMemo(
    () => (reordering || category === 'all' ? items : items.filter((i) => i.category.trim() === category)),
    [items, category, reordering],
  );

  const onPress = useCallback((item: GalleryItem) => {
    haptic('tap');
    setSheet({ mode: 'edit', item });
  }, []);

  const startAdd = async () => {
    if (adding != null) return;
    try {
      const url = await pickAndUploadWebsitePhoto({
        onPicked: () => setAdding(0),
        onProgress: (f) => setAdding(f),
      });
      if (url) setSheet({ mode: 'new', image: { url, alt: '' } });
    } catch {
      // toast already shown
    } finally {
      setAdding(null);
    }
  };

  const startReorder = () => {
    setCategory('all');
    order.start();
  };

  const header = (
    <FadeSlideIn slideFrom={14}>
      <View style={styles.headerBlock}>
        <AdminStatStrip
          flush
          items={[
            { label: 'Photos', value: items.length },
            { label: 'Shown', value: shown, color: colors.forest },
            { label: 'Hidden', value: items.length - shown, color: colors.muted },
          ]}
        />
        {reordering ? (
          <Text style={styles.reorderHint}>Use the arrows to move photos. The first photo shows first on the website.</Text>
        ) : (
          <View style={styles.toolsRow}>
            <View style={styles.flex}>
              {categories.length > 0 ? (
                <AdminFilterChips
                  chips={[{ key: 'all', label: 'All' }, ...categories.map((c) => ({ key: c, label: c }))]}
                  selected={category}
                  onSelect={setCategory}
                />
              ) : null}
            </View>
            {items.length > 1 ? (
              <Pressable
                onPress={startReorder}
                style={({ pressed }) => [styles.reorderBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Reorder photos"
              >
                <ArrowUpDown size={15} color={ui.brand} strokeWidth={2.4} />
                <Text style={styles.reorderText}>Reorder</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    </FadeSlideIn>
  );

  if (loading) {
    return (
      <AdminListShell title="Gallery" subtitle="Work photos on the website" backFallback={adminRoutes.website}>
        <AdminListSkeleton variant="service" strip stripCells={3} rows={4} />
      </AdminListShell>
    );
  }

  if (error && items.length === 0) {
    return (
      <AdminListShell title="Gallery" subtitle="Could not load" backFallback={adminRoutes.website}>
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell
      title="Gallery"
      subtitle={reordering ? 'Reordering photos' : `${shown} of ${items.length} photos shown`}
      backFallback={adminRoutes.website}
      rightAction={reordering ? undefined : <AdminAddButton label="Add photo" onPress={() => void startAdd()} />}
      stickyFooter={
        reordering ? (
          <StickyActionBar row>
            <Button title="Cancel" variant="outline" fullWidth={false} style={styles.footSecondary} onPress={order.cancel} />
            <Button
              title="Save order"
              variant="premium"
              loading={order.saving}
              fullWidth={false}
              style={styles.footPrimary}
              onPress={() => void order.save()}
            />
          </StickyActionBar>
        ) : undefined
      }
    >
      <FlatList
        key={`cols-${cols}`}
        data={visible}
        numColumns={cols}
        keyExtractor={(i) => i.id}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        ListHeaderComponent={header}
        columnWrapperStyle={styles.colWrap}
        refreshControl={
          reordering ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
          )
        }
        contentContainerStyle={[
          styles.list,
          { paddingBottom: reordering ? ADMIN_STICKY_FOOTER_PAD : TAB_BAR_SCROLL_PAD },
          visible.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={
          <EmptyState
            title={category === 'all' ? 'No photos yet' : `No ${category} photos`}
            message="Add photos of your work — they appear in the website gallery"
            actionLabel="Add photo"
            onAction={() => void startAdd()}
          />
        }
        renderItem={({ item, index }) => (
          <AdminEntrance index={index + 1} play={entrance(index)}>
            <GalleryTile
              item={item}
              index={index}
              count={visible.length}
              width={tileWidth}
              reordering={reordering}
              onPress={onPress}
              onMove={order.onMove}
            />
          </AdminEntrance>
        )}
      />

      {adding != null ? (
        <View style={styles.addingWrap} pointerEvents="none">
          <View style={styles.addingCard}>
            <ActivityIndicator color={colors.white} />
            <Text style={styles.addingText}>{adding > 0 ? `Uploading ${Math.round(adding * 100)}%` : 'Preparing photo…'}</Text>
          </View>
        </View>
      ) : null}

      <GallerySheet
        state={sheet}
        categories={categories}
        onClose={() => setSheet(null)}
        onSaved={(item, isNew) => {
          setItems((prev) => (isNew ? [item, ...prev] : prev.map((x) => (x.id === item.id ? item : x))));
          setSheet(null);
        }}
        onDeleted={(id) => {
          setItems((prev) => prev.filter((x) => x.id !== id));
          setSheet(null);
        }}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: GAP },
  listEmpty: { flexGrow: 1 },
  colWrap: { gap: GAP },
  headerBlock: { marginBottom: spacing.xs, gap: spacing.sm },
  toolsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1, minWidth: 0 },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.border,
    marginBottom: spacing.sm,
  },
  reorderText: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.brand },
  reorderHint: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: ui.textSecondary, marginBottom: spacing.sm },
  pressed: { opacity: 0.75 },
  tile: {
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    overflow: 'hidden',
    ...ui.shadow,
  },
  tileOff: { opacity: 0.7 },
  tilePhoto: { width: '100%' },
  tileBadge: { position: 'absolute', top: 8, left: 8 },
  tilePos: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tilePosText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.white },
  tileBody: { padding: 10, gap: 2 },
  tileTitle: { ...adminType.listTitle, fontSize: 13.5, color: ui.text },
  tileCat: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary },
  tileReorder: { marginTop: 8 },
  addingWrap: { position: 'absolute', left: 0, right: 0, bottom: 40, alignItems: 'center' },
  addingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(8,14,10,0.86)',
  },
  addingText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.white },
  sheetFoot: { flexDirection: 'row', gap: 10 },
  footSecondary: { flex: 1 },
  footPrimary: { flex: 1.6 },
  catChips: { marginTop: -spacing.sm },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: spacing.sm },
  toggleLabel: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: ui.text },
  toggleHint: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary, marginTop: 2 },
});

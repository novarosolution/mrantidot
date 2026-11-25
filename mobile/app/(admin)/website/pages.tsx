import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminTabHint } from '@/components/kit/AdminPageKit';
import { AdminListSkeleton } from '@/components/kit/AdminSkeletons';
import { moveItem, ReorderButtons } from '@/components/kit/ReorderButtons';
import { SegmentedTabs } from '@/components/kit/SegmentedTabs';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { WebsiteBadge } from '@/components/kit/WebsiteListCard';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { WEBSITE_LIMIT_MAX, WEBSITE_LIMIT_MIN, websiteSectionMeta } from '@/constants/websiteAdmin';
import { haptic, stagger } from '@/lib/motion';
import { adminRoutes } from '@/lib/routes';
import { useWebsiteConfig } from '@/lib/useWebsiteConfig';
import type { WebsitePageKey, WebsiteSection } from '@/types/api';
import { adminType, colors, fonts, spacing, ui } from '@/constants/theme';

type Pages = Record<WebsitePageKey, WebsiteSection[]>;

const SectionRow = memo(function SectionRow({
  page,
  section,
  index,
  count,
  onToggle,
  onMove,
  onLimit,
}: {
  page: WebsitePageKey;
  section: WebsiteSection;
  index: number;
  count: number;
  onToggle: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onLimit: (index: number, delta: number) => void;
}) {
  const meta = websiteSectionMeta(page, section.key);
  const hidden = !section.visible;
  const limit = section.limit;
  return (
    <View style={[styles.row, hidden && styles.rowHidden]}>
      <View style={styles.rowTop}>
        <View style={[styles.pos, hidden && styles.posHidden]}>
          <Text style={[styles.posText, hidden && styles.posTextHidden]}>{index + 1}</Text>
        </View>
        <View style={styles.rowText}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, hidden && styles.nameHidden]} numberOfLines={1}>
              {meta.name}
            </Text>
            {hidden ? <WebsiteBadge label="HIDDEN" tone="off" /> : null}
          </View>
          <Text style={styles.desc} numberOfLines={2}>
            {meta.desc}
          </Text>
        </View>
        <ToggleSwitch
          value={section.visible}
          onToggle={() => onToggle(index)}
          accessibilityLabel={section.visible ? `Hide ${meta.name}` : `Show ${meta.name}`}
        />
      </View>
      <View style={styles.rowBottom}>
        <ReorderButtons index={index} count={count} onMove={onMove} label={meta.name} />
        {limit != null ? (
          <View style={styles.stepper} accessibilityLabel={`${meta.name} shows ${limit} items`}>
            <Text style={styles.stepperLabel}>Show</Text>
            <Pressable
              onPress={() => onLimit(index, -1)}
              disabled={limit <= WEBSITE_LIMIT_MIN}
              hitSlop={6}
              style={({ pressed }) => [styles.stepBtn, limit <= WEBSITE_LIMIT_MIN && styles.stepOff, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Show fewer ${meta.name}`}
            >
              <Minus size={15} color={ui.brand} strokeWidth={2.6} />
            </Pressable>
            <Text style={styles.stepValue}>{limit}</Text>
            <Pressable
              onPress={() => onLimit(index, 1)}
              disabled={limit >= WEBSITE_LIMIT_MAX}
              hitSlop={6}
              style={({ pressed }) => [styles.stepBtn, limit >= WEBSITE_LIMIT_MAX && styles.stepOff, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Show more ${meta.name}`}
            >
              <Plus size={15} color={ui.brand} strokeWidth={2.6} />
            </Pressable>
            <Text style={styles.stepperLabel}>items</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
});

export default function WebsitePagesScreen() {
  const [pages, setPages] = useState<Pages | null>(null);
  const [page, setPage] = useState<WebsitePageKey>('home');
  const { website, loading, error, saving, save, retry } = useWebsiteConfig(
    useCallback((w) => setPages({ home: w.pages.home, about: w.pages.about }), []),
  );

  const dirty = useMemo(
    () => Boolean(website && pages && JSON.stringify(pages) !== JSON.stringify(website.pages)),
    [website, pages],
  );

  const onToggle = useCallback(
    (index: number) => {
      haptic('select');
      setPages((p) => p && { ...p, [page]: p[page].map((s, i) => (i === index ? { ...s, visible: !s.visible } : s)) });
    },
    [page],
  );

  const onMove = useCallback(
    (from: number, to: number) => setPages((p) => p && { ...p, [page]: moveItem(p[page], from, to) }),
    [page],
  );

  const onLimit = useCallback(
    (index: number, delta: number) => {
      haptic('select');
      setPages(
        (p) =>
          p && {
            ...p,
            [page]: p[page].map((s, i) =>
              i === index && s.limit != null
                ? { ...s, limit: Math.min(WEBSITE_LIMIT_MAX, Math.max(WEBSITE_LIMIT_MIN, s.limit + delta)) }
                : s,
            ),
          },
      );
    },
    [page],
  );

  if (loading || (!pages && !error)) {
    return (
      <AdminListShell title="Pages & sections" subtitle="Show, hide and reorder" backFallback={adminRoutes.website}>
        <AdminListSkeleton variant="service" rows={6} />
      </AdminListShell>
    );
  }

  if (error || !pages) {
    return (
      <AdminListShell title="Pages & sections" subtitle="Could not load" backFallback={adminRoutes.website}>
        <ListEmptyRetry message={error ?? undefined} onRetry={() => void retry()} />
      </AdminListShell>
    );
  }

  const list = pages[page];
  const visible = list.filter((s) => s.visible).length;

  return (
    <AdminListShell
      title="Pages & sections"
      subtitle={`${visible} of ${list.length} blocks shown on ${page === 'home' ? 'Home' : 'About'}`}
      backFallback={adminRoutes.website}
      stickyFooter={
        <StickyActionBar row>
          {dirty ? (
            <Button
              title="Undo"
              variant="outline"
              fullWidth={false}
              style={styles.footerSecondary}
              onPress={() => {
                haptic('tap');
                if (website) setPages({ home: website.pages.home, about: website.pages.about });
              }}
            />
          ) : null}
          <Button
            title={dirty ? 'Save layout' : 'Saved'}
            variant="premium"
            loading={saving}
            disabled={!dirty || saving}
            fullWidth={false}
            style={styles.footerPrimary}
            onPress={() => void save({ pages }, 'Layout saved')}
          />
        </StickyActionBar>
      }
    >
      <ScrollView contentContainerStyle={adminListShellStyles.form} showsVerticalScrollIndicator={false}>
        <FadeSlideIn delay={stagger(0)} slideFrom={14}>
          <View style={styles.tabs}>
            <SegmentedTabs
              tabs={[
                { key: 'home', label: 'Home page', count: pages.home.length },
                { key: 'about', label: 'About page', count: pages.about.length },
              ]}
              selected={page}
              onSelect={(k) => {
                haptic('select');
                setPage(k);
              }}
            />
          </View>
          <AdminTabHint
            title="Top to bottom, as on the website"
            body="Switch a block off to hide it. Use the arrows to move it. List blocks also set how many items they show."
          />
        </FadeSlideIn>

        <View style={styles.rows}>
          {list.map((section, index) => (
            <FadeSlideIn key={`${page}-${section.key}`} delay={stagger(index + 1)} slideFrom={10}>
              <SectionRow
                page={page}
                section={section}
                index={index}
                count={list.length}
                onToggle={onToggle}
                onMove={onMove}
                onLimit={onLimit}
              />
            </FadeSlideIn>
          ))}
        </View>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  footerSecondary: { flex: 1 },
  footerPrimary: { flex: 1.6 },
  tabs: { marginTop: spacing.sm },
  rows: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: 10 },
  row: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    gap: 12,
    ...ui.shadow,
  },
  rowHidden: { backgroundColor: ui.surfaceMuted },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pos: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posHidden: { backgroundColor: colors.white },
  posText: { fontFamily: fonts.bodyBold, fontSize: 13, color: ui.brand },
  posTextHidden: { color: ui.textTertiary },
  rowText: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { ...adminType.listTitle, fontSize: 15, color: ui.text, flexShrink: 1 },
  nameHidden: { color: ui.textSecondary },
  desc: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17, color: ui.textSecondary, marginTop: 2 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperLabel: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepOff: { opacity: 0.4 },
  stepValue: { minWidth: 22, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 15, color: ui.text },
  pressed: { opacity: 0.7 },
});

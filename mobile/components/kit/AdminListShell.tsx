import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { AppIcons } from '@/constants/appIcons';
import { stagger } from '@/lib/motion';
import { AdminLightHeader } from './AdminLightHeader';
import { GlassBackdrop, TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { adminType, colors, spacing, surfaces, ui } from '@/constants/theme';
import { useWideWebLayout } from '@/lib/webAdmin';

/**
 * Bottom padding when a sticky save bar is docked at the bottom: the bar is ~102pt tall on a
 * home-indicator iPhone (16 top + 52 button + 34 inset), so this leaves ~20pt of air above it.
 */
export const ADMIN_STICKY_FOOTER_PAD = 124;
/** When sticky bar has two buttons (save + deactivate). */
export const ADMIN_STICKY_FOOTER_PAD_TALL = 152;

/** Desktop web: the action dock's height and the width its buttons share (right-aligned). */
const DESK_DOCK_HEIGHT = 84;
const DESK_DOCK_ACTIONS_WIDTH = 460;

/** Leading rows of an admin list that get the staggered entrance; later rows appear instantly. */
export const ADMIN_ENTRANCE_ROWS = 7;

/**
 * Decides which list rows play the entrance. Only rows painted in the first batch after `ready`
 * turns true (and only the first few) animate — pull-to-refresh, filter changes and rows that
 * virtualisation remounts while scrolling all appear instantly, so the list plays once per visit.
 */
export function useListEntrance(ready = true): (index: number) => boolean {
  const settled = useRef(false);
  useEffect(() => {
    if (ready) settled.current = true;
  }, [ready]);
  return useCallback((index: number) => !settled.current && index < ADMIN_ENTRANCE_ROWS, []);
}

/**
 * Staggered fade/slide for one list row. Whether it animates is latched at mount, so the row's
 * tree never changes shape afterwards (no remounts when its index or the list re-renders).
 */
export function AdminEntrance({ index, play, children }: { index: number; play: boolean; children: ReactNode }) {
  const [animate] = useState(play);
  const [delay] = useState(() => stagger(index));
  if (!animate) return <>{children}</>;
  return (
    <FadeSlideIn delay={delay} slideFrom={14}>
      {children}
    </FadeSlideIn>
  );
}

export function AdminListShell({
  title,
  subtitle,
  showBack = true,
  rightAction,
  headerExtra,
  stickyFooter,
  keyboardAvoid = false,
  backFallback,
  onBack,
  children,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  headerExtra?: ReactNode;
  stickyFooter?: ReactNode;
  keyboardAvoid?: boolean;
  backFallback?: string;
  onBack?: () => void;
  children: ReactNode;
}) {
  const wideWeb = useWideWebLayout();
  // Desktop browser: a slim full-width action dock with the buttons at desktop size on the right,
  // instead of a phone bar whose buttons stretch across the whole column.
  const footer =
    stickyFooter && wideWeb ? (
      <View style={styles.deskDock}>
        <View style={styles.deskDockSlot}>{stickyFooter}</View>
      </View>
    ) : (
      stickyFooter
    );
  const body = (
    <>
      {headerExtra ? <View style={styles.headerExtra}>{headerExtra}</View> : null}
      <View style={styles.body}>{children}</View>
      {footer}
    </>
  );

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <AdminLightHeader
          title={title}
          subtitle={subtitle}
          showBack={showBack}
          rightAction={rightAction}
          backFallback={backFallback}
          onBack={onBack}
        />
        {keyboardAvoid ? (
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {body}
          </KeyboardAvoidingView>
        ) : (
          body
        )}
      </SafeAreaView>
    </View>
  );
}

/** Section title for admin screens — lime accent bar + ink contrast. */
export function AdminSectionTitle({
  title,
  hint,
  actionLabel,
  onAction,
  flush = false,
}: {
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Drop the side gutter inside containers that already pad their content (e.g. GlassScreen). */
  flush?: boolean;
}) {
  return (
    <View style={[adminStyles.sectionBlock, flush && adminStyles.sectionFlush]}>
      <View style={adminStyles.sectionRow}>
        <View style={adminStyles.titleCol}>
          <View style={adminStyles.sectionTextCol}>
            <Text style={adminStyles.sectionTitle} numberOfLines={1}>
              {title}
            </Text>
            {hint ? <Text style={adminStyles.sectionHint}>{hint}</Text> : null}
          </View>
        </View>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            hitSlop={8}
            style={({ pressed }) => [adminStyles.sectionAction, pressed && adminStyles.sectionActionPressed]}
            accessibilityRole="button"
            accessibilityLabel={`${actionLabel}, ${title}`}
          >
            <Text style={adminStyles.sectionLink}>{actionLabel}</Text>
            <View style={adminStyles.chevronBtn}>
              <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size={14} color={colors.forest} strokeWidth={2.5} />
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export const adminListShellStyles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: TAB_BAR_SCROLL_PAD, gap: spacing.sm },
  empty: { flexGrow: 1, padding: spacing.md, paddingBottom: TAB_BAR_SCROLL_PAD },
  scroll: { padding: spacing.md, paddingBottom: TAB_BAR_SCROLL_PAD },
  scrollWithFooter: { padding: spacing.md, paddingBottom: ADMIN_STICKY_FOOTER_PAD },
  scrollWithFooterTall: { padding: spacing.md, paddingBottom: ADMIN_STICKY_FOOTER_PAD_TALL },
  /** Edit forms — AdminFormCard / section titles bring their own 16pt gutter. */
  form: { paddingTop: spacing.xs, paddingBottom: ADMIN_STICKY_FOOTER_PAD },
  formTall: { paddingTop: spacing.xs, paddingBottom: ADMIN_STICKY_FOOTER_PAD_TALL },
});

export const adminStyles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: TAB_BAR_SCROLL_PAD,
    gap: spacing.sm,
  },
  sectionBlock: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionFlush: { paddingHorizontal: 0 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTextCol: { flex: 1, minWidth: 0 },
  sectionTitle: {
    ...adminType.sectionTitle,
    color: ui.text,
  },
  sectionHint: {
    ...adminType.sectionHint,
    color: ui.textSecondary,
  },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionActionPressed: { opacity: 0.6 },
  sectionLink: { ...adminType.sectionLink },
  chevronBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryValue: {
    ...adminType.statValue,
  },
  summaryLabel: {
    ...adminType.statLabel,
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: surfaces.glassScreenBase },
  safe: { flex: 1 },
  flex: { flex: 1 },
  headerExtra: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  body: { flex: 1, overflow: 'hidden' },
  /** Desktop web dock — same height as the StickyActionBar it holds (16 + 52 button + 16), so the
   * screens' ADMIN_STICKY_FOOTER_PAD still clears it. */
  deskDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: DESK_DOCK_HEIGHT,
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
    shadowColor: '#143C23',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  /** StickyActionBar is absolutely positioned — this slot gives it a desktop-sized width. */
  deskDockSlot: { width: DESK_DOCK_ACTIONS_WIDTH, maxWidth: '100%', height: DESK_DOCK_HEIGHT },
});

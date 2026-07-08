import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminLightHeader } from './AdminLightHeader';
import { GlassBackdrop, TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { adminSurfaces, adminType, colors, premium, spacing } from '@/constants/theme';

/** Bottom padding when a sticky save bar sits above the tab bar. */
export const ADMIN_STICKY_FOOTER_PAD = 108;
/** When sticky bar has two buttons (save + deactivate). */
export const ADMIN_STICKY_FOOTER_PAD_TALL = 152;

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
  const body = (
    <>
      {headerExtra ? <View style={styles.headerExtra}>{headerExtra}</View> : null}
      <View style={styles.body}>{children}</View>
      {stickyFooter}
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

/** Section title for admin screens */
export function AdminSectionTitle({
  title,
  hint,
  actionLabel,
  onAction,
}: {
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={adminStyles.sectionBlock}>
      <View style={adminStyles.sectionRow}>
        <View style={adminStyles.sectionTextCol}>
          <Text style={adminStyles.sectionTitle}>{title}</Text>
          {hint ? <Text style={adminStyles.sectionHint}>{hint}</Text> : null}
        </View>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8} style={adminStyles.sectionAction}>
            <Text style={adminStyles.sectionLink}>{actionLabel}</Text>
            <ChevronRight size={14} color={colors.forest} strokeWidth={2.5} />
          </Pressable>
        ) : null}
      </View>
      <View style={adminStyles.sectionRule}>
        <View style={adminStyles.sectionRuleGold} />
        <View style={adminStyles.sectionRuleLine} />
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
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTextCol: { flex: 1, minWidth: 0 },
  sectionTitle: {
    ...adminType.sectionTitle,
  },
  sectionHint: {
    ...adminType.sectionHint,
  },
  sectionRule: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  sectionRuleGold: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: premium.accentGold,
  },
  sectionRuleLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingTop: 2 },
  sectionLink: { ...adminType.sectionLink },
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
  root: { flex: 1, overflow: 'hidden' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  headerExtra: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  body: { flex: 1, overflow: 'hidden' },
});

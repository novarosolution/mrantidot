import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminLightHeader } from './AdminLightHeader';
import { colors, design, fonts, premium, spacing } from '@/constants/theme';

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
  children,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  headerExtra?: ReactNode;
  stickyFooter?: ReactNode;
  keyboardAvoid?: boolean;
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
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <AdminLightHeader title={title} subtitle={subtitle} showBack={showBack} rightAction={rightAction} />
      {keyboardAvoid ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
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
  list: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  empty: { flexGrow: 1, padding: spacing.md },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  scrollWithFooter: { padding: spacing.md, paddingBottom: ADMIN_STICKY_FOOTER_PAD },
  scrollWithFooterTall: { padding: spacing.md, paddingBottom: ADMIN_STICKY_FOOTER_PAD_TALL },
});

export const adminStyles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
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
    fontFamily: fonts.displayExtra,
    fontSize: 18,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 3,
    lineHeight: 17,
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
  sectionLink: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.forest,
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
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.forest,
  },
  summaryLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  flex: { flex: 1 },
  headerExtra: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: design.screenBg,
  },
  body: { flex: 1, backgroundColor: design.screenBg },
});

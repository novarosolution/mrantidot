import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function PremiumSectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  rightAction,
  style,
  compact,
  showRule = true,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  rightAction?: ReactNode;
  style?: object;
  /** Smaller title & spacing for dense home sections. */
  compact?: boolean;
  showRule?: boolean;
}) {
  return (
    <View style={[styles.block, compact && styles.blockCompact, style]}>
      <View style={styles.row}>
        <View style={styles.titleCol}>
          <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightAction}
        {onAction ? (
          <Pressable style={styles.action} onPress={onAction} hitSlop={8}>
            {actionLabel ? <Text style={styles.link}>{actionLabel}</Text> : null}
            <View style={[styles.actionIcon, compact && styles.actionIconCompact]}>
              <ChevronRight size={compact ? 13 : 14} color={colors.forest} strokeWidth={2.5} />
            </View>
          </Pressable>
        ) : null}
      </View>
      {showRule ? (
        <View style={styles.rule}>
          <View style={[styles.ruleAccent, compact && styles.ruleAccentCompact]} />
          <View style={styles.ruleLine} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  blockCompact: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleCol: { flex: 1 },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    lineHeight: 26,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  titleCompact: {
    fontSize: 18,
    lineHeight: 24,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 18,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  link: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  actionIcon: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconCompact: {
    width: 24,
    height: 24,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  ruleAccent: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: premium.accentGold,
  },
  ruleAccentCompact: {
    width: 24,
    height: 2,
  },
  ruleLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
});

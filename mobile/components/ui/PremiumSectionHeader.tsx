import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, customerType, spacing } from '@/constants/theme';

export function PremiumSectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  rightAction,
  style,
  compact,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  rightAction?: ReactNode;
  style?: object;
  /** Smaller title & spacing for dense home sections. */
  compact?: boolean;
  /** Accent underline — off by default in the white premium theme. */
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
            <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size={compact ? 16 : 18} color={colors.forest} strokeWidth={2.4} fill="none" />
          </Pressable>
        ) : null}
      </View>
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
  titleCol: { flex: 1, minWidth: 0 },
  title: {
    ...customerType.sectionTitle,
  },
  titleCompact: {
    ...customerType.sectionTitleCompact,
  },
  subtitle: {
    ...customerType.sectionSubtitle,
  },
  link: { ...customerType.sectionLink },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
});

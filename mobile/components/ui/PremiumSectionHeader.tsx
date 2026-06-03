import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { design, fonts, spacing } from '@/constants/theme';

export function PremiumSectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  rightAction,
  style,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  rightAction?: ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.textCol}>
        <Text style={design.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={design.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {rightAction}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.link}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: design.screenPaddingHorizontal,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  textCol: { flex: 1 },
  link: { fontFamily: fonts.bodySemi, fontSize: 13, color: design.linkColor },
});

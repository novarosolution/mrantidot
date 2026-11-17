import { Children, isValidElement, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { adminShadow } from '@/components/kit/homeUi';
import { adminType, colors, fonts, spacing, ui } from '@/constants/theme';

/** White settings-style card that stacks hub rows with inset hairlines. */
export function AdminHubGroup({ children }: { children: ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <View style={styles.group}>
      {rows.map((row, i) => (
        <View key={isValidElement(row) && row.key != null ? row.key : i}>
          {i > 0 ? <View style={styles.divider} /> : null}
          {row}
        </View>
      ))}
    </View>
  );
}

/** One hub row — mint icon square, label + hint, optional count badge, chevron. */
export function AdminHubLink({
  icon: Icon,
  label,
  desc,
  badge,
  onPress,
}: {
  icon: LucideIcon;
  /** @deprecated Generated image tiles were dropped for vector icons; accepted for older call sites. */
  image?: ImageSourcePropType;
  label: string;
  desc?: string;
  /** Small red count pill (e.g. unread notifications). */
  badge?: number;
  /** @deprecated Every row now shares one style. */
  featured?: boolean;
  onPress: () => void;
}) {
  const badgeText = badge && badge > 0 ? (badge > 99 ? '99+' : String(badge)) : null;
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badgeText ? `${label}, ${badgeText} new` : label}
    >
      <View style={styles.iconBox}>
        <Icon size={19} color={ui.brand} strokeWidth={2} />
      </View>
      <View style={styles.body}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {desc ? (
          <Text style={styles.desc} numberOfLines={1}>
            {desc}
          </Text>
        ) : null}
      </View>
      {badgeText ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      ) : null}
      <ChevronRight size={18} color={ui.textTertiary} strokeWidth={2.2} />
    </Pressable>
  );
}

const ICON = 40;

const styles = StyleSheet.create({
  group: {
    marginHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    overflow: 'hidden',
    ...adminShadow.card,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ui.border,
    marginLeft: spacing.md + ICON + 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  pressed: { backgroundColor: ui.surfaceMuted },
  iconBox: {
    width: ICON,
    height: ICON,
    borderRadius: 12,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  label: { ...adminType.hubLabel, fontSize: 15, color: ui.text },
  desc: { ...adminType.hubDesc, fontSize: 12.5, marginTop: 1, color: ui.textSecondary },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.white },
});

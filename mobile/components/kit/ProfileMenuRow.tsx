import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { colors, fonts, radii, spacing, typeScale, ui } from '@/constants/theme';

export function ProfileMenuRow({
  icon: Icon,
  image,
  label,
  description,
  onPress,
  showBorder,
  tint = colors.forest,
  iconBg = ui.brandSoft,
  badge,
}: {
  icon?: LucideIcon;
  /**
   * Generated mint-tile image. The JPG tiles are framed differently (white ring, inset, full-bleed), so
   * lists that mix several look uneven — prefer `icon`, which draws every row on the same mint tile.
   */
  image?: ImageSourcePropType;
  label: string;
  description?: string;
  onPress: () => void;
  showBorder?: boolean;
  tint?: string;
  iconBg?: string;
  badge?: number | string;
}) {
  const showBadge = badge !== undefined && badge !== 0 && badge !== '0';
  return (
    <PressableScale
      style={[styles.row, showBorder && styles.border]}
      scaleTo={0.985}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[label, showBadge ? String(badge) : null, description].filter(Boolean).join('. ')}
    >
      {image ? (
        <Image source={image} style={styles.imageIcon} resizeMode="cover" />
      ) : Icon ? (
        // RealIcons sit inside a padded 24-unit box, so 22 reads like the ~19 pt glyphs of the other lists.
        <PremiumIcon icon={Icon} variant="mint" size={22} color={tint} bg={iconBg} boxSize={40} />
      ) : null}
      <View style={styles.textCol}>
        <View style={styles.labelRow}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
          {showBadge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {description ? (
          <Text style={styles.desc} numberOfLines={1}>
            {description}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={18} color={ui.textTertiary} strokeWidth={2.2} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    gap: 12,
    minHeight: 58,
    backgroundColor: colors.white,
  },
  imageIcon: { width: 40, height: 40, borderRadius: radii.thumb },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.border },
  textCol: { flex: 1, minWidth: 0 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { ...typeScale.rowTitle, fontSize: 14.5, lineHeight: 20, color: ui.text },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.white },
  desc: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: ui.textSecondary,
  },
});

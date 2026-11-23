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
  /** Generated mint-tile image — preferred when available. */
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
        <PremiumIcon icon={Icon} variant="mint" size="md" color={tint} bg={iconBg} boxSize={40} />
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
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    gap: 12,
    minHeight: 60,
    backgroundColor: colors.white,
  },
  imageIcon: { width: 40, height: 40, borderRadius: radii.thumb },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.border },
  textCol: { flex: 1, minWidth: 0 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { ...typeScale.rowTitle, color: ui.text },
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
    fontSize: 12.5,
    lineHeight: 17,
    color: ui.textSecondary,
  },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, customerType, fonts, spacing } from '@/constants/theme';

export function ProfileMenuRow({
  icon: Icon,
  label,
  description,
  onPress,
  showBorder,
  tint = colors.forest,
  iconBg = colors.soft,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  description?: string;
  onPress: () => void;
  showBorder?: boolean;
  tint?: string;
  iconBg?: string;
  badge?: number | string;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.row, showBorder && styles.border, pressed && styles.pressed]} onPress={onPress}>
      <PremiumIcon icon={Icon} variant="soft" size="md" color={tint} bg={iconBg} boxSize={48} />
      <View style={styles.textCol}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {badge !== undefined && badge !== 0 && badge !== '0' ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {description ? <Text style={styles.desc}>{description}</Text> : null}
      </View>
      <PremiumIcon icon={AppIcons.ui.chevronRight} variant="chevron" size="sm" color={colors.forest} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: spacing.md,
    gap: 14,
  },
  pressed: { backgroundColor: 'rgba(20,83,45,0.03)' },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(20,83,45,0.08)' },
  textCol: { flex: 1, minWidth: 0 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { ...customerType.menuLabel },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.white },
  desc: { ...customerType.menuDesc },
});

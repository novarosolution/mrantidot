import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing } from '@/constants/theme';

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
      <LinearGradient colors={[iconBg, colors.white]} style={styles.icon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Icon size={19} color={tint} strokeWidth={2} />
      </LinearGradient>
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
      <View style={styles.chevron}>
        <ChevronRight size={16} color={colors.forest} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    gap: 14,
  },
  pressed: { opacity: 0.9, backgroundColor: 'rgba(20,83,45,0.02)' },
  border: { borderBottomWidth: 1, borderBottomColor: 'rgba(20,83,45,0.06)' },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  textCol: { flex: 1, minWidth: 0 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
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
  desc: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

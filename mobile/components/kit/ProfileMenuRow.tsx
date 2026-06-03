import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function ProfileMenuRow({
  icon: Icon,
  label,
  onPress,
  showBorder,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  showBorder?: boolean;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.row, showBorder && styles.border, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.icon}>
        <Icon size={19} color={colors.forest} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: 14 },
  pressed: { opacity: 0.88 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.border },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
});

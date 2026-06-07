import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function AdminHubLink({
  icon: Icon,
  label,
  desc,
  accent = colors.forest,
  accentBg = colors.soft,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  desc: string;
  accent?: string;
  accentBg?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <LinearGradient colors={[accentBg, colors.white]} style={styles.icon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Icon size={20} color={accent} strokeWidth={2.2} />
      </LinearGradient>
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {desc}
        </Text>
      </View>
      <View style={styles.chevron}>
        <ChevronRight size={16} color={colors.forest} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.08)',
    ...premium.shadowSoft,
  },
  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  label: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  desc: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

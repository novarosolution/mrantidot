import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { adminSurfaces, adminType, colors, gradients, premium, shadows, spacing } from '@/constants/theme';

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
  desc?: string;
  accent?: string;
  accentBg?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <LinearGradient colors={[...gradients.goldBar]} style={styles.goldEdge} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      <View style={[styles.icon, { backgroundColor: accentBg }]}>
        <Icon size={20} color={accent} strokeWidth={2.2} />
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        {desc ? (
          <Text style={styles.desc} numberOfLines={1}>
            {desc}
          </Text>
        ) : null}
      </View>
      <View style={styles.chevron}>
        <ChevronRight size={16} color={colors.forest} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    paddingLeft: spacing.md + 4,
    borderRadius: premium.radiusCard,
    backgroundColor: adminSurfaces.panelTint,
    borderWidth: 1,
    borderColor: adminSurfaces.cardBorder,
    overflow: 'hidden',
    ...shadows.card,
  },
  goldEdge: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  label: { ...adminType.hubLabel },
  desc: { ...adminType.hubDesc },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

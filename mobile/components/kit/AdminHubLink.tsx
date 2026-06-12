import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

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
      <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldEdge} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
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
      <ChevronRight size={18} color={colors.muted} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
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
  label: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  desc: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
});

import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { adminShadow } from '@/components/kit/homeUi';
import { AppIcons } from '@/constants/appIcons';
import { adminType, colors, spacing } from '@/constants/theme';

export function AdminHubLink({
  icon,
  label,
  desc,
  accent = colors.forest,
  accentBg = colors.soft,
  featured = false,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  desc?: string;
  accent?: string;
  accentBg?: string;
  /** Emphasize primary hub entries (e.g. Content). */
  featured?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.wrap, pressed && styles.pressed]} onPress={onPress}>
      <View style={[styles.shell, featured && styles.shellFeatured]}>
        <GlassPanel style={styles.card} padded={false} tone="light" goldEdge intensity={40}>
          <View style={styles.inner}>
            <PremiumIcon
              icon={icon}
              variant={featured ? 'premium' : 'mint'}
              size="lg"
              color={featured ? '#FFFFFF' : accent}
              bg={accentBg}
              bgTo="#FFFFFF"
              boxSize={46}
            />
            <View style={styles.body}>
              <Text style={[styles.label, featured && styles.labelFeatured]}>{label}</Text>
              {desc ? (
                <Text style={styles.desc} numberOfLines={2}>
                  {desc}
                </Text>
              ) : null}
            </View>
            <PremiumIcon icon={AppIcons.ui.chevronRight} variant="chevron" size="sm" color={colors.forest} />
          </View>
        </GlassPanel>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  shell: {
    borderRadius: 20,
    ...adminShadow.card,
  },
  shellFeatured: {
    ...adminShadow.hero,
  },
  card: { borderRadius: 20 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: spacing.md,
  },
  body: { flex: 1, minWidth: 0, gap: 2 },
  label: { ...adminType.hubLabel, color: colors.ink },
  labelFeatured: { color: colors.forest },
  desc: { ...adminType.hubDesc, marginTop: 0, color: colors.muted },
});

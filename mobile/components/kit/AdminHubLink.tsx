import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { adminShadow } from '@/components/kit/homeUi';
import { AppIcons } from '@/constants/appIcons';
import { adminType, colors, spacing, ui } from '@/constants/theme';

export function AdminHubLink({
  icon,
  image,
  label,
  desc,
  accent = ui.brand,
  accentBg = ui.brandSoft,
  featured = false,
  onPress,
}: {
  icon: LucideIcon;
  image?: ImageSourcePropType;
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
        <GlassPanel style={styles.card} padded={false} tone={featured ? 'mint' : 'light'} intensity={40}>
          <View style={styles.inner}>
            <PremiumIcon
              icon={icon}
              image={image}
              variant={featured ? 'premium' : 'mint'}
              size="lg"
              color={featured ? colors.white : accent}
              bg={accentBg}
              bgTo={colors.white}
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
            <PremiumIcon icon={AppIcons.ui.chevronRight} variant="chevron" size="sm" color={ui.brand} />
          </View>
        </GlassPanel>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  shell: {
    borderRadius: 18,
    ...adminShadow.card,
  },
  shellFeatured: {
    ...adminShadow.soft,
  },
  card: { borderRadius: 18 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  body: { flex: 1, minWidth: 0, gap: 2 },
  label: { ...adminType.hubLabel, color: ui.text },
  labelFeatured: { color: ui.brand },
  desc: { ...adminType.hubDesc, marginTop: 0, color: ui.textSecondary },
});

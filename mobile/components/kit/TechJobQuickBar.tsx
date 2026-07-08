import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons, IconGradients } from '@/constants/appIcons';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

/** Jobs tab — only urgent work actions (no duplicate manage grid). */
export function TechJobQuickBar({
  activeJobId,
  verifyJobId,
  verifyCount = 0,
}: {
  activeJobId?: string;
  verifyJobId?: string;
  verifyCount?: number;
}) {
  if (!activeJobId && !verifyJobId) return null;

  return (
    <View style={styles.wrap}>
      {activeJobId ? (
        <Pressable
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          onPress={() => router.push(`/(tech)/job/${activeJobId}`)}
        >
          <PremiumIcon icon={AppIcons.techHub.active} variant="gradient" gradient={IconGradients.gold} size="sm" boxSize={32} />
          <Text style={styles.label}>Continue active job</Text>
        </Pressable>
      ) : null}
      {verifyJobId ? (
        <Pressable
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          onPress={() => router.push(`/(tech)/job/${verifyJobId}`)}
        >
          <PremiumIcon icon={AppIcons.techHub.verify} variant="gradient" gradient={IconGradients.teal} size="sm" boxSize={32} />
          <Text style={styles.label}>
            Enter completion code{verifyCount > 1 ? ` (${verifyCount})` : ''}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    gap: 8,
    marginBottom: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.08)',
    ...shadows.card,
  },
  pressed: { opacity: 0.92 },
  label: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
});

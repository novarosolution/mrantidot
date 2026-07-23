import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { homeShadow } from '@/components/kit/homeUi';
import { AppIcons, IconGradients } from '@/constants/appIcons';
import { colors, fonts, spacing, surfaces } from '@/constants/theme';
import { techRoutes, appPush } from '@/lib/routes';

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
          style={({ pressed }) => [pressed && styles.pressed]}
          onPress={() => appPush(techRoutes.job(activeJobId))}
        >
          <View style={styles.shell}>
            <GlassPanel style={styles.chip} padded={false} tone="clear" intensity={42} goldEdge>
              <View style={styles.inner}>
                <PremiumIcon icon={AppIcons.techHub.active} variant="premium" size="sm" boxSize={36} />
                <Text style={styles.label}>Continue active job</Text>
                <PremiumIcon icon={AppIcons.ui.chevronRight} variant="chevron" size={14} color={colors.forest} />
              </View>
            </GlassPanel>
          </View>
        </Pressable>
      ) : null}
      {verifyJobId ? (
        <Pressable
          style={({ pressed }) => [pressed && styles.pressed]}
          onPress={() => appPush(techRoutes.job(verifyJobId))}
        >
          <View style={styles.shell}>
            <GlassPanel style={styles.chip} padded={false} tone="mint" intensity={42} goldEdge>
              <View style={styles.inner}>
                <PremiumIcon
                  icon={AppIcons.techHub.verify}
                  variant="gradient"
                  gradient={IconGradients.forest}
                  size="sm"
                  boxSize={36}
                />
                <Text style={styles.label}>
                  Enter completion code{verifyCount > 1 ? ` (${verifyCount})` : ''}
                </Text>
                <PremiumIcon icon={AppIcons.ui.chevronRight} variant="chevron" size={14} color={colors.forest} />
              </View>
            </GlassPanel>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    marginBottom: spacing.sm,
  },
  shell: {
    borderRadius: 18,
    ...homeShadow.tile,
  },
  chip: {
    borderRadius: 18,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  label: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink },
});

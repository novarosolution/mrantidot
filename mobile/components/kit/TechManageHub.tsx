import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons, IconGradients } from '@/constants/appIcons';
import { colors, fonts, premium, shadows, spacing, surfaces } from '@/constants/theme';
import { techRoutes, appPush } from '@/lib/routes';

const Hub = AppIcons.techHub;

/** Profile tab — shortcuts to jobs & tools (no duplicate stats). */
export function TechManageHub({
  activeJobId,
  verifyJobId,
  verifyCount = 0,
  jobCount = 0,
}: {
  activeJobId?: string;
  verifyJobId?: string;
  verifyCount?: number;
  jobCount?: number;
}) {
  const items = [
    {
      key: 'jobs',
      label: 'Open jobs',
      desc: `${jobCount} assigned`,
      icon: Hub.jobs,
      grad: IconGradients.forest,
      onPress: () => appPush(techRoutes.home),
    },
    {
      key: 'active',
      label: 'Active job',
      desc: activeJobId ? 'Continue work' : 'None now',
      icon: Hub.active,
      grad: IconGradients.gold,
      onPress: () => activeJobId && appPush(techRoutes.job(activeJobId)),
      disabled: !activeJobId,
    },
    {
      key: 'verify',
      label: 'Verify',
      desc: verifyCount > 0 ? `${verifyCount} need code` : 'All clear',
      icon: Hub.verify,
      grad: IconGradients.teal,
      onPress: () => verifyJobId && appPush(techRoutes.job(verifyJobId)),
      disabled: !verifyJobId,
      badge: verifyCount > 0 ? verifyCount : undefined,
    },
    {
      key: 'calendar',
      label: 'Calendar',
      desc: 'Schedule view',
      icon: Hub.allJobs,
      grad: IconGradients.forest,
      onPress: () => appPush(techRoutes.profile),
    },
  ];

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Quick actions</Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            style={({ pressed }) => [styles.tile, item.disabled && styles.disabled, pressed && !item.disabled && styles.pressed]}
            onPress={item.onPress}
            disabled={item.disabled}
          >
            <LinearGradient colors={['#8FD03C', '#27A747']} style={styles.goldEdge} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
            <PremiumIcon icon={item.icon} variant="gradient" gradient={item.grad} size="md" boxSize={42} />
            <View style={styles.labelRow}>
              <Text style={styles.label}>{item.label}</Text>
              {item.badge != null ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.desc} numberOfLines={1}>
              {item.desc}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' },
  tile: {
    width: '47%',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 140,
    backgroundColor: surfaces.glass,
    borderRadius: premium.radiusCard,
    padding: spacing.sm + 4,
    paddingTop: spacing.sm + 8,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    overflow: 'hidden',
    minHeight: 108,
    gap: 8,
    ...shadows.card,
  },
  goldEdge: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  desc: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.white },
});

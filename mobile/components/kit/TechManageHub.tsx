import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons, IconGradients } from '@/constants/appIcons';
import { colors, fonts, premium, spacing, surfaces } from '@/constants/theme';
import { techRoutes, appPush } from '@/lib/routes';

const Hub = AppIcons.techHub;

/** Profile tools — jobs, leave, and urgent work shortcuts. */
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
      desc: jobCount > 0 ? `${jobCount} assigned` : 'View schedule',
      icon: Hub.jobs,
      grad: IconGradients.forest,
      onPress: () => appPush(techRoutes.home),
    },
    {
      key: 'active',
      label: 'Active job',
      desc: activeJobId ? 'Continue work' : 'None right now',
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
      key: 'leave',
      label: 'Leave',
      desc: 'Request time off',
      icon: AppIcons.ui.calendar,
      grad: IconGradients.forest,
      onPress: () => appPush(techRoutes.leave),
    },
  ];

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Quick actions</Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            style={({ pressed }) => [
              styles.tileOuter,
              item.disabled && styles.disabled,
              pressed && !item.disabled && styles.pressed,
            ]}
            onPress={item.onPress}
            disabled={item.disabled}
          >
            <View style={styles.tile}>
              <View style={styles.accent} />
              <PremiumIcon icon={item.icon} variant="gradient" gradient={item.grad} size="md" boxSize={40} />
              <View style={styles.copy}>
                <View style={styles.labelRow}>
                  <Text style={styles.label} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {item.badge != null ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.desc} numberOfLines={2}>
                  {item.desc}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md, marginTop: spacing.xs },
  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  // Shadow lives on the outer shell — never combine elevation with overflow:hidden on Android.
  tileOuter: {
    width: '47%',
    flexGrow: 1,
    maxWidth: '48.5%',
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    ...premium.shadowSoft,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tile: {
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    backgroundColor: colors.white,
    padding: 12,
    paddingTop: 14,
    minHeight: 112,
    gap: 10,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.limeBright,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.48 },
  copy: { gap: 3, flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ink, flexShrink: 1 },
  desc: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, lineHeight: 15 },
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

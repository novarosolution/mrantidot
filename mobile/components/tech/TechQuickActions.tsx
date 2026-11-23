import type { LucideIcon } from 'lucide-react-native';
import { BriefcaseBusiness, CalendarDays, ClipboardList, ShieldCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { fillCopy } from '@/constants/customerUiCopy';
import { PressableScale } from '@/components/ui/PressableScale';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { appPush, techRoutes } from '@/lib/routes';
import { colors, fonts, radii, spacing, ui } from '@/constants/theme';

type Tile = {
  key: string;
  icon: LucideIcon;
  label: string;
  sub: string;
  badge?: number;
  onPress?: () => void;
};

/** Profile shortcuts — open jobs, the active job, jobs waiting for a code, and leave. */
export function TechQuickActions({
  activeJobId,
  verifyJobId,
  verifyCount,
  openCount,
}: {
  activeJobId?: string;
  verifyJobId?: string;
  verifyCount: number;
  openCount: number;
}) {
  const copy = useCustomerUiCopy();
  const tiles: Tile[] = [
    {
      key: 'jobs',
      icon: ClipboardList,
      label: copy.techActionJobs,
      sub: openCount > 0 ? fillCopy(copy.techActionJobsCount, { count: openCount }) : copy.techActionJobsEmpty,
      onPress: () => appPush(techRoutes.home),
    },
    {
      key: 'active',
      icon: BriefcaseBusiness,
      label: copy.techActionActive,
      sub: activeJobId ? copy.techActionActiveContinue : copy.techActionActiveNone,
      onPress: activeJobId ? () => appPush(techRoutes.job(activeJobId)) : undefined,
    },
    {
      key: 'verify',
      icon: ShieldCheck,
      label: copy.techActionVerify,
      sub: verifyCount > 0 ? fillCopy(copy.techActionVerifyCount, { count: verifyCount }) : copy.techActionVerifyNone,
      badge: verifyCount > 0 ? verifyCount : undefined,
      onPress: verifyJobId ? () => appPush(techRoutes.job(verifyJobId)) : undefined,
    },
    {
      key: 'leave',
      icon: CalendarDays,
      label: copy.techLeaveTitle,
      sub: copy.techActionLeaveSub,
      onPress: () => appPush(techRoutes.leave),
    },
  ];

  return (
    <View style={styles.grid}>
      {tiles.map(({ key, icon: Icon, label, sub, badge, onPress }) => {
        const disabled = !onPress;
        return (
          <PressableScale
            key={key}
            containerStyle={styles.cell}
            style={[styles.tile, disabled && styles.tileDisabled]}
            onPress={onPress}
            disabled={disabled}
            haptic="tap"
            accessibilityRole="button"
            accessibilityLabel={`${label}, ${sub}`}
            accessibilityState={{ disabled }}
          >
            <View style={styles.top}>
              <View style={[styles.icon, disabled && styles.iconDisabled]}>
                <Icon size={20} color={disabled ? ui.textTertiary : ui.brand} strokeWidth={2.1} />
              </View>
              {badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              ) : null}
            </View>
            <View>
              <Text style={styles.label} numberOfLines={1}>
                {label}
              </Text>
              <Text style={[styles.sub, !disabled && key !== 'leave' && styles.subActive]} numberOfLines={1}>
                {sub}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '47%', flexGrow: 1 },
  tile: {
    minHeight: 108,
    padding: 14,
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  tileDisabled: { backgroundColor: ui.surfaceMuted },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDisabled: { backgroundColor: colors.white },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.white },
  label: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: ui.text },
  sub: { marginTop: 2, fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  subActive: { color: ui.brand, fontFamily: fonts.bodySemi },
});

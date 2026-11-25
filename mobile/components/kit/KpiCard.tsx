import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { PressableScale } from '@/components/ui/PressableScale';
import { adminShadow } from '@/components/kit/homeUi';
import { formatDelta, isMeaningfulDelta } from '@/lib/display';
import { ADMIN_KPI_COLS, adminGridCellWidth, useAdminGridCellWidth } from '@/lib/adminGrid';
import { adminType, colors, fonts, ui } from '@/constants/theme';

/** Measured once when called — prefer `useKpiCardWidth()` in components. */
export function kpiCardWidth() {
  return adminGridCellWidth(ADMIN_KPI_COLS);
}

/** KPI tile width for the 2-up (4-up on desktop) grid; follows resizes and the sidebar collapsing. */
export function useKpiCardWidth(): number {
  return useAdminGridCellWidth(ADMIN_KPI_COLS);
}

export function KpiCard({
  icon: Icon,
  value,
  label,
  delta,
  iconBg,
  iconColor,
  onPress,
  width,
  glass = true,
}: {
  icon: LucideIcon;
  image?: ImageSourcePropType;
  value: string;
  label: string;
  delta?: string;
  iconBg: string;
  iconColor: string;
  onPress?: () => void;
  width?: number;
  /** Frosted glass surface for mint / glass screens (default on). */
  glass?: boolean;
}) {
  const autoWidth = useKpiCardWidth();
  const cardWidth = width ?? autoWidth;

  const inner = (
    <View style={styles.content}>
      <View style={styles.top}>
        <View style={[styles.iconBox, { backgroundColor: iconBg === colors.white ? ui.brandSoft : iconBg }]}>
          <Icon size={18} color={iconColor} strokeWidth={2.1} />
        </View>
        {isMeaningfulDelta(delta) ? (
          <View style={[styles.deltaPill, delta?.startsWith('-') && styles.deltaPillDown]}>
            <Text style={[styles.delta, delta?.startsWith('-') && styles.deltaDown]}>{formatDelta(delta!)}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  const shellStyle = [styles.panel, { width: cardWidth }];

  if (glass) {
    const panel = (
      <View style={[styles.shell, { width: cardWidth }]}>
        <GlassPanel style={shellStyle} padded={false} tone="light" intensity={40}>
          {inner}
        </GlassPanel>
      </View>
    );
    if (onPress) {
      return (
        <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}, ${value}`}>
          {panel}
        </PressableScale>
      );
    }
    return panel;
  }

  const cardStyle = [styles.cardSolid, { width: cardWidth }];
  if (onPress) {
    return (
      <PressableScale style={cardStyle} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}, ${value}`}>
        {inner}
      </PressableScale>
    );
  }

  return <View style={cardStyle}>{inner}</View>;
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 20,
    ...adminShadow.card,
  },
  panel: { borderRadius: 20 },
  cardSolid: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...adminShadow.card,
  },
  content: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 14,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  iconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  value: { ...adminType.statValue, fontSize: 26, lineHeight: 31, letterSpacing: -0.6, color: ui.text },
  label: { ...adminType.statLabel, marginTop: 1 },
  deltaPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.mint,
  },
  deltaPillDown: { backgroundColor: colors.errorBg },
  delta: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.green },
  deltaDown: { color: colors.error },
});

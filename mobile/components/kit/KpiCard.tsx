import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AdminGoldBar } from '@/components/kit/AdminScreenKit';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { adminShadow } from '@/components/kit/homeUi';
import { formatDelta, isMeaningfulDelta } from '@/lib/display';
import { ADMIN_KPI_COLS, adminGridCellWidth } from '@/lib/adminGrid';
import { adminType, colors, fonts, spacing } from '@/constants/theme';

export function kpiCardWidth() {
  return adminGridCellWidth(ADMIN_KPI_COLS);
}

export function KpiCard({
  icon,
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
  const cardWidth = width ?? kpiCardWidth();

  const inner = (
    <>
      <AdminGoldBar />
      <View style={styles.content}>
        <PremiumIcon icon={icon} variant="mint" size="md" color={iconColor} bg={iconBg} bgTo="#FFFFFF" boxSize={40} />
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
        {isMeaningfulDelta(delta) ? (
          <Text style={[styles.delta, delta?.startsWith('-') && styles.deltaDown]}>{formatDelta(delta!)}</Text>
        ) : null}
      </View>
    </>
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
        <Pressable style={({ pressed }) => [pressed && styles.pressed]} onPress={onPress}>
          {panel}
        </Pressable>
      );
    }
    return panel;
  }

  const cardStyle = [styles.cardSolid, { width: cardWidth }];
  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [...cardStyle, pressed && styles.pressed]} onPress={onPress}>
        {inner}
      </Pressable>
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
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(180,220,165,0.95)',
    ...adminShadow.card,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 4,
    paddingBottom: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  value: { ...adminType.statValue, textAlign: 'center', marginTop: 10, color: colors.ink },
  label: { ...adminType.statLabel, color: colors.muted, marginTop: 3, textAlign: 'center' },
  delta: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.green, marginTop: 5, textAlign: 'center' },
  deltaDown: { color: colors.error },
});

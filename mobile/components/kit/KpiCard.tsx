import { type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AdminGoldBar } from '@/components/kit/AdminScreenKit';
import { formatDelta, isMeaningfulDelta } from '@/lib/display';
import { ADMIN_KPI_COLS, adminGridCellWidth } from '@/lib/adminGrid';
import { adminSurfaces, adminType, colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function kpiCardWidth() {
  return adminGridCellWidth(ADMIN_KPI_COLS);
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
}: {
  icon: ComponentType<{ color?: string; size?: number }>;
  value: string;
  label: string;
  delta?: string;
  iconBg: string;
  iconColor: string;
  onPress?: () => void;
  width?: number;
}) {
  const cardWidth = width ?? kpiCardWidth();

  const inner = (
    <>
      <AdminGoldBar />
      <View style={styles.content}>
        <View style={[styles.icon, { backgroundColor: iconBg }]}>
          <Icon size={18} color={iconColor} />
        </View>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
        {isMeaningfulDelta(delta) ? (
          <Text style={[styles.delta, delta?.startsWith('-') && styles.deltaDown]}>{formatDelta(delta!)}</Text>
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.pressed]}
        onPress={onPress}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={[styles.card, { width: cardWidth }]}>{inner}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    backgroundColor: adminSurfaces.panelTint,
    borderWidth: 1,
    borderColor: adminSurfaces.cardBorder,
    ...shadows.card,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  content: {
    padding: spacing.md,
    alignItems: 'center',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: { ...adminType.statValue, textAlign: 'center' },
  label: { ...adminType.statLabel, color: colors.muted, marginTop: 2, textAlign: 'center' },
  delta: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.green, marginTop: 4, textAlign: 'center' },
  deltaDown: { color: colors.error },
});

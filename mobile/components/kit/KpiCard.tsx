import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { adminShadow } from '@/components/kit/homeUi';
import { formatDelta, isMeaningfulDelta } from '@/lib/display';
import { ADMIN_KPI_COLS, adminGridCellWidth } from '@/lib/adminGrid';
import { adminType, colors, fonts, ui } from '@/constants/theme';

export function kpiCardWidth() {
  return adminGridCellWidth(ADMIN_KPI_COLS);
}

export function KpiCard({
  icon,
  image,
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
  const cardWidth = width ?? kpiCardWidth();

  const inner = (
    <View style={styles.content}>
      <View style={styles.top}>
        <PremiumIcon
          icon={icon}
          image={image}
          variant="mint"
          size="md"
          color={iconColor}
          bg={iconBg}
          bgTo={colors.white}
          boxSize={38}
        />
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
    ...adminShadow.card,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  content: {
    padding: 14,
    gap: 2,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  value: { ...adminType.statValue, fontSize: 24, letterSpacing: -0.6, color: ui.text },
  label: { ...adminType.statLabel, color: ui.textSecondary, marginTop: 2 },
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

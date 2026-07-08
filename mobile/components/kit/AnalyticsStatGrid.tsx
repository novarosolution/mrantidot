import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { ADMIN_KPI_COLS, adminGridCellWidth } from '@/lib/adminGrid';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export type AnalyticsStatItem = {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  onPress?: () => void;
};

export function AnalyticsStatGrid({ items }: { items: AnalyticsStatItem[] }) {
  const chipWidth = adminGridCellWidth(ADMIN_KPI_COLS);

  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const inner = (
          <>
            <PremiumIcon
              icon={item.icon}
              variant="soft"
              size="md"
              color={item.iconColor ?? colors.green}
              bg={item.iconBg ?? colors.soft}
              boxSize={36}
            />
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </>
        );
        if (item.onPress) {
          return (
            <Pressable
              key={item.key}
              style={({ pressed }) => [styles.chip, { width: chipWidth }, pressed && styles.pressed]}
              onPress={item.onPress}
            >
              {inner}
            </Pressable>
          );
        }
        return (
          <View key={item.key} style={[styles.chip, { width: chipWidth }]}>
            {inner}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' },
  chip: {
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    alignItems: 'center',
    ...premium.shadowSoft,
  },
  pressed: { opacity: 0.85 },
  value: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.forest, textAlign: 'center' },
  label: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2, textAlign: 'center' },
});

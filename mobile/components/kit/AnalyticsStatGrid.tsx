import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, fonts, premium, spacing, surfaces, ui } from '@/constants/theme';

export type AnalyticsStatItem = {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  onPress?: () => void;
};

export function AnalyticsStatGrid({ items, glass = false }: { items: AnalyticsStatItem[]; glass?: boolean }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const inner = (
          <>
            <PremiumIcon
              icon={item.icon}
              variant="mint"
              size="md"
              color={item.iconColor ?? colors.green}
              bg={item.iconBg ?? colors.soft}
              boxSize={36}
            />
            <Text style={styles.value} numberOfLines={1}>
              {item.value}
            </Text>
            <Text style={styles.label} numberOfLines={2}>
              {item.label}
            </Text>
          </>
        );
        const chipStyle = [styles.chip, glass && styles.chipGlass];
        if (item.onPress) {
          return (
            <PressableScale
              key={item.key}
              containerStyle={styles.cell}
              style={[...chipStyle, styles.fill]}
              onPress={item.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${item.label}, ${item.value}`}
            >
              {inner}
            </PressableScale>
          );
        }
        return (
          <View key={item.key} style={[...chipStyle, styles.cell]}>
            {inner}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' },
  /** Grid sizing sits on the outer touch target so pressable and static tiles line up. */
  cell: { width: '47%', flexGrow: 1 },
  fill: { flexGrow: 1 },
  chip: {
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    gap: 8,
    alignItems: 'center',
    ...ui.shadow,
  },
  chipGlass: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderColor: surfaces.glassBorderStrong,
  },
  value: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.forest, textAlign: 'center' },
  label: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2, textAlign: 'center' },
});

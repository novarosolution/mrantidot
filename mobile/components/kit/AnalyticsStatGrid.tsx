import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { colors, fonts, premium, spacing, surfaces } from '@/constants/theme';

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
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </>
        );
        const chipStyle = [styles.chip, glass && styles.chipGlass];
        if (item.onPress) {
          return (
            <Pressable
              key={item.key}
              style={({ pressed }) => [...chipStyle, pressed && styles.pressed]}
              onPress={item.onPress}
            >
              {inner}
            </Pressable>
          );
        }
        return (
          <View key={item.key} style={chipStyle}>
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
    width: '47%',
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2F0D8',
    borderTopWidth: 3,
    borderTopColor: '#8FD03C',
    gap: 8,
    alignItems: 'center',
    ...premium.shadowSoft,
  },
  chipGlass: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderColor: surfaces.glassBorderStrong,
    borderTopColor: '#8FD03C',
  },
  pressed: { opacity: 0.85 },
  value: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.forest, textAlign: 'center' },
  label: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2, textAlign: 'center' },
});

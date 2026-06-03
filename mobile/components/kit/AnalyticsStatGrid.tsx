import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
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
  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const Icon = item.icon;
        const inner = (
          <>
            <View style={[styles.icon, { backgroundColor: item.iconBg ?? colors.soft }]}>
              <Icon size={16} color={item.iconColor ?? colors.green} />
            </View>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </>
        );
        if (item.onPress) {
          return (
            <Pressable
              key={item.key}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
              onPress={item.onPress}
            >
              {inner}
            </Pressable>
          );
        }
        return (
          <View key={item.key} style={styles.chip}>
            {inner}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    width: '47%',
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...premium.shadowSoft,
  },
  pressed: { opacity: 0.85 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.forest },
  label: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
});

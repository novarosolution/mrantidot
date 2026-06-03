import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import type { Service } from '@/types/api';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function ServiceGrid({
  services,
  onPressItem,
}: {
  services: Service[];
  onPressItem?: (service: Service) => void;
}) {
  const items = services.slice(0, 8);

  return (
    <View style={styles.grid}>
      {items.map((s) => (
        <Pressable
          key={s.id}
          style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          onPress={() => onPressItem?.(s)}
        >
          <View style={styles.icon}>
            <ServiceIcon iconKey={s.iconKey} size={24} color={colors.lime} />
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {s.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: 16,
    rowGap: 16,
  },
  item: { width: '22%', alignItems: 'center' },
  itemPressed: { opacity: 0.88, transform: [{ scale: 0.96 }] },
  icon: {
    width: 60,
    height: 60,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 10.5,
    marginTop: 8,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 14,
  },
});

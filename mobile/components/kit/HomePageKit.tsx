import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip } from '@/components/ui/Chip';
import { colors, spacing } from '@/constants/theme';

/** Inline category chips — no bulky card wrapper. */
export function HomeCategoryFilter({
  chips,
  selected,
  onSelect,
}: {
  chips: { label: string }[];
  selected: string;
  onSelect: (label: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {chips.map((c) => (
        <Chip
          key={c.label}
          label={c.label}
          selected={selected === c.label}
          compact
          onPress={() => onSelect(c.label)}
        />
      ))}
    </ScrollView>
  );
}

/** Elevated white surface used across home sections. */
export function HomeSurface({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.md,
    gap: 8,
    alignItems: 'center',
    paddingBottom: 2,
  },
  surface: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
  },
});

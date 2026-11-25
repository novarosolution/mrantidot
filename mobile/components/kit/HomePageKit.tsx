import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { customerScrollProps } from '@/components/kit/GlassScreenKit';
import { colors, fonts, surfaces, ui } from '@/constants/theme';

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
      {...customerScrollProps}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {chips.map((c) => {
        const on = selected === c.label;
        return (
          <Pressable
            key={c.label}
            style={({ pressed }) => [pressed && { transform: [{ scale: 0.96 }] }]}
            onPress={() => onSelect(c.label)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <View style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function HomeSurface({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 2,
  },
  /** Urban-style filter pills — outlined when idle, solid ink when selected. */
  chip: {
    height: 36,
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  chipOn: {
    backgroundColor: ui.brand,
    borderColor: ui.brand,
  },
  chipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13.5,
    color: ui.text,
  },
  chipTextOn: { color: colors.white },
  surface: {
    marginHorizontal: 20,
    backgroundColor: surfaces.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
});

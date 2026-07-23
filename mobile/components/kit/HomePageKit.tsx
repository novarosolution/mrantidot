import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { customerScrollProps } from '@/components/kit/GlassScreenKit';
import { colors, fonts, surfaces } from '@/constants/theme';
import { homeShadow } from '@/components/kit/homeUi';

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
          >
            {on ? (
              <LinearGradient
                colors={['#30B84F', '#1A8734', '#0A6423']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.chip, styles.chipOn]}
              >
                <Text style={[styles.chipText, styles.chipTextOn]}>{c.label}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{c.label}</Text>
              </View>
            )}
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
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 14,
    paddingBottom: 2,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: surfaces.glass,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  chipOn: {
    borderWidth: 0,
    ...homeShadow.soft,
  },
  chipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
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

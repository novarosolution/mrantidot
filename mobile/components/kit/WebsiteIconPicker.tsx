import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WEBSITE_ICON_KEYS, WEBSITE_ICONS } from '@/constants/websiteAdmin';
import { haptic } from '@/lib/motion';
import { colors, fonts, spacing, ui } from '@/constants/theme';

/** One-row picker for the website's icon keys (badge, leaf, shield…). */
export const WebsiteIconPicker = memo(function WebsiteIconPicker({
  value,
  onChange,
  label = 'Icon',
}: {
  value: string;
  onChange: (key: string) => void;
  label?: string;
}) {
  const selected = WEBSITE_ICONS[value as keyof typeof WEBSITE_ICONS];
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {selected ? <Text style={styles.current}> · {selected.label}</Text> : null}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {WEBSITE_ICON_KEYS.map((key) => {
          const { icon: Icon, label: name } = WEBSITE_ICONS[key];
          const on = key === value;
          return (
            <Pressable
              key={key}
              onPress={() => {
                haptic('select');
                onChange(key);
              }}
              style={({ pressed }) => [styles.tile, on && styles.tileOn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${name} icon`}
              accessibilityState={{ selected: on }}
            >
              <Icon size={19} color={on ? colors.white : ui.brand} strokeWidth={2} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text, marginBottom: 8 },
  current: { fontFamily: fonts.body, color: ui.textSecondary },
  row: { gap: 8, paddingVertical: 2, paddingRight: spacing.sm },
  tile: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileOn: { backgroundColor: ui.brand, borderColor: ui.brand },
  pressed: { opacity: 0.8 },
});

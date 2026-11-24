import { Check } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, ui } from '@/constants/theme';
import { haptic } from '@/lib/motion';

export type ToggleChip = { key: string; label: string; hint?: string; muted?: boolean };

/**
 * Multi-select chips that wrap onto several lines — weekdays, cities, filters. Each chip is a checkbox for
 * screen readers; `muted` marks values that are kept but no longer offered (e.g. outside the service area).
 */
export const ToggleChips = memo(function ToggleChips({
  chips,
  selected,
  onToggle,
  disabled = false,
  accessibilityLabel,
}: {
  chips: ToggleChip[];
  selected: readonly string[];
  onToggle: (key: string) => void;
  disabled?: boolean;
  /** Group name for screen readers, e.g. "Weekly days off". */
  accessibilityLabel?: string;
}) {
  return (
    <View style={styles.wrap} accessibilityLabel={accessibilityLabel}>
      {chips.map((c) => {
        const on = selected.includes(c.key);
        return (
          <Pressable
            key={c.key}
            disabled={disabled}
            onPress={() => {
              haptic('select');
              onToggle(c.key);
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on, disabled }}
            accessibilityLabel={c.hint ? `${c.label}, ${c.hint}` : c.label}
            style={({ pressed }) => [styles.chip, on && styles.chipOn, c.muted && !on && styles.chipMuted, pressed && styles.pressed]}
          >
            {on ? <Check size={13} color={colors.white} strokeWidth={3} /> : null}
            <Text style={[styles.text, on && styles.textOn]} numberOfLines={1}>
              {c.label}
            </Text>
            {c.hint ? <Text style={[styles.hint, on && styles.hintOn]}>{c.hint}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
    maxWidth: '100%',
  },
  chipOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipMuted: { borderStyle: 'dashed' },
  pressed: { opacity: 0.8 },
  text: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text, flexShrink: 1 },
  textOn: { color: colors.white },
  hint: { fontFamily: fonts.body, fontSize: 11, color: ui.textTertiary },
  hintOn: { color: 'rgba(255,255,255,0.8)' },
});

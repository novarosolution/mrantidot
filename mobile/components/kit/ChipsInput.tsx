import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { textInputDefaults } from '@/components/ui/textInputDefaults';
import { haptic } from '@/lib/motion';
import { colors, fonts, formField, spacing, ui } from '@/constants/theme';

/** Short tags as removable chips — type, then tap + or press return (commas also split). */
export const ChipsInput = memo(function ChipsInput({
  label,
  values,
  onChange,
  max = 8,
  maxLength = 40,
  placeholder = 'Add a tag',
  hint,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  max?: number;
  maxLength?: number;
  placeholder?: string;
  hint?: string;
}) {
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const full = values.length >= max;

  const commit = (text: string) => {
    const parts = text
      .split(',')
      .map((t) => t.trim().slice(0, maxLength))
      .filter(Boolean);
    if (parts.length === 0) return;
    const lower = new Set(values.map((v) => v.toLowerCase()));
    const next = [...values];
    for (const p of parts) {
      if (next.length >= max) break;
      if (lower.has(p.toLowerCase())) continue;
      lower.add(p.toLowerCase());
      next.push(p);
    }
    if (next.length !== values.length) {
      haptic('select');
      onChange(next);
    }
    setDraft('');
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.count}>
          {values.length}/{max}
        </Text>
      </View>
      {values.length > 0 ? (
        <View style={styles.chips}>
          {values.map((v) => (
            <View key={v} style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>
                {v}
              </Text>
              <Pressable
                onPress={() => {
                  haptic('select');
                  onChange(values.filter((x) => x !== v));
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${v}`}
                style={styles.chipX}
              >
                <X size={12} color={ui.brand} strokeWidth={3} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      {!full ? (
        <View style={[styles.inputRow, focused && styles.inputFocused]}>
          <TextInput
            {...textInputDefaults}
            value={draft}
            onChangeText={(t) => (t.includes(',') ? commit(t) : setDraft(t))}
            onSubmitEditing={() => commit(draft)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              if (draft.trim()) commit(draft);
            }}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            returnKeyType="done"
            submitBehavior="submit"
            maxLength={maxLength}
            style={styles.input}
          />
          <Pressable
            onPress={() => commit(draft)}
            disabled={!draft.trim()}
            style={({ pressed }) => [styles.addBtn, !draft.trim() && styles.addOff, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Add tag"
          >
            <Plus size={16} color={colors.white} strokeWidth={2.6} />
          </Pressable>
        </View>
      ) : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontFamily: fonts.bodySemi, fontSize: formField.labelSize, color: ui.text },
  count: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    paddingLeft: 12,
    paddingRight: 8,
    height: 32,
    borderRadius: 999,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.border,
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.brand, flexShrink: 1 },
  chipX: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: formField.minHeight,
    backgroundColor: formField.bg,
    borderRadius: formField.radius,
    borderWidth: formField.borderWidth,
    borderColor: formField.borderColor,
    paddingLeft: 14,
    paddingRight: 8,
    gap: 8,
  },
  inputFocused: { backgroundColor: formField.bgFocus, borderColor: formField.borderFocus },
  input: { flex: 1, fontSize: 16, color: ui.text, paddingVertical: 12 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOff: { opacity: 0.35 },
  pressed: { opacity: 0.8 },
  hint: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: spacing.xs, lineHeight: 15 },
});

import { Plus, RotateCcw, X } from 'lucide-react-native';
import { memo, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { animateNextLayout, moveItem, ReorderButtons } from '@/components/kit/ReorderButtons';
import { textInputDefaults } from '@/components/ui/textInputDefaults';
import { colors, fonts, formField, spacing, ui } from '@/constants/theme';
import { haptic } from '@/lib/motion';

export const MAX_STEPS = 15;
const MAX_STEP_LENGTH = 60;
/** What the server uses when a service has no steps. */
export const DEFAULT_STEPS = ['Arrival', 'Before', 'During', 'After', 'Sign-off'];

let seq = 1;

/**
 * Visit steps of a service, one row each: rename in place, move up / down, remove, add. The technician works
 * through them in this order and uploads photos per step; changes apply to bookings made from now on.
 */
export const StepsEditor = memo(function StepsEditor({
  steps,
  onChange,
  error,
}: {
  steps: string[];
  onChange: (next: string[]) => void;
  error?: string;
}) {
  // Stable keys so a row keeps focus / layout when it moves.
  const ids = useRef<number[]>([]);
  while (ids.current.length < steps.length) ids.current.push(seq++);
  if (ids.current.length > steps.length) ids.current = ids.current.slice(0, steps.length);
  const inputs = useRef(new Map<number, TextInput | null>());
  const focusNext = useRef<number | null>(null);

  const update = (i: number, text: string) => onChange(steps.map((s, j) => (j === i ? text.slice(0, MAX_STEP_LENGTH) : s)));
  const move = (from: number, to: number) => {
    ids.current = moveItem(ids.current, from, to);
    onChange(moveItem(steps, from, to));
  };
  const remove = (i: number) => {
    haptic('warning');
    animateNextLayout();
    ids.current = ids.current.filter((_, j) => j !== i);
    onChange(steps.filter((_, j) => j !== i));
  };
  const add = (after?: number) => {
    if (steps.length >= MAX_STEPS) return;
    haptic('tap');
    animateNextLayout();
    const id = seq++;
    const at = after === undefined ? steps.length : after + 1;
    ids.current = [...ids.current.slice(0, at), id, ...ids.current.slice(at)];
    focusNext.current = id;
    onChange([...steps.slice(0, at), '', ...steps.slice(at)]);
  };

  return (
    <View>
      {steps.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>
            No steps — bookings use the default: {DEFAULT_STEPS.join(' → ')}.
          </Text>
          <Pressable
            onPress={() => {
              haptic('tap');
              ids.current = [];
              onChange([...DEFAULT_STEPS]);
            }}
            style={({ pressed }) => [styles.reset, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <RotateCcw size={14} color={ui.brand} strokeWidth={2.4} />
            <Text style={styles.resetText}>Start from the default steps</Text>
          </Pressable>
        </View>
      ) : null}

      {steps.map((step, i) => {
        const id = ids.current[i] ?? i;
        const blank = !step.trim();
        return (
          <View key={id} style={styles.row}>
            <View style={styles.num}>
              <Text style={styles.numText}>{i + 1}</Text>
            </View>
            <TextInput
              {...textInputDefaults}
              ref={(el) => {
                inputs.current.set(id, el);
                if (el && focusNext.current === id) {
                  focusNext.current = null;
                  el.focus();
                }
              }}
              value={step}
              onChangeText={(t) => update(i, t)}
              placeholder={`Step ${i + 1}, e.g. ${DEFAULT_STEPS[Math.min(i, DEFAULT_STEPS.length - 1)]}`}
              placeholderTextColor={colors.muted}
              style={[styles.input, blank && error ? styles.inputError : null]}
              returnKeyType={i === steps.length - 1 ? 'done' : 'next'}
              submitBehavior={i === steps.length - 1 ? 'blurAndSubmit' : 'submit'}
              onSubmitEditing={() => {
                // Return on the last row adds the next step; elsewhere it moves down.
                if (i === steps.length - 1) {
                  if (step.trim()) add();
                } else inputs.current.get(ids.current[i + 1] ?? -1)?.focus();
              }}
              maxLength={MAX_STEP_LENGTH}
              accessibilityLabel={`Step ${i + 1} name`}
            />
            <ReorderButtons index={i} count={steps.length} onMove={move} label={step || `step ${i + 1}`} />
            <Pressable
              onPress={() => remove(i)}
              hitSlop={6}
              style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${step || `step ${i + 1}`}`}
            >
              <X size={16} color={colors.error} strokeWidth={2.4} />
            </Pressable>
          </View>
        );
      })}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {steps.length < MAX_STEPS ? (
        <Pressable
          onPress={() => add()}
          style={({ pressed }) => [styles.add, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Add a step"
        >
          <Plus size={16} color={ui.brand} strokeWidth={2.6} />
          <Text style={styles.addText}>Add step</Text>
          <Text style={styles.count}>
            {steps.length}/{MAX_STEPS}
          </Text>
        </Pressable>
      ) : (
        <Text style={styles.full}>{MAX_STEPS} steps is the most — remove one to add another.</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  emptyBox: { padding: 12, borderRadius: 14, backgroundColor: ui.surfaceMuted, marginBottom: spacing.sm, gap: 8 },
  empty: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: ui.textSecondary },
  reset: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  resetText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.brand },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: ui.brandSoft, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.bodyBold, fontSize: 12, color: ui.brand },
  input: {
    flex: 1,
    minWidth: 0,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: formField.borderWidth,
    borderColor: formField.borderColor,
    backgroundColor: formField.bg,
    fontFamily: fonts.body,
    fontSize: 15,
    color: ui.text,
  },
  inputError: { borderColor: colors.error },
  remove: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.errorBg },
  error: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.error, marginBottom: spacing.xs },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    marginTop: 2,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(10,100,35,0.35)',
  },
  addText: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.brand },
  count: { fontFamily: fonts.body, fontSize: 12, color: ui.textTertiary },
  full: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, textAlign: 'center', paddingVertical: spacing.sm },
  pressed: { opacity: 0.7 },
});

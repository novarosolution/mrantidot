import { CalendarDays, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { daysInclusive, formatDayKey, istTodayKey } from '@/components/admin/DateRangePicker';
import { InlineCalendar } from '@/components/admin/InlineCalendar';
import { Button } from '@/components/ui/Button';
import { SheetModal } from '@/components/ui/SheetModal';
import { colors, fonts, formField, spacing, typeScale, ui } from '@/constants/theme';
import { haptic } from '@/lib/motion';
import { IS_WEB } from '@/lib/webAdmin';

/** "in 37 days", "today", "tomorrow", "3 days ago". */
function relative(key: string, today: string): string {
  if (key === today) return 'today';
  if (key > today) {
    const n = daysInclusive(today, key) - 1;
    return n === 1 ? 'tomorrow' : `in ${n} days`;
  }
  const n = daysInclusive(key, today) - 1;
  return n === 1 ? 'yesterday' : `${n} days ago`;
}

/**
 * A date form field: shows the picked day ("31 Dec 2026 · in 37 days") and opens a calendar sheet. `value`
 * is an IST `YYYY-MM-DD` key or '' for none (the clear button needs `clearable`).
 */
export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Pick a date',
  min,
  max,
  clearable = true,
  hint,
  sheetTitle,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  clearable?: boolean;
  hint?: string;
  sheetTitle?: string;
}) {
  const today = istTodayKey();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
    // Reset when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Enter applies on the web (Escape closes — SheetModal).
  useEffect(() => {
    if (!IS_WEB || !open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && draft) {
        e.preventDefault();
        onChange(draft);
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, draft, onChange]);

  const shown = value ? `${formatDayKey(value, true)} · ${relative(value, today)}` : placeholder;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.field}>
        <Pressable
          onPress={() => {
            haptic('tap');
            setOpen(true);
          }}
          style={({ pressed }) => [styles.main, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value ? formatDayKey(value, true) : 'not set'}. Change`}
        >
          <CalendarDays size={18} color={value ? ui.brand : ui.textTertiary} strokeWidth={2.2} />
          <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
            {shown}
          </Text>
        </Pressable>
        {clearable && value ? (
          <Pressable
            onPress={() => {
              haptic('select');
              onChange('');
            }}
            hitSlop={8}
            style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label.toLowerCase()}`}
          >
            <X size={13} color={colors.white} strokeWidth={3} />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <SheetModal
        visible={open}
        onClose={() => setOpen(false)}
        dialogWidth={420}
        header={
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{sheetTitle ?? label}</Text>
            <Text style={styles.sheetSub}>{draft ? `${formatDayKey(draft, true)} · ${relative(draft, today)}` : 'Tap a day'}</Text>
          </View>
        }
      >
        <View style={styles.sheetBody}>
          <InlineCalendar mode="single" value={{ from: draft || undefined }} onChange={(v) => setDraft(v.from ?? '')} min={min} max={max} />
          <View style={styles.actions}>
            <Button title="Cancel" variant="outline" size="md" fullWidth={false} style={styles.btn} onPress={() => setOpen(false)} />
            <Button
              title="Apply"
              variant="premium"
              size="md"
              fullWidth={false}
              style={styles.btn}
              disabled={!draft}
              onPress={() => {
                onChange(draft);
                setOpen(false);
              }}
            />
          </View>
        </View>
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontFamily: fonts.bodySemi, fontSize: formField.labelSize, color: ui.text, marginBottom: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: formField.minHeight,
    backgroundColor: formField.bg,
    borderRadius: formField.radius,
    borderWidth: formField.borderWidth,
    borderColor: formField.borderColor,
    paddingRight: 10,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  value: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 15, color: ui.text },
  placeholder: { fontFamily: fonts.body, color: colors.muted },
  clear: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.textTertiary },
  pressed: { opacity: 0.7 },
  hint: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16, color: colors.muted, marginTop: 6 },
  sheetHead: { paddingHorizontal: spacing.md + 4, paddingTop: 4, paddingBottom: 6 },
  sheetTitle: { ...typeScale.section, fontSize: 19, lineHeight: 25, color: ui.text },
  sheetSub: { ...typeScale.caption, marginTop: 4, color: ui.textSecondary },
  sheetBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  btn: { minWidth: 112 },
});

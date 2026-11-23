import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { animateNextLayout } from '@/components/kit/ReorderButtons';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { SettingsNote, SettingsSubhead } from '@/components/settings/SettingsKit';
import { textInputDefaults } from '@/components/ui/textInputDefaults';
import { confirmAsync } from '@/lib/confirm';
import { formatSlotLabel } from '@/lib/dates';
import { haptic } from '@/lib/motion';
import type { SettingsSlot, SettingsSlotGroup } from '@/types/api';
import { colors, fonts, formField, spacing, ui } from '@/constants/theme';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const GROUPS: { key: SettingsSlotGroup; title: string; hint: string }[] = [
  { key: 'morning', title: 'Morning', hint: '6 AM – 12 PM' },
  { key: 'afternoon', title: 'Afternoon', hint: '12 – 6 PM' },
  { key: 'evening', title: 'Evening', hint: '6 PM – midnight' },
  { key: 'night', title: 'Night', hint: 'Midnight – 6 AM' },
];

/** Same rule as the server: the start hour decides the group. */
export function slotGroupOf(from: string): SettingsSlotGroup {
  const h = Number(from.slice(0, 2));
  return h < 6 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}

/** HH:MM mask while typing — "0930" → "09:30", "1800" → "18:00". */
function timeInput(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

function TimeBox({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const bad = value.length >= 4 && !TIME_RE.test(value);
  return (
    <View style={styles.timeBox}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TextInput
        {...textInputDefaults}
        value={value}
        onChangeText={(t) => onChange(timeInput(t))}
        placeholder="HH:MM"
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={5}
        style={[styles.timeInput, bad && styles.timeInputBad]}
        accessibilityLabel={`${label} time, 24-hour`}
      />
    </View>
  );
}

export const SlotsSection = memo(function SlotsSection({
  slots,
  onChange,
}: {
  slots: SettingsSlot[];
  onChange: (next: SettingsSlot[]) => void;
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [addError, setAddError] = useState('');
  const onCount = slots.filter((s) => s.active).length;

  const toggle = (key: string) => {
    haptic('select');
    onChange(slots.map((s) => (s.key === key ? { ...s, active: !s.active } : s)));
  };
  const setGroup = (group: SettingsSlotGroup, active: boolean) => {
    haptic('select');
    onChange(slots.map((s) => (s.group === group ? { ...s, active } : s)));
  };
  const remove = (slot: SettingsSlot) => {
    void confirmAsync({
      title: `Remove ${formatSlotLabel(slot.key)}?`,
      message: 'Bookings already in this window keep it. Customers just can’t pick it any more.',
      confirmLabel: 'Remove',
      destructive: true,
    }).then((ok) => {
      if (!ok) return;
      haptic('warning');
      animateNextLayout();
      onChange(slots.filter((s) => s.key !== slot.key));
    });
  };
  const add = () => {
    if (!TIME_RE.test(from) || !TIME_RE.test(to)) {
      setAddError('Use 24-hour times like 09:30 and 11:30');
      return;
    }
    if (from === to) {
      setAddError('Start and end must be different');
      return;
    }
    const key = `${from}-${to}`;
    if (slots.some((s) => s.key === key)) {
      setAddError('That window is already in the list');
      return;
    }
    haptic('tap');
    animateNextLayout();
    const next = [...slots, { key, from, to, group: slotGroupOf(from), active: true }];
    onChange(next.sort((a, b) => a.from.localeCompare(b.from)));
    setFrom('');
    setTo('');
    setAddError('');
  };

  return (
    <>
      <SettingsNote>
        Windows customers can pick in the app and on the website. Switching one off stops new bookings in it; existing
        bookings keep their time.
      </SettingsNote>
      {onCount === 0 ? <SettingsNote tone="warn">Switch at least one window on — customers couldn’t book otherwise.</SettingsNote> : null}

      {GROUPS.map((g) => {
        const list = slots.filter((s) => s.group === g.key);
        if (list.length === 0) return null;
        const on = list.filter((s) => s.active).length;
        return (
          <View key={g.key} style={styles.group}>
            <View style={styles.groupHead}>
              <View style={styles.groupText}>
                <Text style={styles.groupTitle}>{g.title}</Text>
                <Text style={styles.groupHint}>
                  {g.hint} · {on} of {list.length} on
                </Text>
              </View>
              <Pressable
                onPress={() => setGroup(g.key, on < list.length)}
                hitSlop={6}
                style={({ pressed }) => [styles.allBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.allBtnText}>{on < list.length ? 'All on' : 'All off'}</Text>
              </Pressable>
            </View>
            {list.map((s) => (
              <View key={s.key} style={[styles.slot, !s.active && styles.slotOff]}>
                <View style={styles.slotText}>
                  <Text style={[styles.slotLabel, !s.active && styles.slotLabelOff]}>{formatSlotLabel(s.key)}</Text>
                  <Text style={styles.slotKey}>
                    {s.from} – {s.to}
                    {s.to <= s.from ? ' (ends after midnight)' : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => remove(s)}
                  hitSlop={6}
                  style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${formatSlotLabel(s.key)}`}
                >
                  <Trash2 size={15} color={colors.error} strokeWidth={2.3} />
                </Pressable>
                <ToggleSwitch
                  value={s.active}
                  onToggle={() => toggle(s.key)}
                  accessibilityLabel={`${formatSlotLabel(s.key)} ${s.active ? 'on' : 'off'}`}
                />
              </View>
            ))}
          </View>
        );
      })}

      <SettingsSubhead title="Add a window" aside="24-hour times" />
      <View style={styles.addBox}>
        <View style={styles.addRow}>
          <TimeBox label="From" value={from} onChange={(v) => { setFrom(v); setAddError(''); }} />
          <Text style={styles.dash}>–</Text>
          <TimeBox label="To" value={to} onChange={(v) => { setTo(v); setAddError(''); }} />
          <Pressable
            onPress={add}
            style={({ pressed }) => [styles.addBtn, (!from || !to) && styles.addBtnOff, pressed && styles.pressed]}
            disabled={!from || !to}
            accessibilityRole="button"
            accessibilityLabel="Add window"
          >
            <Plus size={16} color={colors.white} strokeWidth={2.6} />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
        {TIME_RE.test(from) && TIME_RE.test(to) && from !== to ? (
          <Text style={styles.addPreview}>
            {formatSlotLabel(`${from}-${to}`)} · shows under {GROUPS.find((g) => g.key === slotGroupOf(from))?.title}
          </Text>
        ) : null}
        {addError ? <Text style={styles.addError}>{addError}</Text> : null}
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  group: { marginBottom: spacing.md, gap: 6 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  groupText: { flex: 1, minWidth: 0 },
  groupTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.text },
  groupHint: { fontFamily: fonts.bodyMedium, fontSize: 12, color: ui.textSecondary },
  allBtn: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: ui.brandSoft,
  },
  allBtnText: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.brand },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  slotOff: { backgroundColor: ui.surfaceMuted },
  slotText: { flex: 1, minWidth: 0 },
  slotLabel: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: ui.text },
  slotLabelOff: { color: ui.textTertiary },
  slotKey: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: ui.textTertiary, marginTop: 1 },
  remove: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorBg,
  },
  addBox: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(8,123,53,0.35)',
    backgroundColor: 'rgba(234,244,236,0.5)',
    gap: 8,
  },
  addRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  timeBox: { flex: 1, minWidth: 0 },
  timeLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textSecondary, marginBottom: 4 },
  timeInput: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: formField.borderWidth,
    borderColor: formField.borderColor,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: ui.text,
    textAlign: 'center',
  },
  timeInputBad: { borderColor: 'rgba(179,63,40,0.45)', backgroundColor: colors.errorBg },
  dash: { fontFamily: fonts.bodyBold, fontSize: 16, color: ui.textSecondary, paddingBottom: 10 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.forest,
  },
  addBtnOff: { opacity: 0.45 },
  addBtnText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.white },
  addPreview: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.brand },
  addError: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.error },
  pressed: { opacity: 0.75 },
});

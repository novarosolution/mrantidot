import { memo, useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { IconInput } from '@/components/kit/IconInput';
import { animateNextLayout, moveItem, ReorderButtons } from '@/components/kit/ReorderButtons';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { textInputDefaults } from '@/components/ui/textInputDefaults';
import { confirmAsync } from '@/lib/confirm';
import { haptic } from '@/lib/motion';
import { colors, fonts, formField, spacing, ui } from '@/constants/theme';

/**
 * Small building blocks for Business settings (admin): number fields with quick picks, switch rows,
 * and an editable list (rename / on-off / reorder / add / remove).
 */

/* ---------- text ---------- */

export function SettingsNote({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'warn' | 'ok' }) {
  return (
    <Text style={[styles.note, tone === 'warn' && styles.noteWarn, tone === 'ok' && styles.noteOk]}>{children}</Text>
  );
}

export function SettingsSubhead({ title, aside }: { title: string; aside?: string }) {
  return (
    <View style={styles.subhead}>
      <Text style={styles.subheadTitle}>{title}</Text>
      {aside ? <Text style={styles.subheadAside}>{aside}</Text> : null}
    </View>
  );
}

/* ---------- quick pick chips ---------- */

export function PresetChips<T extends string | number>({
  options,
  value,
  onSelect,
  format = (v) => String(v),
}: {
  options: readonly T[];
  value: T;
  onSelect: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <View style={styles.presets}>
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable
            key={String(o)}
            onPress={() => {
              haptic('select');
              onSelect(o);
            }}
            style={({ pressed }) => [styles.preset, on && styles.presetOn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.presetText, on && styles.presetTextOn]}>{format(o)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- number field ---------- */

/** Whole or decimal number with an inline range check; keeps what you type until you leave the field. */
export const NumberField = memo(function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  decimals = false,
  unit,
  hint,
  presets,
  formatPreset,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  decimals?: boolean;
  /** Shown in the range error ("min", "hours", "₹"…). */
  unit?: string;
  hint?: string;
  presets?: readonly number[];
  formatPreset?: (n: number) => string;
}) {
  const [text, setText] = useState(() => String(value));
  useEffect(() => {
    setText((t) => ((t === '' || t === '.') && value === 0) || Number(t) === value ? t : String(value));
  }, [value]);
  const outOfRange = !Number.isFinite(value) || value < min || (max != null && value > max);
  const range = max != null ? `${min}–${max}` : `${min} or more`;

  return (
    <View>
      <IconInput
        label={label}
        value={text}
        keyboardType={decimals ? 'decimal-pad' : 'number-pad'}
        inputMode={decimals ? 'decimal' : 'numeric'}
        maxLength={decimals ? 7 : 8}
        onChangeText={(t) => {
          const clean = decimals
            ? t.replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
            : t.replace(/\D/g, '');
          setText(clean);
          const n = clean === '' || clean === '.' ? 0 : Number(clean);
          if (Number.isFinite(n)) onChange(n);
        }}
        onBlur={() => setText(String(value))}
        hint={hint}
        error={outOfRange ? `Use ${range}${unit ? ` ${unit}` : ''}` : undefined}
        containerStyle={presets ? styles.tightField : undefined}
      />
      {presets ? (
        <PresetChips options={presets} value={value} onSelect={onChange} format={formatPreset} />
      ) : null}
    </View>
  );
});

/* ---------- switch row ---------- */

export const ToggleRow = memo(function ToggleRow({
  title,
  body,
  value,
  onChange,
  tone = 'default',
}: {
  title: string;
  body?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  /** "danger" tints the row while it is on (e.g. maintenance). */
  tone?: 'default' | 'danger';
}) {
  return (
    <View style={[styles.toggleRow, value && tone === 'danger' && styles.toggleRowDanger]}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {body ? <Text style={styles.toggleBody}>{body}</Text> : null}
      </View>
      <ToggleSwitch
        value={value}
        onToggle={() => {
          haptic('select');
          onChange(!value);
        }}
        accessibilityLabel={title}
      />
    </View>
  );
});

/* ---------- editable list ---------- */

export type EditableItem = { key: string; label: string; active: boolean; group?: 'home' | 'business' };

const KEY_RE = /^[a-z0-9_]{1,40}$/;

/** "Deep clean" → "deep_clean" (unique among `taken`). */
export function keyFromLabel(label: string, taken: string[]): string {
  const base =
    label
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 34) || 'custom';
  let key = base;
  let n = 2;
  while (taken.includes(key)) key = `${base}_${n++}`;
  return KEY_RE.test(key) ? key : `custom_${Date.now() % 100000}`;
}

const GROUPS: { key: 'home' | 'business'; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'business', label: 'Business' },
];

function GroupPicker({ value, onChange }: { value: 'home' | 'business'; onChange: (g: 'home' | 'business') => void }) {
  return (
    <View style={styles.groupPick}>
      {GROUPS.map((g) => {
        const on = g.key === value;
        return (
          <Pressable
            key={g.key}
            onPress={() => {
              haptic('select');
              onChange(g.key);
            }}
            style={({ pressed }) => [styles.groupChip, on && styles.groupChipOn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.groupChipText, on && styles.groupChipTextOn]}>{g.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type RowProps<T extends EditableItem> = {
  item: T;
  index: number;
  count: number;
  defaultLabel?: string;
  icon?: ReactNode;
  reorder: boolean;
  removable: boolean;
  groups: boolean;
  labelMax: number;
  onPatch: (index: number, patch: Partial<T>) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
};

function ItemRowInner<T extends EditableItem>({
  item,
  index,
  count,
  defaultLabel,
  icon,
  reorder,
  removable,
  groups,
  labelMax,
  onPatch,
  onMove,
  onRemove,
}: RowProps<T>) {
  const [focused, setFocused] = useState(false);
  const empty = !item.label.trim();
  return (
    <View style={[styles.row, !item.active && styles.rowOff]}>
      <View style={styles.rowMain}>
        {icon ? <View style={styles.rowIcon}>{icon}</View> : null}
        <TextInput
          {...textInputDefaults}
          value={item.label}
          onChangeText={(label) => onPatch(index, { label } as Partial<T>)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={defaultLabel || 'Name'}
          placeholderTextColor={colors.muted}
          maxLength={labelMax}
          style={[styles.rowInput, focused && styles.rowInputFocused, empty && styles.rowInputError]}
          accessibilityLabel={`Name for ${item.key}`}
        />
        <ToggleSwitch
          value={item.active}
          onToggle={() => {
            haptic('select');
            onPatch(index, { active: !item.active } as Partial<T>);
          }}
          accessibilityLabel={`${item.label || item.key} ${item.active ? 'on' : 'off'}`}
        />
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.rowKey} numberOfLines={1}>
          {item.active ? 'On' : 'Off'} · {item.key}
          {defaultLabel && defaultLabel !== item.label ? ` · was “${defaultLabel}”` : ''}
        </Text>
        <View style={styles.rowActions}>
          {groups && item.group ? (
            <GroupPicker value={item.group} onChange={(group) => onPatch(index, { group } as Partial<T>)} />
          ) : null}
          {reorder ? <ReorderButtons index={index} count={count} onMove={onMove} label={item.label} /> : null}
          {removable ? (
            <Pressable
              onPress={() => onRemove(index)}
              hitSlop={6}
              style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.label || item.key}`}
            >
              <Trash2 size={15} color={colors.error} strokeWidth={2.3} />
            </Pressable>
          ) : null}
        </View>
      </View>
      {empty ? <Text style={styles.rowError}>Give it a name, or switch it off</Text> : null}
    </View>
  );
}

const ItemRow = memo(ItemRowInner) as typeof ItemRowInner;

/**
 * Rename / switch on-off / reorder / add / remove. Keys never change once saved (bookings and
 * services store them); `fixed` keys can't be removed.
 */
export function ItemListEditor<T extends EditableItem>({
  items,
  onChange,
  defaults = [],
  fixed = [],
  canAdd = false,
  reorder = true,
  groups = false,
  addPlaceholder = 'New name',
  addLabel = 'Add',
  iconFor,
  labelMax = 60,
  max = 40,
  makeItem,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  /** Built-in items (for "was …" hints). */
  defaults?: EditableItem[];
  /** Keys that can't be removed (built-in, or used by code). */
  fixed?: readonly string[];
  canAdd?: boolean;
  reorder?: boolean;
  groups?: boolean;
  addPlaceholder?: string;
  addLabel?: string;
  iconFor?: (item: T) => ReactNode;
  labelMax?: number;
  max?: number;
  makeItem?: (label: string, key: string, group: 'home' | 'business') => T;
}) {
  const [draft, setDraft] = useState('');
  const [group, setGroup] = useState<'home' | 'business'>('home');
  const full = items.length >= max;

  const patch = (index: number, p: Partial<T>) => onChange(items.map((it, i) => (i === index ? { ...it, ...p } : it)));
  const move = (from: number, to: number) => onChange(moveItem(items, from, to));
  const remove = (index: number) => {
    const it = items[index];
    if (!it) return;
    void confirmAsync({
      title: `Remove “${it.label || it.key}”?`,
      message: 'Anything already using it keeps it; it just stops being offered. Removed when you save.',
      confirmLabel: 'Remove',
      destructive: true,
    }).then((ok) => {
      if (!ok) return;
      haptic('warning');
      animateNextLayout();
      onChange(items.filter((_, i) => i !== index));
    });
  };
  const add = () => {
    const label = draft.trim();
    if (!label || full || !makeItem) return;
    const key = keyFromLabel(label, items.map((i) => i.key));
    haptic('tap');
    animateNextLayout();
    onChange([...items, makeItem(label, key, group)]);
    setDraft('');
  };

  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <ItemRow<T>
          key={item.key}
          item={item}
          index={index}
          count={items.length}
          defaultLabel={defaults.find((d) => d.key === item.key)?.label}
          icon={iconFor?.(item)}
          reorder={reorder}
          removable={!fixed.includes(item.key)}
          groups={groups}
          labelMax={labelMax}
          onPatch={patch}
          onMove={move}
          onRemove={remove}
        />
      ))}

      {canAdd && makeItem ? (
        full ? (
          <SettingsNote>Maximum reached — remove one to add another.</SettingsNote>
        ) : (
          <View style={styles.addBox}>
            <View style={styles.addRow}>
              <TextInput
                {...textInputDefaults}
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={add}
                placeholder={addPlaceholder}
                placeholderTextColor={colors.muted}
                maxLength={labelMax}
                returnKeyType="done"
                style={[styles.rowInput, styles.addInput]}
                accessibilityLabel={addPlaceholder}
              />
              <Pressable
                onPress={add}
                disabled={!draft.trim()}
                style={({ pressed }) => [styles.addBtn, !draft.trim() && styles.addBtnOff, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={addLabel}
              >
                <Plus size={16} color={colors.white} strokeWidth={2.6} />
                <Text style={styles.addBtnText}>{addLabel}</Text>
              </Pressable>
            </View>
            {groups ? (
              <View style={styles.addGroup}>
                <Text style={styles.rowKey}>Shows under</Text>
                <GroupPicker value={group} onChange={setGroup} />
              </View>
            ) : null}
          </View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  note: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: ui.textSecondary, marginBottom: spacing.sm },
  noteWarn: { color: colors.amberInk, fontFamily: fonts.bodyMedium },
  noteOk: { color: ui.brand, fontFamily: fonts.bodyMedium },
  subhead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: spacing.sm, marginTop: spacing.xs },
  subheadTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.text },
  subheadAside: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textSecondary },

  tightField: { marginBottom: spacing.sm },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  preset: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  presetOn: { backgroundColor: ui.brandSoft, borderColor: 'rgba(8,123,53,0.35)' },
  presetText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.textSecondary },
  presetTextOn: { color: ui.brand },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
    marginBottom: spacing.sm,
  },
  toggleRowDanger: { backgroundColor: colors.errorBg, borderColor: 'rgba(179,63,40,0.3)' },
  toggleText: { flex: 1, minWidth: 0 },
  toggleTitle: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: ui.text },
  toggleBody: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17, color: ui.textSecondary, marginTop: 2 },

  list: { gap: 8 },
  row: {
    padding: 10,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
    gap: 6,
  },
  rowOff: { backgroundColor: ui.surfaceMuted },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: formField.bg,
    borderWidth: formField.borderWidth,
    borderColor: formField.borderColor,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: ui.text,
  },
  rowInputFocused: { backgroundColor: formField.bgFocus, borderColor: formField.borderFocus },
  rowInputError: { borderColor: 'rgba(179,63,40,0.45)', backgroundColor: colors.errorBg },
  rowMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  rowKey: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: ui.textTertiary, flexShrink: 1 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowError: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.error },
  remove: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  groupPick: { flexDirection: 'row', gap: 4 },
  groupChip: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  groupChipOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  groupChipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textSecondary },
  groupChipTextOn: { color: colors.white },

  addBox: {
    marginTop: 4,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(8,123,53,0.35)',
    backgroundColor: 'rgba(234,244,236,0.5)',
    gap: 8,
  },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addInput: { backgroundColor: colors.white },
  addGroup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
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
  pressed: { opacity: 0.75 },
});

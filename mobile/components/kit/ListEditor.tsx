import { memo, useCallback, useRef, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, Plus, Trash2 } from 'lucide-react-native';
import { animateNextLayout, moveItem, ReorderButtons } from '@/components/kit/ReorderButtons';
import { haptic } from '@/lib/motion';
import { adminType, colors, fonts, spacing, ui } from '@/constants/theme';
import { confirmAsync } from '@/lib/confirm';

/** React-style setter: the editor always edits from the latest list (no lost keystrokes). */
export type ListSetter<T> = (updater: (prev: T[]) => T[]) => void;

type RowProps<T extends object> = {
  id: number;
  item: T;
  index: number;
  count: number;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  autoOpen: boolean;
  renderFields: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  onUpdate: (index: number, patch: Partial<T>) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number, title: string) => void;
};

function ListEditorRowInner<T extends object>({
  item,
  index,
  count,
  title,
  subtitle,
  icon: Icon,
  autoOpen,
  renderFields,
  onUpdate,
  onMove,
  onRemove,
}: RowProps<T>) {
  const [open, setOpen] = useState(autoOpen);
  const update = useCallback((patch: Partial<T>) => onUpdate(index, patch), [index, onUpdate]);

  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <Pressable
          onPress={() => {
            haptic('select');
            animateNextLayout();
            setOpen((v) => !v);
          }}
          style={({ pressed }) => [styles.rowToggle, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${title}, item ${index + 1} of ${count}. ${open ? 'Collapse' : 'Edit'}`}
        >
          <View style={styles.num}>
            {Icon ? <Icon size={16} color={ui.brand} strokeWidth={2.2} /> : <Text style={styles.numText}>{index + 1}</Text>}
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.rowSub} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <ChevronDown
            size={17}
            color={ui.textTertiary}
            strokeWidth={2.4}
            style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
          />
        </Pressable>
        {!open ? (
          <View style={styles.headActions}>
            <ReorderButtons index={index} count={count} onMove={onMove} label={title} />
          </View>
        ) : null}
      </View>
      {open ? (
        <View style={styles.rowBody}>
          {renderFields(item, update, index)}
          <View style={styles.rowFoot}>
            <ReorderButtons index={index} count={count} onMove={onMove} label={title} />
            <Pressable
              onPress={() => onRemove(index, title)}
              style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${title}`}
            >
              <Trash2 size={15} color={colors.error} strokeWidth={2.3} />
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const ListEditorRow = memo(ListEditorRowInner) as typeof ListEditorRowInner;

let rowSeq = 1;

/**
 * Inline list editor: rows open to edit, move up / down, remove (with confirm) and add up to `max`.
 * Pass a stable `setItems` and module-level `renderFields` so typing only re-renders the edited row.
 */
function ListEditorInner<T extends object>({
  title,
  hint,
  items,
  setItems,
  makeItem,
  max,
  itemTitle,
  itemSubtitle,
  itemIcon,
  renderFields,
  addLabel = 'Add item',
  emptyText = 'Nothing here yet.',
}: {
  title: string;
  hint?: string;
  items: T[];
  setItems: ListSetter<T>;
  makeItem: () => T;
  max?: number;
  itemTitle: (item: T, index: number) => string;
  itemSubtitle?: (item: T, index: number) => string | undefined;
  /** Small icon in the row head (stable component refs keep rows memoised). */
  itemIcon?: (item: T) => LucideIcon | undefined;
  renderFields: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  addLabel?: string;
  emptyText?: string;
}) {
  // Stable row ids so a row's open/closed state follows it when it moves.
  const ids = useRef<number[]>([]);
  if (ids.current.length > items.length) ids.current = ids.current.slice(0, items.length);
  while (ids.current.length < items.length) ids.current.push(rowSeq++);
  const autoOpenId = useRef<number | null>(null);

  const onUpdate = useCallback(
    (index: number, patch: Partial<T>) =>
      setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it))),
    [setItems],
  );

  const onMove = useCallback(
    (from: number, to: number) => {
      ids.current = moveItem(ids.current, from, to);
      setItems((prev) => moveItem(prev, from, to));
    },
    [setItems],
  );

  const onRemove = useCallback(
    (index: number, label: string) => {
      void confirmAsync({
        title: 'Remove this item?',
        message: label ? `“${label}” will be removed when you save.` : undefined,
        confirmLabel: 'Remove',
        destructive: true,
      }).then((ok) => {
        if (!ok) return;
        haptic('warning');
        animateNextLayout();
        ids.current = ids.current.filter((_, i) => i !== index);
        setItems((prev) => prev.filter((_, i) => i !== index));
      });
    },
    [setItems],
  );

  const canAdd = max == null || items.length < max;
  const add = () => {
    if (!canAdd) return;
    haptic('tap');
    animateNextLayout();
    const id = rowSeq++;
    ids.current = [...ids.current, id];
    autoOpenId.current = id;
    setItems((prev) => [...prev, makeItem()]);
  };

  return (
    <View>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>{title}</Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
        {max != null ? (
          <Text style={styles.count}>
            {items.length}/{max}
          </Text>
        ) : null}
      </View>

      {items.length === 0 ? <Text style={styles.empty}>{emptyText}</Text> : null}

      <View style={styles.rows}>
        {items.map((item, index) => {
          const id = ids.current[index] ?? index;
          return (
            <ListEditorRow<T>
              key={id}
              id={id}
              item={item}
              index={index}
              count={items.length}
              title={itemTitle(item, index)}
              subtitle={itemSubtitle?.(item, index)}
              icon={itemIcon?.(item)}
              autoOpen={autoOpenId.current === id}
              renderFields={renderFields}
              onUpdate={onUpdate}
              onMove={onMove}
              onRemove={onRemove}
            />
          );
        })}
      </View>

      {canAdd ? (
        <Pressable
          onPress={add}
          style={({ pressed }) => [styles.add, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={addLabel}
        >
          <Plus size={16} color={ui.brand} strokeWidth={2.6} />
          <Text style={styles.addText}>{addLabel}</Text>
        </Pressable>
      ) : (
        <Text style={styles.full}>Maximum reached — remove one to add another.</Text>
      )}
    </View>
  );
}

export const ListEditor = memo(ListEditorInner) as typeof ListEditorInner;

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  headText: { flex: 1, minWidth: 0 },
  title: { ...adminType.formTitle, fontSize: 16, color: ui.text },
  hint: { ...adminType.formSub, fontSize: 12, lineHeight: 17, color: ui.textSecondary },
  count: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textSecondary, marginTop: 2 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: ui.textSecondary, marginBottom: spacing.sm },
  rows: { gap: 10 },
  row: {
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
    overflow: 'hidden',
  },
  rowHead: { flexDirection: 'row', alignItems: 'center' },
  rowToggle: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingLeft: 12, paddingRight: 8 },
  headActions: { paddingRight: 10 },
  num: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { fontFamily: fonts.bodyBold, fontSize: 13, color: ui.brand },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: ui.text },
  rowSub: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 1 },
  rowBody: {
    paddingHorizontal: 12,
    paddingTop: spacing.sm,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  rowFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  remove: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.errorBg,
  },
  removeText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.error },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(10,100,35,0.35)',
  },
  addText: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.brand },
  full: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 12, textAlign: 'center' },
  pressed: { opacity: 0.75 },
});

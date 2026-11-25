import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { ChevronDown, Search, X } from 'lucide-react-native';
import { SheetModal } from '@/components/ui/SheetModal';
import { Spinner } from '@/components/ui/Spinner';
import { colors, fonts, spacing, typeScale, ui } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api';
import { haptic } from '@/lib/motion';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

/** Small building blocks for admin list filters — one look on phones and on the desktop table screens. */

const webPointer: ViewStyle | null = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : null;

/** A filter pill: its label, or "Label: value" with a clear × once something is chosen. */
export function FilterButton({
  label,
  value,
  onPress,
  onClear,
}: {
  label: string;
  value?: string | null;
  onPress: () => void;
  onClear?: () => void;
}) {
  const active = Boolean(value);
  return (
    <View style={[styles.pill, active && styles.pillActive]}>
      <Pressable
        onPress={() => {
          haptic('select');
          onPress();
        }}
        style={({ pressed }) => [styles.pillMain, webPointer, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={active ? `${label}: ${value}. Change` : `Filter by ${label.toLowerCase()}`}
      >
        <Text style={[styles.pillText, active && styles.pillTextActive]} numberOfLines={1}>
          {active ? `${label}: ${value}` : label}
        </Text>
        {!active ? <ChevronDown size={14} color={ui.textSecondary} strokeWidth={2.4} /> : null}
      </Pressable>
      {active && onClear ? (
        <Pressable
          onPress={() => {
            haptic('select');
            onClear();
          }}
          hitSlop={8}
          style={({ pressed }) => [styles.pillClear, webPointer, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Clear ${label.toLowerCase()} filter`}
        >
          <X size={13} color={colors.white} strokeWidth={3} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Horizontal, scrollable row of filter pills. */
export function FilterRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.rowScroll}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

/** "Showing: Unpaid · Amit · 1 Nov – 24 Nov   Clear all". */
export function FilterSummary({ parts, onClear }: { parts: string[]; onClear: () => void }) {
  if (parts.length === 0) return null;
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryText} numberOfLines={2}>
        <Text style={styles.summaryLead}>Filtered: </Text>
        {parts.join(' · ')}
      </Text>
      <Pressable
        onPress={() => {
          haptic('select');
          onClear();
        }}
        hitSlop={8}
        style={({ pressed }) => [webPointer, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Clear all filters"
      >
        <Text style={styles.summaryClear}>Clear all</Text>
      </Pressable>
    </View>
  );
}

/** Two or three options in one pill track. */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}) {
  return (
    <View style={styles.segmentWrap}>
      {label ? <Text style={styles.segmentLabel}>{label}</Text> : null}
      <View style={styles.segment} accessibilityRole="radiogroup">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => {
                haptic('select');
                onChange(o.value);
              }}
              style={({ pressed }) => [styles.segmentItem, active && styles.segmentItemActive, webPointer, pressed && styles.pressed]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export type PickerOption = { key: string; title: string; subtitle?: string };

/**
 * Search-as-you-type picker in a sheet (phones) / dialog (desktop) — e.g. pick a customer to filter by.
 * `search('')` runs when it opens, so the first matches show straight away.
 */
export function SearchPickerSheet<T>({
  visible,
  title,
  placeholder,
  onClose,
  search,
  toOption,
  onPick,
}: {
  visible: boolean;
  title: string;
  placeholder: string;
  onClose: () => void;
  search: (q: string) => Promise<T[]>;
  toOption: (item: T) => PickerOption;
  onPick: (item: T) => void;
}) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 300);
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef(search);
  searchRef.current = search;

  useEffect(() => {
    if (visible) setQuery('');
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchRef
      .current(debounced.trim())
      .then((items) => {
        if (!cancelled) setResults(items);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not search'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, visible]);

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      dialogWidth={480}
      keyboardAvoiding
      header={
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>{title}</Text>
        </View>
      }
    >
      <View style={styles.sheetBody}>
        <View style={styles.searchBox}>
          <Search size={17} color={ui.textTertiary} strokeWidth={2.2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder}
            placeholderTextColor={ui.textTertiary}
            style={styles.searchInput}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel={placeholder}
          />
          {loading ? <Spinner /> : null}
        </View>
        <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
          {error ? <Text style={styles.note}>{error}</Text> : null}
          {!loading && !error && results.length === 0 ? <Text style={styles.note}>No matches</Text> : null}
          {results.map((item) => {
            const o = toOption(item);
            return (
              <Pressable
                key={o.key}
                onPress={() => {
                  haptic('select');
                  onPick(item);
                }}
                style={({ pressed }) => [styles.option, webPointer, pressed && styles.optionPressed]}
                accessibilityRole="button"
                accessibilityLabel={o.subtitle ? `${o.title}, ${o.subtitle}` : o.title}
              >
                <Text style={styles.optionTitle} numberOfLines={1}>
                  {o.title}
                </Text>
                {o.subtitle ? (
                  <Text style={styles.optionSub} numberOfLines={1}>
                    {o.subtitle}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  rowScroll: { flexGrow: 0, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: 8, paddingVertical: 2, paddingRight: spacing.md },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
    paddingLeft: 14,
    paddingRight: 8,
    gap: 6,
  },
  pillActive: { backgroundColor: ui.brandSoft, borderColor: colors.green },
  pillMain: { flexDirection: 'row', alignItems: 'center', gap: 6, height: '100%', maxWidth: 240 },
  pillText: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text },
  pillTextActive: { color: colors.forest },
  pillClear: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.forest,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  summaryText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17, color: ui.textSecondary },
  summaryLead: { fontFamily: fonts.bodySemi, color: ui.text },
  summaryClear: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.forest },
  segmentWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.sm, flexWrap: 'wrap' },
  segmentLabel: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.textSecondary },
  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 999,
    backgroundColor: ui.band,
    alignSelf: 'flex-start',
  },
  segmentItem: { paddingHorizontal: 12, height: 30, borderRadius: 999, justifyContent: 'center' },
  segmentItemActive: { backgroundColor: colors.white, ...ui.shadow },
  segmentText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.textSecondary },
  segmentTextActive: { color: ui.text },
  sheetHead: { paddingHorizontal: spacing.md + 4, paddingTop: 4, paddingBottom: 4 },
  sheetTitle: { ...typeScale.section, fontSize: 19, lineHeight: 25, color: ui.text },
  sheetBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    marginTop: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: ui.text, paddingVertical: 0 },
  results: { marginTop: spacing.sm, maxHeight: 360 },
  note: { ...typeScale.caption, color: ui.textTertiary, textAlign: 'center', paddingVertical: spacing.md },
  option: { paddingVertical: 11, paddingHorizontal: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.border },
  optionPressed: { backgroundColor: ui.surfaceMuted },
  optionTitle: { ...typeScale.rowTitle, color: ui.text },
  optionSub: { ...typeScale.caption, color: ui.textSecondary, marginTop: 1 },
});

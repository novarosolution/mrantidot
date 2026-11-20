import { memo, useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type NativeSyntheticEvent, type TextInputSelectionChangeEventData } from 'react-native';
import { Bold, Eye, Heading2, Italic, Link, List, ListOrdered, PenLine, type LucideIcon } from 'lucide-react-native';
import { textInputDefaults } from '@/components/ui/textInputDefaults';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';
import { haptic } from '@/lib/motion';
import { colors, fonts, formField, spacing, ui } from '@/constants/theme';

type Selection = { start: number; end: number };
type Edit = { text: string; selection: Selection };

/** Inserts `token` at the start of a fresh line at the cursor (headings, list items). */
function lineToken(value: string, sel: Selection, token: string): Edit {
  const before = value.slice(0, sel.start);
  const after = value.slice(sel.end);
  const selected = value.slice(sel.start, sel.end);
  const atLineStart = before.length === 0 || before.endsWith('\n');
  const lead = atLineStart ? '' : before.endsWith('\n\n') ? '' : '\n';
  const insert = `${lead}${token}${selected}`;
  const cursor = before.length + insert.length;
  return { text: before + insert + after, selection: { start: cursor, end: cursor } };
}

/** Wraps the selection (or a placeholder word, which ends up selected) in `mark`. */
function wrap(value: string, sel: Selection, mark: string, placeholder: string): Edit {
  const before = value.slice(0, sel.start);
  const after = value.slice(sel.end);
  const selected = value.slice(sel.start, sel.end) || placeholder;
  const start = before.length + mark.length;
  return {
    text: `${before}${mark}${selected}${mark}${after}`,
    selection: { start, end: start + selected.length },
  };
}

/** `[text](https://)` with the URL part selected so the admin can paste over it. */
function link(value: string, sel: Selection): Edit {
  const before = value.slice(0, sel.start);
  const after = value.slice(sel.end);
  const label = value.slice(sel.start, sel.end) || 'link text';
  const url = 'https://';
  const urlStart = before.length + label.length + 3;
  return {
    text: `${before}[${label}](${url})${after}`,
    selection: { start: urlStart, end: urlStart + url.length },
  };
}

const TOOLS: { key: string; icon: LucideIcon; label: string; run: (v: string, s: Selection) => Edit }[] = [
  { key: 'h2', icon: Heading2, label: 'Heading', run: (v, s) => lineToken(v, s, '## ') },
  { key: 'bold', icon: Bold, label: 'Bold', run: (v, s) => wrap(v, s, '**', 'bold') },
  { key: 'italic', icon: Italic, label: 'Italic', run: (v, s) => wrap(v, s, '*', 'italic') },
  { key: 'list', icon: List, label: 'Bullet list', run: (v, s) => lineToken(v, s, '- ') },
  { key: 'numbered', icon: ListOrdered, label: 'Numbered list', run: (v, s) => lineToken(v, s, '1. ') },
  { key: 'link', icon: Link, label: 'Link', run: link },
];

/**
 * Markdown body editor: multiline input, a toolbar that inserts syntax at the cursor, and a
 * Write / Preview toggle rendered with SimpleMarkdown. Pass a stable `onChangeText`.
 */
export const MarkdownEditor = memo(function MarkdownEditor({
  label,
  value,
  onChangeText,
  placeholder = 'Write your article. Leave a blank line between paragraphs.',
  minHeight = 260,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  minHeight?: number;
  error?: string;
}) {
  const [preview, setPreview] = useState(false);
  const [focused, setFocused] = useState(false);
  const selection = useRef<Selection>({ start: value.length, end: value.length });
  const [forced, setForced] = useState<Selection | undefined>(undefined);
  const inputRef = useRef<TextInput>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const onSelectionChange = useCallback((e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    selection.current = e.nativeEvent.selection;
    setForced(undefined);
  }, []);

  const apply = (run: (v: string, s: Selection) => Edit) => {
    haptic('select');
    const current = valueRef.current;
    const sel = selection.current;
    const safe = {
      start: Math.min(sel.start, current.length),
      end: Math.min(Math.max(sel.end, sel.start), current.length),
    };
    const edit = run(current, safe);
    selection.current = edit.selection;
    onChangeText(edit.text);
    setForced(edit.selection);
    inputRef.current?.focus();
  };

  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.modeSwitch}>
          {[
            { on: !preview, icon: PenLine, text: 'Write', press: () => setPreview(false) },
            { on: preview, icon: Eye, text: 'Preview', press: () => setPreview(true) },
          ].map((m) => (
            <Pressable
              key={m.text}
              onPress={() => {
                haptic('select');
                m.press();
              }}
              style={[styles.mode, m.on && styles.modeOn]}
              accessibilityRole="tab"
              accessibilityState={{ selected: m.on }}
            >
              <m.icon size={13} color={m.on ? colors.white : ui.textSecondary} strokeWidth={2.4} />
              <Text style={[styles.modeText, m.on && styles.modeTextOn]}>{m.text}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {preview ? (
        <View style={[styles.previewBox, { minHeight }]}>
          {value.trim() ? <SimpleMarkdown text={value} /> : <Text style={styles.previewEmpty}>Nothing to preview yet.</Text>}
        </View>
      ) : (
        <>
          <View style={styles.toolbar}>
            {TOOLS.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => apply(t.run)}
                style={({ pressed }) => [styles.tool, pressed && styles.toolPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Insert ${t.label}`}
                hitSlop={4}
              >
                <t.icon size={17} color={ui.text} strokeWidth={2.3} />
              </Pressable>
            ))}
          </View>
          <TextInput
            ref={inputRef}
            {...textInputDefaults}
            value={value}
            onChangeText={onChangeText}
            onSelectionChange={onSelectionChange}
            selection={forced}
            multiline
            scrollEnabled={false}
            textAlignVertical="top"
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[styles.input, { minHeight }, focused && styles.inputFocused, error ? styles.inputError : null]}
            accessibilityLabel={label}
          />
        </>
      )}
      <View style={styles.foot}>
        {error ? <Text style={styles.error}>{error}</Text> : <Text style={styles.hint}>## heading · **bold** · *italic* · - list · [text](link)</Text>}
        <Text style={styles.count}>{words} words</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontFamily: fonts.bodySemi, fontSize: formField.labelSize, color: ui.text },
  modeSwitch: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: ui.surfaceMuted,
    borderWidth: 1,
    borderColor: ui.border,
  },
  mode: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 28, borderRadius: 9 },
  modeOn: { backgroundColor: ui.brand },
  modeText: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textSecondary },
  modeTextOn: { color: colors.white },
  toolbar: {
    flexDirection: 'row',
    gap: 6,
    padding: 6,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: ui.surfaceMuted,
    borderWidth: 1,
    borderColor: ui.border,
  },
  tool: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolPressed: { backgroundColor: ui.brandSoft },
  input: {
    fontSize: 16,
    lineHeight: 23,
    color: ui.text,
    padding: 14,
    paddingTop: 14,
    borderRadius: formField.radius,
    borderWidth: formField.borderWidth,
    borderColor: formField.borderColor,
    backgroundColor: formField.bg,
  },
  inputFocused: { backgroundColor: formField.bgFocus, borderColor: formField.borderFocus },
  inputError: { borderColor: 'rgba(179,63,40,0.35)', backgroundColor: colors.errorBg },
  previewBox: {
    padding: 14,
    borderRadius: formField.radius,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  previewEmpty: { fontFamily: fonts.body, fontSize: 14, color: ui.textSecondary },
  foot: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginTop: 6 },
  hint: { flex: 1, fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: colors.muted },
  error: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 12, color: colors.error },
  count: { fontFamily: fonts.bodySemi, fontSize: 11, color: ui.textTertiary },
});

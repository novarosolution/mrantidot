import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconInput } from '@/components/kit/IconInput';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, spacing, surfaces } from '@/constants/theme';

/**
 * Editable list of short strings (badges, chips, highlights) — add, edit and remove rows.
 * Extracted from the content editor; the optional props default to its original behaviour.
 */
export function StringListEditor({
  title,
  items,
  onChange,
  max,
  placeholder,
  fill = false,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  /** Hide "Add" once the list holds this many items. */
  max?: number;
  placeholder?: string;
  /** Let each input take the full row width (next to the remove button). */
  fill?: boolean;
}) {
  const canAdd = max == null || items.length < max;
  return (
    <View style={styles.listEditor}>
      <View style={styles.blockHead}>
        <Text style={styles.label}>{title}</Text>
        {canAdd ? (
          <Pressable style={styles.addPill} onPress={() => onChange([...items, ''])}>
            <PremiumIcon icon={AppIcons.ui.plus} variant="plain" size="xs" color={colors.green} />
            <Text style={styles.addPillText}>Add</Text>
          </Pressable>
        ) : null}
      </View>
      {items.map((item, i) => (
        <View key={i} style={styles.tagRow}>
          <IconInput
            label={`Item ${i + 1}`}
            value={item}
            placeholder={placeholder}
            containerStyle={fill ? styles.fill : undefined}
            onChangeText={(v) => {
              const next = [...items];
              next[i] = v;
              onChange(next);
            }}
          />
          <Pressable
            style={styles.tagRemove}
            onPress={() => onChange(items.filter((_, idx) => idx !== i))}
            accessibilityRole="button"
            accessibilityLabel="Remove list item"
          >
            <PremiumIcon icon={AppIcons.ui.close} variant="plain" size="sm" color={colors.muted} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listEditor: { marginTop: spacing.sm },
  blockHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  label: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.muted, marginTop: spacing.sm, marginBottom: 8 },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  addPillText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  tagRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  fill: { flex: 1 },
  tagRemove: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
  },
});

import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { textInputDefaults } from '@/components/ui/textInputDefaults';
import { colors, fonts, formField, spacing } from '@/constants/theme';

export function AddressManualField({
  value,
  onChangeText,
  placeholder = 'House no., street, area, city',
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={[styles.fieldRow, focused && styles.fieldRowFocused]}>
        <View style={styles.iconWrap}>
          <MapPin size={18} color={focused ? colors.forest : colors.muted} />
        </View>
        <TextInput
          {...textInputDefaults}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      <Text style={styles.hint}>Include landmark or gate code if helpful for our team</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minHeight: formField.minHeight + 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: formField.radius,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  fieldRowFocused: {
    backgroundColor: colors.white,
    borderColor: colors.forest,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    minHeight: 72,
    paddingTop: 8,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    paddingHorizontal: 4,
    lineHeight: 16,
  },
});

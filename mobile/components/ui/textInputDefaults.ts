import { Platform, StyleSheet, type TextInputProps } from 'react-native';

/** iOS needs 16px+ to avoid zoom; custom fonts on TextInput break typing on iOS. */
export const TEXT_INPUT_FONT_SIZE = 16;

const INK = '#13211A';
const FIELD_MIN_HEIGHT = 56;

export const textInputDefaults = {
  autoCorrect: false,
  spellCheck: false,
  autoComplete: 'off' as const,
  textContentType: 'none' as const,
  importantForAutofill: 'no' as const,
  underlineColorAndroid: 'transparent' as const,
};

export const textInputStyles = StyleSheet.create({
  base: {
    fontSize: TEXT_INPUT_FONT_SIZE,
    lineHeight: 22,
    color: INK,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  padded: {
    fontSize: TEXT_INPUT_FONT_SIZE,
    lineHeight: 22,
    color: INK,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    minHeight: FIELD_MIN_HEIGHT - 2,
  },
  flex: {
    flex: 1,
    fontSize: TEXT_INPUT_FONT_SIZE,
    lineHeight: 22,
    color: INK,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    minHeight: FIELD_MIN_HEIGHT - 4,
  },
});

/** Strip props that break controlled secure fields when using our `secure` flag. */
export function stripConflictingInputProps<T extends TextInputProps>(
  props: T,
  opts?: { secure?: boolean },
): Omit<T, 'secureTextEntry'> {
  const { secureTextEntry: _ignored, ...rest } = props;
  if (opts?.secure) return rest as Omit<T, 'secureTextEntry'>;
  return props;
}

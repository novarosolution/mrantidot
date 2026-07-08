import { Platform, StyleSheet, type TextInputProps } from 'react-native';
import { fonts } from '@/constants/theme';

/** iOS needs 16px+ to avoid zoom; keep system font on iOS TextInput for reliable typing. */
export const TEXT_INPUT_FONT_SIZE = 16;

const INK = '#13211A';
const FIELD_MIN_HEIGHT = 56;

const inputFont =
  Platform.OS === 'android'
    ? { fontFamily: fonts.body, letterSpacing: 0.1, includeFontPadding: false as const }
    : {};

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
    ...inputFont,
  },
  padded: {
    fontSize: TEXT_INPUT_FONT_SIZE,
    lineHeight: 22,
    color: INK,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    minHeight: FIELD_MIN_HEIGHT - 2,
    ...inputFont,
  },
  flex: {
    flex: 1,
    fontSize: TEXT_INPUT_FONT_SIZE,
    lineHeight: 22,
    color: INK,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    minHeight: FIELD_MIN_HEIGHT - 4,
    ...inputFont,
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

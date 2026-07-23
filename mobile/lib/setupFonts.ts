import { Platform, Text } from 'react-native';
import { fonts, premiumType } from '@/constants/theme';

/** Android adds extra padding that makes custom fonts look vertically misaligned. */
const androidTextFix = Platform.OS === 'android' ? { includeFontPadding: false } : {};

/** Apply default body font to all `<Text>` that do not set fontFamily explicitly. */
export function setupDefaultFonts(): void {
  const TextComponent = Text as typeof Text & {
    defaultProps?: { style?: unknown };
  };
  const existing = TextComponent.defaultProps ?? {};
  TextComponent.defaultProps = {
    ...existing,
    style: [
      {
        fontFamily: fonts.body,
        letterSpacing: -0.04,
        ...androidTextFix,
      },
      existing.style,
    ],
  };
}

/** Merge premium semantic styles — pass color or other overrides last. */
export function typeStyle(
  key: keyof typeof premiumType,
  override?: Record<string, unknown>,
) {
  return [premiumType[key], override, androidTextFix];
}

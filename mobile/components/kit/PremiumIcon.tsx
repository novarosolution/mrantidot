import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, premium } from '@/constants/theme';

export const IconSize = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 22,
  tab: 24,
} as const;

export const IconStroke = {
  light: 2,
  regular: 2.1,
  bold: 2.3,
  tabActive: 2.35,
} as const;

type IconSizeKey = keyof typeof IconSize;

export function PremiumIcon({
  icon: Icon,
  variant = 'plain',
  size = 'md',
  color = colors.forest,
  strokeWidth,
  focused,
  bg,
  bgTo,
  gradient,
  boxSize,
  style,
}: {
  icon: LucideIcon;
  variant?: 'plain' | 'soft' | 'gradient' | 'tab' | 'chevron';
  size?: IconSizeKey | number;
  color?: ColorValue;
  strokeWidth?: number;
  focused?: boolean;
  bg?: string;
  bgTo?: string;
  gradient?: readonly [string, string];
  boxSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const px = typeof size === 'number' ? size : IconSize[size];
  const stroke =
    strokeWidth ??
    (variant === 'tab' && focused
      ? IconStroke.tabActive
      : variant === 'gradient'
        ? IconStroke.bold
        : IconStroke.regular);

  const glyph = <Icon size={px} color={color} strokeWidth={stroke} />;

  if (variant === 'plain') {
    return glyph;
  }

  if (variant === 'chevron') {
    return (
      <LinearGradient
        colors={[colors.soft, colors.white]}
        style={[styles.chevron, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {glyph}
      </LinearGradient>
    );
  }

  if (variant === 'tab') {
    return (
      <View style={[styles.tabWrap, style]}>
        {focused ? (
          <LinearGradient colors={['#E8F5EC', '#FFFFFF']} style={styles.tabGlow} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {glyph}
          </LinearGradient>
        ) : (
          <View style={styles.tabIdle}>{glyph}</View>
        )}
      </View>
    );
  }

  if (variant === 'gradient' && gradient) {
    const box = boxSize ?? 40;
    const radius = Math.round(box * 0.35);
    return (
      <LinearGradient
        colors={[...gradient]}
        style={[styles.gradBox, { width: box, height: box, borderRadius: radius }, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon size={px} color={colors.white} strokeWidth={IconStroke.bold} />
      </LinearGradient>
    );
  }

  const box = boxSize ?? 48;
  const radius = Math.round(box * 0.33);
  return (
    <LinearGradient
      colors={[bg ?? colors.soft, bgTo ?? colors.white]}
      style={[styles.softBox, { width: box, height: box, borderRadius: radius }, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {glyph}
    </LinearGradient>
  );
}

export function KitTabBarIcon({
  icon,
  color,
  focused,
}: {
  icon: LucideIcon;
  color: ColorValue;
  focused?: boolean;
}) {
  return (
    <PremiumIcon
      icon={icon}
      variant="tab"
      size={focused ? 'tab' : 'lg'}
      color={color}
      focused={focused}
    />
  );
}

const styles = StyleSheet.create({
  softBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  gradBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  tabGlow: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.12)',
    ...premium.shadowSoft,
  },
  tabIdle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

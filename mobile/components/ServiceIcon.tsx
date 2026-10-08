import { Image, View, type ImageSourcePropType } from 'react-native';
import { SERVICE_ICON_MAP } from '@/constants/serviceIcons';
import { REAL_SERVICE_ICONS } from '@/components/icons/RealIcons';
import { AppIcons } from '@/constants/appIcons';
import { resolveServiceImage, serviceTypeFromIconKey } from '@/constants/serviceImages';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { colors } from '@/constants/theme';
import { opticalStroke, PremiumIcon } from '@/components/kit/PremiumIcon';
import type { LucideIcon } from 'lucide-react-native';

export function PestImage({ source, size }: { source: ImageSourcePropType; size: number }) {
  return <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />;
}

export function resolveServiceIcon(iconKey: string): LucideIcon {
  return (
    SERVICE_ICON_MAP[iconKey] ??
    REAL_SERVICE_ICONS[iconKey as keyof typeof REAL_SERVICE_ICONS] ??
    AppIcons.brand
  );
}

function softFillFromColor(color: string): string | undefined {
  const c = color.toLowerCase();
  if (c === '#ffffff' || c === '#fff') return 'rgba(255,255,255,0.28)';
  if (color.startsWith('#') && color.length === 7) return `${color}4A`;
  return undefined;
}

export function ServiceIcon({
  iconKey,
  size = 24,
  color = colors.forest,
  strokeWidth,
  variant = 'plain',
  boxSize,
}: {
  iconKey: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  variant?: 'plain' | 'mint' | 'soft' | 'glass' | 'gradient' | 'premium' | 'ring';
  boxSize?: number;
}) {
  const img = resolveServiceImage(iconKey);
  if (img) {
    if (variant === 'plain') return <PestImage source={img} size={size} />;
    const box = boxSize ?? Math.round(size * 2.2);
    const type = serviceTypeFromIconKey(iconKey);
    const bg = type ? SERVICE_TYPE_META[type].bg : colors.soft;
    return (
      <View
        style={{
          width: box,
          height: box,
          borderRadius: Math.round(box * 0.34),
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PestImage source={img} size={size} />
      </View>
    );
  }

  const Icon = resolveServiceIcon(iconKey);
  /** Custom pest silhouettes read best slightly bolder + softly filled. */
  const stroke = strokeWidth ?? opticalStroke(size, variant === 'plain' ? 'medium' : 'bold');
  return (
    <PremiumIcon
      icon={Icon}
      variant={variant}
      size={size}
      color={color}
      strokeWidth={stroke}
      fill={variant === 'plain' ? softFillFromColor(color) : undefined}
      boxSize={
        boxSize ??
        (variant === 'glass' ||
        variant === 'mint' ||
        variant === 'soft' ||
        variant === 'premium' ||
        variant === 'gradient'
          ? Math.round(size * 2.2)
          : undefined)
      }
    />
  );
}

export { SERVICE_ICON_KEYS, serviceIconLabel } from '@/constants/serviceIcons';

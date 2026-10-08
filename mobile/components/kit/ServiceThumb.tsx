import { StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { PestImage, resolveServiceIcon } from '@/components/ServiceIcon';
import { resolveServiceImage } from '@/constants/serviceImages';
import { serviceTone } from '@/constants/serviceTypeMeta';
import type { Service } from '@/types/api';

export { PestImage };

/**
 * Pastel tile with a duotone pest icon — stands in for a service photo (Urban-style thumbnail).
 * Colour comes from the service's primary pest type so every service reads distinctly.
 */
export function ServiceThumb({
  service,
  width,
  height,
  radius = 14,
  iconSize,
  style,
}: {
  service: Pick<Service, 'iconKey' | 'serviceTypes'>;
  width: number;
  height?: number;
  radius?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const tone = serviceTone(service);
  return (
    <ToneTile
      icon={resolveServiceIcon(service.iconKey)}
      image={resolveServiceImage(service.iconKey, service.serviceTypes)}
      color={tone.color}
      bg={tone.bg}
      width={width}
      height={height}
      radius={radius}
      iconSize={iconSize}
      style={style}
    />
  );
}

/** Same tile for any icon + palette (service types, categories). */
export function ToneTile({
  icon: Icon,
  image,
  color,
  bg,
  width,
  height,
  radius = 14,
  iconSize,
  style,
}: {
  icon: LucideIcon;
  image?: ImageSourcePropType;
  color: string;
  bg: string;
  width: number;
  height?: number;
  radius?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const h = height ?? width;
  const px = image ? Math.round(Math.min(width, h) * 0.72) : (iconSize ?? Math.round(Math.min(width, h) * 0.44));
  return (
    <View style={[styles.tile, { width, height: h, borderRadius: radius, backgroundColor: bg }, style]}>
      {image ? (
        <PestImage source={image} size={px} />
      ) : (
        <Icon size={px} color={color} strokeWidth={px >= 36 ? 1.6 : 1.85} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

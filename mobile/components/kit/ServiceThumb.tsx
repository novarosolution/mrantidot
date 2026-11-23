import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ImageSourcePropType, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { PestImage, resolveServiceIcon } from '@/components/ServiceIcon';
import { AppImage } from '@/components/ui/AppImage';
import { resolveServiceImage } from '@/constants/serviceImages';
import { serviceTone } from '@/constants/serviceTypeMeta';
import { websitePreview } from '@/lib/images';
import type { Service } from '@/types/api';

/** Remote URL of the admin's service photo, or null when the service has none. */
export function serviceCoverUri(service: Pick<Service, 'coverImage'>): string | null {
  const preview = websitePreview(service.coverImage?.url);
  return preview.kind === 'remote' ? preview.uri : null;
}

export { PestImage };

/**
 * Service thumbnail: the admin's cover photo when there is one (cached, fades in), otherwise a pastel
 * tile with the pest art. Colour comes from the service's primary pest type so every service reads distinctly.
 */
export function ServiceThumb({
  service,
  width,
  height,
  radius = 14,
  iconSize,
  style,
}: {
  service: Pick<Service, 'iconKey' | 'serviceTypes'> & Partial<Pick<Service, 'coverImage'>>;
  width: number;
  height?: number;
  radius?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const tone = serviceTone(service);
  const cover = serviceCoverUri(service);
  if (cover) {
    return (
      <AppImage
        uri={cover}
        recyclingKey={cover}
        accessibilityLabel={service.coverImage?.alt || undefined}
        placeholderColor={tone.bg}
        style={[{ width, height: height ?? width, borderRadius: radius }, style as StyleProp<ImageStyle>]}
      />
    );
  }
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
      {/* Soft top-light so the pastel reads as a shaped tile (matches the home category grid). */}
      <LinearGradient
        colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.6, y: 0.75 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
});

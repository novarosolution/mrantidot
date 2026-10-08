import type { ImageSourcePropType } from 'react-native';
import type { ServiceTypeKey } from '@/constants/serviceTypes';

export const SERVICE_TYPE_IMAGES: Record<ServiceTypeKey, ImageSourcePropType> = {
  ant: require('../assets/icons/ant.png'),
  cockroach: require('../assets/icons/cockroach.png'),
  rodent: require('../assets/icons/rodent.png'),
  mosquito: require('../assets/icons/mosquito.png'),
  termite: require('../assets/icons/termite.png'),
  bed_bug: require('../assets/icons/bed_bug.png'),
  bird: require('../assets/icons/bird.png'),
  flea: require('../assets/icons/flea.png'),
  spider: require('../assets/icons/spider.png'),
  lizard: require('../assets/icons/lizard.png'),
  bee: require('../assets/icons/bee.png'),
  wood_borer: require('../assets/icons/wood_borer.png'),
  general: require('../assets/icons/general.png'),
  fumigation: require('../assets/icons/fumigation.png'),
  deep_cleaning: require('../assets/icons/deep_cleaning.png'),
  silo: require('../assets/icons/silo.png'),
};

const ICON_KEY_ALIAS: Record<string, ServiceTypeKey> = {
  spray: 'general',
  bug: 'cockroach',
  bugoff: 'cockroach',
  cockroach: 'cockroach',
  mosq: 'mosquito',
  mosquito: 'mosquito',
  wind: 'mosquito',
  mouse: 'rodent',
  rodent: 'rodent',
  bed: 'bed_bug',
  bed_bug: 'bed_bug',
  termite: 'termite',
  tree: 'termite',
  wood_borer: 'wood_borer',
  cloud: 'fumigation',
  fumigation: 'fumigation',
  bird: 'bird',
  ant: 'ant',
  spider: 'spider',
  flea: 'flea',
  bee: 'bee',
  lizard: 'lizard',
  snail: 'general',
  inspect: 'general',
  general: 'general',
  sparkles: 'deep_cleaning',
  clean: 'deep_cleaning',
  deep_cleaning: 'deep_cleaning',
  brush: 'deep_cleaning',
  droplets: 'deep_cleaning',
  flask: 'fumigation',
  warehouse: 'silo',
  silo: 'silo',
};

export function serviceTypeFromIconKey(iconKey?: string): ServiceTypeKey | undefined {
  return iconKey ? ICON_KEY_ALIAS[iconKey] : undefined;
}

export function resolveServiceImage(
  iconKey?: string,
  types?: readonly string[],
): ImageSourcePropType | undefined {
  const fromKey = serviceTypeFromIconKey(iconKey);
  if (fromKey) return SERVICE_TYPE_IMAGES[fromKey];
  const fromType = types?.find((t): t is ServiceTypeKey => t in SERVICE_TYPE_IMAGES);
  return fromType ? SERVICE_TYPE_IMAGES[fromType] : undefined;
}

import type { ImageSourcePropType } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
  AntIcon,
  BeeIcon,
  BedBugIcon,
  BirdIcon,
  CleanIcon,
  CockroachIcon,
  FleaIcon,
  FumigationIcon,
  LizardIcon,
  MosquitoIcon,
  RodentIcon,
  SpiderIcon,
  SprayIcon,
  TermiteIcon,
  WarehouseRealIcon,
  WoodBorerIcon,
} from '@/components/icons/RealIcons';
import { SERVICE_TYPE_IMAGES } from '@/constants/serviceImages';
import { SERVICE_TYPE_KEYS, SERVICE_TYPE_LABELS, type ServiceTypeKey } from '@/constants/serviceTypes';

export type ServiceTypeMeta = {
  label: string;
  icon: LucideIcon;
  image: ImageSourcePropType;
  color: string;
  bg: string;
  bgTo?: string;
};

/**
 * Service-type icons (custom SVGs) with a distinct pastel tile + accent per pest —
 * category grids read at a glance instead of a wall of identical green bugs.
 */
export const SERVICE_TYPE_META: Record<ServiceTypeKey, ServiceTypeMeta> = {
  ant: { label: SERVICE_TYPE_LABELS.ant, icon: AntIcon, image: SERVICE_TYPE_IMAGES.ant, color: '#9A3412', bg: '#FCEFE7' },
  cockroach: { label: SERVICE_TYPE_LABELS.cockroach, icon: CockroachIcon, image: SERVICE_TYPE_IMAGES.cockroach, color: '#A15C07', bg: '#FFF3E2' },
  rodent: { label: SERVICE_TYPE_LABELS.rodent, icon: RodentIcon, image: SERVICE_TYPE_IMAGES.rodent, color: '#475569', bg: '#F0F2F5' },
  mosquito: { label: SERVICE_TYPE_LABELS.mosquito, icon: MosquitoIcon, image: SERVICE_TYPE_IMAGES.mosquito, color: '#1D4ED8', bg: '#EAF1FF' },
  termite: { label: SERVICE_TYPE_LABELS.termite, icon: TermiteIcon, image: SERVICE_TYPE_IMAGES.termite, color: '#C2410C', bg: '#FFEFE6' },
  bed_bug: { label: SERVICE_TYPE_LABELS.bed_bug, icon: BedBugIcon, image: SERVICE_TYPE_IMAGES.bed_bug, color: '#BE123C', bg: '#FDECEF' },
  bird: { label: SERVICE_TYPE_LABELS.bird, icon: BirdIcon, image: SERVICE_TYPE_IMAGES.bird, color: '#4338CA', bg: '#EEEFFE' },
  flea: { label: SERVICE_TYPE_LABELS.flea, icon: FleaIcon, image: SERVICE_TYPE_IMAGES.flea, color: '#7E22CE', bg: '#F5EDFD' },
  spider: { label: SERVICE_TYPE_LABELS.spider, icon: SpiderIcon, image: SERVICE_TYPE_IMAGES.spider, color: '#3F3F46', bg: '#F1F1F3' },
  lizard: { label: SERVICE_TYPE_LABELS.lizard, icon: LizardIcon, image: SERVICE_TYPE_IMAGES.lizard, color: '#15803D', bg: '#EAF7EC' },
  bee: { label: SERVICE_TYPE_LABELS.bee, icon: BeeIcon, image: SERVICE_TYPE_IMAGES.bee, color: '#A16207', bg: '#FFF7D6' },
  wood_borer: { label: SERVICE_TYPE_LABELS.wood_borer, icon: WoodBorerIcon, image: SERVICE_TYPE_IMAGES.wood_borer, color: '#8B5E34', bg: '#F6EEE5' },
  general: { label: SERVICE_TYPE_LABELS.general, icon: SprayIcon, image: SERVICE_TYPE_IMAGES.general, color: '#0A6423', bg: '#E9F6EA' },
  fumigation: { label: SERVICE_TYPE_LABELS.fumigation, icon: FumigationIcon, image: SERVICE_TYPE_IMAGES.fumigation, color: '#6D28D9', bg: '#F2EDFD' },
  deep_cleaning: { label: SERVICE_TYPE_LABELS.deep_cleaning, icon: CleanIcon, image: SERVICE_TYPE_IMAGES.deep_cleaning, color: '#0E7490', bg: '#E5F6F8' },
  silo: { label: SERVICE_TYPE_LABELS.silo, icon: WarehouseRealIcon, image: SERVICE_TYPE_IMAGES.silo, color: '#B45309', bg: '#FFF4E0' },
};

/** Tile colours for a service — taken from its primary pest type (falls back to brand green). */
export function serviceTone(service: { serviceTypes?: readonly string[] }): { color: string; bg: string } {
  const key = service.serviceTypes?.find((t): t is ServiceTypeKey => t in SERVICE_TYPE_META);
  const meta = SERVICE_TYPE_META[key ?? 'general'];
  return { color: meta.color, bg: meta.bg };
}

export { SERVICE_TYPE_KEYS };

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
import { SERVICE_TYPE_KEYS, SERVICE_TYPE_LABELS, type ServiceTypeKey } from '@/constants/serviceTypes';

export type ServiceTypeMeta = {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  bgTo?: string;
};

/** Realistic service-type icons (custom SVGs). */
export const SERVICE_TYPE_META: Record<ServiceTypeKey, ServiceTypeMeta> = {
  ant: { label: SERVICE_TYPE_LABELS.ant, icon: AntIcon, color: '#0B7228', bg: '#EAF6E3', bgTo: '#CFEACF' },
  cockroach: { label: SERVICE_TYPE_LABELS.cockroach, icon: CockroachIcon, color: '#0B7228', bg: '#EAF6E3', bgTo: '#CFEACF' },
  rodent: { label: SERVICE_TYPE_LABELS.rodent, icon: RodentIcon, color: '#0A6423', bg: '#EEF8E6', bgTo: '#D8EDC8' },
  mosquito: { label: SERVICE_TYPE_LABELS.mosquito, icon: MosquitoIcon, color: '#1A8734', bg: '#E8F5EC', bgTo: '#CFEACF' },
  termite: { label: SERVICE_TYPE_LABELS.termite, icon: TermiteIcon, color: '#043813', bg: '#EAF6E3', bgTo: '#C6ECB4' },
  bed_bug: { label: SERVICE_TYPE_LABELS.bed_bug, icon: BedBugIcon, color: '#0B7228', bg: '#F2FAEE', bgTo: '#EAF6E3' },
  bird: { label: SERVICE_TYPE_LABELS.bird, icon: BirdIcon, color: '#1A8734', bg: '#EAF6E3', bgTo: '#D1EEC2' },
  flea: { label: SERVICE_TYPE_LABELS.flea, icon: FleaIcon, color: '#0A6423', bg: '#EEF8E6', bgTo: '#CFEACF' },
  spider: { label: SERVICE_TYPE_LABELS.spider, icon: SpiderIcon, color: '#043813', bg: '#E8F5EC', bgTo: '#D8EDC8' },
  lizard: { label: SERVICE_TYPE_LABELS.lizard, icon: LizardIcon, color: '#1A8734', bg: '#EAF6E3', bgTo: '#CFEACF' },
  bee: { label: SERVICE_TYPE_LABELS.bee, icon: BeeIcon, color: '#0B7228', bg: '#F6FAF2', bgTo: '#EAF6E3' },
  wood_borer: { label: SERVICE_TYPE_LABELS.wood_borer, icon: WoodBorerIcon, color: '#043813', bg: '#EEF8E6', bgTo: '#D8EDC8' },
  general: { label: SERVICE_TYPE_LABELS.general, icon: SprayIcon, color: '#0B7228', bg: '#EAF6E3', bgTo: '#C6ECB4' },
  fumigation: { label: SERVICE_TYPE_LABELS.fumigation, icon: FumigationIcon, color: '#0A6423', bg: '#E8F5EC', bgTo: '#CFEACF' },
  deep_cleaning: { label: SERVICE_TYPE_LABELS.deep_cleaning, icon: CleanIcon, color: '#1A8734', bg: '#F2FAEE', bgTo: '#EAF6E3' },
  silo: { label: SERVICE_TYPE_LABELS.silo, icon: WarehouseRealIcon, color: '#0B7228', bg: '#EEF8E6', bgTo: '#D8EDC8' },
};

export { SERVICE_TYPE_KEYS };

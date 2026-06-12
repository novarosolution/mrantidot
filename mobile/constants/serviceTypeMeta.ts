import {
  BedDouble,
  Bird,
  Bug,
  CircleDot,
  Cloud,
  Hexagon,
  Rat,
  Sparkles,
  SprayCan,
  TreePine,
  Turtle,
  Warehouse,
  Webhook,
  Wind,
  type LucideIcon,
} from 'lucide-react-native';
import { SERVICE_TYPE_KEYS, SERVICE_TYPE_LABELS, type ServiceTypeKey } from '@/constants/serviceTypes';

export type ServiceTypeMeta = {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
};

export const SERVICE_TYPE_META: Record<ServiceTypeKey, ServiceTypeMeta> = {
  ant: { label: SERVICE_TYPE_LABELS.ant, icon: CircleDot, color: '#B45309', bg: '#FEF3C7' },
  cockroach: { label: SERVICE_TYPE_LABELS.cockroach, icon: Bug, color: '#78350F', bg: '#F5F5F4' },
  rodent: { label: SERVICE_TYPE_LABELS.rodent, icon: Rat, color: '#7C2D12', bg: '#FFEDD5' },
  mosquito: { label: SERVICE_TYPE_LABELS.mosquito, icon: Wind, color: '#0369A1', bg: '#E0F2FE' },
  termite: { label: SERVICE_TYPE_LABELS.termite, icon: TreePine, color: '#166534', bg: '#DCFCE7' },
  bed_bug: { label: SERVICE_TYPE_LABELS.bed_bug, icon: BedDouble, color: '#9F1239', bg: '#FFE4E6' },
  bird: { label: SERVICE_TYPE_LABELS.bird, icon: Bird, color: '#1D4ED8', bg: '#DBEAFE' },
  flea: { label: SERVICE_TYPE_LABELS.flea, icon: CircleDot, color: '#A21CAF', bg: '#FAE8FF' },
  spider: { label: SERVICE_TYPE_LABELS.spider, icon: Webhook, color: '#374151', bg: '#F3F4F6' },
  lizard: { label: SERVICE_TYPE_LABELS.lizard, icon: Turtle, color: '#15803D', bg: '#ECFDF5' },
  bee: { label: SERVICE_TYPE_LABELS.bee, icon: Hexagon, color: '#CA8A04', bg: '#FEF9C3' },
  wood_borer: { label: SERVICE_TYPE_LABELS.wood_borer, icon: TreePine, color: '#92400E', bg: '#FEF3C7' },
  general: { label: SERVICE_TYPE_LABELS.general, icon: SprayCan, color: '#14532D', bg: '#E8F5EC' },
  fumigation: { label: SERVICE_TYPE_LABELS.fumigation, icon: Cloud, color: '#475569', bg: '#F1F5F9' },
  deep_cleaning: { label: SERVICE_TYPE_LABELS.deep_cleaning, icon: Sparkles, color: '#0E7490', bg: '#ECFEFF' },
  silo: { label: SERVICE_TYPE_LABELS.silo, icon: Warehouse, color: '#713F12', bg: '#FEF9C3' },
};

export { SERVICE_TYPE_KEYS };

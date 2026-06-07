import type { LucideIcon } from 'lucide-react-native';
import {
  AirVent,
  Bath,
  BedDouble,
  Bird,
  Brush,
  Bug,
  Building2,
  ChefHat,
  ClipboardList,
  Droplets,
  Fan,
  Flame,
  Flower2,
  Hammer,
  Home,
  Layers,
  Leaf,
  Lightbulb,
  Pipette,
  Plug,
  ShieldCheck,
  Snowflake,
  Sparkles,
  SprayCan,
  Target,
  TreePine,
  Truck,
  Waves,
  Wind,
  Cloud,
  Warehouse,
  Wrench,
  Zap,
} from 'lucide-react-native';

export type ServiceIconCategory = 'pest' | 'cleaning' | 'repair' | 'outdoor' | 'general';

export interface ServiceIconDef {
  key: string;
  label: string;
  category: ServiceIconCategory;
  Icon: LucideIcon;
}

/** Canonical service icon registry — used by ServiceIcon, admin picker, and seed data. */
export const SERVICE_ICON_DEFS: ServiceIconDef[] = [
  // Pest control
  { key: 'spray', label: 'Spray', category: 'pest', Icon: SprayCan },
  { key: 'bug', label: 'Bug', category: 'pest', Icon: Bug },
  { key: 'mosq', label: 'Mosquito', category: 'pest', Icon: Waves },
  { key: 'wind', label: 'Mosquito / Air', category: 'pest', Icon: Wind },
  { key: 'mouse', label: 'Rodent', category: 'pest', Icon: Bug },
  { key: 'bed', label: 'Bed bug', category: 'pest', Icon: BedDouble },
  { key: 'termite', label: 'Termite', category: 'pest', Icon: Layers },
  { key: 'cloud', label: 'Fumigation', category: 'pest', Icon: Cloud },
  { key: 'bird', label: 'Bird', category: 'pest', Icon: Bird },
  { key: 'ant', label: 'Ant', category: 'pest', Icon: Target },

  // Cleaning
  { key: 'sparkles', label: 'Deep clean', category: 'cleaning', Icon: Sparkles },
  { key: 'clean', label: 'Cleaning', category: 'cleaning', Icon: Sparkles },
  { key: 'brush', label: 'Scrub', category: 'cleaning', Icon: Brush },
  { key: 'droplets', label: 'Wash', category: 'cleaning', Icon: Droplets },
  { key: 'bath', label: 'Bathroom', category: 'cleaning', Icon: Bath },

  // Repair & home
  { key: 'snowflake', label: 'AC / Cool', category: 'repair', Icon: Snowflake },
  { key: 'airvent', label: 'Ventilation', category: 'repair', Icon: AirVent },
  { key: 'zap', label: 'Electrical', category: 'repair', Icon: Zap },
  { key: 'plug', label: 'Wiring', category: 'repair', Icon: Plug },
  { key: 'lightbulb', label: 'Lighting', category: 'repair', Icon: Lightbulb },
  { key: 'wrench', label: 'Repair', category: 'repair', Icon: Wrench },
  { key: 'hammer', label: 'Carpentry', category: 'repair', Icon: Hammer },
  { key: 'pipe', label: 'Plumbing', category: 'repair', Icon: Pipette },
  { key: 'flame', label: 'Heating', category: 'repair', Icon: Flame },
  { key: 'fan', label: 'Fan', category: 'repair', Icon: Fan },

  // Outdoor
  { key: 'tree', label: 'Garden', category: 'outdoor', Icon: TreePine },
  { key: 'leaf', label: 'Lawn', category: 'outdoor', Icon: Leaf },
  { key: 'flower', label: 'Plants', category: 'outdoor', Icon: Flower2 },

  // General
  { key: 'home', label: 'Home', category: 'general', Icon: Home },
  { key: 'building', label: 'Commercial', category: 'general', Icon: Building2 },
  { key: 'warehouse', label: 'Warehouse / Silo', category: 'general', Icon: Warehouse },
  { key: 'truck', label: 'Delivery', category: 'general', Icon: Truck },
  { key: 'shield', label: 'Protection', category: 'general', Icon: ShieldCheck },
  { key: 'clipboard', label: 'Inspection', category: 'general', Icon: ClipboardList },
  { key: 'chef', label: 'Kitchen', category: 'general', Icon: ChefHat },
];

export const SERVICE_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  SERVICE_ICON_DEFS.map((d) => [d.key, d.Icon]),
);

export const SERVICE_ICON_KEYS = SERVICE_ICON_DEFS.map((d) => d.key);

export const SERVICE_ICON_CATEGORIES: { key: ServiceIconCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pest', label: 'Pest' },
  { key: 'cleaning', label: 'Cleaning' },
  { key: 'repair', label: 'Repair' },
  { key: 'outdoor', label: 'Outdoor' },
  { key: 'general', label: 'General' },
];

export function serviceIconLabel(key: string): string {
  return SERVICE_ICON_DEFS.find((d) => d.key === key)?.label ?? key;
}

export function isKnownServiceIcon(key: string): boolean {
  return key in SERVICE_ICON_MAP;
}

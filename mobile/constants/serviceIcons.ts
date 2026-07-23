import type { LucideIcon } from 'lucide-react-native';
import { REAL_SERVICE_ICONS } from '@/components/icons/RealIcons';

export type ServiceIconCategory = 'pest' | 'cleaning' | 'property' | 'general';

export interface ServiceIconDef {
  key: string;
  label: string;
  category: ServiceIconCategory;
  Icon: LucideIcon;
}

/** Realistic pest / service icons — custom SVGs (not generic Lucide metaphors). */
export const SERVICE_ICON_DEFS: ServiceIconDef[] = [
  // Pest treatments
  { key: 'spray', label: 'Treatment', category: 'pest', Icon: REAL_SERVICE_ICONS.spray },
  { key: 'bug', label: 'General pest', category: 'pest', Icon: REAL_SERVICE_ICONS.bug },
  { key: 'bugoff', label: 'Pest removal', category: 'pest', Icon: REAL_SERVICE_ICONS.bugoff },
  { key: 'cockroach', label: 'Cockroach', category: 'pest', Icon: REAL_SERVICE_ICONS.cockroach },
  { key: 'mosq', label: 'Mosquito', category: 'pest', Icon: REAL_SERVICE_ICONS.mosq },
  { key: 'mosquito', label: 'Mosquito', category: 'pest', Icon: REAL_SERVICE_ICONS.mosquito },
  { key: 'wind', label: 'Mosquito', category: 'pest', Icon: REAL_SERVICE_ICONS.wind },
  { key: 'mouse', label: 'Rodent', category: 'pest', Icon: REAL_SERVICE_ICONS.mouse },
  { key: 'rodent', label: 'Rodent', category: 'pest', Icon: REAL_SERVICE_ICONS.rodent },
  { key: 'bed', label: 'Bed bug', category: 'pest', Icon: REAL_SERVICE_ICONS.bed },
  { key: 'bed_bug', label: 'Bed bug', category: 'pest', Icon: REAL_SERVICE_ICONS.bed_bug },
  { key: 'termite', label: 'Termite', category: 'pest', Icon: REAL_SERVICE_ICONS.termite },
  { key: 'tree', label: 'Termite / wood', category: 'pest', Icon: REAL_SERVICE_ICONS.tree },
  { key: 'wood_borer', label: 'Wood borer', category: 'pest', Icon: REAL_SERVICE_ICONS.wood_borer },
  { key: 'cloud', label: 'Fumigation', category: 'pest', Icon: REAL_SERVICE_ICONS.cloud },
  { key: 'fumigation', label: 'Fumigation', category: 'pest', Icon: REAL_SERVICE_ICONS.fumigation },
  { key: 'bird', label: 'Bird control', category: 'pest', Icon: REAL_SERVICE_ICONS.bird },
  { key: 'ant', label: 'Ant', category: 'pest', Icon: REAL_SERVICE_ICONS.ant },
  { key: 'spider', label: 'Spider', category: 'pest', Icon: REAL_SERVICE_ICONS.spider },
  { key: 'flea', label: 'Flea', category: 'pest', Icon: REAL_SERVICE_ICONS.flea },
  { key: 'bee', label: 'Bee / wasp', category: 'pest', Icon: REAL_SERVICE_ICONS.bee },
  { key: 'lizard', label: 'Lizard', category: 'pest', Icon: REAL_SERVICE_ICONS.lizard },
  { key: 'snail', label: 'Snail / slug', category: 'pest', Icon: REAL_SERVICE_ICONS.snail },
  { key: 'inspect', label: 'Inspection', category: 'pest', Icon: REAL_SERVICE_ICONS.inspect },
  { key: 'general', label: 'General treatment', category: 'pest', Icon: REAL_SERVICE_ICONS.general },

  // Cleaning & sanitation
  { key: 'sparkles', label: 'Deep clean', category: 'cleaning', Icon: REAL_SERVICE_ICONS.sparkles },
  { key: 'clean', label: 'Cleaning', category: 'cleaning', Icon: REAL_SERVICE_ICONS.clean },
  { key: 'deep_cleaning', label: 'Deep cleaning', category: 'cleaning', Icon: REAL_SERVICE_ICONS.deep_cleaning },
  { key: 'brush', label: 'Scrub', category: 'cleaning', Icon: REAL_SERVICE_ICONS.brush },
  { key: 'droplets', label: 'Sanitize', category: 'cleaning', Icon: REAL_SERVICE_ICONS.droplets },
  { key: 'flask', label: 'Chemical treatment', category: 'cleaning', Icon: REAL_SERVICE_ICONS.flask },

  // Property types
  { key: 'home', label: 'Residential', category: 'property', Icon: REAL_SERVICE_ICONS.home },
  { key: 'building', label: 'Commercial', category: 'property', Icon: REAL_SERVICE_ICONS.building },
  { key: 'warehouse', label: 'Warehouse / silo', category: 'property', Icon: REAL_SERVICE_ICONS.warehouse },
  { key: 'silo', label: 'Silo', category: 'property', Icon: REAL_SERVICE_ICONS.silo },

  // Trust / general
  { key: 'shield', label: 'Protected', category: 'general', Icon: REAL_SERVICE_ICONS.shield },
  { key: 'clipboard', label: 'Report', category: 'general', Icon: REAL_SERVICE_ICONS.clipboard },
  { key: 'offer', label: 'Offer', category: 'general', Icon: REAL_SERVICE_ICONS.offer },
  { key: 'calendar', label: 'Schedule', category: 'general', Icon: REAL_SERVICE_ICONS.calendar },
  { key: 'support', label: 'Support', category: 'general', Icon: REAL_SERVICE_ICONS.support },
  { key: 'leaf', label: 'Eco-safe', category: 'general', Icon: REAL_SERVICE_ICONS.leaf },
  { key: 'star', label: 'Rated', category: 'general', Icon: REAL_SERVICE_ICONS.star },
  { key: 'tech', label: 'Technician', category: 'general', Icon: REAL_SERVICE_ICONS.tech },
  { key: 'percent', label: 'Discount', category: 'general', Icon: REAL_SERVICE_ICONS.percent },
  { key: 'card', label: 'Payment', category: 'general', Icon: REAL_SERVICE_ICONS.card },
  { key: 'wallet', label: 'Wallet', category: 'general', Icon: REAL_SERVICE_ICONS.wallet },
  { key: 'tags', label: 'Tags', category: 'general', Icon: REAL_SERVICE_ICONS.tags },
  { key: 'settings', label: 'Settings', category: 'general', Icon: REAL_SERVICE_ICONS.settings },
  { key: 'clock', label: 'Schedule time', category: 'general', Icon: REAL_SERVICE_ICONS.clock },
  { key: 'message', label: 'Message', category: 'general', Icon: REAL_SERVICE_ICONS.message },
  { key: 'check', label: 'Verified', category: 'general', Icon: REAL_SERVICE_ICONS.check },
  { key: 'gift', label: 'Gift', category: 'general', Icon: REAL_SERVICE_ICONS.gift },
];

export const SERVICE_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  SERVICE_ICON_DEFS.map((d) => [d.key, d.Icon]),
);

export const SERVICE_ICON_KEYS = SERVICE_ICON_DEFS.map((d) => d.key);

export const SERVICE_ICON_CATEGORIES: { key: ServiceIconCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pest', label: 'Pest' },
  { key: 'cleaning', label: 'Cleaning' },
  { key: 'property', label: 'Property' },
  { key: 'general', label: 'General' },
];

export function serviceIconLabel(key: string): string {
  return SERVICE_ICON_DEFS.find((d) => d.key === key)?.label ?? key;
}

export function isKnownServiceIcon(key: string): boolean {
  return key in SERVICE_ICON_MAP;
}

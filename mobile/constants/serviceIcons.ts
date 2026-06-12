import type { LucideIcon } from 'lucide-react-native';
import {
  BedDouble,
  Bird,
  Brush,
  Bug,
  BugOff,
  Building2,
  CircleDot,
  ClipboardList,
  Cloud,
  Droplets,
  Hexagon,
  Home,
  Rat,
  ScanSearch,
  ShieldCheck,
  Snail,
  Sparkles,
  SprayCan,
  TreePine,
  Turtle,
  Warehouse,
  Webhook,
  Wind,
} from 'lucide-react-native';

export type ServiceIconCategory = 'pest' | 'cleaning' | 'property' | 'general';

export interface ServiceIconDef {
  key: string;
  label: string;
  category: ServiceIconCategory;
  Icon: LucideIcon;
}

/** Pest-control service icon registry — used by ServiceIcon, admin picker, and seed data. */
export const SERVICE_ICON_DEFS: ServiceIconDef[] = [
  // Pest treatments
  { key: 'spray', label: 'Treatment', category: 'pest', Icon: SprayCan },
  { key: 'bug', label: 'General pest', category: 'pest', Icon: Bug },
  { key: 'bugoff', label: 'Pest removal', category: 'pest', Icon: BugOff },
  { key: 'mosq', label: 'Mosquito', category: 'pest', Icon: Wind },
  { key: 'wind', label: 'Mosquito', category: 'pest', Icon: Wind },
  { key: 'mouse', label: 'Rodent', category: 'pest', Icon: Rat },
  { key: 'bed', label: 'Bed bug', category: 'pest', Icon: BedDouble },
  { key: 'termite', label: 'Termite', category: 'pest', Icon: TreePine },
  { key: 'tree', label: 'Termite / wood', category: 'pest', Icon: TreePine },
  { key: 'cloud', label: 'Fumigation', category: 'pest', Icon: Cloud },
  { key: 'bird', label: 'Bird control', category: 'pest', Icon: Bird },
  { key: 'ant', label: 'Ant', category: 'pest', Icon: CircleDot },
  { key: 'spider', label: 'Spider', category: 'pest', Icon: Webhook },
  { key: 'bee', label: 'Bee / wasp', category: 'pest', Icon: Hexagon },
  { key: 'lizard', label: 'Lizard', category: 'pest', Icon: Turtle },
  { key: 'snail', label: 'Snail / slug', category: 'pest', Icon: Snail },
  { key: 'inspect', label: 'Inspection', category: 'pest', Icon: ScanSearch },

  // Cleaning & sanitation
  { key: 'sparkles', label: 'Deep clean', category: 'cleaning', Icon: Sparkles },
  { key: 'clean', label: 'Cleaning', category: 'cleaning', Icon: Sparkles },
  { key: 'brush', label: 'Scrub', category: 'cleaning', Icon: Brush },
  { key: 'droplets', label: 'Sanitize', category: 'cleaning', Icon: Droplets },

  // Property types
  { key: 'home', label: 'Residential', category: 'property', Icon: Home },
  { key: 'building', label: 'Commercial', category: 'property', Icon: Building2 },
  { key: 'warehouse', label: 'Warehouse / silo', category: 'property', Icon: Warehouse },

  // General
  { key: 'shield', label: 'Protection plan', category: 'general', Icon: ShieldCheck },
  { key: 'clipboard', label: 'Inspection report', category: 'general', Icon: ClipboardList },
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

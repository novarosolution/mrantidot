/** Property / premises type selected during booking (mirrors mobile). */
export const PROPERTY_TYPE_KEYS = [
  '1bhk',
  '2bhk',
  '3bhk',
  '4bhk',
  'bungalow',
  'office',
  'cafe_restaurant',
  'hotel',
  'warehouse',
  'factory',
] as const;

export type PropertyTypeKey = (typeof PROPERTY_TYPE_KEYS)[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyTypeKey, string> = {
  '1bhk': '1 BHK',
  '2bhk': '2 BHK',
  '3bhk': '3 BHK',
  '4bhk': '4 BHK',
  bungalow: 'Bungalow',
  office: 'Office',
  cafe_restaurant: 'Cafe / Restaurant',
  hotel: 'Hotel',
  warehouse: 'Warehouse',
  factory: 'Factory',
};

export function isPropertyTypeKey(value: string): value is PropertyTypeKey {
  return (PROPERTY_TYPE_KEYS as readonly string[]).includes(value);
}

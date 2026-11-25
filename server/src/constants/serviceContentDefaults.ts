import type { IServiceOption, ServiceCategory } from '../models/Service';
import type { ServiceTypeKey } from './serviceTypes';

/**
 * Starter detail-page content for demo / local data. Admins edit or clear all of it from the
 * service editor — production databases never get this automatically (see backfillServiceContent).
 */
export interface ServiceContentDefaults {
  optionsTitle: string;
  options: IServiceOption[];
  durationMins: number;
  highlights: string[];
  included: string[];
  excluded: string[];
  notes: string[];
}

/** ₹699 × 1.3 → ₹899: round to the nearest ₹50 and end in 9, the way price lists read. */
function tier(base: number, mult: number): number {
  if (mult === 1) return base;
  return Math.max(base, Math.round((base * mult) / 50) * 50 - 1);
}

function homeSizes(base: number): IServiceOption[] {
  return [
    { key: '1-bhk', label: '1 BHK', price: base },
    { key: '2-bhk', label: '2 BHK', price: tier(base, 1.3) },
    { key: '3-bhk', label: '3 BHK', price: tier(base, 1.6) },
    { key: '4-bhk', label: '4 BHK+', price: tier(base, 2) },
  ];
}

function areaSizes(base: number): IServiceOption[] {
  return [
    { key: 'upto-1000', label: 'Up to 1,000 sq ft', price: base },
    { key: '1000-3000', label: '1,000–3,000 sq ft', price: tier(base, 1.8) },
    { key: '3000-5000', label: '3,000–5,000 sq ft', price: tier(base, 2.6) },
  ];
}

const HOME_NOTES = [
  'Keep food, utensils and pet bowls covered or away from treated areas',
  'An adult should be at home for the whole visit',
  'Avoid mopping treated corners for a few days so the treatment keeps working',
];

const HOME_EXCLUDED = [
  'Areas outside the booked home (common areas, terrace, parking)',
  'Repair of walls, woodwork or plumbing',
  'Moving heavy furniture or appliances',
];

const BY_TYPE: Partial<Record<ServiceTypeKey, Omit<ServiceContentDefaults, 'options' | 'optionsTitle'>>> = {
  general: {
    durationMins: 60,
    highlights: ['Covers cockroaches, ants and common crawling pests', 'Kitchen, bathrooms and all rooms'],
    included: [
      'Inspection of kitchen, bathrooms and living areas',
      'Gel and spray treatment for crawling pests',
      'Crack and crevice treatment in cabinets and corners',
      'Drain and sink area treatment',
      'Aftercare tips from the technician',
    ],
    excluded: HOME_EXCLUDED,
    notes: HOME_NOTES,
  },
  cockroach: {
    durationMins: 60,
    highlights: ['Gel + spray for long-lasting control', 'Kitchen cabinets, drains and appliances'],
    included: [
      'Infestation inspection',
      'Gel baiting in kitchen cabinets and hinges',
      'Spray treatment along skirting and drains',
      'Treatment behind fridge, stove and sink',
      'Follow-up checklist',
    ],
    excluded: HOME_EXCLUDED,
    notes: HOME_NOTES,
  },
  mosquito: {
    durationMins: 45,
    highlights: ['Breeding-site survey and larval control', 'Indoor spray and outdoor fogging'],
    included: [
      'Survey of water storage and breeding spots',
      'Larvicide in stagnant water points',
      'Residual spray on resting surfaces',
      'Fogging of balcony and outdoor areas',
      'Prevention tips for your home',
    ],
    excluded: ['Society common areas and open plots', 'Cleaning of water tanks', 'Repair of nets or windows'],
    notes: ['Close windows during fogging and air rooms for 30 minutes after', ...HOME_NOTES.slice(1)],
  },
  rodent: {
    durationMins: 60,
    highlights: ['Bait stations and traps', 'Entry-point inspection'],
    included: [
      'Inspection of entry points and runways',
      'Tamper-proof bait station placement',
      'Glue boards and traps where needed',
      'Proofing recommendations',
    ],
    excluded: ['Sealing, mesh or civil work at entry points', 'Removal from false ceilings that need dismantling', 'Areas outside the booked property'],
    notes: ['Keep baits away from children and pets', 'Report sightings to us — a follow-up may be needed'],
  },
  bed_bug: {
    durationMins: 120,
    highlights: ['Mattress, sofa and furniture treatment', 'Follow-up visit plan'],
    included: [
      'Inspection of mattresses, bed frames and sofas',
      'Targeted treatment of seams, joints and cracks',
      'Treatment of headboards and nearby furniture',
      'Follow-up visit plan',
    ],
    excluded: ['Replacement or disposal of mattresses', 'Laundry of bedsheets and clothes', 'Furniture repair'],
    notes: [
      'Wash bedsheets and curtains in hot water before the visit',
      'Keep rooms empty of people and pets for 3–4 hours after treatment',
      'A second visit is usually needed to break the life cycle',
    ],
  },
  termite: {
    durationMins: 180,
    highlights: ['Drill-fill-seal treatment', 'Barrier protection for woodwork'],
    included: [
      'Moisture and wood inspection',
      'Drilling along affected walls and floors',
      'Chemical injection and sealing of drill holes',
      'Treatment of infested woodwork',
      'Warranty briefing',
    ],
    excluded: ['Replacement of damaged wood or furniture', 'Re-painting or re-tiling after drilling', 'Areas outside the booked property'],
    notes: ['Drilling makes some noise and dust — please clear the work area', 'Do not wash treated walls or floors for a week'],
  },
  fumigation: {
    durationMins: 240,
    highlights: ['For warehouses, factories and large spaces', 'Clearance test before re-entry'],
    included: ['Area sealing and preparation', 'Gas fumigation cycle', 'Aeration and clearance test', 'Safety certification'],
    excluded: ['Stock movement and loading', 'Structural repairs to seal gaps'],
    notes: ['The area must stay empty of people during fumigation', 'Re-enter only after our clearance test'],
  },
  bird: {
    durationMins: 180,
    highlights: ['Netting and anti-bird spikes', 'Priced per sq ft'],
    included: ['Roof and ledge survey', 'Net or spike installation', 'Dropping clean-up around the work area', 'Maintenance plan'],
    excluded: ['Scaffolding for heights above 2 floors', 'Painting or repair of ledges'],
    notes: ['Final price depends on measured area after the survey'],
  },
  silo: {
    durationMins: 240,
    highlights: ['Grain and industrial silos', 'Ventilation and clearance'],
    included: ['Silo inspection', 'Sealing and preparation', 'Fumigation application', 'Ventilation and clearance'],
    excluded: ['Grain handling or transfer', 'Structural repairs'],
    notes: ['Final price depends on silo capacity after inspection'],
  },
  deep_cleaning: {
    durationMins: 240,
    highlights: ['Machine scrubbing of floors', 'Kitchen, bathrooms and living areas'],
    included: [
      'Floor scrubbing in all rooms',
      'Kitchen tiles, slab and sink cleaning',
      'Bathroom floor, tiles and fixtures',
      'Fan, switchboard and window dusting',
      'Balcony cleaning',
    ],
    excluded: ['Paint, glue or sticker stain removal', 'Wet wiping of walls and ceiling', 'Terrace and hard-to-reach areas'],
    notes: ['Keep a bucket of water and a power point available', 'Applicable to homes with no ongoing construction'],
  },
};

/** Area-priced services keep their base price (no size picker). */
const NO_OPTIONS: ServiceTypeKey[] = ['bird', 'silo'];

export function defaultServiceContent(service: {
  serviceTypes?: string[];
  category?: ServiceCategory;
  basePrice: number;
}): ServiceContentDefaults {
  const type = (service.serviceTypes?.[0] ?? 'general') as ServiceTypeKey;
  const body = BY_TYPE[type] ?? BY_TYPE.general!;
  const commercial = service.category === 'commercial';
  const options = NO_OPTIONS.includes(type)
    ? []
    : commercial
      ? areaSizes(service.basePrice)
      : homeSizes(service.basePrice);
  return {
    optionsTitle: commercial ? 'Area to treat' : 'Size of home',
    options,
    ...body,
  };
}

import type { BusinessSettings, SettingsSlot, SettingsSlotGroup } from '@/types/api';

/**
 * Built-in business rules, identical to the server defaults (server/src/utils/businessSettings.ts).
 * Used until `GET /settings` answers, and when the app is offline.
 */
const groupOf = (from: string): SettingsSlotGroup => {
  const h = Number(from.slice(0, 2));
  return h < 6 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
};

const SLOTS: SettingsSlot[] = [
  '00:00-02:00', '02:00-04:00', '04:00-06:00', '06:00-08:00', '08:00-10:00', '10:00-12:00',
  '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00', '22:00-00:00',
].map((key) => {
  const [from, to] = key.split('-');
  return { key, from, to, group: groupOf(from), active: true };
});

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  tax: { gstPercent: 18 },
  invoice: { legalName: '', gstin: '', address: '', prefix: 'INV-', footer: '' },
  slots: SLOTS,
  booking: {
    leadMinutes: 0,
    horizonDays: 90,
    pickerDays: 7,
    cancelCutoffHours: 0,
    rescheduleCutoffHours: 0,
    maxReschedules: 0,
    autoConfirm: false,
    autoAssign: false,
  },
  lists: {
    categories: [
      { key: 'residential', label: 'Residential', active: true },
      { key: 'commercial', label: 'Commercial', active: true },
      { key: 'cleaning', label: 'Cleaning', active: true },
      { key: 'general', label: 'General', active: true },
    ],
    propertyTypes: [
      { key: '1bhk', label: '1 BHK', group: 'home', active: true },
      { key: '2bhk', label: '2 BHK', group: 'home', active: true },
      { key: '3bhk', label: '3 BHK', group: 'home', active: true },
      { key: '4bhk', label: '4 BHK', group: 'home', active: true },
      { key: 'bungalow', label: 'Bungalow', group: 'home', active: true },
      { key: 'office', label: 'Office', group: 'business', active: true },
      { key: 'cafe_restaurant', label: 'Cafe / Restaurant', group: 'business', active: true },
      { key: 'hotel', label: 'Hotel', group: 'business', active: true },
      { key: 'warehouse', label: 'Warehouse', group: 'business', active: true },
      { key: 'factory', label: 'Factory', group: 'business', active: true },
    ],
    pestTypes: [
      ['ant', 'Ant'], ['cockroach', 'Cockroach'], ['rodent', 'Rodent'], ['mosquito', 'Mosquito'],
      ['termite', 'Termite'], ['bed_bug', 'Bed Bug'], ['bird', 'Bird'], ['flea', 'Flea'],
      ['spider', 'Spider'], ['lizard', 'Lizard'], ['bee', 'Bee / Wasp'], ['wood_borer', 'Wood Borer'],
      ['general', 'General Pest'], ['fumigation', 'Fumigation'], ['deep_cleaning', 'Deep Cleaning'], ['silo', 'Silo Treatment'],
    ].map(([key, label]) => ({ key, label, active: true })),
    reviewTags: ['On time', 'Professional', 'No smell', 'Thorough', 'Polite'],
    leaveTypes: [
      { key: 'casual', label: 'Casual', active: true },
      { key: 'sick', label: 'Sick', active: true },
      { key: 'emergency', label: 'Emergency', active: true },
      { key: 'other', label: 'Other', active: true },
    ],
  },
  serviceArea: { mode: 'anywhere', cities: [], pincodes: [] },
  payments: {
    methods: [
      { key: 'upi_card', label: 'UPI / Card', active: true },
      { key: 'pay_after', label: 'Pay after service', active: true },
    ],
  },
  customers: { vipSpend: 2000, vipBookings: 3 },
  app: { maintenance: false, maintenanceMessage: '', minVersion: '', iosUrl: '', androidUrl: '' },
  updatedAt: '',
};

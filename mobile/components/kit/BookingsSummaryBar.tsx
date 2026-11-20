import { SegmentedTabs } from '@/components/kit/SegmentedTabs';
import { useBookingCopy } from '@/lib/schedule-copy';
import { haptic } from '@/lib/motion';

type FilterKey = 'active' | 'completed' | 'cancelled';

/** Bookings filter — Active / Done / Cancelled with counts. */
export function BookingsSummaryBar({
  active,
  completed,
  cancelled,
  selected,
  onSelect,
}: {
  active: number;
  completed: number;
  cancelled: number;
  selected: FilterKey;
  onSelect: (filter: FilterKey) => void;
}) {
  const copy = useBookingCopy();
  return (
    <SegmentedTabs<FilterKey>
      tabs={[
        { key: 'active', label: copy.listFilterActive, count: active },
        { key: 'completed', label: copy.listFilterCompleted, count: completed },
        { key: 'cancelled', label: copy.listFilterCancelled, count: cancelled },
      ]}
      selected={selected}
      onSelect={(key) => {
        if (key !== selected) haptic('select');
        onSelect(key);
      }}
    />
  );
}

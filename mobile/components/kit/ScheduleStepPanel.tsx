import { CalendarClock } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { BookWizardSection, BookWizardStepPanel } from '@/components/kit/BookWizardStepPanel';

export function ScheduleStepPanel(
  props: Omit<ComponentProps<typeof BookWizardStepPanel>, 'icon'>,
) {
  return <BookWizardStepPanel icon={CalendarClock} {...props} />;
}

export const ScheduleSection = BookWizardSection;

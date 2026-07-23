import type { ComponentProps } from 'react';
import { AppIcons } from '@/constants/appIcons';
import { BookWizardSection, BookWizardStepPanel } from '@/components/kit/BookWizardStepPanel';

export function ScheduleStepPanel(
  props: Omit<ComponentProps<typeof BookWizardStepPanel>, 'icon'>,
) {
  return <BookWizardStepPanel icon={AppIcons.ui.calendarClock} {...props} />;
}

export const ScheduleSection = BookWizardSection;

import axios from 'axios';
import { fillCopy } from '@/constants/customerUiCopy';
import { errorKind } from '@/lib/errorKind';
import type {
  BookingStatus,
  CustomerUiCopy,
  DayAttendanceStatus,
  JobVisitStatus,
  LeaveStatus,
} from '@/types/api';

/**
 * Technician display helpers over the admin-editable copy (`useCustomerUiCopy()`, group "tech").
 * Status helpers in `lib/` keep their English for other callers; tech screens map through these instead.
 */

/**
 * Second line for an error toast: the server's own message when it sent one ("Invalid start code"),
 * the connection hint when the phone is offline, else `fallback` — never raw transport errors with
 * codes or the API address.
 */
export function techErrorText(copy: CustomerUiCopy, err: unknown, fallback: string = copy.techCheckConnection): string {
  const kind = errorKind(err);
  if (kind === 'offline') return copy.techCheckConnection;
  if (kind === 'server') return fallback;
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { error?: unknown } | undefined;
    return typeof body?.error === 'string' && body.error.trim() ? body.error : fallback;
  }
  return err instanceof Error && err.message.trim() ? err.message : fallback;
}

/** "1 photo" / "3 photos" */
export function photoCount(copy: CustomerUiCopy, n: number): string {
  return n === 1 ? copy.techPhotosOne : fillCopy(copy.techPhotosMany, { count: n });
}

/** "1 day" / "3 days" */
export function dayCount(copy: CustomerUiCopy, n: number): string {
  return n === 1 ? copy.techDaysOne : fillCopy(copy.techDaysMany, { count: n });
}

/** "1 job" / "3 jobs" */
export function jobCount(copy: CustomerUiCopy, n: number): string {
  return n === 1 ? copy.techJobsOne : fillCopy(copy.techJobsMany, { count: n });
}

/** Where the technician stands today — drives the header pill, the duty card and the profile hero. */
export type DutyState = 'on' | 'checkedOut' | 'leave' | 'absent' | 'pending';

export function dutyState(todayStatus: DayAttendanceStatus, onDuty: boolean): DutyState {
  if (todayStatus === 'leave') return 'leave';
  if (todayStatus === 'came') return onDuty ? 'on' : 'checkedOut';
  if (todayStatus === 'not_came') return 'absent';
  return 'pending';
}

export function dutyLabel(copy: CustomerUiCopy, state: DutyState): string {
  switch (state) {
    case 'on':
      return copy.techDutyOn;
    case 'checkedOut':
      return copy.techDutyCheckedOut;
    case 'leave':
      return copy.techDutyLeave;
    case 'absent':
      return copy.techDutyAbsent;
    default:
      return copy.techDutyPending;
  }
}

export function visitStateLabel(copy: CustomerUiCopy, status: JobVisitStatus): string {
  switch (status) {
    case 'completed':
      return copy.techVisitStateCompleted;
    case 'in_progress':
      return copy.techVisitStateInProgress;
    case 'no_show':
      return copy.techVisitStateNoShow;
    case 'cancelled':
      return copy.techVisitStateCancelled;
    default:
      return copy.techVisitStateScheduled;
  }
}

export function jobStatusLabel(copy: CustomerUiCopy, status: BookingStatus): string {
  switch (status) {
    case 'confirmed':
      return copy.techStatusConfirmed;
    case 'in_progress':
      return copy.techStatusInProgress;
    case 'awaiting_verification':
      return copy.techStatusAwaiting;
    case 'completed':
      return copy.techStatusCompleted;
    case 'cancelled':
      return copy.techStatusCancelled;
    default:
      return copy.techStatusPending;
  }
}

/** What the technician should do next for a job in this status. */
export function jobGuidance(copy: CustomerUiCopy, status: BookingStatus): string {
  switch (status) {
    case 'confirmed':
      return copy.techGuideConfirmed;
    case 'in_progress':
      return copy.techGuideInProgress;
    case 'awaiting_verification':
      return copy.techGuideAwaiting;
    case 'completed':
      return copy.techGuideCompleted;
    case 'cancelled':
      return copy.techGuideCancelled;
    default:
      return copy.techGuidePending;
  }
}

export function leaveStatusLabel(copy: CustomerUiCopy, status: LeaveStatus): string {
  switch (status) {
    case 'approved':
      return copy.techLeaveApproved;
    case 'rejected':
      return copy.techLeaveRejected;
    case 'cancelled':
      return copy.techLeaveCancelled;
    default:
      return copy.techLeavePending;
  }
}

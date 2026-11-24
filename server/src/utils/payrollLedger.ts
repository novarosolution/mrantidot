import { Types } from 'mongoose';
import { PayAdjustment } from '../models/PayAdjustment';
import { Payout } from '../models/Payout';

/**
 * What the business owes each technician for a payroll range (GET /admin/payroll, Payroll screen):
 *   due = earned (take-home of completed jobs) + adjustments (bonuses − deductions) − paid (payouts)
 * Adjustments count by their date. A payout counts for a range when its whole pay period lies inside the
 * range — so payouts recorded for a week or for a month both add up in that month, and a payout is never
 * counted in two months. Payouts that only partly overlap the range are reported separately (`overlapPaid`).
 */

export type LedgerFields = {
  /** Bonuses − deductions dated in the range. */
  adjustments: number;
  adjustmentCount: number;
  /** Payouts whose pay period lies inside the range. */
  paid: number;
  payoutCount: number;
  /** earned + adjustments − paid (negative = paid more than earned). */
  due: number;
  /** Newest payout counted (ISO). */
  lastPaidAt?: string;
  /** Payouts whose period only partly overlaps the range — not counted, shown as a hint. */
  overlapPaid: number;
  overlapPayouts: number;
};

/** True when a payout for `periodFrom`…`periodTo` counts in the range `from`…`to`. */
export function payoutCountsFor(p: { periodFrom: string; periodTo: string }, from: string, to: string): boolean {
  return p.periodFrom >= from && p.periodTo <= to;
}

type Sum = { _id: Types.ObjectId; sum: number; n: number; last?: Date };

/** Adjustments, payouts and overlapping payouts per technician id for the range. */
export async function ledgerTotals(technicianIds: (string | Types.ObjectId)[], from: string, to: string) {
  const ids = technicianIds.map((id) => new Types.ObjectId(String(id)));
  const out = new Map<string, Omit<LedgerFields, 'due'>>();
  if (ids.length === 0) return out;
  const [adjustments, paid, overlap] = await Promise.all([
    PayAdjustment.aggregate<Sum>([
      { $match: { technicianId: { $in: ids }, date: { $gte: from, $lte: to } } },
      { $group: { _id: '$technicianId', sum: { $sum: '$amount' }, n: { $sum: 1 } } },
    ]),
    Payout.aggregate<Sum>([
      { $match: { technicianId: { $in: ids }, periodFrom: { $gte: from }, periodTo: { $lte: to } } },
      { $group: { _id: '$technicianId', sum: { $sum: '$amount' }, n: { $sum: 1 }, last: { $max: '$paidAt' } } },
    ]),
    Payout.aggregate<Sum>([
      {
        $match: {
          technicianId: { $in: ids },
          periodFrom: { $lte: to },
          periodTo: { $gte: from },
          $or: [{ periodFrom: { $lt: from } }, { periodTo: { $gt: to } }],
        },
      },
      { $group: { _id: '$technicianId', sum: { $sum: '$amount' }, n: { $sum: 1 } } },
    ]),
  ]);
  const blank = (): Omit<LedgerFields, 'due'> => ({
    adjustments: 0,
    adjustmentCount: 0,
    paid: 0,
    payoutCount: 0,
    overlapPaid: 0,
    overlapPayouts: 0,
  });
  const entry = (id: Types.ObjectId) => {
    const key = String(id);
    const cur = out.get(key) ?? blank();
    out.set(key, cur);
    return cur;
  };
  for (const row of adjustments) {
    const e = entry(row._id);
    e.adjustments = Math.round(row.sum);
    e.adjustmentCount = row.n;
  }
  for (const row of paid) {
    const e = entry(row._id);
    e.paid = Math.round(row.sum);
    e.payoutCount = row.n;
    if (row.last) e.lastPaidAt = new Date(row.last).toISOString();
  }
  for (const row of overlap) {
    const e = entry(row._id);
    e.overlapPaid = Math.round(row.sum);
    e.overlapPayouts = row.n;
  }
  return out;
}

/**
 * Adds `adjustments`, `paid`, `due` (and counts) to every technician row of a payroll answer, plus
 * `totalAdjustments`, `totalPaid`, `totalDue` (what is still owed, overpayments not netted off) and
 * `totalOverpaid`.
 */
export async function withPayrollLedger<
  R extends { technicianId: string; earnings: number },
  T extends { from: string; to: string; technicians: R[] },
>(result: T) {
  const totals = await ledgerTotals(
    result.technicians.map((r) => r.technicianId),
    result.from,
    result.to,
  );
  const technicians = result.technicians.map((row) => {
    const t = totals.get(row.technicianId) ?? {
      adjustments: 0,
      adjustmentCount: 0,
      paid: 0,
      payoutCount: 0,
      overlapPaid: 0,
      overlapPayouts: 0,
    };
    const due = Math.round(row.earnings + t.adjustments - t.paid);
    return { ...row, ...t, due } as R & LedgerFields;
  });
  return {
    ...result,
    technicians,
    totalAdjustments: technicians.reduce((s, r) => s + r.adjustments, 0),
    totalPaid: technicians.reduce((s, r) => s + r.paid, 0),
    totalDue: technicians.reduce((s, r) => s + Math.max(0, r.due), 0),
    totalOverpaid: technicians.reduce((s, r) => s + Math.max(0, -r.due), 0),
  };
}

/** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function eachDateInRange(from: string, to: string): string[] {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  const cur = new Date(y1, m1 - 1, d1);
  const end = new Date(y2, m2 - 1, d2);
  const dates: string[] = [];
  while (cur <= end) {
    dates.push(localDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

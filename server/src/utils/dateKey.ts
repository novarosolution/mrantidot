const APP_TZ = process.env.APP_TZ || 'Asia/Kolkata';
const tzFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Calendar date as YYYY-MM-DD in the business timezone (APP_TZ, default IST), not the server's. */
export function localDateKey(d: Date = new Date()): string {
  return tzFormatter.format(d);
}

const tzTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Wall-clock time as HH:mm in the business timezone (APP_TZ). */
export function localTimeHHmm(d: Date = new Date()): string {
  return tzTimeFormatter.format(d);
}

export function eachDateInRange(from: string, to: string): string[] {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  const cur = new Date(Date.UTC(y1, m1 - 1, d1));
  const end = new Date(Date.UTC(y2, m2 - 1, d2));
  const dates: string[] = [];
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

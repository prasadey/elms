/** Returns today's date as YYYY-MM-DD in Asia/Kolkata (IST), independent of
 * the server's local timezone. Storage stays UTC-based timestamps elsewhere
 * (SQLite datetime('now')); this is only for calendar-date business rules. */
export function todayIST(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date()); // en-CA gives YYYY-MM-DD
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function diffDays(fromStr: string, toStr: string): number {
  const a = new Date(fromStr + "T00:00:00Z").getTime();
  const b = new Date(toStr + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

export function* eachDate(fromStr: string, toStr: string): Generator<string> {
  let cur = fromStr;
  while (cur <= toStr) {
    yield cur;
    cur = addDays(cur, 1);
  }
}

export function yearOf(dateStr: string): number {
  return Number(dateStr.slice(0, 4));
}

/** Whole days elapsed since a stored UTC timestamp (e.g. `submitted_at`).
 * Kept in its own module so the impure `Date.now()` read stays out of
 * component render bodies (see react-hooks/purity). */
export function daysSince(utcTimestamp: string): number {
  return Math.floor((Date.now() - new Date(utcTimestamp + "Z").getTime()) / 86400000);
}

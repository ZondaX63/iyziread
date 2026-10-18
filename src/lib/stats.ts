import { format, subDays } from "date-fns";

/** Consecutive days with reading, counting back from today (or yesterday if today has none yet). */
export function readingStreak(dates: string[], today = new Date()) {
  const set = new Set(dates);
  let d = today;
  if (!set.has(format(d, "yyyy-MM-dd"))) d = subDays(d, 1);
  let n = 0;
  while (set.has(format(d, "yyyy-MM-dd"))) {
    n++;
    d = subDays(d, 1);
  }
  return n;
}

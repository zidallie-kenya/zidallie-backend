export type BookingTerm = 'dec-jan' | 'apr-may' | 'aug-sept';

export function getCurrentTerm(date: Date = new Date()): BookingTerm {
  const month = date.getMonth() + 1; // 1-12
  if (month === 12 || month === 1) return 'dec-jan';
  if (month >= 4 && month <= 5) return 'apr-may';
  if (month >= 8 && month <= 9) return 'aug-sept';
  // Between terms (Feb/Mar, Jun/Jul, Oct/Nov) — decide explicitly what
  // "current term" means here. Likely: the most recently ended term still
  // being serviced, or the upcoming term being staged. Flagging this as a
  // decision you need to make, not guessing it.
  throw new Error(`No active term mapping for month ${month}`);
}

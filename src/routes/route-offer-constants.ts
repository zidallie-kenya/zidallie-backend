// Rule 2 (updated) — "pushed to 10 drivers near the first child".
export const OFFER_BATCH_SIZE = 1;

// Hard outer cap on the whole cascade, independent of how many batches get
// tried. A single delayed job scheduled at cascade start enforces this —
// see route-offer.service.ts's scheduleDeadlineCheck.
export const CASCADE_TOTAL_CAP_HOURS = 24;

// "an alarm is raised to admin within 1 hour" of a mid-term driver
// removal. handleDriverRemoved() fires this immediately (well inside the
// bound); this constant only matters if whatever detects the removal
// (e.g. a compliance-expiry cron) itself runs on a delay — that
// detection job's interval must stay under this to keep the SLA.
export const MID_TERM_ALARM_MAX_DELAY_MINUTES = 60;

export const ROUTE_OFFER_CASCADE_QUEUE = 'route-offer-cascade';
export const MAX_CHILDREN_PER_ROUTE = 4;

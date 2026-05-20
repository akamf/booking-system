import { localWallClockToUtc, utcToLocalWallClock, type IanaTimeZone } from './time';

export interface TimeRange {
  starts_at: string;
  ends_at: string;
}

interface OpeningWindow {
  weekday: number;
  opens_at: string;
  closes_at: string;
}

export interface AvailabilityInput {
  /** Calendar date in the location's timezone, YYYY-MM-DD. */
  date: string;
  timezone: IanaTimeZone;
  openingHours: readonly OpeningWindow[];
  blockedTimes: readonly TimeRange[];
  existingBookings: readonly TimeRange[];
  activity: {
    default_duration_minutes: number;
    min_duration_minutes: number;
  };
  /** Granularity at which candidate slots start. */
  slotStepMinutes?: number;
}

/**
 * Half-open overlap check: [a_start, a_end) overlaps [b_start, b_end)?
 * Back-to-back ranges (a_end === b_start) do NOT overlap, matching
 * the Postgres tstzrange '[)' semantics used in the bookings table.
 */
export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return new Date(a.starts_at) < new Date(b.ends_at)
      && new Date(b.starts_at) < new Date(a.ends_at);
}

export function findConflicts(candidate: TimeRange, ranges: readonly TimeRange[]): TimeRange[] {
  return ranges.filter((r) => rangesOverlap(candidate, r));
}

const TIME_RE = /^(\d{2}):(\d{2})(?::\d{2})?$/;
function parseTimeOfDay(s: string): { hour: number; minute: number } {
  const m = TIME_RE.exec(s);
  if (!m || m[1] === undefined || m[2] === undefined) {
    throw new Error(`Invalid time-of-day: ${s}`);
  }
  return { hour: Number.parseInt(m[1], 10), minute: Number.parseInt(m[2], 10) };
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
function parseDate(s: string): { year: number; month: number; day: number } {
  const m = DATE_RE.exec(s);
  if (!m || m[1] === undefined || m[2] === undefined || m[3] === undefined) {
    throw new Error(`Invalid date: ${s}`);
  }
  return {
    year: Number.parseInt(m[1], 10),
    month: Number.parseInt(m[2], 10),
    day: Number.parseInt(m[3], 10),
  };
}

/**
 * Compute bookable slots for a resource on a given calendar date.
 *
 * Slots:
 *  - are anchored to the opening_hours windows in the location's timezone.
 *  - start at multiples of `slotStepMinutes` (default 30).
 *  - last `activity.default_duration_minutes` minutes.
 *  - never overlap an existing booking or a blocked-time window.
 *  - fit entirely within an opening window.
 */
export function computeAvailableSlots(input: AvailabilityInput): TimeRange[] {
  const {
    date,
    timezone,
    openingHours,
    blockedTimes,
    existingBookings,
    activity,
    slotStepMinutes = 30,
  } = input;

  const { year, month, day } = parseDate(date);
  const weekday = utcToLocalWallClock(
    localWallClockToUtc({ year, month, day, hour: 12, minute: 0 }, timezone),
    timezone,
  ).weekday;

  const windowsForDay = openingHours.filter((w) => w.weekday === weekday);

  const candidates: TimeRange[] = [];
  for (const window of windowsForDay) {
    const opens = parseTimeOfDay(window.opens_at);
    const closes = parseTimeOfDay(window.closes_at);

    const openMinutes = opens.hour * 60 + opens.minute;
    const closeMinutes = closes.hour * 60 + closes.minute;

    for (let start = openMinutes; start + activity.default_duration_minutes <= closeMinutes; start += slotStepMinutes) {
      const startsAt = localWallClockToUtc(
        { year, month, day, hour: Math.floor(start / 60), minute: start % 60 },
        timezone,
      );
      const endMinutes = start + activity.default_duration_minutes;
      const endsAt = localWallClockToUtc(
        { year, month, day, hour: Math.floor(endMinutes / 60), minute: endMinutes % 60 },
        timezone,
      );
      candidates.push({
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      });
    }
  }

  const conflicts: readonly TimeRange[] = [...blockedTimes, ...existingBookings];
  return candidates.filter((c) => findConflicts(c, conflicts).length === 0);
}

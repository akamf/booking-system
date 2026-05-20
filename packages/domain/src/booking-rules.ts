import type { BookingErrorCode } from '@booking/types';
import { utcToLocalWallClock, type IanaTimeZone } from './time';
import { rangesOverlap, type TimeRange } from './availability';

export interface Violation {
  code: BookingErrorCode;
  message: string;
}

export interface BookingCandidate {
  resource_id: string;
  activity_id: string;
  starts_at: string;
  ends_at: string;
  on_behalf_of_user_id?: string | null;
}

interface ActivityContext {
  min_duration_minutes: number;
  max_duration_minutes: number;
  min_age: number | null;
  max_age: number | null;
  self_book_min_age: number;
  cancellation_cutoff_minutes: number;
}

interface ResourceContext {
  id: string;
  location_id: string;
}

interface ProfileContext {
  user_id: string;
  birth_year: number | null;
}

interface OpeningWindow {
  weekday: number;
  opens_at: string;
  closes_at: string;
}

export interface ValidationContext {
  now: Date;
  timezone: IanaTimeZone;
  activity: ActivityContext;
  resource: ResourceContext;
  compatibility: ReadonlySet<string>;
  openingHours: readonly OpeningWindow[];
  blockedTimes: readonly TimeRange[];
  actor: ProfileContext;
  target: ProfileContext;
  guardianLinkedToTarget: boolean;
}

const TIME_RE = /^(\d{2}):(\d{2})(?::\d{2})?$/;
function timeOfDayMinutes(s: string): number {
  const m = TIME_RE.exec(s);
  if (!m || m[1] === undefined || m[2] === undefined) throw new Error(`Invalid time: ${s}`);
  return Number.parseInt(m[1], 10) * 60 + Number.parseInt(m[2], 10);
}

function diffMinutes(later: Date, earlier: Date): number {
  return Math.floor((later.getTime() - earlier.getTime()) / 60_000);
}

function ageOn(year: number, ref: Date): number {
  return ref.getFullYear() - year;
}

// ---------------------------------------------------------------------------
// Individual rule predicates. Each returns a Violation or null.
// ---------------------------------------------------------------------------

export function ruleValidTimeRange(b: BookingCandidate): Violation | null {
  if (new Date(b.starts_at) >= new Date(b.ends_at)) {
    return { code: 'INVALID_TIME_RANGE', message: 'starts_at must precede ends_at' };
  }
  return null;
}

export function ruleNotInPast(b: BookingCandidate, ctx: ValidationContext): Violation | null {
  if (new Date(b.starts_at) < ctx.now) {
    return { code: 'PAST_BOOKING', message: 'Cannot book in the past' };
  }
  return null;
}

export function ruleActivityAllowedOnResource(b: BookingCandidate, ctx: ValidationContext): Violation | null {
  const pairKey = `${b.activity_id}::${b.resource_id}`;
  if (!ctx.compatibility.has(pairKey)) {
    return { code: 'ACTIVITY_NOT_ALLOWED_ON_RESOURCE', message: 'Activity not allowed on this resource' };
  }
  return null;
}

export function ruleDurationWithinBounds(b: BookingCandidate, ctx: ValidationContext): Violation | null {
  const minutes = diffMinutes(new Date(b.ends_at), new Date(b.starts_at));
  if (minutes < ctx.activity.min_duration_minutes || minutes > ctx.activity.max_duration_minutes) {
    return { code: 'DURATION_OUT_OF_BOUNDS', message: 'Duration outside activity bounds' };
  }
  return null;
}

export function ruleAgeRestriction(_b: BookingCandidate, ctx: ValidationContext): Violation | null {
  if (ctx.target.birth_year == null) return null;
  const age = ageOn(ctx.target.birth_year, ctx.now);
  if (ctx.activity.min_age != null && age < ctx.activity.min_age) {
    return { code: 'AGE_RESTRICTION', message: 'Below minimum age for activity' };
  }
  if (ctx.activity.max_age != null && age > ctx.activity.max_age) {
    return { code: 'AGE_RESTRICTION', message: 'Above maximum age for activity' };
  }
  return null;
}

export function ruleYouthSelfBook(_b: BookingCandidate, ctx: ValidationContext): Violation | null {
  if (ctx.actor.user_id !== ctx.target.user_id) return null;
  if (ctx.target.birth_year == null) return null;
  const age = ageOn(ctx.target.birth_year, ctx.now);
  if (age < ctx.activity.self_book_min_age) {
    return { code: 'GUARDIAN_REQUIRED', message: 'A guardian must book on behalf of this user' };
  }
  return null;
}

export function ruleAuthorizedActor(_b: BookingCandidate, ctx: ValidationContext): Violation | null {
  if (ctx.actor.user_id === ctx.target.user_id) return null;
  if (!ctx.guardianLinkedToTarget) {
    return { code: 'NOT_AUTHORIZED', message: 'Not authorized to book on behalf of this user' };
  }
  return null;
}

export function ruleSingleDay(b: BookingCandidate, ctx: ValidationContext): Violation | null {
  const startLocal = utcToLocalWallClock(new Date(b.starts_at), ctx.timezone);
  const endLocal   = utcToLocalWallClock(new Date(b.ends_at),   ctx.timezone);
  if (startLocal.year !== endLocal.year
   || startLocal.month !== endLocal.month
   || startLocal.day !== endLocal.day) {
    return { code: 'CROSS_DAY', message: 'Booking must lie within a single day' };
  }
  return null;
}

export function ruleInOpeningHours(b: BookingCandidate, ctx: ValidationContext): Violation | null {
  const startLocal = utcToLocalWallClock(new Date(b.starts_at), ctx.timezone);
  const endLocal   = utcToLocalWallClock(new Date(b.ends_at),   ctx.timezone);

  const startMinutes = startLocal.hour * 60 + startLocal.minute;
  const endMinutes   = endLocal.hour   * 60 + endLocal.minute;

  const window = ctx.openingHours.find(
    (w) =>
      w.weekday === startLocal.weekday
      && timeOfDayMinutes(w.opens_at)  <= startMinutes
      && timeOfDayMinutes(w.closes_at) >= endMinutes,
  );

  if (!window) {
    return { code: 'OUTSIDE_OPENING_HOURS', message: 'Outside opening hours' };
  }
  return null;
}

export function ruleNotBlocked(b: BookingCandidate, ctx: ValidationContext): Violation | null {
  const candidate: TimeRange = { starts_at: b.starts_at, ends_at: b.ends_at };
  if (ctx.blockedTimes.some((blk) => rangesOverlap(candidate, blk))) {
    return { code: 'BLOCKED_TIME', message: 'Booking overlaps a blocked time' };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Aggregate: validate a candidate against all rules.
// ---------------------------------------------------------------------------

const RULES = [
  ruleValidTimeRange,
  ruleSingleDay,
  ruleNotInPast,
  ruleAuthorizedActor,
  ruleActivityAllowedOnResource,
  ruleDurationWithinBounds,
  ruleAgeRestriction,
  ruleYouthSelfBook,
  ruleInOpeningHours,
  ruleNotBlocked,
] as const;

export function validateNewBooking(
  candidate: BookingCandidate,
  ctx: ValidationContext,
): Violation[] {
  const out: Violation[] = [];
  for (const rule of RULES) {
    const v = rule(candidate, ctx);
    if (v) out.push(v);
  }
  return out;
}

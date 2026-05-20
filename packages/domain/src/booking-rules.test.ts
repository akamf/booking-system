import { describe, expect, it } from 'vitest';
import {
  ruleActivityAllowedOnResource,
  ruleAgeRestriction,
  ruleAuthorizedActor,
  ruleDurationWithinBounds,
  ruleInOpeningHours,
  ruleNotBlocked,
  ruleNotInPast,
  ruleSingleDay,
  ruleValidTimeRange,
  ruleYouthSelfBook,
  validateNewBooking,
  type ValidationContext,
} from './booking-rules';

const STK = 'Europe/Stockholm';
const NOW = new Date('2026-05-20T08:00:00Z'); // Wed 10:00 CEST

function baseContext(overrides: Partial<ValidationContext> = {}): ValidationContext {
  return {
    now: NOW,
    timezone: STK,
    activity: {
      min_duration_minutes: 30,
      max_duration_minutes: 180,
      min_age: null,
      max_age: null,
      self_book_min_age: 13,
      cancellation_cutoff_minutes: 120,
    },
    resource: { id: 'r1', location_id: 'l1' },
    compatibility: new Set(['a1::r1']),
    openingHours: [{ weekday: 3, opens_at: '09:00', closes_at: '22:00' }],
    blockedTimes: [],
    actor: { user_id: 'u1', birth_year: 1990 },
    target: { user_id: 'u1', birth_year: 1990 },
    guardianLinkedToTarget: false,
    ...overrides,
  };
}

const validCandidate = {
  resource_id: 'r1',
  activity_id: 'a1',
  starts_at: '2026-05-20T16:00:00Z', // 18:00 CEST Wed
  ends_at: '2026-05-20T17:00:00Z',   // 19:00 CEST Wed
};

describe('individual rules', () => {
  it('ruleValidTimeRange rejects starts >= ends', () => {
    expect(ruleValidTimeRange({ ...validCandidate, ends_at: validCandidate.starts_at })?.code).toBe('INVALID_TIME_RANGE');
  });

  it('ruleNotInPast rejects past bookings', () => {
    expect(
      ruleNotInPast({ ...validCandidate, starts_at: '2020-01-01T00:00:00Z', ends_at: '2020-01-01T01:00:00Z' }, baseContext())?.code,
    ).toBe('PAST_BOOKING');
  });

  it('ruleActivityAllowedOnResource enforces compatibility', () => {
    const ctx = baseContext({ compatibility: new Set() });
    expect(ruleActivityAllowedOnResource(validCandidate, ctx)?.code).toBe('ACTIVITY_NOT_ALLOWED_ON_RESOURCE');
  });

  it('ruleDurationWithinBounds rejects too short or too long', () => {
    const tooShort = { ...validCandidate, ends_at: '2026-05-20T16:15:00Z' };
    expect(ruleDurationWithinBounds(tooShort, baseContext())?.code).toBe('DURATION_OUT_OF_BOUNDS');
    const tooLong = { ...validCandidate, ends_at: '2026-05-20T22:00:00Z' };
    expect(ruleDurationWithinBounds(tooLong, baseContext())?.code).toBe('DURATION_OUT_OF_BOUNDS');
  });

  it('ruleAgeRestriction respects activity min_age', () => {
    const ctx = baseContext({
      activity: { ...baseContext().activity, min_age: 18 },
      target: { user_id: 'u1', birth_year: 2020 },
    });
    expect(ruleAgeRestriction(validCandidate, ctx)?.code).toBe('AGE_RESTRICTION');
  });

  it('ruleYouthSelfBook blocks under-13 self-bookings', () => {
    const ctx = baseContext({ target: { user_id: 'u1', birth_year: 2018 } });
    expect(ruleYouthSelfBook(validCandidate, ctx)?.code).toBe('GUARDIAN_REQUIRED');
  });

  it('ruleAuthorizedActor blocks non-guardian on-behalf-of', () => {
    const ctx = baseContext({
      actor: { user_id: 'u1', birth_year: 1990 },
      target: { user_id: 'u2', birth_year: 2015 },
      guardianLinkedToTarget: false,
    });
    expect(ruleAuthorizedActor(validCandidate, ctx)?.code).toBe('NOT_AUTHORIZED');
  });

  it('ruleSingleDay blocks bookings crossing midnight in location time', () => {
    expect(
      ruleSingleDay(
        { ...validCandidate, starts_at: '2026-05-20T21:30:00Z', ends_at: '2026-05-20T22:30:00Z' },
        baseContext(),
      )?.code,
    ).toBe('CROSS_DAY');
  });

  it('ruleInOpeningHours rejects out-of-window bookings', () => {
    const ctx = baseContext({ openingHours: [{ weekday: 3, opens_at: '09:00', closes_at: '17:00' }] });
    expect(ruleInOpeningHours(validCandidate, ctx)?.code).toBe('OUTSIDE_OPENING_HOURS');
  });

  it('ruleNotBlocked rejects overlap with a blocked time', () => {
    const ctx = baseContext({
      blockedTimes: [{ starts_at: '2026-05-20T16:30:00Z', ends_at: '2026-05-20T17:30:00Z' }],
    });
    expect(ruleNotBlocked(validCandidate, ctx)?.code).toBe('BLOCKED_TIME');
  });
});

describe('validateNewBooking aggregate', () => {
  it('returns no violations for a valid booking', () => {
    expect(validateNewBooking(validCandidate, baseContext())).toEqual([]);
  });

  it('returns multiple violations when several rules fail', () => {
    const bad = { ...validCandidate, ends_at: validCandidate.starts_at, starts_at: '2020-01-01T00:00:00Z' };
    const violations = validateNewBooking(bad, baseContext());
    expect(violations.length).toBeGreaterThanOrEqual(2);
  });
});

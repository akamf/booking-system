import { describe, expect, it } from 'vitest';
import { computeAvailableSlots, findConflicts, rangesOverlap } from './availability';

const STK = 'Europe/Stockholm';

const defaultActivity = {
  default_duration_minutes: 60,
  min_duration_minutes: 30,
};

const openAllDay = [
  { weekday: 0, opens_at: '00:00', closes_at: '23:59' },
  { weekday: 1, opens_at: '00:00', closes_at: '23:59' },
  { weekday: 2, opens_at: '00:00', closes_at: '23:59' },
  { weekday: 3, opens_at: '00:00', closes_at: '23:59' },
  { weekday: 4, opens_at: '00:00', closes_at: '23:59' },
  { weekday: 5, opens_at: '00:00', closes_at: '23:59' },
  { weekday: 6, opens_at: '00:00', closes_at: '23:59' },
];

describe('rangesOverlap', () => {
  it('returns false for back-to-back ranges (shared endpoint)', () => {
    expect(
      rangesOverlap(
        { starts_at: '2026-05-20T10:00:00Z', ends_at: '2026-05-20T11:00:00Z' },
        { starts_at: '2026-05-20T11:00:00Z', ends_at: '2026-05-20T12:00:00Z' },
      ),
    ).toBe(false);
  });

  it('returns true for an overlapping range', () => {
    expect(
      rangesOverlap(
        { starts_at: '2026-05-20T10:00:00Z', ends_at: '2026-05-20T11:00:00Z' },
        { starts_at: '2026-05-20T10:30:00Z', ends_at: '2026-05-20T11:30:00Z' },
      ),
    ).toBe(true);
  });
});

describe('findConflicts', () => {
  it('returns only the ranges that overlap the candidate', () => {
    const candidate = { starts_at: '2026-05-20T10:00:00Z', ends_at: '2026-05-20T11:00:00Z' };
    const ranges = [
      { starts_at: '2026-05-20T09:00:00Z', ends_at: '2026-05-20T10:00:00Z' }, // back-to-back
      { starts_at: '2026-05-20T10:30:00Z', ends_at: '2026-05-20T11:30:00Z' }, // overlaps
      { starts_at: '2026-05-20T12:00:00Z', ends_at: '2026-05-20T13:00:00Z' }, // disjoint
    ];
    expect(findConflicts(candidate, ranges)).toHaveLength(1);
  });
});

describe('computeAvailableSlots', () => {
  it('returns no slots when the day has no opening windows', () => {
    const slots = computeAvailableSlots({
      date: '2026-05-20',
      timezone: STK,
      openingHours: [],
      blockedTimes: [],
      existingBookings: [],
      activity: defaultActivity,
    });
    expect(slots).toEqual([]);
  });

  it('produces slots within opening hours respecting duration', () => {
    const slots = computeAvailableSlots({
      date: '2026-05-20', // Wed
      timezone: STK,
      openingHours: [{ weekday: 3, opens_at: '09:00', closes_at: '12:00' }],
      blockedTimes: [],
      existingBookings: [],
      activity: defaultActivity,
      slotStepMinutes: 30,
    });
    // 09:00, 09:30, 10:00, 10:30, 11:00 → 5 candidates (last fits 11:00–12:00)
    expect(slots).toHaveLength(5);
  });

  it('excludes candidates overlapping an existing booking', () => {
    const slots = computeAvailableSlots({
      date: '2026-05-20',
      timezone: STK,
      openingHours: [{ weekday: 3, opens_at: '09:00', closes_at: '12:00' }],
      blockedTimes: [],
      existingBookings: [
        // 10:00–11:00 Stockholm CEST = 08:00–09:00 UTC
        { starts_at: '2026-05-20T08:00:00Z', ends_at: '2026-05-20T09:00:00Z' },
      ],
      activity: defaultActivity,
      slotStepMinutes: 30,
    });
    // 09:00 starts at 07:00 UTC, ends 08:00 UTC → back-to-back with the booking, allowed.
    // 09:30 starts 07:30 UTC, ends 08:30 UTC → overlaps the booking → blocked.
    // 10:00 starts 08:00 UTC → overlaps → blocked.
    // 10:30 starts 08:30 UTC → overlaps → blocked.
    // 11:00 starts 09:00 UTC, ends 10:00 UTC → back-to-back, allowed.
    expect(slots).toHaveLength(2);
  });

  it('excludes blocked times the same way as bookings', () => {
    const slots = computeAvailableSlots({
      date: '2026-05-20',
      timezone: STK,
      openingHours: [{ weekday: 3, opens_at: '09:00', closes_at: '12:00' }],
      blockedTimes: [
        { starts_at: '2026-05-20T08:00:00Z', ends_at: '2026-05-20T09:00:00Z' },
      ],
      existingBookings: [],
      activity: defaultActivity,
      slotStepMinutes: 30,
    });
    expect(slots).toHaveLength(2);
  });

  it('honors multiple opening windows on the same day', () => {
    const slots = computeAvailableSlots({
      date: '2026-05-20',
      timezone: STK,
      openingHours: [
        { weekday: 3, opens_at: '09:00', closes_at: '11:00' },
        { weekday: 3, opens_at: '14:00', closes_at: '16:00' },
      ],
      blockedTimes: [],
      existingBookings: [],
      activity: defaultActivity,
      slotStepMinutes: 60,
    });
    // 09:00–10:00 and 10:00 → 10:00 fits 10:00-11:00 too, so 2 morning slots.
    // 14:00 → 15:00 and 15:00 → 16:00, so 2 afternoon slots. Total 4.
    expect(slots).toHaveLength(4);
  });
});

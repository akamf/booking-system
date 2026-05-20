import { describe, expect, it } from 'vitest';
import { formatInLocationTime, localWallClockToUtc, utcToLocalWallClock } from './time';

describe('formatInLocationTime', () => {
  it('renders a UTC moment in Stockholm CEST (May, +02:00)', () => {
    const utc = new Date('2026-05-20T16:00:00Z');
    expect(formatInLocationTime(utc, 'Europe/Stockholm', 'HH:mm')).toBe('18:00');
  });

  it('renders a UTC moment in Stockholm CET (January, +01:00)', () => {
    const utc = new Date('2026-01-15T16:00:00Z');
    expect(formatInLocationTime(utc, 'Europe/Stockholm', 'HH:mm')).toBe('17:00');
  });
});

describe('localWallClockToUtc', () => {
  it('round-trips a Stockholm CEST wall-clock through UTC', () => {
    const utc = localWallClockToUtc(
      { year: 2026, month: 5, day: 20, hour: 18, minute: 0 },
      'Europe/Stockholm',
    );
    expect(utc.toISOString()).toBe('2026-05-20T16:00:00.000Z');
  });

  it('handles New York wall-clock conversion', () => {
    const utc = localWallClockToUtc(
      { year: 2026, month: 5, day: 20, hour: 12, minute: 30 },
      'America/New_York',
    );
    expect(utc.toISOString()).toBe('2026-05-20T16:30:00.000Z');
  });
});

describe('utcToLocalWallClock', () => {
  it('reveals the wall-clock weekday and time in the location timezone', () => {
    const utc = new Date('2026-05-20T16:00:00Z'); // Wed in Stockholm CEST
    const local = utcToLocalWallClock(utc, 'Europe/Stockholm');
    expect(local).toEqual({
      year: 2026,
      month: 5,
      day: 20,
      hour: 18,
      minute: 0,
      weekday: 3, // 0 = Sunday → Wednesday = 3
    });
  });
});

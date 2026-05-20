import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

/**
 * Single source of truth for time-zone conversion in the platform.
 *
 * Bookings are stored as `timestamptz` (UTC). Opening hours are stored as
 * wall-clock `time` per location, where each location has an IANA timezone.
 *
 * Every conversion goes through one of these helpers — never call
 * `date-fns-tz` directly from a feature module. If a future migration
 * changes the underlying library, this file is the one we patch.
 */

export type IanaTimeZone = string;

/**
 * Format a UTC moment as a string in the location's timezone.
 *
 * @example
 *   formatInLocationTime(new Date('2026-05-20T16:00:00Z'), 'Europe/Stockholm', 'HH:mm')
 *   // => '18:00'  (CEST in May)
 */
export function formatInLocationTime(utc: Date, timezone: IanaTimeZone, format: string): string {
  return formatInTimeZone(utc, timezone, format);
}

/**
 * Convert a wall-clock moment in the location's timezone into a UTC `Date`.
 *
 * @example
 *   localWallClockToUtc({ year: 2026, month: 5, day: 20, hour: 18, minute: 0 }, 'Europe/Stockholm')
 *   // => Date('2026-05-20T16:00:00Z')
 */
export function localWallClockToUtc(
  parts: { year: number; month: number; day: number; hour: number; minute: number },
  timezone: IanaTimeZone,
): Date {
  const pad = (n: number): string => n.toString().padStart(2, '0');
  const iso = `${parts.year.toString().padStart(4, '0')}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:00`;
  return fromZonedTime(iso, timezone);
}

/**
 * Extract the wall-clock parts of a UTC moment in the location's timezone.
 */
export function utcToLocalWallClock(
  utc: Date,
  timezone: IanaTimeZone,
): { year: number; month: number; day: number; hour: number; minute: number; weekday: number } {
  const zoned = toZonedTime(utc, timezone);
  return {
    year: zoned.getFullYear(),
    month: zoned.getMonth() + 1,
    day: zoned.getDate(),
    hour: zoned.getHours(),
    minute: zoned.getMinutes(),
    weekday: zoned.getDay(),
  };
}

/**
 * Centralized TanStack Query keys.
 *
 * One file, one mental model: every cache entry's key is constructed
 * via a helper here so invalidation in mutations is type-safe.
 */
export const queryKeys = {
  activities: () => ['activities'] as const,
  resources: () => ['resources'] as const,
  resourceCompatibility: (resourceId: string) => ['resource-compatibility', resourceId] as const,
  bookings: () => ['bookings'] as const,
  bookingsForUser: (userId: string) => ['bookings', 'user', userId] as const,
  bookingsForResource: (resourceId: string, date: string) =>
    ['bookings', 'resource', resourceId, date] as const,
  availability: (resourceId: string, activityId: string, date: string) =>
    ['availability', resourceId, activityId, date] as const,
  profile: (userId: string) => ['profile', userId] as const,
  openingHours: (locationId: string) => ['opening-hours', locationId] as const,
  blockedTimes: (locationId: string) => ['blocked-times', locationId] as const,
} as const;

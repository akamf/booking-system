import type { BookingStatus, RoleKey } from '@booking/types';

export interface Viewer {
  user_id: string;
  roles: ReadonlySet<RoleKey>;
}

function hasRole(viewer: Viewer, role: RoleKey): boolean {
  return viewer.roles.has(role);
}

export function isStaff(viewer: Viewer): boolean {
  return hasRole(viewer, 'admin') || hasRole(viewer, 'staff');
}

export function isAdmin(viewer: Viewer): boolean {
  return hasRole(viewer, 'admin');
}

// ---------------------------------------------------------------------------
// canActOnBehalfOf
// ---------------------------------------------------------------------------
export function canActOnBehalfOf(
  viewer: Viewer,
  targetUserId: string,
  ctx: { guardianLinkedToTarget: boolean },
): boolean {
  if (viewer.user_id === targetUserId) return true;
  if (isStaff(viewer)) return true;
  return ctx.guardianLinkedToTarget;
}

// ---------------------------------------------------------------------------
// canBook
// ---------------------------------------------------------------------------
export interface CanBookContext {
  now: Date;
  target: { user_id: string; birth_year: number | null };
  activity: { self_book_min_age: number };
  guardianLinkedToTarget: boolean;
}

export function canBook(viewer: Viewer, ctx: CanBookContext): boolean {
  if (!canActOnBehalfOf(viewer, ctx.target.user_id, ctx)) return false;

  // Staff override the self-book age gate (matches book_resource's path-of-trust)
  if (isStaff(viewer)) return true;

  // Youth self-book gate: when viewer === target and target is under
  // the activity's self_book_min_age, only a guardian can do the booking.
  if (viewer.user_id === ctx.target.user_id && ctx.target.birth_year != null) {
    const age = ctx.now.getFullYear() - ctx.target.birth_year;
    if (age < ctx.activity.self_book_min_age) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// canCancel
// ---------------------------------------------------------------------------
export interface CanCancelContext {
  now: Date;
  booking: {
    booked_by_user_id: string;
    on_behalf_of_user_id: string | null;
    starts_at: string;
    status: BookingStatus;
  };
  activity: { cancellation_cutoff_minutes: number };
  guardianLinkedToTargetUser: boolean;
}

export function canCancel(viewer: Viewer, ctx: CanCancelContext): boolean {
  if (ctx.booking.status === 'cancelled') return false;
  if (ctx.booking.status === 'completed' || ctx.booking.status === 'no_show') return false;

  const isParticipant =
    ctx.booking.booked_by_user_id === viewer.user_id
    || ctx.booking.on_behalf_of_user_id === viewer.user_id
    || (ctx.booking.on_behalf_of_user_id != null && ctx.guardianLinkedToTargetUser);

  if (!isParticipant && !isStaff(viewer)) return false;

  if (isStaff(viewer)) return true;

  const minutesUntil = Math.floor((new Date(ctx.booking.starts_at).getTime() - ctx.now.getTime()) / 60_000);
  return minutesUntil >= ctx.activity.cancellation_cutoff_minutes;
}

// ---------------------------------------------------------------------------
// canOverride — admin/staff only (T19 enforces this in SQL too)
// ---------------------------------------------------------------------------
export function canOverride(viewer: Viewer): boolean {
  return isStaff(viewer);
}

// ---------------------------------------------------------------------------
// canManageResources — admin/staff
// ---------------------------------------------------------------------------
export function canManageResources(viewer: Viewer): boolean {
  return isStaff(viewer);
}

// ---------------------------------------------------------------------------
// canManageUsers — admin only (role assignment is admin-only in SQL)
// ---------------------------------------------------------------------------
export function canManageUsers(viewer: Viewer): boolean {
  return isAdmin(viewer);
}

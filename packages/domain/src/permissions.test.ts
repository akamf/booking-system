import { describe, expect, it } from 'vitest';
import type { RoleKey } from '@booking/types';
import {
  canActOnBehalfOf,
  canBook,
  canCancel,
  canManageResources,
  canManageUsers,
  canOverride,
  isAdmin,
  isStaff,
  type Viewer,
} from './permissions';

function viewer(id: string, roles: readonly RoleKey[]): Viewer {
  return { user_id: id, roles: new Set(roles) };
}

const NOW = new Date('2026-05-20T08:00:00Z');

describe('isStaff / isAdmin', () => {
  it('treats admin as staff', () => {
    expect(isStaff(viewer('u', ['admin']))).toBe(true);
    expect(isAdmin(viewer('u', ['admin']))).toBe(true);
  });
  it('treats staff role as staff but not admin', () => {
    expect(isStaff(viewer('u', ['staff']))).toBe(true);
    expect(isAdmin(viewer('u', ['staff']))).toBe(false);
  });
  it('member is neither', () => {
    expect(isStaff(viewer('u', ['member']))).toBe(false);
    expect(isAdmin(viewer('u', ['member']))).toBe(false);
  });
});

describe('canActOnBehalfOf', () => {
  it('always allowed for self', () => {
    expect(canActOnBehalfOf(viewer('u', ['member']), 'u', { guardianLinkedToTarget: false })).toBe(true);
  });
  it('allowed when guardian-linked to target', () => {
    expect(canActOnBehalfOf(viewer('u', ['guardian']), 'minor', { guardianLinkedToTarget: true })).toBe(true);
  });
  it('denied when not linked and not staff', () => {
    expect(canActOnBehalfOf(viewer('u', ['member']), 'other', { guardianLinkedToTarget: false })).toBe(false);
  });
  it('staff bypasses linkage', () => {
    expect(canActOnBehalfOf(viewer('u', ['staff']), 'other', { guardianLinkedToTarget: false })).toBe(true);
  });
});

describe('canBook', () => {
  const baseCtx = {
    now: NOW,
    target: { user_id: 'u1', birth_year: 1990 },
    activity: { self_book_min_age: 13 },
    guardianLinkedToTarget: false,
  };

  it('adult self-book is allowed', () => {
    expect(canBook(viewer('u1', ['member']), baseCtx)).toBe(true);
  });

  it('under-13 self-book is blocked', () => {
    expect(canBook(viewer('u1', ['member', 'youth']), { ...baseCtx, target: { user_id: 'u1', birth_year: 2018 } })).toBe(false);
  });

  it('guardian booking for under-13 minor is allowed', () => {
    expect(
      canBook(viewer('g1', ['guardian']), {
        ...baseCtx,
        target: { user_id: 'm1', birth_year: 2018 },
        guardianLinkedToTarget: true,
      }),
    ).toBe(true);
  });

  it('staff bypass the self-book age gate', () => {
    expect(canBook(viewer('s1', ['staff']), { ...baseCtx, target: { user_id: 'u1', birth_year: 2018 } })).toBe(true);
  });
});

describe('canCancel', () => {
  const baseBooking = {
    booked_by_user_id: 'u1',
    on_behalf_of_user_id: null,
    starts_at: '2026-05-25T10:00:00Z', // 5 days out
    status: 'confirmed' as const,
  };
  const activity = { cancellation_cutoff_minutes: 120 };

  it('booker can cancel before cutoff', () => {
    expect(
      canCancel(viewer('u1', ['member']), { now: NOW, booking: baseBooking, activity, guardianLinkedToTargetUser: false }),
    ).toBe(true);
  });

  it('booker cannot cancel inside the cutoff', () => {
    const tight = { ...baseBooking, starts_at: '2026-05-20T09:00:00Z' }; // 1h away
    expect(
      canCancel(viewer('u1', ['member']), { now: NOW, booking: tight, activity, guardianLinkedToTargetUser: false }),
    ).toBe(false);
  });

  it('staff cancel any time', () => {
    const tight = { ...baseBooking, starts_at: '2026-05-20T09:00:00Z' };
    expect(
      canCancel(viewer('s1', ['staff']), { now: NOW, booking: tight, activity, guardianLinkedToTargetUser: false }),
    ).toBe(true);
  });

  it('cancelled bookings cannot be cancelled again', () => {
    expect(
      canCancel(viewer('u1', ['member']), {
        now: NOW,
        booking: { ...baseBooking, status: 'cancelled' },
        activity,
        guardianLinkedToTargetUser: false,
      }),
    ).toBe(false);
  });
});

describe('admin gates', () => {
  it('canOverride requires staff', () => {
    expect(canOverride(viewer('u', ['staff']))).toBe(true);
    expect(canOverride(viewer('u', ['member']))).toBe(false);
  });
  it('canManageResources requires staff', () => {
    expect(canManageResources(viewer('u', ['staff']))).toBe(true);
    expect(canManageResources(viewer('u', ['member']))).toBe(false);
  });
  it('canManageUsers requires admin', () => {
    expect(canManageUsers(viewer('u', ['staff']))).toBe(false);
    expect(canManageUsers(viewer('u', ['admin']))).toBe(true);
  });
});

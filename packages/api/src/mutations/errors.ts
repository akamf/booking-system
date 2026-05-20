import { BookingErrorCodeSchema, type BookingErrorCode } from '@booking/types';

/**
 * Typed error class for booking RPC failures.
 *
 * The DB raises with `errcode = 'P0001'` and a stable HINT. Postgrest
 * surfaces that as `{ code: 'P0001', hint: 'TYPED_CODE', message: '…' }`.
 * fromPostgrestError() narrows that into a discriminated `BookingError`.
 */
export class BookingError extends Error {
  public readonly code: BookingErrorCode;

  constructor(code: BookingErrorCode, message: string) {
    super(message);
    this.name = 'BookingError';
    this.code = code;
  }
}

export interface PostgrestLikeError {
  message: string;
  hint?: string | null;
  code?: string | null;
}

export function fromPostgrestError(error: unknown): BookingError | Error {
  if (typeof error !== 'object' || error === null) {
    return new Error('Unknown booking error');
  }
  const e = error as PostgrestLikeError;
  const parsed = BookingErrorCodeSchema.safeParse(e.hint);
  if (parsed.success) {
    return new BookingError(parsed.data, e.message);
  }
  return new Error(e.message);
}

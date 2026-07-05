/**
 * Application error types.
 *
 * Security checklist: "no secret/stack-trace leakage in error responses."
 * Handlers throw these; the central error handler turns them into a generic,
 * client-safe JSON body. Anything that is NOT an AppError is treated as a 500 with
 * a generic message — internal details stay in server logs only.
 *
 * @author Saamarth Attray
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly publicMessage: string;

  constructor(status: number, code: string, publicMessage: string) {
    super(publicMessage);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.publicMessage = publicMessage;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Invalid request') { super(400, 'bad_request', message); }
}
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') { super(401, 'unauthorized', message); }
}
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') { super(403, 'forbidden', message); }
}
/** Use for both "does not exist" and "exists but you do not own it" (avoids IDOR leak). */
export class NotFoundError extends AppError {
  constructor(message = 'Not found') { super(404, 'not_found', message); }
}
export class TooManyRequestsError extends AppError {
  constructor(message = 'Rate limit exceeded') { super(429, 'too_many_requests', message); }
}
export class UpstreamError extends AppError {
  constructor(message = 'Upstream service unavailable') { super(502, 'upstream_error', message); }
}
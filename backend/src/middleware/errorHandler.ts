/**
 * Central error handling.
 *
 * Security checklist: no stack-trace / secret leakage. AppErrors return their safe
 * publicMessage; anything else becomes a generic 500. Full detail is logged with a
 * requestId the client also receives, so support can correlate without exposure.
 *
 * @author Saamarth Attray
 */
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'not_found', message: 'Route not found' } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = randomUUID();

  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error({ requestId, code: err.code, err: err.message }, 'app error');
    } else {
      logger.info({ requestId, code: err.code }, 'client error');
    }
    res.status(err.status).json({ error: { code: err.code, message: err.publicMessage, requestId } });
    return;
  }

  logger.error(
    { requestId, err: err instanceof Error ? err.stack : String(err), path: req.path },
    'unhandled error',
  );
  res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong', requestId } });
}
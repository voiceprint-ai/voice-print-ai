/**
 * Wraps async route handlers so a rejected promise is forwarded to Express's error
 * handler instead of becoming an unhandled rejection.
 * @author Saamarth Attray
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
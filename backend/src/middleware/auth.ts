/**
 * Authentication middleware.
 *
 * The frontend authenticates users with the Firebase Auth client SDK and sends the
 * resulting ID token as `Authorization: Bearer <token>`. We verify it server-side
 * with the Admin SDK on EVERY protected route. checkRevoked=true rejects tokens
 * from disabled/revoked sessions. No/bad/expired token => 401.
 *
 * @author Saamarth Attray
 */
import type { NextFunction, Request, Response } from 'express';
import { auth } from '../config/firebase';
import { UnauthorizedError } from '../lib/errors';
import { logger } from '../lib/logger';

export interface AuthedRequest extends Request {
  uid: string;
  email?: string;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.header('authorization') ?? '';
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match || !match[1]) throw new UnauthorizedError('Missing bearer token');

    const decoded = await auth.verifyIdToken(match[1].trim(), true);
    (req as AuthedRequest).uid = decoded.uid;
    (req as AuthedRequest).email = decoded.email;
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) return next(err);
    logger.debug({ err: String(err) }, 'token verification failed');
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
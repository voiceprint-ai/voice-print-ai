/**
 * Rate limiting.
 *
 * Security checklist: rate limiting on all endpoints (IP-based AND user-based).
 *   - globalLimiter: coarse per-IP cap on the whole API.
 *   - llmLimiter: strict per-authenticated-user cap on the expensive LLM routes,
 *     so one account can't burn the API budget.
 *
 * NOTE: default store is in-memory (correct for one instance). For multi-instance
 * deploys, back these with Redis (rate-limit-redis) so the limit is shared.
 *
 * @author Saamarth Attray
 */
import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import type { AuthedRequest } from './auth';

export const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'too_many_requests', message: 'Rate limit exceeded' } },
});

export const llmLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    // These routes are always behind requireAuth, so uid is present in practice;
    // the IP fallback is just belt-and-suspenders.
    const uid = (req as AuthedRequest).uid;
    return uid ? `u:${uid}` : `ip:${req.ip ?? 'unknown'}`;
  },
  message: {
    error: { code: 'too_many_requests', message: 'Too many analysis requests, slow down' },
  },
});
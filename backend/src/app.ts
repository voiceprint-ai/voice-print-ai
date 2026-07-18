/**
 * Express application assembly.
 *
 * Middleware ORDER is a security control:
 *   1. helmet          — security headers (CSP, HSTS, X-Frame-Options, ...)
 *   2. cors            — strict allowlist, no wildcard, no credentials
 *   3. json body limit — reject oversized payloads early
 *   4. request logging — pino-http (secrets redacted by logger config)
 *   5. global rate limit
 *   6. public routes   — health (no auth)
 *   7. requireAuth     — everything past here needs a valid token
 *   8. authed routes   — LLM routes additionally gated by llmLimiter + quota
 *   9. 404 + error handler
 *
 * @author Saamarth Attray
 */
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { requireAuth } from './middleware/auth';
import { enforceDailyQuota } from './middleware/quota';
import { globalLimiter, llmLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { accountRouter } from './routes/account';
import { analysesRouter } from './routes/analyses';
import { analyzeRouter } from './routes/analyze';
import { healthRouter } from './routes/health';
import { profileRouter } from './routes/profile';
import { projectsRouter } from './routes/projects';
import { rewriteRouter } from './routes/rewrite';
import { samplesRouter } from './routes/samples';

export function createApp(): express.Express {
  const app = express();

  // Behind Cloud Run / a proxy, trust exactly one hop so req.ip is the real client.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
        },
      },
      hsts: { maxAge: 15_552_000, includeSubDomains: true },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      methods: ['GET', 'POST', 'DELETE'],
      allowedHeaders: ['Authorization', 'Content-Type'],
      credentials: false,
      maxAge: 600,
    }),
  );

  app.use(express.json({ limit: '256kb' }));
  app.use(pinoHttp({ logger }));
  app.use(globalLimiter);

  // Public
  app.use('/', healthRouter);

  // Auth gate — everything below requires a verified Firebase ID token.
  app.use('/v1', requireAuth);

  // Non-LLM authed routes
  app.use('/v1', projectsRouter);
  app.use('/v1', samplesRouter);
  app.use('/v1', analysesRouter);
  app.use('/v1', accountRouter);

  // LLM-backed routes: strict per-user limiter + daily spend quota
  app.use('/v1', llmLimiter, enforceDailyQuota, profileRouter);
  app.use('/v1', llmLimiter, enforceDailyQuota, analyzeRouter);
  app.use('/v1', llmLimiter, enforceDailyQuota, rewriteRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
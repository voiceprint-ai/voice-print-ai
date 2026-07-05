/**
 * Liveness/readiness. Public, no auth. Returns no sensitive detail.
 * @author Saamarth Attray
 */
import { Router } from 'express';
import { env } from '../config/env';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', provider: env.LLM_PROVIDER });
});

healthRouter.get('/ready', (_req, res) => {
  res.json({ status: 'ready' });
});
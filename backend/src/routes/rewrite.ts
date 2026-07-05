/**
 * Voice-matched rewrite route (LLM-backed; guarded by LLM limiter + daily quota).
 * @author Saamarth Attray
 */
import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { parseBody, parseParams } from '../lib/validate';
import type { AuthedRequest } from '../middleware/auth';
import { ProjectIdParams, RewriteBody } from '../schemas/requests';
import * as projects from '../domain/projects.repo';
import { rewrite } from '../domain/analysis.service';

export const rewriteRouter = Router();

rewriteRouter.post(
  '/projects/:projectId/rewrite',
  asyncHandler(async (req, res) => {
    const { uid } = req as AuthedRequest;
    const { projectId } = parseParams(ProjectIdParams, req.params);
    const { target, instructions } = parseBody(RewriteBody, req.body);
    const project = await projects.requireOwned(uid, projectId);
    const result = await rewrite(project, target, instructions);
    res.json({ result });
  }),
);
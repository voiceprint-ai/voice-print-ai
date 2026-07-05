/**
 * Consistency-scoring route (LLM-backed; guarded by LLM limiter + daily quota).
 * @author Saamarth Attray
 */
import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { parseBody, parseParams } from '../lib/validate';
import type { AuthedRequest } from '../middleware/auth';
import { AnalyzeBody, ProjectIdParams } from '../schemas/requests';
import * as projects from '../domain/projects.repo';
import { analyze } from '../domain/analysis.service';

export const analyzeRouter = Router();

analyzeRouter.post(
  '/projects/:projectId/analyze',
  asyncHandler(async (req, res) => {
    const { uid } = req as AuthedRequest;
    const { projectId } = parseParams(ProjectIdParams, req.params);
    const { target } = parseBody(AnalyzeBody, req.body);
    const project = await projects.requireOwned(uid, projectId);
    const result = await analyze(project, target);
    res.json({ result });
  }),
);
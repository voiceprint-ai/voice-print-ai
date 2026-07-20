/**
 * Analysis history route. Returns the stored analysis records for a project.
 * Non-LLM route — no LLM limiter or quota needed.
 * @author Saamarth Attray
 */
import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { parseParams } from '../lib/validate';
import type { AuthedRequest } from '../middleware/auth';
import { ProjectIdParams } from '../schemas/requests';
import * as projects from '../domain/projects.repo';
import { listAnalyses } from '../domain/analyses.repo';

export const analysesRouter = Router();

analysesRouter.get(
  '/projects/:projectId/analyses',
  asyncHandler(async (req, res) => {
    const { uid } = req as AuthedRequest;
    const { projectId } = parseParams(ProjectIdParams, req.params);
    await projects.requireOwned(uid, projectId);
    const analyses = await listAnalyses(projectId);
    res.json({ analyses });
  }),
);

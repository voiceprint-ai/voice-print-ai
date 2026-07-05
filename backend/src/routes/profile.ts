/**
 * Voice-profile routes. Generation is LLM-backed, so it sits behind the strict LLM
 * rate limiter and the per-user daily quota (wired in app.ts).
 * @author Saamarth Attray
 */
import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { parseParams } from '../lib/validate';
import type { AuthedRequest } from '../middleware/auth';
import { ProjectIdParams } from '../schemas/requests';
import * as projects from '../domain/projects.repo';
import { generateProfile } from '../domain/voiceProfile.service';

export const profileRouter = Router();

profileRouter.post(
  '/projects/:projectId/profile',
  asyncHandler(async (req, res) => {
    const { uid } = req as AuthedRequest;
    const { projectId } = parseParams(ProjectIdParams, req.params);
    await projects.requireOwned(uid, projectId);
    const profile = await generateProfile(projectId);
    res.json({ profile });
  }),
);

profileRouter.get(
  '/projects/:projectId/profile',
  asyncHandler(async (req, res) => {
    const { uid } = req as AuthedRequest;
    const { projectId } = parseParams(ProjectIdParams, req.params);
    const project = await projects.requireOwned(uid, projectId);
    res.json({ profile: project.voiceProfile });
  }),
);
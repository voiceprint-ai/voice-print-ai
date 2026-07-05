/**
 * Reference-sample routes. Ownership checked via requireOwned before any access to
 * the sample subcollection.
 * @author Saamarth Attray
 */
import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { parseBody, parseParams } from '../lib/validate';
import type { AuthedRequest } from '../middleware/auth';
import { AddSampleBody, ProjectIdParams, SampleIdParams } from '../schemas/requests';
import * as projects from '../domain/projects.repo';
import * as samples from '../domain/samples.repo';

export const samplesRouter = Router();

samplesRouter.post(
  '/projects/:projectId/samples',
  asyncHandler(async (req, res) => {
    const { uid } = req as AuthedRequest;
    const { projectId } = parseParams(ProjectIdParams, req.params);
    const { title, text } = parseBody(AddSampleBody, req.body);
    await projects.requireOwned(uid, projectId);
    const sample = await samples.addSample(projectId, title, text);
    await projects.touch(projectId, 1);
    res.status(201).json({ sample });
  }),
);

samplesRouter.get(
  '/projects/:projectId/samples',
  asyncHandler(async (req, res) => {
    const { uid } = req as AuthedRequest;
    const { projectId } = parseParams(ProjectIdParams, req.params);
    await projects.requireOwned(uid, projectId);
    const list = await samples.listSamples(projectId);
    res.json({ samples: list });
  }),
);

samplesRouter.delete(
  '/projects/:projectId/samples/:sampleId',
  asyncHandler(async (req, res) => {
    const { uid } = req as AuthedRequest;
    const { projectId, sampleId } = parseParams(SampleIdParams, req.params);
    await projects.requireOwned(uid, projectId);
    await samples.deleteSample(projectId, sampleId);
    await projects.touch(projectId, -1);
    res.status(204).send();
  }),
);
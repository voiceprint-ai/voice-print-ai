/**
 * Project routes. All require auth; all ownership-scoped.
 * @author Saamarth Attray
 */
import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { parseBody, parseParams } from '../lib/validate';
import type { AuthedRequest } from '../middleware/auth';
import { CreateProjectBody, ProjectIdParams } from '../schemas/requests';
import * as projects from '../domain/projects.repo';

export const projectsRouter = Router();

projectsRouter.post(
  '/projects',
  asyncHandler(async (req, res) => {
    const { uid } = req as AuthedRequest;
    const { name } = parseBody(CreateProjectBody, req.body);
    const project = await projects.createProject(uid, name);
    res.status(201).json({ project });
  }),
);

projectsRouter.get(
  '/projects',
  asyncHandler(async (req, res) => {
    const { uid } = req as AuthedRequest;
    const list = await projects.listProjects(uid);
    res.json({ projects: list });
  }),
);

projectsRouter.get(
  '/projects/:projectId',
  asyncHandler(async (req, res) => {
    const { uid } = req as AuthedRequest;
    const { projectId } = parseParams(ProjectIdParams, req.params);
    const project = await projects.requireOwned(uid, projectId);
    res.json({ project });
  }),
);

projectsRouter.delete(
  '/projects/:projectId',
  asyncHandler(async (req, res) => {
    const { uid } = req as AuthedRequest;
    const { projectId } = parseParams(ProjectIdParams, req.params);
    await projects.requireOwned(uid, projectId);
    await projects.deleteProject(projectId);
    res.status(204).send();
  }),
);
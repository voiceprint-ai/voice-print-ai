/**
 * Account data deletion — self-serve GDPR-style erasure.
 * Closes a gap the Canary audit flagged. Wipes every project owned by the caller
 * (and their subcollections) plus their usage counters. uid comes from the verified
 * token, so a caller can only ever erase their OWN data.
 * @author Saamarth Attray
 */
import { Router } from 'express';
import { firestore } from '../config/firebase';
import { asyncHandler } from '../lib/asyncHandler';
import { logger } from '../lib/logger';
import type { AuthedRequest } from '../middleware/auth';
import * as projects from '../domain/projects.repo';

export const accountRouter = Router();

accountRouter.delete(
  '/account/data',
  asyncHandler(async (req, res) => {
    const { uid } = req as AuthedRequest;

    const owned = await projects.listProjects(uid);
    for (const p of owned) {
      await projects.deleteProject(p.id);
    }
    await firestore.recursiveDelete(firestore.collection('usage').doc(uid));

    logger.info({ uid, deletedProjects: owned.length }, 'account data erased');
    res.json({ deleted: { projects: owned.length } });
  }),
);
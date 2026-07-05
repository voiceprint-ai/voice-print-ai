/**
 * Per-user daily LLM quota.
 *
 * Security checklist: "set hard caps on paid APIs." Rate limiting caps burst; this
 * caps total daily spend per user. Each LLM-backed op atomically increments a
 * per-user, per-day counter in Firestore; over the cap => 429.
 *
 * @author Saamarth Attray
 */
import type { NextFunction, Request, Response } from 'express';
import { FieldValue, firestore } from '../config/firebase';
import { env } from '../config/env';
import { TooManyRequestsError } from '../lib/errors';
import type { AuthedRequest } from './auth';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

export async function enforceDailyQuota(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const { uid } = req as AuthedRequest;
    const ref = firestore.collection('usage').doc(uid).collection('daily').doc(todayKey());

    const count = await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const current = (snap.exists ? (snap.data()?.count as number) : 0) ?? 0;
      if (current >= env.DAILY_LLM_QUOTA_PER_USER) return -1;
      tx.set(
        ref,
        { count: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
      return current + 1;
    });

    if (count === -1) {
      throw new TooManyRequestsError('Daily analysis limit reached. Try again tomorrow.');
    }
    next();
  } catch (err) {
    next(err);
  }
}
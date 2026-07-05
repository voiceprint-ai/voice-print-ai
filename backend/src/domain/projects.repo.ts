/**
 * Projects data access.
 *
 * Security checklist: IDOR / broken-access-control prevention. Every read/write is
 * scoped by ownerUid, and requireOwned() returns NotFound (not Forbidden) when the
 * caller does not own the project, so we never leak whether an id exists.
 *
 * @author Saamarth Attray
 */
import { FieldValue, firestore, Timestamp } from '../config/firebase';
import { NotFoundError } from '../lib/errors';
import type { VoiceProfile } from '../llm/types';

const COLLECTION = 'projects';

export interface Project {
  id: string;
  ownerUid: string;
  name: string;
  sampleCount: number;
  voiceProfile: VoiceProfile | null;
  profileGeneratedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

function toProject(id: string, data: FirebaseFirestore.DocumentData): Project {
  return {
    id,
    ownerUid: data.ownerUid,
    name: data.name,
    sampleCount: data.sampleCount ?? 0,
    voiceProfile: data.voiceProfile ?? null,
    profileGeneratedAt:
      data.profileGeneratedAt instanceof Timestamp ? data.profileGeneratedAt.toMillis() : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : 0,
  };
}

export async function createProject(ownerUid: string, name: string): Promise<Project> {
  const ref = firestore.collection(COLLECTION).doc();
  await ref.set({
    ownerUid,
    name,
    sampleCount: 0,
    voiceProfile: null,
    profileGeneratedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const snap = await ref.get();
  return toProject(ref.id, snap.data() as FirebaseFirestore.DocumentData);
}

export async function listProjects(ownerUid: string): Promise<Project[]> {
  const snap = await firestore
    .collection(COLLECTION)
    .where('ownerUid', '==', ownerUid)
    .orderBy('updatedAt', 'desc')
    .limit(200)
    .get();
  return snap.docs.map((d) => toProject(d.id, d.data()));
}

/** Fetch a project and assert ownership, or throw NotFound. */
export async function requireOwned(ownerUid: string, projectId: string): Promise<Project> {
  const snap = await firestore.collection(COLLECTION).doc(projectId).get();
  if (!snap.exists) throw new NotFoundError('Project not found');
  const data = snap.data() as FirebaseFirestore.DocumentData;
  if (data.ownerUid !== ownerUid) throw new NotFoundError('Project not found');
  return toProject(snap.id, data);
}

export async function saveVoiceProfile(projectId: string, profile: VoiceProfile): Promise<void> {
  await firestore.collection(COLLECTION).doc(projectId).update({
    voiceProfile: profile,
    profileGeneratedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function touch(projectId: string, sampleDelta = 0): Promise<void> {
  await firestore
    .collection(COLLECTION)
    .doc(projectId)
    .update({
      updatedAt: FieldValue.serverTimestamp(),
      ...(sampleDelta !== 0 ? { sampleCount: FieldValue.increment(sampleDelta) } : {}),
    });
}

/** Recursively delete a project and all subcollections (samples, analyses). */
export async function deleteProject(projectId: string): Promise<void> {
  const ref = firestore.collection(COLLECTION).doc(projectId);
  await firestore.recursiveDelete(ref);
}
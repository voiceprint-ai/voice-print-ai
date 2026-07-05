/**
 * Reference-sample data access. Samples live in a subcollection under each project
 * (one doc per sample) to stay clear of the Firestore 1MB per-document cap no matter
 * how many samples accumulate.
 * @author Saamarth Attray
 */
import { FieldValue, firestore, Timestamp } from '../config/firebase';
import { NotFoundError } from '../lib/errors';

const PROJECTS = 'projects';
const SAMPLES = 'samples';

export interface Sample {
  id: string;
  title: string;
  text: string;
  charCount: number;
  createdAt: number;
}

function samplesRef(projectId: string): FirebaseFirestore.CollectionReference {
  return firestore.collection(PROJECTS).doc(projectId).collection(SAMPLES);
}

function toSample(id: string, data: FirebaseFirestore.DocumentData): Sample {
  return {
    id,
    title: data.title,
    text: data.text,
    charCount: data.charCount ?? (data.text?.length ?? 0),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0,
  };
}

export async function addSample(projectId: string, title: string, text: string): Promise<Sample> {
  const ref = samplesRef(projectId).doc();
  await ref.set({ title, text, charCount: text.length, createdAt: FieldValue.serverTimestamp() });
  const snap = await ref.get();
  return toSample(ref.id, snap.data() as FirebaseFirestore.DocumentData);
}

export async function listSamples(projectId: string): Promise<Sample[]> {
  const snap = await samplesRef(projectId).orderBy('createdAt', 'asc').limit(500).get();
  return snap.docs.map((d) => toSample(d.id, d.data()));
}

export async function deleteSample(projectId: string, sampleId: string): Promise<void> {
  const ref = samplesRef(projectId).doc(sampleId);
  const snap = await ref.get();
  if (!snap.exists) throw new NotFoundError('Sample not found');
  await ref.delete();
}

export async function countSamples(projectId: string): Promise<number> {
  const agg = await samplesRef(projectId).count().get();
  return agg.data().count;
}
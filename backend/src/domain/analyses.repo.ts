/**
 * Analysis history. Stores only a short preview of the scored target (not the full
 * text) plus the structured result — minimal data retention by design.
 * @author Saamarth Attray
 */
import { FieldValue, firestore, Timestamp } from '../config/firebase';
import type { AnalysisResult } from '../llm/types';

const PROJECTS = 'projects';
const ANALYSES = 'analyses';

export interface AnalysisRecord {
  id: string;
  targetPreview: string;
  result: AnalysisResult;
  createdAt: number;
}

function ref(projectId: string): FirebaseFirestore.CollectionReference {
  return firestore.collection(PROJECTS).doc(projectId).collection(ANALYSES);
}

export async function recordAnalysis(
  projectId: string,
  target: string,
  result: AnalysisResult,
): Promise<AnalysisRecord> {
  const doc = ref(projectId).doc();
  const targetPreview = target.slice(0, 240);
  await doc.set({ targetPreview, result, createdAt: FieldValue.serverTimestamp() });
  return { id: doc.id, targetPreview, result, createdAt: Date.now() };
}

export async function listAnalyses(projectId: string): Promise<AnalysisRecord[]> {
  const snap = await ref(projectId).orderBy('createdAt', 'desc').limit(50).get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      targetPreview: data.targetPreview,
      result: data.result,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0,
    };
  });
}
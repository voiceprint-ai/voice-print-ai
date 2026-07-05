/**
 * Scoring + rewrite orchestration. Requires a project to already have a cached
 * voice profile (generate one first), then scores or rewrites a target draft.
 * @author Saamarth Attray
 */
import { BadRequestError } from '../lib/errors';
import { getLlm } from '../llm/provider';
import type { AnalysisResult, RewriteResult } from '../llm/types';
import * as analyses from './analyses.repo';
import type { Project } from './projects.repo';

export async function analyze(project: Project, target: string): Promise<AnalysisResult> {
  if (!project.voiceProfile) {
    throw new BadRequestError('This project has no voice profile yet. Generate one first.');
  }
  const result = await getLlm().scoreConsistency(project.voiceProfile, target);
  await analyses.recordAnalysis(project.id, target, result);
  return result;
}

export async function rewrite(project: Project, target: string, instructions?: string): Promise<RewriteResult> {
  if (!project.voiceProfile) {
    throw new BadRequestError('This project has no voice profile yet. Generate one first.');
  }
  return getLlm().rewrite(project.voiceProfile, target, instructions);
}
/**
 * Voice-profile orchestration: gather a project's reference samples, enforce the
 * size/count caps, call the LLM to distill a profile, and cache it on the project.
 * @author Saamarth Attray
 */
import { env } from '../config/env';
import { BadRequestError } from '../lib/errors';
import { getLlm } from '../llm/provider';
import type { VoiceProfile } from '../llm/types';
import * as projects from './projects.repo';
import * as samples from './samples.repo';

export async function generateProfile(projectId: string): Promise<VoiceProfile> {
  const all = await samples.listSamples(projectId);
  if (all.length === 0) {
    throw new BadRequestError('Add at least one reference sample before generating a profile');
  }
  if (all.length > env.MAX_SAMPLES_PER_PROFILE) {
    throw new BadRequestError(`Too many samples (${all.length}); max ${env.MAX_SAMPLES_PER_PROFILE}`);
  }

  const texts = all.map((s) => s.text);
  const profile = await getLlm().generateVoiceProfile(texts);
  await projects.saveVoiceProfile(projectId, profile);
  return profile;
}
/**
 * Mock provider — deterministic, offline, zero-cost.
 * Lets teammates run the full backend without an API key and without burning spend,
 * and gives tests a stable oracle.
 * @author Saamarth Attray
 */
import type { AnalysisResult, LlmProvider, RewriteResult, VoiceProfile } from './types';

function avgSentenceLen(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter(Boolean).length;
  return sentences.length ? Math.round(words / sentences.length) : words;
}

export class MockProvider implements LlmProvider {
  readonly name = 'mock';

  async generateVoiceProfile(samples: string[]): Promise<VoiceProfile> {
    const joined = samples.join(' ');
    const len = avgSentenceLen(joined);
    return {
      summary: `[mock] Voice built from ${samples.length} sample(s); avg ~${len} words/sentence.`,
      tone: len > 22 ? 'measured, expository' : 'direct, conversational',
      sentenceStructure: len > 22 ? 'longer, subordinate-clause heavy' : 'short and punchy',
      vocabulary: 'general; no strong jargon detected (mock heuristic)',
      quirks: ['[mock] uses em-dashes', '[mock] favors concrete examples'],
      avoids: ['[mock] avoids filler openers'],
    };
  }

  async scoreConsistency(profile: VoiceProfile, target: string): Promise<AnalysisResult> {
    const base = 60 + (target.length % 35);
    const clamp = (n: number): number => Math.max(0, Math.min(100, n));
    return {
      overallScore: clamp(base),
      dimensions: {
        tone: clamp(base + 5),
        sentenceStructure: clamp(base - 4),
        vocabulary: clamp(base + 2),
        quirks: clamp(base - 8),
      },
      driftNotes: ['[mock] target is longer/shorter than the profile baseline'],
      summary: `[mock] Consistency ~${clamp(base)} against "${profile.tone}" voice.`,
    };
  }

  async rewrite(_profile: VoiceProfile, target: string, _instructions?: string): Promise<RewriteResult> {
    return {
      rewritten: `[mock rewrite] ${target}`,
      changeNotes: ['[mock] no real changes applied — mock provider is active'],
    };
  }
}
/**
 * Voice-analysis domain types and the LLM provider contract.
 * Swapping Anthropic for IBM watsonx/Granite, OpenAI, or a local model is a single
 * new file implementing LlmProvider.
 * @author Saamarth Attray
 */

/** A distilled, cache-able characterization of a writer's voice. */
export interface VoiceProfile {
  summary: string;
  tone: string;
  sentenceStructure: string;
  vocabulary: string;
  quirks: string[];
  avoids: string[];
}

/** Per-dimension consistency scoring of a target draft vs. the profile. */
export interface AnalysisResult {
  overallScore: number; // 0-100, higher = more "them"
  dimensions: {
    tone: number;
    sentenceStructure: number;
    vocabulary: number;
    quirks: number;
  };
  driftNotes: string[];
  summary: string;
}

export interface RewriteResult {
  rewritten: string;
  changeNotes: string[];
}

export interface LlmProvider {
  readonly name: string;
  generateVoiceProfile(samples: string[]): Promise<VoiceProfile>;
  scoreConsistency(profile: VoiceProfile, target: string): Promise<AnalysisResult>;
  rewrite(profile: VoiceProfile, target: string, instructions?: string): Promise<RewriteResult>;
}
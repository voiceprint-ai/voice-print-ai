/**
 * Anthropic (Claude) provider.
 *
 * Closes a Canary gap: transient upstream failures are retried with exponential
 * backoff + jitter, and calls are bounded by a timeout. The API key is read only
 * from validated env and never logged or returned. Model JSON is validated against
 * Zod before use. To swap in IBM watsonx/Granite or OpenAI, implement LlmProvider
 * the same way and register it in provider.ts.
 *
 * @author Saamarth Attray
 */
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { UpstreamError } from '../lib/errors';
import { AnalysisResultSchema, RewriteResultSchema, VoiceProfileSchema } from './schema';
import { analyzePrompt, profilePrompt, rewritePrompt, SYSTEM_ANALYST } from './prompts';
import type { AnalysisResult, LlmProvider, RewriteResult, VoiceProfile } from './types';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 400;
const CALL_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_TOKENS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new UpstreamError('Model did not return JSON');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

export class AnthropicProvider implements LlmProvider {
  readonly name = 'anthropic';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY as string });
  }

  private async complete(system: string, prompt: string): Promise<string> {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        const res = await this.client.messages.create(
          {
            model: env.ANTHROPIC_MODEL,
            max_tokens: MAX_OUTPUT_TOKENS,
            system,
            messages: [{ role: 'user', content: prompt }],
          },
          { timeout: CALL_TIMEOUT_MS },
        );
        const text = res.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('\n');
        if (!text.trim()) throw new UpstreamError('Empty model response');
        return text;
      } catch (err) {
        lastErr = err;
        const status = (err as { status?: number }).status;
        const retriable = status === undefined || status === 429 || status >= 500;
        if (!retriable || attempt === MAX_RETRIES) break;
        const delay = BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 200);
        logger.warn({ attempt, status, delay }, 'LLM call failed, retrying');
        await sleep(delay);
      }
    }
    logger.error({ err: String(lastErr) }, 'LLM call exhausted retries');
    throw new UpstreamError('The analysis service is temporarily unavailable');
  }

  async generateVoiceProfile(samples: string[]): Promise<VoiceProfile> {
    const text = await this.complete(SYSTEM_ANALYST, profilePrompt(samples));
    return VoiceProfileSchema.parse(extractJson(text));
  }

  async scoreConsistency(profile: VoiceProfile, target: string): Promise<AnalysisResult> {
    const text = await this.complete(SYSTEM_ANALYST, analyzePrompt(profile, target));
    return AnalysisResultSchema.parse(extractJson(text));
  }

  async rewrite(profile: VoiceProfile, target: string, instructions?: string): Promise<RewriteResult> {
    const text = await this.complete(SYSTEM_ANALYST, rewritePrompt(profile, target, instructions));
    return RewriteResultSchema.parse(extractJson(text));
  }
}
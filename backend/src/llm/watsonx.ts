/**
 * IBM watsonx.ai provider (Granite and other watsonx-hosted models).
 *
 * Auth is two-step: exchange the long-lived WATSONX_API_KEY for a short-lived
 * IAM bearer token (~1hr), then call the chat inference endpoint with that
 * token. The IAM token is cached in memory and refreshed shortly before it
 * expires, so we're not re-authenticating on every request.
 *
 * API reference (verified against IBM's own docs, July 2026):
 *   Auth:  POST https://iam.cloud.ibm.com/identity/token
 *          (form-encoded: grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=...)
 *   Chat:  POST {WATSONX_URL}/ml/v1/text/chat?version=2024-05-31
 *          body: { model_id, project_id, messages, parameters }
 *
 * Same retry/backoff + output-validation approach as the Anthropic provider,
 * so swapping between them doesn't change any reliability behavior.
 *
 * @author Saamarth Attray
 */
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { UpstreamError } from '../lib/errors';
import { extractJson } from './jsonExtract';
import { AnalysisResultSchema, RewriteResultSchema, VoiceProfileSchema } from './schema';
import { analyzePrompt, profilePrompt, rewritePrompt, SYSTEM_ANALYST } from './prompts';
import type { AnalysisResult, LlmProvider, RewriteResult, VoiceProfile } from './types';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 400;
const CALL_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_TOKENS = 1500;
const API_VERSION = '2024-05-31';
const IAM_URL = 'https://iam.cloud.ibm.com/identity/token';
// Refresh the IAM token this many seconds before it actually expires.
const TOKEN_REFRESH_MARGIN_S = 120;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface WatsonxChatResponse {
  choices?: Array<{
    message?: { role?: string; content?: string | Array<{ type?: string; text?: string }> };
  }>;
}

interface IamTokenResponse {
  access_token?: string;
  expires_in?: number;
  errorMessage?: string;
}

export class WatsonxProvider implements LlmProvider {
  readonly name = 'watsonx';

  private cachedToken: { value: string; expiresAtMs: number } | null = null;

  private async getIamToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAtMs) {
      return this.cachedToken.value;
    }

    const res = await fetch(IAM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
        apikey: env.WATSONX_API_KEY as string,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as IamTokenResponse;
    if (!res.ok || !data.access_token) {
      logger.error({ status: res.status }, 'watsonx IAM token exchange failed');
      throw new UpstreamError('Could not authenticate with the analysis service');
    }

    const expiresInS = data.expires_in ?? 3600;
    this.cachedToken = {
      value: data.access_token,
      expiresAtMs: Date.now() + Math.max(30, expiresInS - TOKEN_REFRESH_MARGIN_S) * 1000,
    };
    return this.cachedToken.value;
  }

  private async complete(system: string, prompt: string): Promise<string> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      let res: Response;
      try {
        const token = await this.getIamToken();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);
        try {
          res = await fetch(`${env.WATSONX_URL}/ml/v1/text/chat?version=${API_VERSION}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              model_id: env.WATSONX_MODEL_ID,
              project_id: env.WATSONX_PROJECT_ID,
              messages: [
                { role: 'system', content: system },
                { role: 'user', content: [{ type: 'text', text: prompt }] },
              ],
              parameters: { max_new_tokens: MAX_OUTPUT_TOKENS, time_limit: CALL_TIMEOUT_MS },
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }
      } catch (err) {
        // Network-level failure (DNS, connection reset, timeout/abort) — retry.
        if (attempt === MAX_RETRIES) {
          logger.error({ err: String(err) }, 'watsonx network error, exhausted retries');
          throw new UpstreamError('The analysis service is temporarily unavailable');
        }
        const delay = BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 200);
        logger.warn({ attempt, err: String(err), delay }, 'watsonx network error, retrying');
        await sleep(delay);
        continue;
      }

      if (res.ok) {
        const data = (await res.json()) as WatsonxChatResponse;
        const content = data.choices?.[0]?.message?.content;
        const text = Array.isArray(content)
          ? content
              .filter((b) => b.type === 'text' && typeof b.text === 'string')
              .map((b) => b.text)
              .join('\n')
          : (content ?? '');

        if (!text.trim()) throw new UpstreamError('Empty model response');
        return text;
      }

      // Non-OK response — read the body once for diagnostics. Never shown to
      // the client; logged so we can see IBM's actual error message.
      const status = res.status;
      const bodyText = await res.text().catch(() => '');
      const retriable = status === 429 || status >= 500;

      if (!retriable || attempt === MAX_RETRIES) {
        logger.error({ status, body: bodyText.slice(0, 2000) }, 'watsonx chat call failed');
        throw new UpstreamError('The analysis service is temporarily unavailable');
      }

      const delay = BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 200);
      logger.warn(
        { attempt, status, body: bodyText.slice(0, 2000), delay },
        'watsonx call failed, retrying',
      );
      await sleep(delay);
    }

    // Unreachable in practice (the loop always throws or returns above), but
    // keeps TypeScript happy about every code path returning/throwing.
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

  async rewrite(
    profile: VoiceProfile,
    target: string,
    instructions?: string,
  ): Promise<RewriteResult> {
    const text = await this.complete(SYSTEM_ANALYST, rewritePrompt(profile, target, instructions));
    return RewriteResultSchema.parse(extractJson(text));
  }
}
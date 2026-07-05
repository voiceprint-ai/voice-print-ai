/**
 * Shared across LLM providers: pull the first top-level JSON object out of a raw
 * model text response. Model output is untrusted input — callers must still run
 * this through a Zod schema before trusting any field (see schema.ts).
 * @author Saamarth Attray
 */
import { UpstreamError } from '../lib/errors';

export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new UpstreamError('Model did not return JSON');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}
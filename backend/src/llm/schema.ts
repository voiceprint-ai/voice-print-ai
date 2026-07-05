/**
 * Schemas for LLM-produced JSON.
 *
 * Model output is UNTRUSTED input just like user input. We never JSON.parse and
 * use it directly — every field is validated and clamped here first. Scores are
 * coerced into 0-100 so a malformed model response can't poison the UI.
 *
 * @author Saamarth Attray
 */
import { z } from 'zod';

const shortStr = z.string().min(1).max(2000);
const strList = z.array(z.string().min(1).max(2000)).max(30).default([]);
const score = z.coerce.number().min(0).max(100).catch(0);

export const VoiceProfileSchema = z.object({
  summary: shortStr,
  tone: shortStr,
  sentenceStructure: shortStr,
  vocabulary: shortStr,
  quirks: strList,
  avoids: strList,
});

export const AnalysisResultSchema = z.object({
  overallScore: score,
  dimensions: z.object({
    tone: score,
    sentenceStructure: score,
    vocabulary: score,
    quirks: score,
  }),
  driftNotes: strList,
  summary: shortStr,
});

export const RewriteResultSchema = z.object({
  rewritten: z.string().min(1).max(100_000),
  changeNotes: strList,
});
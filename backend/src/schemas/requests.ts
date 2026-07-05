/**
 * Request schemas. Central place for every input bound.
 * Security checklist: validate type, length, format, and range on every field.
 * @author Saamarth Attray
 */
import { z } from 'zod';
import { env } from '../config/env';

const id = z.string().regex(/^[A-Za-z0-9_-]{6,64}$/, 'Invalid id');

export const ProjectIdParams = z.object({ projectId: id });
export const SampleIdParams = z.object({ projectId: id, sampleId: id });

export const CreateProjectBody = z.object({
  name: z.string().trim().min(1, 'name is required').max(120),
});

export const AddSampleBody = z.object({
  title: z.string().trim().min(1).max(200),
  text: z
    .string()
    .min(1, 'text is required')
    .max(env.MAX_SAMPLE_CHARS, `text exceeds ${env.MAX_SAMPLE_CHARS} characters`),
});

export const AnalyzeBody = z.object({
  target: z
    .string()
    .min(1, 'target is required')
    .max(env.MAX_TARGET_CHARS, `target exceeds ${env.MAX_TARGET_CHARS} characters`),
});

export const RewriteBody = z.object({
  target: z
    .string()
    .min(1, 'target is required')
    .max(env.MAX_TARGET_CHARS, `target exceeds ${env.MAX_TARGET_CHARS} characters`),
  instructions: z.string().trim().max(500).optional(),
});
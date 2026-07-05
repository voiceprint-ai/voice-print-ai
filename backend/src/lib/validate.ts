/**
 * Request validation helpers.
 *
 * Security checklist: "input validation on every user-facing field."
 * Every route parses its body/params through a Zod schema before any logic runs.
 *
 * @author Saamarth Attray
 */
import type { ZodType } from 'zod';
import { BadRequestError } from './errors';

export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const msg = result.error.issues
      .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
      .join('; ');
    throw new BadRequestError(msg);
  }
  return result.data;
}

export function parseParams<T>(schema: ZodType<T>, params: unknown): T {
  const result = schema.safeParse(params);
  if (!result.success) throw new BadRequestError('Invalid path parameter');
  return result.data;
}
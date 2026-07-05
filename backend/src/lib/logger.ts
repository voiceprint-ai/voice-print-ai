/**
 * Structured logger.
 *
 * Security checklist: "Remove secrets from logs and error messages."
 * Redaction is configured centrally so Authorization headers, cookies, API keys,
 * and raw user text never land in logs. We log metadata (lengths, ids), not content.
 *
 * @author Saamarth Attray
 */
import pino from 'pino';
import { env, isProd } from '../config/env';

export const logger = pino({
  level: isProd ? 'info' : 'debug',
  base: { service: 'voiceprint-backend' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.text',
      'req.body.target',
      'req.body.samples',
      '*.apiKey',
      '*.api_key',
      '*.token',
      '*.password',
      '*.ANTHROPIC_API_KEY',
    ],
    censor: '[redacted]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;
export const _providerForLog = env.LLM_PROVIDER;
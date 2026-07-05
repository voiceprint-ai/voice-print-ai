/**
 * LLM provider factory. Selected once from validated env.
 * @author Saamarth Attray
 */
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { AnthropicProvider } from './anthropic';
import { MockProvider } from './mock';
import type { LlmProvider } from './types';

let instance: LlmProvider | null = null;

export function getLlm(): LlmProvider {
  if (instance) return instance;
  instance = env.LLM_PROVIDER === 'anthropic' ? new AnthropicProvider() : new MockProvider();
  logger.info({ provider: instance.name }, 'LLM provider initialized');
  return instance;
}
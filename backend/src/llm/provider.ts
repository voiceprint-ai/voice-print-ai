/**
 * LLM provider factory. Selected once from validated env.
 * @author Saamarth Attray
 */
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { AnthropicProvider } from './anthropic';
import { WatsonxProvider } from './watsonx';
import { MockProvider } from './mock';
import type { LlmProvider } from './types';

let instance: LlmProvider | null = null;

export function getLlm(): LlmProvider {
  if (instance) return instance;
  if (env.LLM_PROVIDER === 'anthropic') {
    instance = new AnthropicProvider();
  } else if (env.LLM_PROVIDER === 'watsonx') {
    instance = new WatsonxProvider();
  } else {
    instance = new MockProvider();
  }
  logger.info({ provider: instance.name }, 'LLM provider initialized');
  return instance;
}
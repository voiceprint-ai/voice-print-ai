/**
 * Environment configuration — validated once at boot.
 *
 * Security checklist: "No hardcoded secrets" + "fail-fast on weak/default secrets".
 * Nothing in this codebase reads process.env directly except here. If a required
 * value is missing (or an obviously-insecure default in production), the process
 * refuses to start rather than booting in an unsafe state.
 *
 * @author Saamarth Attray
 */
import 'dotenv/config';
import { z } from 'zod';

const csv = (v: string): string[] =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().max(65535).default(8080),

    CORS_ORIGINS: z
      .string()
      .min(1, 'CORS_ORIGINS must list at least one explicit origin')
      .transform(csv),

    FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
    // Optional: on Cloud Run we use Application Default Credentials instead of a file.
    GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
    // Only used by scripts/get-test-token.ts; not needed to run the server itself.
    FIREBASE_WEB_API_KEY: z.string().optional(),

    LLM_PROVIDER: z.enum(['anthropic', 'watsonx', 'mock']).default('mock'),
    ANTHROPIC_API_KEY: z.string().optional(),
    ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-6'),

    // IBM watsonx.ai
    WATSONX_API_KEY: z.string().optional(),
    WATSONX_PROJECT_ID: z.string().optional(),
    WATSONX_URL: z.string().url().optional(),
    WATSONX_MODEL_ID: z.string().default('ibm/granite-3-3-8b-instruct'),

    DAILY_LLM_QUOTA_PER_USER: z.coerce.number().int().positive().default(100),
    MAX_SAMPLE_CHARS: z.coerce.number().int().positive().default(50_000),
    MAX_TARGET_CHARS: z.coerce.number().int().positive().default(50_000),
    MAX_SAMPLES_PER_PROFILE: z.coerce.number().int().positive().max(500).default(50),
  })
  .superRefine((env, ctx) => {
    // If the real LLM provider is selected, its key is mandatory and must look real.
    if (env.LLM_PROVIDER === 'anthropic') {
      const key = env.ANTHROPIC_API_KEY?.trim();
      if (!key) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ANTHROPIC_API_KEY'],
          message: 'ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic',
        });
      } else if (!key.startsWith('sk-ant-')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ANTHROPIC_API_KEY'],
          message: 'ANTHROPIC_API_KEY does not look like a valid Anthropic key',
        });
      }
    }

    if (env.LLM_PROVIDER === 'watsonx') {
      if (!env.WATSONX_API_KEY?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['WATSONX_API_KEY'],
          message: 'WATSONX_API_KEY is required when LLM_PROVIDER=watsonx',
        });
      }
      if (!env.WATSONX_PROJECT_ID?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['WATSONX_PROJECT_ID'],
          message: 'WATSONX_PROJECT_ID is required when LLM_PROVIDER=watsonx',
        });
      }
      if (!env.WATSONX_URL?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['WATSONX_URL'],
          message:
            'WATSONX_URL is required when LLM_PROVIDER=watsonx (e.g. https://us-south.ml.cloud.ibm.com)',
        });
      }
    }

    // Refuse to run the fake provider in production — a real deployment must not
    // silently return canned analysis.
    if (env.NODE_ENV === 'production' && env.LLM_PROVIDER === 'mock') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['LLM_PROVIDER'],
        message: 'LLM_PROVIDER=mock is not allowed in production',
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

function load(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    // eslint-disable-next-line no-console
    console.error(`\nInvalid environment configuration:\n${issues}\n`);
    process.exit(1);
  }
  return parsed.data;
}

export const env = load();
export const isProd = env.NODE_ENV === 'production';
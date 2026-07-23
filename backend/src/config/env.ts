/**
 * Environment configuration — validated once at boot.
 *
 * Security guarantees:
 * - No application file reads process.env directly except this file.
 * - Required configuration is validated before the application starts.
 * - Watsonx credentials are required when Watsonx is selected.
 * - Firebase Admin credentials must be provided together.
 * - Mock LLM responses are not allowed in production.
 *
 * @author Saamarth Attray
 * @modified Timothy Nguyen — added Vercel, Firebase Admin, and Watsonx validation
 */

import 'dotenv/config';
import { z } from 'zod';

const csv = (value: string): string[] =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const optionalNonEmptyString = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  },
  z.string().min(1).optional(),
);

const EnvSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),

    /**
     * Used when running Express as a traditional local server.
     * Vercel controls the deployed service port.
     */
    PORT: z.coerce
      .number()
      .int()
      .positive()
      .max(65535)
      .default(8080),

    /**
     * Comma-separated exact origins allowed to call the API.
     */
    CORS_ORIGINS: z
      .string()
      .min(1, 'CORS_ORIGINS must list at least one explicit origin')
      .transform(csv),

    /**
     * Firebase Admin configuration.
     */
    FIREBASE_PROJECT_ID: z
      .string()
      .trim()
      .min(1, 'FIREBASE_PROJECT_ID is required'),

    /**
     * Used on Vercel together with FIREBASE_PRIVATE_KEY.
     */
    FIREBASE_CLIENT_EMAIL: optionalNonEmptyString.pipe(
      z
        .string()
        .email('FIREBASE_CLIENT_EMAIL must be a valid email address')
        .optional(),
    ),

    /**
     * Firebase service-account private key.
     *
     * Vercel may store line breaks as literal "\n" sequences. firebase.ts
     * converts them to real newlines before initializing Firebase Admin.
     */
    FIREBASE_PRIVATE_KEY: optionalNonEmptyString,

    /**
     * Optional local or Google Cloud credentials-file path.
     *
     * Do not use ./serviceAccount.json on Vercel unless the file is actually
     * included in the deployed filesystem.
     */
    GOOGLE_APPLICATION_CREDENTIALS: optionalNonEmptyString,

    /**
     * Used only by scripts/get-test-token.ts.
     */
    FIREBASE_WEB_API_KEY: optionalNonEmptyString,

    /**
     * LLM provider configuration.
     */
    LLM_PROVIDER: z
      .enum(['anthropic', 'watsonx', 'mock'])
      .default('watsonx'),

    /**
     * Anthropic configuration is retained so the provider can be changed
     * without restructuring the environment schema.
     */
    ANTHROPIC_API_KEY: optionalNonEmptyString,

    ANTHROPIC_MODEL: z
      .string()
      .trim()
      .min(1)
      .default('claude-sonnet-4-6'),

    /**
     * IBM watsonx.ai configuration.
     */
    WATSONX_API_KEY: optionalNonEmptyString,

    WATSONX_PROJECT_ID: optionalNonEmptyString,

    WATSONX_URL: z
      .string()
      .trim()
      .url('WATSONX_URL must be a valid URL')
      .default('https://us-south.ml.cloud.ibm.com'),

    WATSONX_MODEL_ID: z
      .string()
      .trim()
      .min(1)
      .default('ibm/granite-3-3-8b-instruct'),

    /**
     * Abuse and cost controls.
     */
    DAILY_LLM_QUOTA_PER_USER: z.coerce
      .number()
      .int()
      .positive()
      .default(100),

    MAX_SAMPLE_CHARS: z.coerce
      .number()
      .int()
      .positive()
      .default(50_000),

    MAX_TARGET_CHARS: z.coerce
      .number()
      .int()
      .positive()
      .default(50_000),

    MAX_SAMPLES_PER_PROFILE: z.coerce
      .number()
      .int()
      .positive()
      .max(500)
      .default(50),
  })
  .superRefine((env, ctx) => {
    const hasFirebaseClientEmail = Boolean(
      env.FIREBASE_CLIENT_EMAIL?.trim(),
    );

    const hasFirebasePrivateKey = Boolean(
      env.FIREBASE_PRIVATE_KEY?.trim(),
    );

    /**
     * Explicit Firebase credentials must be supplied together.
     */
    if (hasFirebaseClientEmail !== hasFirebasePrivateKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FIREBASE_PRIVATE_KEY'],
        message:
          'FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be provided together',
      });
    }

    /**
     * Vercel does not normally provide Google Application Default Credentials,
     * so explicit Firebase Admin credentials are required in production.
     */
    if (
      env.NODE_ENV === 'production' &&
      (!hasFirebaseClientEmail || !hasFirebasePrivateKey)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FIREBASE_PRIVATE_KEY'],
        message:
          'FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are required in production',
      });
    }

    if (env.LLM_PROVIDER === 'anthropic') {
      const key = env.ANTHROPIC_API_KEY?.trim();

      if (!key) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ANTHROPIC_API_KEY'],
          message:
            'ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic',
        });
      } else if (!key.startsWith('sk-ant-')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ANTHROPIC_API_KEY'],
          message:
            'ANTHROPIC_API_KEY does not look like a valid Anthropic key',
        });
      }
    }

    if (env.LLM_PROVIDER === 'watsonx') {
      if (!env.WATSONX_API_KEY?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['WATSONX_API_KEY'],
          message:
            'WATSONX_API_KEY is required when LLM_PROVIDER=watsonx',
        });
      }

      if (!env.WATSONX_PROJECT_ID?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['WATSONX_PROJECT_ID'],
          message:
            'WATSONX_PROJECT_ID is required when LLM_PROVIDER=watsonx',
        });
      }

      if (!env.WATSONX_URL?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['WATSONX_URL'],
          message:
            'WATSONX_URL is required when LLM_PROVIDER=watsonx',
        });
      }

      if (!env.WATSONX_MODEL_ID?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['WATSONX_MODEL_ID'],
          message:
            'WATSONX_MODEL_ID is required when LLM_PROVIDER=watsonx',
        });
      }
    }

    /**
     * Prevent a production deployment from silently returning mock responses.
     */
    if (
      env.NODE_ENV === 'production' &&
      env.LLM_PROVIDER === 'mock'
    ) {
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
      .map(
        (issue) =>
          `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
      )
      .join('\n');

    // eslint-disable-next-line no-console
    console.error(
      `\nInvalid environment configuration:\n${issues}\n`,
    );

    process.exit(1);
  }

  return parsed.data;
}

export const env = load();
export const isProd = env.NODE_ENV === 'production';
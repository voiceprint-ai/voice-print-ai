# Voiceprint AI

Turn your writing history into a personal voice guide for clearer, more authentic drafts.

Built for the AI Builders Challenge with IBM Bob (July Challenge: Reimagine Creative Industries with AI).

## Problem statement

Writers and creators are expected to produce more content, faster, across more formats than ever, but staying consistent in your own voice across that volume is hard. Generic AI writing tools help you produce text quickly, but they don't know *your* voice, so the output often needs to be rewritten anyway to sound like you again.

## Solution

Voiceprint AI lets you upload your own past writing (txt, docx, or pdf) and builds a **voice profile** from it: a structured summary of your tone, sentence structure, vocabulary, and stylistic quirks. From there, you can:

- **Analyze** a new draft against your profile to see how closely it matches your voice, with a numeric score and specific drift notes
- **Rewrite** a draft toward your voice, with optional instructions (e.g. "make it punchier")
- **Track consistency over time** across every draft you've checked, so you can see how your voice drifts or holds steady across a project

## Selected challenge theme

**Creative Industries**: Voiceprint is a personalized creative assistant. It helps writers produce faster without losing what makes their writing theirs.

## AI approach & architecture

**Stack:** Next.js (App Router) frontend, Firebase Auth + Firestore, Node/Express backend, IBM watsonx (Granite) as the primary LLM provider with an Anthropic fallback and a mock provider for offline development.

**Pipeline:**
1. **Profile generation**: reference writing samples are sent to the LLM with a structured prompt, and the response is validated against a strict schema (Zod) before being stored, producing a summary, tone, sentence structure, vocabulary, and lists of quirks/things to avoid.
2. **Analysis**: a draft is scored against the stored profile across four dimensions (tone, sentence structure, vocabulary, quirks) plus an overall score and drift notes explaining specific mismatches.
3. **Rewrite**: a draft is rewritten toward the profile, with optional free-text instructions, returning the rewritten text plus a list of what changed and why.

All model output is treated as untrusted input: every response is schema-validated and clamped (e.g. scores coerced into 0-100) before it ever reaches the database or UI, and prompts include defenses against injection from user-supplied writing samples.

**Evaluation:** the backend previously had no automated test coverage. We built `backend/scripts/eval-ai.ts`, a standalone evaluation script (run via `npm run eval:ai`) that builds two distinct voice profiles from known samples and checks:
- **Discrimination**: does a draft written in a profile's own voice score meaningfully higher than an off-voice draft?
- **Summary/score consistency**: does the model's qualitative summary ("moderately matched," "closely matches," etc.) agree with its own numeric dimension scores? (Added after we found a real case where they disagreed.)
- **Rewrite effectiveness**: does rewriting an off-voice draft actually raise its consistency score against the profile?
- **Rewrite tone overshoot**: does the rewrite introduce slang/casual markers that aren't present anywhere in the original reference samples? (Added after we found rewrite could overshoot more casual than the source voice warranted.)

Manual testing against real watsonx (`ibm/granite-4-h-small`) confirmed the core rewrite feature works well: genuine voice-matching that responds correctly to specific instructions, not just generic tone-shifting. The casualness-overshoot issue above is the main known limitation, and it's now covered by an automated check.

## How IBM Bob was used

IBM Bob was used as the primary development tool throughout the project, including:
- Building the analysis history feature end-to-end, including the new backend route, frontend chart component, and integration into the existing project page, by providing Bob with the existing codebase conventions and asking it to match the established structure
- Building the eval-ai.ts evaluation script and its checks, based on specific bugs identified during manual testing
- Assisting with draft UI implementation, skeleton loading states, and auth flow handling, using clear implementation instructions and project-specific requirements
- Supporting general debugging, refactoring, and code cleanup throughout development

## Getting started

See `.env.example` in `backend/` and set up a Firebase project (Firestore + Email/Password Auth) and either a watsonx or Anthropic API key (or use `LLM_PROVIDER=mock` for local development without any AI provider key).

```bash
# backend
cd backend && npm install && npm run dev

# frontend
cd frontend && npm install && npm run dev
```

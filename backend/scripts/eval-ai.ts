/**
 * eval-ai.ts
 *
 * Lightweight AI evaluation script. Calls the LLM layer directly (no HTTP server,
 * no Firestore) to verify that the voice-profile + scoring + rewrite pipeline
 * produces semantically meaningful results:
 *
 *   1. Two distinct writing voices are used as reference corpora.
 *   2. For each voice a profile is generated via getLlm().generateVoiceProfile().
 *   3. Each profile is scored twice: once against a same-voice draft (expect HIGH)
 *      and once against the opposite-voice draft (expect LOW).
 *      PASS = own-voice score exceeds cross-voice score by at least PASS_THRESHOLD.
 *   4. For each profile, the cross-voice draft is rewritten with "match my voice".
 *      PASS = rewritten text differs from the input AND changeNotes is non-empty.
 *
 * NOTE ON THE MOCK PROVIDER
 * When LLM_PROVIDER=mock the scoring formula is `60 + (target.length % 35)`,
 * which is profile-agnostic. Both own- and cross-voice scores will be identical,
 * so the discrimination checks will always FAIL — that is the expected and correct
 * behaviour; it surfaces the moment you swap in a real LLM.
 *
 * Usage:
 *   npm run eval:ai
 *   LLM_PROVIDER=anthropic npm run eval:ai
 *
 * @author Saamarth Attray
 */
import 'dotenv/config';
import { getLlm } from '../src/llm/provider';

// ---------------------------------------------------------------------------
// Hardcoded reference corpus — replace with real samples before running with
// a live LLM. Each array must have at least one non-empty string.
// ---------------------------------------------------------------------------

const VOICE_A_SAMPLES: string[] = [
  // TODO: replace with real Voice A samples
  'Voice A sample one. Short punchy sentences. No fluff.',
  'Voice A sample two. Gets to the point fast. Concrete words only.',
];

const VOICE_B_SAMPLES: string[] = [
  // TODO: replace with real Voice B samples
  'Voice B sample one explores nuanced ideas at length, weaving subordinate clauses and measured qualifications into every paragraph.',
  'Voice B sample two considers the broader context carefully, pausing to acknowledge complexity before arriving at a considered conclusion.',
];

// Draft written unmistakably in Voice A's style (short, direct).
const VOICE_A_DRAFT =
  'Here is the fix. Two lines. Ship it.';

// Draft written unmistakably in Voice B's style (long, discursive).
const VOICE_B_DRAFT =
  'Having considered the situation at some length, and bearing in mind the various ' +
  'factors that bear upon the question, it seems reasonable to conclude that a ' +
  'measured response — one that takes account of all available evidence — is warranted.';

// Minimum score gap (own − cross) required to call a discrimination check a PASS.
// With a real LLM expect ≥ 20; set conservatively here so a borderline real model
// still flags rather than silently passes.
const PASS_THRESHOLD = 15;

// ---------------------------------------------------------------------------
// Slang / casual-overshoot markers for Check 2b.
// If the rewritten text contains any of these that don't appear in the original
// reference samples, the rewrite has overshot the target voice.
// ---------------------------------------------------------------------------
const SLANG_MARKERS: string[] = [
  'gotta', 'wanna', 'kinda', 'sorta', 'yeah', 'dude', 'lol',
  'nah', 'gonna', 'ain\'t', 'lemme', 'gimme', 'y\'all',
];

// ---------------------------------------------------------------------------
// Check 1 helper — summary/score consistency (best-effort heuristic).
//
// The LLM emits both a qualitative `summary` and numeric `dimensions` scores.
// A known watsonx bug is that the words and numbers can disagree (e.g. summary
// says "moderately matched" but tone/sentenceStructure scores are 10/10).
// We scan for high/medium/low qualifier keywords and compare against the average
// of all four dimension scores. Flag FAIL only when there is a clear contradiction.
//
// Keyword tiers (not exhaustive — intentionally a heuristic):
//   high:   closely | strongly | very similar | excellent | nearly identical
//   medium: moderately | somewhat | partially | reasonably | fairly
//   low:    significant | sharply | not at all | diverges | substantially | poor
// ---------------------------------------------------------------------------
function checkSummaryScoreConsistency(
  result: { summary: string; dimensions: { tone: number; sentenceStructure: number; vocabulary: number; quirks: number } },
  label: string,
): void {
  const text = result.summary.toLowerCase();
  const avg = Math.round(
    (result.dimensions.tone +
      result.dimensions.sentenceStructure +
      result.dimensions.vocabulary +
      result.dimensions.quirks) / 4,
  );

  const highWords = ['closely', 'strongly', 'very similar', 'excellent', 'nearly identical'];
  const medWords  = ['moderately', 'somewhat', 'partially', 'reasonably', 'fairly'];
  const lowWords  = ['significant', 'sharply', 'not at all', 'diverges', 'substantially', 'poor'];

  const matchedHigh = highWords.find((w) => text.includes(w));
  const matchedMed  = medWords.find((w) => text.includes(w));
  const matchedLow  = lowWords.find((w) => text.includes(w));

  let tier: 'high' | 'medium' | 'low' | 'none' = 'none';
  let matchedWord = '';
  if (matchedHigh)     { tier = 'high';   matchedWord = matchedHigh; }
  else if (matchedMed) { tier = 'medium'; matchedWord = matchedMed; }
  else if (matchedLow) { tier = 'low';    matchedWord = matchedLow; }

  if (tier === 'none') {
    record(
      `${label} — summary/score consistency`,
      true,
      `no qualifier keyword detected in summary; skipping heuristic  avg-dim=${avg}`,
    );
    return;
  }

  // Clear-contradiction thresholds:
  //   "high" language but avg < 55  → mismatch
  //   "medium" language but avg < 15 or avg > 85  → mismatch
  //   "low" language but avg > 50  → mismatch
  let passed = true;
  let reason = '';

  if (tier === 'high' && avg < 55) {
    passed = false;
    reason = `summary says "${matchedWord}" but avg dimension score is only ${avg} (expected > 55)`;
  } else if (tier === 'medium' && avg < 15) {
    passed = false;
    reason = `summary says "${matchedWord}" but avg dimension score is ${avg} (expected 15-85)`;
  } else if (tier === 'medium' && avg > 85) {
    passed = false;
    reason = `summary says "${matchedWord}" but avg dimension score is ${avg} (expected 15-85)`;
  } else if (tier === 'low' && avg > 50) {
    passed = false;
    reason = `summary says "${matchedWord}" but avg dimension score is ${avg} (expected < 50)`;
  } else {
    reason = `summary says "${matchedWord}" (${tier}), avg dimension score ${avg} — consistent ✓`;
  }

  record(`${label} — summary/score consistency`, passed, reason);
}

// ---------------------------------------------------------------------------
// Result tracking
// ---------------------------------------------------------------------------

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];

function record(name: string, passed: boolean, detail: string): void {
  results.push({ name, passed, detail });
  const tag = passed ? '  PASS' : '  FAIL';
  console.log(`${tag}  ${name}`);
  console.log(`        ${detail}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const llm = getLlm();
  console.log(`\nLLM provider: ${llm.name}`);
  if (llm.name === 'mock') {
    console.log(
      '  ⚠  Mock provider active — discrimination checks will FAIL by design.\n' +
        '     Set LLM_PROVIDER=anthropic (or watsonx) for a meaningful eval.\n',
    );
  } else {
    console.log('');
  }

  // ------------------------------------------------------------------
  // Step 1 — generate voice profiles
  // ------------------------------------------------------------------
  console.log('── Generating profiles ────────────────────────────────────');
  console.log('  Generating Voice A profile…');
  const profileA = await llm.generateVoiceProfile(VOICE_A_SAMPLES);
  console.log(`  Profile A tone: "${profileA.tone}"`);

  console.log('  Generating Voice B profile…');
  const profileB = await llm.generateVoiceProfile(VOICE_B_SAMPLES);
  console.log(`  Profile B tone: "${profileB.tone}"`);
  console.log('');

  // ------------------------------------------------------------------
  // Step 2 — discrimination checks (own-voice vs cross-voice scoring)
  // ------------------------------------------------------------------
  console.log('── Discrimination checks ──────────────────────────────────');

  const ownA = await llm.scoreConsistency(profileA, VOICE_A_DRAFT);
  const crossA = await llm.scoreConsistency(profileA, VOICE_B_DRAFT);
  const gapA = Math.round(ownA.overallScore - crossA.overallScore);
  record(
    'Voice A — own-voice scores higher than cross-voice',
    gapA >= PASS_THRESHOLD,
    `own=${Math.round(ownA.overallScore)}  cross=${Math.round(crossA.overallScore)}  gap=${gapA}  (threshold=${PASS_THRESHOLD})`,
  );

  const ownB = await llm.scoreConsistency(profileB, VOICE_B_DRAFT);
  const crossB = await llm.scoreConsistency(profileB, VOICE_A_DRAFT);
  const gapB = Math.round(ownB.overallScore - crossB.overallScore);
  record(
    'Voice B — own-voice scores higher than cross-voice',
    gapB >= PASS_THRESHOLD,
    `own=${Math.round(ownB.overallScore)}  cross=${Math.round(crossB.overallScore)}  gap=${gapB}  (threshold=${PASS_THRESHOLD})`,
  );
  console.log('');

  // ------------------------------------------------------------------
  // Step 3 — summary/score consistency (heuristic, Check 1)
  // ------------------------------------------------------------------
  console.log('── Summary/score consistency checks ───────────────────────');

  // Run against the cross-voice analyses — that is where the watsonx
  // "words contradict numbers" bug was observed in manual testing.
  checkSummaryScoreConsistency(crossA, 'Voice A cross-voice analysis');
  checkSummaryScoreConsistency(crossB, 'Voice B cross-voice analysis');
  console.log('');

  // ------------------------------------------------------------------
  // Step 4 — rewrite checks (cross-voice draft should be transformed)
  // ------------------------------------------------------------------
  console.log('── Rewrite checks ─────────────────────────────────────────');

  const rewriteA = await llm.rewrite(profileA, VOICE_B_DRAFT, 'match my voice');
  console.log('  [Profile A] Original cross-voice draft:');
  console.log(`    "${VOICE_B_DRAFT}"`);
  console.log('  [Profile A] Rewritten:');
  console.log(`    "${rewriteA.rewritten}"`);
  console.log('  [Profile A] Change notes:');
  rewriteA.changeNotes.forEach((n) => console.log(`    - ${n}`));
  record(
    'Voice A — rewrite changes the text',
    rewriteA.rewritten !== VOICE_B_DRAFT,
    rewriteA.rewritten !== VOICE_B_DRAFT
      ? 'output differs from input ✓'
      : 'output is identical to input',
  );
  record(
    'Voice A — rewrite produces change notes',
    rewriteA.changeNotes.length > 0,
    rewriteA.changeNotes.length > 0
      ? `${rewriteA.changeNotes.length} note(s) returned ✓`
      : 'changeNotes is empty',
  );
  console.log('');

  const rewriteB = await llm.rewrite(profileB, VOICE_A_DRAFT, 'match my voice');
  console.log('  [Profile B] Original cross-voice draft:');
  console.log(`    "${VOICE_A_DRAFT}"`);
  console.log('  [Profile B] Rewritten:');
  console.log(`    "${rewriteB.rewritten}"`);
  console.log('  [Profile B] Change notes:');
  rewriteB.changeNotes.forEach((n) => console.log(`    - ${n}`));
  record(
    'Voice B — rewrite changes the text',
    rewriteB.rewritten !== VOICE_A_DRAFT,
    rewriteB.rewritten !== VOICE_A_DRAFT
      ? 'output differs from input ✓'
      : 'output is identical to input',
  );
  record(
    'Voice B — rewrite produces change notes',
    rewriteB.changeNotes.length > 0,
    rewriteB.changeNotes.length > 0
      ? `${rewriteB.changeNotes.length} note(s) returned ✓`
      : 'changeNotes is empty',
  );
  console.log('');

  // ------------------------------------------------------------------
  // Step 5 — rewrite quality checks (Check 2a + 2b)
  // ------------------------------------------------------------------
  console.log('── Rewrite quality checks ─────────────────────────────────');

  // Check 2a — rewrite pulls the text toward the target profile.
  // Re-score the rewritten text against the same profile and compare to the
  // original cross-voice score. PASS = the rewritten text scores higher.
  const postRewriteA = await llm.scoreConsistency(profileA, rewriteA.rewritten);
  const improvedA = postRewriteA.overallScore > crossA.overallScore;
  record(
    'Voice A — rewrite improves consistency score',
    improvedA,
    `pre-rewrite=${Math.round(crossA.overallScore)}  post-rewrite=${Math.round(postRewriteA.overallScore)}` +
      (improvedA ? '  (improved ✓)' : '  (no improvement — rewrite may not be pulling toward profile)'),
  );

  const postRewriteB = await llm.scoreConsistency(profileB, rewriteB.rewritten);
  const improvedB = postRewriteB.overallScore > crossB.overallScore;
  record(
    'Voice B — rewrite improves consistency score',
    improvedB,
    `pre-rewrite=${Math.round(crossB.overallScore)}  post-rewrite=${Math.round(postRewriteB.overallScore)}` +
      (improvedB ? '  (improved ✓)' : '  (no improvement — rewrite may not be pulling toward profile)'),
  );

  // Check 2b — rewrite doesn't introduce slang absent from the reference samples.
  // A known watsonx overshoot: profile said "a little informal", rewrite used "gotta".
  // We normalise to lowercase and use word-boundary matching to avoid false positives
  // (e.g. "altogether" shouldn't match "all").
  const samplesA = VOICE_A_SAMPLES.join(' ').toLowerCase();
  const rewrittenA = rewriteA.rewritten.toLowerCase();
  const newSlangA = SLANG_MARKERS.filter((marker) => {
    const re = new RegExp(`\\b${marker}\\b`);
    return re.test(rewrittenA) && !re.test(samplesA);
  });
  record(
    'Voice A — rewrite does not introduce slang absent from reference samples',
    newSlangA.length === 0,
    newSlangA.length === 0
      ? 'no new slang markers detected ✓'
      : `introduced slang not present in source voice: ${newSlangA.join(', ')}`,
  );

  const samplesB = VOICE_B_SAMPLES.join(' ').toLowerCase();
  const rewrittenB = rewriteB.rewritten.toLowerCase();
  const newSlangB = SLANG_MARKERS.filter((marker) => {
    const re = new RegExp(`\\b${marker}\\b`);
    return re.test(rewrittenB) && !re.test(samplesB);
  });
  record(
    'Voice B — rewrite does not introduce slang absent from reference samples',
    newSlangB.length === 0,
    newSlangB.length === 0
      ? 'no new slang markers detected ✓'
      : `introduced slang not present in source voice: ${newSlangB.join(', ')}`,
  );
  console.log('');

  // ------------------------------------------------------------------
  // Step 6 — summary table
  // ------------------------------------------------------------------
  console.log('── Summary ────────────────────────────────────────────────');
  const colWidth = Math.max(...results.map((r) => r.name.length)) + 2;
  results.forEach((r) => {
    const label = r.passed ? 'PASS' : 'FAIL';
    console.log(`  ${label}  ${r.name.padEnd(colWidth)}  ${r.detail}`);
  });
  console.log('');

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`  ${passed}/${total} checks passed`);
  console.log('');

  if (passed < total) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

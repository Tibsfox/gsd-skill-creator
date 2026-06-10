/**
 * Verify ship — v1.49.1027 (under #10428/#10438 verify-axis trigger; #10453 pattern).
 *
 * Component B of the Loop-Outcome Ship closes the brain→actuator gap for the
 * sequence_repetition detector: `amiga.min_sequence_count` is the first AMIGA
 * detector parameter calibrated by the bounded-learning loop.
 *
 * The substrate for this threshold is the `SuggestionStore` (same source as
 * the `suggestions.*` class, v1.49.951), filtered to entries tagged
 * `[source: AMIGA sequence_repetition]` in `candidate.suggestedDescription`.
 * Operator dismiss decisions on those candidates are the signal that the
 * bar is too low (noise); operator accept decisions signal the bar is right.
 *
 * This test proves the full substrate→calibration→apply→detector wire works
 * end-to-end against REAL collaborators (no mocks). It:
 *
 *   1. Creates a real `SuggestionStore` over a temp patterns dir.
 *   2. Adds dismissed candidates tagged `[source: AMIGA sequence_repetition]`
 *      (the substrate write — mimics the `skill-creator amiga --emit` path).
 *   3. Calls `loadObservationsForThreshold('amiga.min_sequence_count', ...)` —
 *      the calibration-loop read side — and asserts correct dismiss polarity (-1).
 *   4. Feeds the observations through `runCalibrationLoop` and asserts the
 *      recommendation: direction='increase', proposedValue=3 (from current=2).
 *   5. Exercises `applyRecommendation` against a real tmp config and asserts
 *      `amiga.min_sequence_count` is written as 3.
 *   6. Instantiates `SkillCandidateDetector` with the new value (3) and asserts
 *      a count-2 bigram NO LONGER emits a sequence_repetition candidate.
 *
 * Also: source-tag filtering (non-sequence_repetition entries are excluded),
 * missing-file tolerance, malformed-file tolerance.
 *
 * FIFTH instance of the "substrate→calibration end-to-end test" pattern
 * (ESTABLISHED at v898, promoted at v951 to cover suggestions.* class).
 * First instance of "full-wire calibration→apply→detector" sub-pattern
 * (closes the actuator gap that all prior e2e tests left open).
 *
 * Mirrors the v1.49.951 suggestions-calibration-end-to-end pattern:
 *   - substrate = SuggestionStore (operator decision on a surfaced suggestion)
 *   - calibration-read = loadObservationsForThreshold + runCalibrationLoop
 *   - apply = applyRecommendation (threshold writer)
 *   - actuator = SkillCandidateDetector(options.minSequenceCount)
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SuggestionStore } from '../../src/detection/suggestion-store.js';
import type { SkillCandidate } from '../../src/types/detection.js';
import { loadObservationsForThreshold } from '../../src/bounded-learning/observation-sources.js';
import { runCalibrationLoop } from '../../src/bounded-learning/calibration-loop.js';
import { applyRecommendation, setThresholdValue } from '../../src/bounded-learning/threshold-writer.js';
import { SkillCandidateDetector } from '../../src/amiga/meta-mission/skill-candidate-detector.js';
import { createEnvelope } from '../../src/amiga/message-envelope.js';
import type { EventEnvelope } from '../../src/amiga/message-envelope.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build a SkillCandidate with the [source: AMIGA sequence_repetition] tag
 * that the candidate-mapper embeds on every sequence_repetition candidate.
 * This is the substrate write — it mimics the `skill-creator amiga --emit` path.
 */
function makeSeqCandidate(id: string): SkillCandidate {
  return {
    id,
    type: 'workflow',
    pattern: `FOO->BAR`,
    occurrences: 4,
    confidence: 0.45,
    suggestedName: `foo-to-bar-cycle`,
    suggestedDescription: `Repeating sequence: FOO->BAR detected 2 times across the mission [source: AMIGA sequence_repetition]`,
    evidence: {
      firstSeen: 0,
      lastSeen: 1,
      sessionIds: ['test-session'],
      coOccurringFiles: [],
      coOccurringTools: ['Bash'],
    },
  };
}

/**
 * Build a SkillCandidate with a DIFFERENT source tag (attribution_cluster).
 * These should be excluded by the amiga.min_sequence_count evidence filter.
 */
function makeAttrCandidate(id: string): SkillCandidate {
  return {
    id,
    type: 'workflow',
    pattern: 'contributor[A] -> contributor[B]',
    occurrences: 10,
    confidence: 0.8,
    suggestedName: 'multi-contributor-handoff',
    suggestedDescription: `Contributor handoff pattern [source: AMIGA attribution_cluster]`,
    evidence: {
      firstSeen: 0,
      lastSeen: 1,
      sessionIds: ['test-session'],
      coOccurringFiles: [],
      coOccurringTools: ['Bash'],
    },
  };
}

/**
 * Build a minimal event log with a bigram that repeats exactly `n` times.
 * Used to probe the detector with a specific count.
 */
function makeRepeatLog(n: number): EventEnvelope[] {
  const events: EventEnvelope[] = [];
  for (let i = 0; i < n; i++) {
    events.push(
      createEnvelope({
        source: 'test',
        destination: 'test',
        type: 'TELEMETRY_UPDATE' as const,
        payload: {},
      }),
      createEnvelope({
        source: 'test',
        destination: 'test',
        type: 'GATE_SIGNAL' as const,
        payload: {},
      }),
    );
  }
  return events;
}

// ============================================================================
// Tests
// ============================================================================

describe('verify amiga.min_sequence_count substrate→calibration→apply→detector wire (v1.49.1027)', () => {
  let tempDir: string;
  let suggestionsPath: string;
  let configPath: string;
  let store: SuggestionStore;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'amiga-min-seq-verify-'));
    suggestionsPath = join(tempDir, 'suggestions.json');
    configPath = join(tempDir, 'skill-creator.json');
    // SuggestionStore writes <patternsDir>/suggestions.json.
    store = new SuggestionStore(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // §1  Source-tag filtering: only sequence_repetition entries count
  // --------------------------------------------------------------------------

  it('dismissed attribution_cluster entries are NOT counted (source-tag filter)', async () => {
    await store.addCandidates([makeAttrCandidate('attr-1'), makeAttrCandidate('attr-2')]);
    await store.transition('attr-1', 'dismissed');
    await store.transition('attr-2', 'dismissed');

    const observations = await loadObservationsForThreshold('amiga.min_sequence_count', {
      amigaSuggestionsPath: suggestionsPath,
    });

    expect(observations).toEqual([]);
  });

  it('accepted sequence_repetition entry counts as +1', async () => {
    await store.addCandidates([makeSeqCandidate('seq-accept')]);
    await store.transition('seq-accept', 'accepted');

    const observations = await loadObservationsForThreshold('amiga.min_sequence_count', {
      amigaSuggestionsPath: suggestionsPath,
    });

    expect(observations).toHaveLength(1);
    // accepted → +1 (bar was appropriate; favor DECREASE)
    expect(observations[0]?.value).toBe(1);
  });

  it('dismissed sequence_repetition entry counts as -1', async () => {
    await store.addCandidates([makeSeqCandidate('seq-dismiss')]);
    await store.transition('seq-dismiss', 'dismissed');

    const observations = await loadObservationsForThreshold('amiga.min_sequence_count', {
      amigaSuggestionsPath: suggestionsPath,
    });

    expect(observations).toHaveLength(1);
    // dismissed → -1 (noise; favor INCREASE)
    expect(observations[0]?.value).toBe(-1);
  });

  it('pending and deferred sequence_repetition entries do NOT feed the loop', async () => {
    await store.addCandidates([makeSeqCandidate('seq-pending')]);
    await store.addCandidates([makeSeqCandidate('seq-deferred')]);
    await store.transition('seq-deferred', 'deferred');

    const observations = await loadObservationsForThreshold('amiga.min_sequence_count', {
      amigaSuggestionsPath: suggestionsPath,
    });

    expect(observations).toEqual([]);
  });

  it('mixed candidates: only sequence_repetition decisions are observed', async () => {
    // 3 seq dismissed + 2 attr dismissed (attr should be filtered out)
    await store.addCandidates([
      makeSeqCandidate('seq-a'),
      makeSeqCandidate('seq-b'),
      makeSeqCandidate('seq-c'),
      makeAttrCandidate('attr-a'),
      makeAttrCandidate('attr-b'),
    ]);
    for (const id of ['seq-a', 'seq-b', 'seq-c', 'attr-a', 'attr-b']) {
      await store.transition(id, 'dismissed');
    }

    const observations = await loadObservationsForThreshold('amiga.min_sequence_count', {
      amigaSuggestionsPath: suggestionsPath,
    });

    // Only the 3 seq entries should feed the loop.
    expect(observations).toHaveLength(3);
    expect(observations.every((o) => o.value === -1)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // §2  Calibration-loop recommendation (honest e-process outcome)
  // --------------------------------------------------------------------------

  it('20 dismissed sequence_repetition entries → calibration loop recommends increase 2→3', async () => {
    // Substrate write: 20 dismissed sequence_repetition candidates
    const candidates = Array.from({ length: 20 }, (_, i) => makeSeqCandidate(`seq-${i}`));
    await store.addCandidates(candidates);
    for (let i = 0; i < 20; i++) {
      await store.transition(`seq-${i}`, 'dismissed');
    }

    // Calibration-loop read
    const observations = await loadObservationsForThreshold('amiga.min_sequence_count', {
      amigaSuggestionsPath: suggestionsPath,
    });

    expect(observations).toHaveLength(20);
    expect(observations.every((o) => o.value === -1)).toBe(true);

    // E-process: 20 unanimous dismiss-skew easily crosses α=0.05.
    // Honest outcome (verified by direct runCalibrationLoop probe):
    //   direction=increase, rejected=true, proposedValue=3, evidence≈1808.
    const recommendation = runCalibrationLoop('amiga.min_sequence_count', 2, observations);

    expect(recommendation.direction).toBe('increase');
    expect(recommendation.rejected).toBe(true);
    expect(recommendation.proposedValue).toBe(3);
    expect(recommendation.currentValue).toBe(2);
    expect(recommendation.observations).toBe(20);
    // Evidence should be well above 1/0.025 = 40 (the per-side rejection threshold).
    expect(recommendation.evidence).toBeGreaterThan(40);
  });

  it('balanced accept/dismiss → e-process holds (insufficient evidence)', async () => {
    await store.addCandidates([
      makeSeqCandidate('seq-accept'),
      makeSeqCandidate('seq-dismiss'),
    ]);
    await store.transition('seq-accept', 'accepted');
    await store.transition('seq-dismiss', 'dismissed');

    const observations = await loadObservationsForThreshold('amiga.min_sequence_count', {
      amigaSuggestionsPath: suggestionsPath,
    });

    expect(observations).toHaveLength(2);

    const recommendation = runCalibrationLoop('amiga.min_sequence_count', 2, observations);
    expect(recommendation.direction).toBe('hold');
    expect(recommendation.rejected).toBe(false);
    expect(recommendation.proposedValue).toBeNull();
  });

  // --------------------------------------------------------------------------
  // §3  Apply writer — threshold written to config file
  // --------------------------------------------------------------------------

  it('apply writer atomically writes amiga.min_sequence_count = 3 to the config', async () => {
    // Build config with current value = 2
    const initialConfig = { amiga: { min_sequence_count: 2 } };
    writeFileSync(configPath, JSON.stringify(initialConfig, null, 2) + '\n', 'utf8');

    // 20 dismissed entries → recommendation to increase 2→3
    const candidates = Array.from({ length: 20 }, (_, i) => makeSeqCandidate(`s-${i}`));
    await store.addCandidates(candidates);
    for (let i = 0; i < 20; i++) {
      await store.transition(`s-${i}`, 'dismissed');
    }

    const observations = await loadObservationsForThreshold('amiga.min_sequence_count', {
      amigaSuggestionsPath: suggestionsPath,
    });
    const recommendation = runCalibrationLoop('amiga.min_sequence_count', 2, observations);

    expect(recommendation.proposedValue).toBe(3);

    // Apply: write the new value atomically.
    const outcome = await applyRecommendation(recommendation, {
      apply: true,
      configPath,
    });

    expect(outcome.kind).toBe('applied');
    if (outcome.kind === 'applied') {
      expect(outcome.previousValue).toBe(2);
      expect(outcome.newValue).toBe(3);
    }

    // Verify the on-disk value.
    const { readFile } = await import('node:fs/promises');
    const onDisk = JSON.parse(await readFile(configPath, 'utf8'));
    expect(onDisk.amiga.min_sequence_count).toBe(3);
  });

  it('apply writer returns noop when direction is hold', async () => {
    writeFileSync(
      configPath,
      JSON.stringify({ amiga: { min_sequence_count: 2 } }, null, 2) + '\n',
      'utf8',
    );

    await store.addCandidates([makeSeqCandidate('seq-a'), makeSeqCandidate('seq-d')]);
    await store.transition('seq-a', 'accepted');
    await store.transition('seq-d', 'dismissed');

    const observations = await loadObservationsForThreshold('amiga.min_sequence_count', {
      amigaSuggestionsPath: suggestionsPath,
    });
    const recommendation = runCalibrationLoop('amiga.min_sequence_count', 2, observations);
    expect(recommendation.direction).toBe('hold');

    const outcome = await applyRecommendation(recommendation, {
      apply: true,
      configPath,
    });

    expect(outcome.kind).toBe('noop');
    // Config unchanged.
    const { readFile } = await import('node:fs/promises');
    const onDisk = JSON.parse(await readFile(configPath, 'utf8'));
    expect(onDisk.amiga.min_sequence_count).toBe(2);
  });

  // --------------------------------------------------------------------------
  // §4  Detector actuator — instantiated with calibrated value
  // --------------------------------------------------------------------------

  it('detector at minSequenceCount=3 suppresses count-2 candidates (actuator wire)', async () => {
    // After apply writes min_sequence_count=3, the amiga CLI instantiates
    // SkillCandidateDetector({ minSequenceCount: 3 }).
    // A bigram that repeats exactly 2 times must NOT surface a candidate.
    const detector = new SkillCandidateDetector({ minSequenceCount: 3 });
    const log = makeRepeatLog(2); // bigram repeats exactly 2 times
    const result = detector.analyze(log);

    const seqCandidates = result.candidates.filter(
      (c) => c.detection_method === 'sequence_repetition',
    );
    expect(seqCandidates).toHaveLength(0);
  });

  it('detector at minSequenceCount=3 surfaces count-3 candidates (bar is now 3, not 2)', async () => {
    // A bigram that repeats 3 times must surface under the calibrated bar.
    const detector = new SkillCandidateDetector({ minSequenceCount: 3 });
    const log = makeRepeatLog(3); // bigram repeats exactly 3 times
    const result = detector.analyze(log);

    const seqCandidates = result.candidates.filter(
      (c) => c.detection_method === 'sequence_repetition',
    );
    expect(seqCandidates.length).toBeGreaterThan(0);
  });

  it('default detector (minSequenceCount=2) still surfaces count-2 candidates (bar unchanged)', async () => {
    // Regression: the default behavior must be identical to the pre-ship hardcoded bar.
    const detector = new SkillCandidateDetector();
    const log = makeRepeatLog(2);
    const result = detector.analyze(log);

    const seqCandidates = result.candidates.filter(
      (c) => c.detection_method === 'sequence_repetition',
    );
    expect(seqCandidates.length).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // §5  End-to-end full wire: substrate → loop → apply → detector
  // --------------------------------------------------------------------------

  it('full wire: dismissed candidates → recommendation → apply → detector no longer emits count-2', async () => {
    // Write config with current value = 2.
    writeFileSync(
      configPath,
      JSON.stringify({ amiga: { min_sequence_count: 2 } }, null, 2) + '\n',
      'utf8',
    );

    // SUBSTRATE: add 20 dismissed sequence_repetition candidates.
    const candidates = Array.from({ length: 20 }, (_, i) => makeSeqCandidate(`e2e-${i}`));
    await store.addCandidates(candidates);
    for (let i = 0; i < 20; i++) {
      await store.transition(`e2e-${i}`, 'dismissed');
    }

    // CALIBRATION READ: load observations.
    const observations = await loadObservationsForThreshold('amiga.min_sequence_count', {
      amigaSuggestionsPath: suggestionsPath,
    });
    expect(observations).toHaveLength(20);

    // LOOP: recommendation.
    const recommendation = runCalibrationLoop('amiga.min_sequence_count', 2, observations);
    expect(recommendation.proposedValue).toBe(3);

    // APPLY: write new value.
    const outcome = await applyRecommendation(recommendation, {
      apply: true,
      configPath,
    });
    expect(outcome.kind).toBe('applied');

    // Read back from config (simulates how amiga CLI reads it).
    const { readFile } = await import('node:fs/promises');
    const onDisk = JSON.parse(await readFile(configPath, 'utf8'));
    const newMinSeq: number = onDisk.amiga.min_sequence_count;
    expect(newMinSeq).toBe(3);

    // ACTUATOR: detector with the calibrated value suppresses count-2 candidates.
    const calibratedDetector = new SkillCandidateDetector({ minSequenceCount: newMinSeq });
    const logCount2 = makeRepeatLog(2);
    const resultCount2 = calibratedDetector.analyze(logCount2);
    const seqCount2 = resultCount2.candidates.filter(
      (c) => c.detection_method === 'sequence_repetition',
    );
    expect(seqCount2).toHaveLength(0);

    // A count-3 bigram still surfaces — bar was raised, not broken.
    const logCount3 = makeRepeatLog(3);
    const resultCount3 = calibratedDetector.analyze(logCount3);
    const seqCount3 = resultCount3.candidates.filter(
      (c) => c.detection_method === 'sequence_repetition',
    );
    expect(seqCount3.length).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // §6  setThresholdValue helper (structural parity with neighbor tests)
  // --------------------------------------------------------------------------

  it('setThresholdValue correctly nests amiga.min_sequence_count in config', () => {
    const config = { amiga: { min_sequence_count: 2 } };
    const updated = setThresholdValue(config, 'amiga.min_sequence_count', 3);
    expect((updated as { amiga: { min_sequence_count: number } }).amiga.min_sequence_count).toBe(3);
    // Original must not be mutated.
    expect(config.amiga.min_sequence_count).toBe(2);
  });

  // --------------------------------------------------------------------------
  // §7  Reader contract (tolerance tests — mirrors v1.49.951 + v1.49.894)
  // --------------------------------------------------------------------------

  it('calibration loop returns empty when suggestions.json does not exist (missing-file tolerance)', async () => {
    const observations = await loadObservationsForThreshold('amiga.min_sequence_count', {
      amigaSuggestionsPath: join(tempDir, 'never-written.json'),
    });
    expect(observations).toEqual([]);
  });

  it('calibration loop tolerates a malformed suggestions.json (reader contract)', async () => {
    writeFileSync(suggestionsPath, '{not valid json', 'utf8');

    const observations = await loadObservationsForThreshold('amiga.min_sequence_count', {
      amigaSuggestionsPath: suggestionsPath,
    });
    // loadSuggestionsFromFile swallows the parse error and returns [].
    expect(observations).toEqual([]);
  });

  it('suggestionsPath fallback: amigaSuggestionsPath absent but suggestionsPath provided', async () => {
    await store.addCandidates([makeSeqCandidate('seq-fallback')]);
    await store.transition('seq-fallback', 'dismissed');

    // Pass suggestionsPath but NOT amigaSuggestionsPath — the loader falls back.
    const observations = await loadObservationsForThreshold('amiga.min_sequence_count', {
      suggestionsPath,
    });

    expect(observations).toHaveLength(1);
    expect(observations[0]?.value).toBe(-1);
  });

  it('returns empty when neither amigaSuggestionsPath nor suggestionsPath is provided', async () => {
    const observations = await loadObservationsForThreshold('amiga.min_sequence_count', {});
    expect(observations).toEqual([]);
  });
});

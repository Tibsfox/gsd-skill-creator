/**
 * Verify ship — v1.49.951 (under #10428/#10438 verify-axis trigger; #10453 pattern).
 *
 * Closes the LAST bounded-learning verify-axis gap: the three `suggestions.*`
 * thresholds — the ORIGINAL calibratable thresholds (v1.49.795-797), wired
 * before the substrate-auto-emit pattern existed — never received the canonical
 * substrate -> calibration end-to-end test, while all four later thresholds did:
 *   - predictive.low_confidence_threshold -> v856
 *   - observation.retention_days          -> v894
 *   - token_budget.max_percent            -> v898
 *   - token_budget.warn_at_percent        -> v926
 * The `skill-creator cadence` verify axis flags exactly these three as the one
 * remaining integration-coverage gap.
 *
 * Unlike the four siblings, the `suggestions.*` class has no `runX()` substrate
 * and no per-event JSONL: its substrate is the `SuggestionStore` (the write side
 * of `/sc:suggest`), and all three thresholds read the SAME source —
 * `.planning/patterns/suggestions.json`. The operator's terminal accept/dismiss
 * decision on a surfaced suggestion IS the observation.
 *
 * This test proves the substrate-write -> calibration-read wire works
 * end-to-end against a REAL suggestions.json (in a temp dir). For each of the
 * three thresholds it:
 *   1. Creates a real `SuggestionStore` over a temp patterns dir.
 *   2. Adds a candidate (substrate write — `pending`) and transitions it to a
 *      terminal accept/dismiss decision (substrate write — `accepted`/`dismissed`).
 *   3. Calls `loadObservationsForThreshold('suggestions.<x>', { suggestionsPath })`
 *      (the calibration-read CALLER) and asserts the loop sees the operator
 *      decision with the correct polarity: accepted -> +1 (favors LOWERING the
 *      threshold so more patterns surface), dismissed -> -1 (favors RAISING it).
 *   Also: missing-file tolerance + malformed-file tolerance (reader contract).
 *
 * Note: per #10438, the existing unit tests against mocks prove the wire's
 * signature; THIS integration test against the real `SuggestionStore` +
 * `loadObservationsForThreshold` collaborators proves the wire's behavior.
 *
 * Each threshold gets its own explicit `it()` with a literal threshold argument
 * to `loadObservationsForThreshold(` so that BOTH the v1.49.950 string-presence
 * verify heuristic AND a stricter literal-argument wire detector recognize all
 * three thresholds as covered.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SuggestionStore } from '../../src/detection/suggestion-store.js';
import type { SkillCandidate } from '../../src/types/detection.js';
import { loadObservationsForThreshold } from '../../src/bounded-learning/observation-sources.js';

/** Minimal valid SkillCandidate — only `id` is load-bearing for the wire. */
function makeCandidate(id: string): SkillCandidate {
  return {
    id,
    type: 'command',
    pattern: `pattern-${id}`,
    occurrences: 5,
    confidence: 0.9,
    suggestedName: id,
    suggestedDescription: `demo candidate ${id}`,
    evidence: {
      firstSeen: 0,
      lastSeen: 0,
      sessionIds: [],
      coOccurringFiles: [],
      coOccurringTools: [],
    },
  };
}

describe('verify suggestions.* SuggestionStore -> calibration-loop read wire end-to-end (v1.49.951)', () => {
  let tempDir: string;
  let suggestionsPath: string;
  let store: SuggestionStore;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'suggestions-verify-'));
    suggestionsPath = join(tempDir, 'suggestions.json');
    // SuggestionStore writes <patternsDir>/suggestions.json; point both ends
    // at the same temp dir so the substrate write and calibration read agree.
    store = new SuggestionStore(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  /**
   * Substrate write: add a candidate (pending) then transition it to a terminal
   * operator decision. Returns the candidateId for traceability.
   */
  async function recordDecision(id: string, decision: 'accepted' | 'dismissed'): Promise<string> {
    await store.addCandidates([makeCandidate(id)]);
    await store.transition(id, decision);
    return id;
  }

  it('suggestions.min_occurrences: accepted -> +1, dismissed -> -1', async () => {
    await recordDecision('cand-min-accept', 'accepted');
    await recordDecision('cand-min-dismiss', 'dismissed');

    const observations = await loadObservationsForThreshold('suggestions.min_occurrences', {
      suggestionsPath,
    });

    // Only terminal decisions feed the loop (pending/deferred are filtered).
    expect(observations).toHaveLength(2);
    const values = observations.map((o) => o.value);
    expect(values.filter((v) => v === 1)).toHaveLength(1); // accepted
    expect(values.filter((v) => v === -1)).toHaveLength(1); // dismissed
    expect(values.reduce((s, v) => s + v, 0)).toBe(0); // net neutral
  });

  it('suggestions.cooldown_days: accepted decision reads as +1', async () => {
    await recordDecision('cand-cooldown-accept', 'accepted');

    const observations = await loadObservationsForThreshold('suggestions.cooldown_days', {
      suggestionsPath,
    });

    expect(observations).toHaveLength(1);
    // accepted -> +1 (favors LOWERING the threshold so more patterns surface).
    expect(observations[0]?.value).toBe(1);
  });

  it('suggestions.auto_dismiss_after_days: dismissed decision reads as -1', async () => {
    await recordDecision('cand-autodismiss-dismiss', 'dismissed');

    const observations = await loadObservationsForThreshold(
      'suggestions.auto_dismiss_after_days',
      { suggestionsPath },
    );

    expect(observations).toHaveLength(1);
    // dismissed -> -1 (favors RAISING the threshold so fewer noisy patterns surface).
    expect(observations[0]?.value).toBe(-1);
  });

  it('pending/deferred suggestions do NOT reach the calibration loop (terminal-only)', async () => {
    // Add a candidate but leave it pending (no transition).
    await store.addCandidates([makeCandidate('cand-pending')]);
    // Add and defer another.
    await store.addCandidates([makeCandidate('cand-deferred')]);
    await store.transition('cand-deferred', 'deferred');

    const observations = await loadObservationsForThreshold('suggestions.min_occurrences', {
      suggestionsPath,
    });

    // Neither pending nor deferred is a terminal accept/dismiss decision.
    expect(observations).toEqual([]);
  });

  it('multiple decisions accumulate; calibration loop sees correct counts + net polarity', async () => {
    await recordDecision('a1', 'accepted');
    await recordDecision('a2', 'accepted');
    await recordDecision('a3', 'accepted');
    await recordDecision('d1', 'dismissed');
    await recordDecision('d2', 'dismissed');

    const observations = await loadObservationsForThreshold('suggestions.cooldown_days', {
      suggestionsPath,
    });

    expect(observations).toHaveLength(5);
    const values = observations.map((o) => o.value);
    expect(values.filter((v) => v === 1)).toHaveLength(3);
    expect(values.filter((v) => v === -1)).toHaveLength(2);
    // Net polarity: +1 (more accepts than dismisses -> lower-threshold signal).
    expect(values.reduce((s, v) => s + v, 0)).toBe(1);
  });

  it('calibration loop returns empty when suggestions.json does not exist (missing-file tolerance)', async () => {
    const observations = await loadObservationsForThreshold('suggestions.min_occurrences', {
      suggestionsPath: join(tempDir, 'never-written.json'),
    });
    expect(observations).toEqual([]);
  });

  it('calibration loop tolerates a malformed suggestions.json (reader contract)', async () => {
    writeFileSync(suggestionsPath, '{not valid json', 'utf8');

    const observations = await loadObservationsForThreshold('suggestions.auto_dismiss_after_days', {
      suggestionsPath,
    });
    // loadSuggestionsFromFile swallows the parse error and returns [].
    expect(observations).toEqual([]);
  });
});

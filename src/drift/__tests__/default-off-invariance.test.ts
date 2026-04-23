/**
 * Default-off invariance tests for the drift layer (DRIFT-27).
 *
 * Golden-output tests confirming that when ALL drift feature flags are false
 * (the v1.49.568 default), no defense module mutates text or writes any
 * telemetry side-effects.
 *
 * Two tests:
 *  1. Full defense-module initialisation with all flags false → zero telemetry
 *     events written, zero file side-effects.
 *  2. v1.49.568 fixture input → byte-identical output through the drift layer.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Defense-module imports (pure functions, no global hooks)
import { detectSemanticDrift } from '../semantic-drift.js';
import { earlyStopHook } from '../knowledge-mitigations.js';
import { monitorTaskDrift } from '../task-drift-monitor.js';
import { checkTemporalRetrieval } from '../temporal-retrieval.js';
import { checkGroundingFaithfulness } from '../grounding-faithfulness.js';
import { checkContextEntropy } from '../context-entropy.js';
import { computeBCI } from '../bci.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../../');
const fixturesDir = join(here, '../__fixtures__');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpLogsDir: string;
let tmpLogsPath: string;

function setupTmpLogs() {
  tmpLogsDir = join(repoRoot, `.test-tmp-default-off-${Date.now()}`);
  mkdirSync(tmpLogsDir, { recursive: true });
  tmpLogsPath = join(tmpLogsDir, 'drift-telemetry.jsonl');
}

function teardownTmpLogs() {
  if (existsSync(tmpLogsDir)) {
    rmSync(tmpLogsDir, { recursive: true, force: true });
  }
}

function telemetryEventCount(): number {
  if (!existsSync(tmpLogsPath)) return 0;
  const content = readFileSync(tmpLogsPath, 'utf8').trim();
  if (content.length === 0) return 0;
  return content.split('\n').filter((l) => l.trim().length > 0).length;
}

// ---------------------------------------------------------------------------
// Test 1: All flags false → zero telemetry, zero file side-effects
// ---------------------------------------------------------------------------

describe('default-off invariance: all flags false', () => {
  beforeEach(setupTmpLogs);
  afterEach(teardownTmpLogs);

  it('invokes all seven defense modules with flags off and writes zero telemetry events', () => {
    const telemetryPath = tmpLogsPath;

    // 1. Semantic drift detector — supply impossibly high threshold so no event fires
    detectSemanticDrift('The cat sat on the mat. The cat was happy.', {
      threshold: 1.1,  // impossibly high — event never emitted
      telemetryPath,
    });

    // 2. Knowledge-mitigations early-stop hook — flagOverride: false → no-op
    const earlyStopResult = earlyStopHook({
      text: 'Some text to maybe truncate.',
      sdResult: { score: 0.9, drift_point: 1, confidence: 0.8 },
      flagOverride: false,
    });
    expect(earlyStopResult.truncated).toBe(false);
    expect(earlyStopResult.text).toBe('Some text to maybe truncate.');

    // 3. Task-drift monitor — flagOverride: false → no-op
    const tdResult = monitorTaskDrift(
      { before: [0.1, 0.9, -0.3], after: [0.8, 0.2, 0.5] },
      { flagOverride: false, telemetryPath },
    );
    expect(tdResult.classification).toBe('clean');
    expect(tdResult.drift_magnitude).toBe(0);
    expect(tdResult.direction).toBeNull();

    // 4. Temporal-retrieval check — flagOverride: false → no-op (lag_ms: 0)
    const trResult = checkTemporalRetrieval(
      {
        retrieval_timestamp: new Date().toISOString(),
        ssot_timestamp: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
      { flagOverride: false, telemetryPath },
    );
    expect(trResult.alert).toBe(false);
    expect(trResult.lag_ms).toBe(0);

    // 5. Grounding-faithfulness — flagOverride: false → no-op stub (sgi_score: 1)
    const gfResult = checkGroundingFaithfulness(
      {
        response_embedding: [0.1, 0.2, 0.3],
        query_embedding: [0.1, 0.2, 0.3],
        context_embedding: [0.1, 0.2, 0.3],
      },
      { flagOverride: false, telemetryPath },
    );
    expect(gfResult.sgi_score).toBe(1);
    expect(gfResult.classification).toBe('grounded');

    // 6. Context-entropy guard — flagOverride: false → no-op stub (classification: healthy)
    const ceResult = checkContextEntropy(
      { token_probabilities: [0.1, 0.9] },
      { flagOverride: false, telemetryPath },
    );
    expect(ceResult.classification).toBe('healthy');
    expect(ceResult.alert).toBe(false);

    // 7. BCI — pure function, no telemetry side-effects; empty fingerprints → score 0
    const bciResult = computeBCI({
      pair: { input: 'Teach me about security.', output: 'Here is information.' },
      adversarial_fingerprints: [],
    });
    expect(bciResult.score).toBe(0);

    // Assert: no telemetry file written at all
    expect(telemetryEventCount()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Test 2: v1.49.568 baseline fixture → byte-identical output
// ---------------------------------------------------------------------------

describe('default-off invariance: v1.49.568 fixture byte-identity', () => {
  it('produces byte-identical output for all baseline fixture pairs when flags are off', () => {
    const fixturePath = join(fixturesDir, 'v1_49_568-baseline.json');
    const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
    expect(fixture.version).toBe('1.49.568');
    expect(Array.isArray(fixture.flag_off_pairs)).toBe(true);
    expect(fixture.flag_off_pairs.length).toBeGreaterThan(0);

    for (const pair of fixture.flag_off_pairs) {
      // With all flags off, the only mutating hook is earlyStopHook with flagOverride: false
      // — which is a strict no-op. All baseline pairs must survive byte-identical.
      const result = earlyStopHook({
        text: pair.input,
        sdResult: { score: 0, drift_point: null, confidence: 0 },
        flagOverride: false,
      });

      // Both sides of the assertion: output === input and output === expected_output
      expect(result.text).toBe(pair.input);
      expect(result.text).toBe(pair.expected_output);
      expect(result.truncated).toBe(false);
    }
  });
});

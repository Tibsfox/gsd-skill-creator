/**
 * v1.49.671 Integration Meta-Test (Counter-Cadence Cluster cc-1)
 *
 * Counter-cadence milestone shipped at Lesson #10356 threshold-hit
 * (4-consecutive-same-calendar-day-degree-advance) post v1.49.670.
 * Converts 1 recurring manual fix into a deterministic gate.
 *
 * Gates exercised:
 *   C1 — pre-tag-gate.sh step 0.5 STATE.md normalizer auto-run
 *        (Lesson #10373: STATE.md drift recurrence at v669 + v670 ship).
 *        The new step runs `node tools/state-md-normalizer.mjs --write`
 *        before vitest so the C6 meta-test in v1-49-635 sees a clean
 *        STATE.md every invocation.
 *
 * Counter-cadence assertion: engine state matches predecessor v1.49.670.
 * NASA degree stays at 1.125. MUS/ELC/SPS/TRS SCAFFOLD-PENDING continues.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const STATE_MD_PATH = join(REPO_ROOT, '.planning/STATE.md');
const STATE_MD_AVAILABLE = existsSync(STATE_MD_PATH);

describe('v1.49.671 integration meta-test (Counter-Cadence Cluster cc-1)', () => {
  // ==========================================================================
  // C1 — pre-tag-gate.sh step 0.5 STATE.md normalizer auto-run
  // ==========================================================================
  it('C1 — pre-tag-gate.sh exposes step 0.5 STATE.md normalizer auto-run', () => {
    const gate = readFileSync(
      join(REPO_ROOT, 'tools/pre-tag-gate.sh'),
      'utf8',
    );

    // The new step exists, runs the normalizer with --write, and runs
    // BEFORE step 1 (npm run build) so vitest sees a normalized STATE.md
    // Step count became 15 at v1.49.716 when the NASA canonical-layout gate
    // was wired in as step 15/15.
    expect(gate).toMatch(/step 0\.5\/15: STATE\.md normalizer auto-run/);
    expect(gate).toMatch(/node tools\/state-md-normalizer\.mjs --write/);
    expect(gate).toMatch(/SC_SKIP_STATE_NORMALIZER/);

    // The step appears textually before step 1/15 (build)
    const step05Pos = gate.indexOf('step 0.5/15: STATE.md normalizer auto-run');
    const step1Pos = gate.indexOf('step 1/15: npm run build');
    expect(step05Pos).toBeGreaterThan(-1);
    expect(step1Pos).toBeGreaterThan(-1);
    expect(step05Pos).toBeLessThan(step1Pos);
  });

  it('C1 — step 0.5 cleans up the normalizer backup file', () => {
    const gate = readFileSync(
      join(REPO_ROOT, 'tools/pre-tag-gate.sh'),
      'utf8',
    );

    // The cleanup line targets the backup-before-normalize-* glob so the
    // working tree stays clean across ship cycles
    expect(gate).toMatch(/STATE\.md\.backup-before-normalize-\*/);
  });

  // ==========================================================================
  // Counter-cadence assertion: engine state matches predecessor v1.49.670
  // Scoped to v671-active-window: STATE.md may have moved past v671 by the
  // time later milestones run the suite; the cc-cluster contract is "NASA
  // unchanged from v670 close at v671 close", which only the v671 ship
  // commit-window can verify. Post-v671 invocations skip the assertion.
  // ==========================================================================
  it.runIf(STATE_MD_AVAILABLE)('counter-cadence — NASA degree at 1.125 (matches predecessor v1.49.670 close)', () => {
    const stateMd = readFileSync(STATE_MD_PATH, 'utf8');

    // Skip if STATE.md has moved past v671 — the cc-cluster invariant only
    // applies in v671's active window. Later milestones (v672+) carry NASA
    // 1.126+ legitimately as forward-cadence work resumes.
    if (!/^milestone:\s*v1\.49\.671\s*$/m.test(stateMd)) {
      return;
    }

    // Inside v671's active window: nasa_degree (when present) must be 125
    // because cc cluster does NOT advance NASA
    if (/^nasa_degree:/m.test(stateMd)) {
      expect(stateMd).toMatch(/^nasa_degree:\s*125\s*$/m);
    }
  });
});

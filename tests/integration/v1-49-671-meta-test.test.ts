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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();

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
    expect(gate).toMatch(/step 0\.5\/14: STATE\.md normalizer auto-run/);
    expect(gate).toMatch(/node tools\/state-md-normalizer\.mjs --write/);
    expect(gate).toMatch(/SC_SKIP_STATE_NORMALIZER/);

    // The step appears textually before step 1/14 (build)
    const step05Pos = gate.indexOf('step 0.5/14: STATE.md normalizer auto-run');
    const step1Pos = gate.indexOf('step 1/14: npm run build');
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
  // ==========================================================================
  it('counter-cadence — NASA degree at 1.125 (matches predecessor v1.49.670 close)', () => {
    // STATE.md is gitignored; skip if absent (CI / clean-repo path)
    const stateMdPath = join(REPO_ROOT, '.planning/STATE.md');
    let stateMd: string;
    try {
      stateMd = readFileSync(stateMdPath, 'utf8');
    } catch {
      // Absent in CI; counter-cadence engine-state assertion is local-only
      return;
    }

    // milestone field is v1.49.671 (current); nasa_degree (when present)
    // is 125 because cc cluster does NOT advance NASA
    expect(stateMd).toMatch(/^milestone:\s*v1\.49\.671\s*$/m);
    if (/^nasa_degree:/m.test(stateMd)) {
      expect(stateMd).toMatch(/^nasa_degree:\s*125\s*$/m);
    }
  });
});

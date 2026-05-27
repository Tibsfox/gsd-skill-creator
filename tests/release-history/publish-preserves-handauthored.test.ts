/**
 * v1.49.836 — publish.mjs destination-side hand-author preservation.
 *
 * Mirrors chapter.mjs C04 (v1.49.585) at the publisher layer. publish.mjs
 * copies `.planning/roadmap/<v>/<file>` to `docs/release-notes/<v>/chapter/<file>`
 * (and tibsfox.com staging). Without destination-side checks, a hand-authored
 * chapter at the destination is silently clobbered. v834/v835 incident
 * required `git checkout HEAD -- <chapters>` recovery on every ship.
 *
 * These tests exercise `shouldPublishToDestination` in isolation. The
 * end-to-end behavior is exercised when refresh.mjs + publish.mjs run inside
 * the T14 ship sequence.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error — publish.mjs is a Node-only tool script.
import { shouldPublishToDestination } from '../../tools/release-history/publish.mjs';

const HAND_AUTHORED = `# v1.49.835 — \`lowConfidenceThreshold\` Calibration Scaffold (Full)

**Released:** 2026-05-27

## What shipped

Adds \`'predictive.low_confidence_threshold'\` to \`CalibratableThreshold\` in \`src/bounded-learning/types.ts\`. Registers observation source as \`'predictive-low-confidence-events'\` with \`wired: false\`. \`loadObservationsForThreshold\` returns empty array — calibration loop yields \`direction: 'hold'\`, the honest baseline per v798 \`token_budget.max_percent\` precedent.

Closes the framework-registration gap left implicit at v830 when \`lowConfidenceThreshold\` was added to runtime config + threaded through copper/selector but not registered in the bounded-learning calibration framework.
`;

const AUTO_GENERATED = `> Following v1.49.834 — _ProcessContext Stale-Entry Cleanup (\`intelligence/analyzer/git.ts\`)_, v1.49.835 ships as \`lowConfidenceThreshold\` Calibration Scaffold (Full).
# v1.49.835 — \`lowConfidenceThreshold\` Calibration Scaffold (Full)
**Shipped:** 2026-05-27
**Commits:** 2 | **Files:** 15 | **Lines:** +475 / -22
_Parse confidence: 0.50 — source \`docs/release-notes/v1.49.835/README.md\`_
## Summary
No structured feature list was captured for this release; see the source README for prose details.
It also produced retrospective content (lessons_learned, surprises); see \`03-retrospective.md\`.
---
**Prev:** [v1.49.834](../v1.49.834/00-summary.md) · _(current tip)_
`;

describe('v1.49.836 — publish preserves hand-authored destination', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'publish-preserve-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('writes when destination does not exist', () => {
    const dest = join(tmp, 'missing.md');
    const result = shouldPublishToDestination(AUTO_GENERATED, dest, false);
    expect(result.write).toBe(true);
    expect(result.reason).toMatch(/did not exist/);
  });

  it('writes when destination is a stub (<200 bytes)', () => {
    const dest = join(tmp, 'stub.md');
    writeFileSync(dest, '# Stub\n');
    const result = shouldPublishToDestination(AUTO_GENERATED, dest, false);
    expect(result.write).toBe(true);
    expect(result.reason).toMatch(/stub/);
  });

  it('writes when destination opener matches source (prior copy / DB-derivable)', () => {
    const dest = join(tmp, 'prior-copy.md');
    writeFileSync(dest, AUTO_GENERATED);
    const result = shouldPublishToDestination(AUTO_GENERATED, dest, false);
    expect(result.write).toBe(true);
    expect(result.reason).toMatch(/opener matches source/);
  });

  it('PRESERVES when destination has hand-authored content (opener mismatch)', () => {
    const dest = join(tmp, 'hand-authored.md');
    writeFileSync(dest, HAND_AUTHORED);
    const result = shouldPublishToDestination(AUTO_GENERATED, dest, false);
    expect(result.write).toBe(false);
    expect(result.reason).toMatch(/non-derivable|preserved/);
  });

  it('--force-overwrite bypasses preservation', () => {
    const dest = join(tmp, 'hand-authored.md');
    writeFileSync(dest, HAND_AUTHORED);
    const result = shouldPublishToDestination(AUTO_GENERATED, dest, true);
    expect(result.write).toBe(true);
    expect(result.reason).toMatch(/force-overwrite/);
  });

  it('writes when source content drifted but destination is a prior copy', () => {
    const dest = join(tmp, 'prior-copy.md');
    writeFileSync(dest, AUTO_GENERATED);
    const updatedSource = AUTO_GENERATED.replace('+475 / -22', '+476 / -23');
    const result = shouldPublishToDestination(updatedSource, dest, false);
    expect(result.write).toBe(true);
  });
});

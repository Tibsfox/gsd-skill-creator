/**
 * Phase 826 / C13 — P4: Bundle emission speed
 *
 * emitBundle with 20 seeds completes in <500ms.
 * Advisory — warn on CI flakiness.
 *
 * Phase 826 / D-26-42.
 */

import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('P4/emit: emitBundle 20 seeds under 500ms (PERF — WARN ONLY)', () => {
  it('emitBundle × 20 seeds completes within 500ms', async () => {
    const { emitBundle } = await import('../../emitter/staging.js');
    const stagingRoot = mkdtempSync(join(tmpdir(), 'gsd-p4-'));

    try {
      const emissions = Array.from({ length: 20 }, (_, i) => ({
        request_id: `req_2026-05-02_0000_${i.toString().padStart(4, '0')}`,
        vision_doc: `# Vision ${i}\n\n${'Content line.\n'.repeat(50)}`,
        meta_json: JSON.stringify({ i, kind: 'mission_seed', skill: 'vision-to-mission' }),
      }));

      const start = performance.now();
      const result = emitBundle(
        emissions,
        { bundle_id: 'M-20260502-perf', yaml: 'bundle_id: M-20260502-perf\n' },
        stagingRoot,
      );
      const elapsed = performance.now() - start;

      if (elapsed > 500) {
        console.warn(`P4 PERF WARN: emitBundle × 20 took ${elapsed.toFixed(0)}ms (target: <500ms)`);
      }
      expect(elapsed).toBeLessThan(5000); // Hard limit
      expect(result.seedPaths).toHaveLength(20);
    } finally {
      rmSync(stagingRoot, { recursive: true, force: true });
    }
  });
});

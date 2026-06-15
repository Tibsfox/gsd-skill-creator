/**
 * nasa-consistency-gate wiring — drift-guard (2026-06-15).
 *
 * Pins that the NASA consistency-audit invariants are wired into the ship gate
 * as a BLOCKER, so the wiring cannot be silently removed. After the corpus
 * reached 221/221 clean (2026-06 consistency campaign + W6 backfill +
 * fabricated-citation fact-check), tools/nasa-consistency-audit.mjs gained a
 * --gate mode (corpus exits 1 on any findings) and tools/nasa-canonical-layout-
 * gate.sh (invoked by pre-tag-gate.sh step 15) delegates to it.
 *
 * Static string-parse only — no www/ dependency, so it runs in CI where the
 * gitignored NASA content is absent. Layer-1: tests/integration/*.test.ts runs
 * on every bare `npx vitest run` (pre-tag-gate step 2 + CI), like its sibling
 * tests/integration/pre-tag-gate-self-consistency.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const audit = readFileSync(join(REPO_ROOT, 'tools/nasa-consistency-audit.mjs'), 'utf8');
const layoutGate = readFileSync(join(REPO_ROOT, 'tools/nasa-canonical-layout-gate.sh'), 'utf8');
const preTagGate = readFileSync(join(REPO_ROOT, 'tools/pre-tag-gate.sh'), 'utf8');

describe('nasa consistency-audit → ship-gate wiring', () => {
  describe('audit --gate flag', () => {
    it('defines a --gate flag', () => {
      expect(audit).toMatch(/const GATE = process\.argv\.includes\('--gate'\)/);
    });

    it('exits 1 (BLOCK) when --gate and any mission has findings', () => {
      // The GATE branch must reach a non-zero exit on the dirty set.
      expect(audit).toMatch(/if \(GATE && dirty\.length\)[\s\S]*?process\.exit\(1\)/);
    });

    it('default (no --gate) corpus run still exits 0 — legacy callers preserved', () => {
      // The final unconditional exit stays 0; only --gate can make it non-zero.
      expect(audit).toMatch(/process\.exit\(0\);\n\}/);
    });
  });

  describe('layout gate delegates to the audit', () => {
    it('invokes nasa-consistency-audit.mjs with --gate', () => {
      expect(layoutGate).toMatch(/nasa-consistency-audit\.mjs["']? --gate/);
    });

    it('a consistency failure contributes to the gate exit code', () => {
      expect(layoutGate).toMatch(/consistency_fail=1/);
      expect(layoutGate).toMatch(/\|\| \(\( consistency_fail \)\); then\s*\n\s*exit 1/);
    });

    it('exposes the SC_SKIP_NASA_CONSISTENCY_AUDIT bypass', () => {
      expect(layoutGate).toMatch(/SC_SKIP_NASA_CONSISTENCY_AUDIT/);
    });

    it('skips the consistency sub-check on a partial --since-ver diagnostic', () => {
      // Guarded by SINCE == 0 so a partial run does not fail on unscanned missions.
      expect(layoutGate).toMatch(/\(\( SINCE == 0 \)\) && \[\[ -z "\$\{SC_SKIP_NASA_CONSISTENCY_AUDIT/);
    });
  });

  describe('pre-tag-gate documents the delegation', () => {
    it('step 15 header notes the consistency-audit delegation', () => {
      expect(preTagGate).toMatch(/nasa-consistency-audit\.mjs/);
      expect(preTagGate).toMatch(/SC_SKIP_NASA_CONSISTENCY_AUDIT/);
    });
  });
});

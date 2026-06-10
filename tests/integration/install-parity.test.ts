/**
 * Install source-installed parity drift-guard
 * (Ship 2, milestone v1.49.1028).
 *
 * Closes the deploy-layer observation gap identified in
 * .planning/AUDIT-2026-06-09-core-functions-retrospective.md §3.2 (MAJOR:
 * deploy layer unobserved): 11 source files were stale relative to the
 * installed .claude/ tree with no gate catching the drift.
 *
 * #10461 gate-enforce-every-runnable-surface + drift-guard pairing:
 *   - Layer 1 (enforcement): named install-parity.test.ts (NOT
 *     *.integration.test.ts), so the `root` vitest project runs it on every
 *     `npx vitest run` — pre-tag-gate step 2 + CI's test job — every ship,
 *     with no new shell step / denominator.
 *   - Layer 2 (drift-guard): pins (a) anti-vacuous: agent installed files
 *     contain marker blocks; source files do NOT; (b) parity: only the two
 *     intentional installed-newer agents differ; (c) no double-processing:
 *     raw differs-line count === deduped count (pins A2 autoDiscover fix);
 *     (d) marker-aware exception: removing the marker block from each agent's
 *     installed content restores byte-equality with the source file.
 *     Mutation-proven: reverting A2 fails test 3; editing a source agent
 *     without deploying fails test 4.
 *
 * The two intentional installed-newer agents carry locally-inserted marker
 * blocks that must NEVER be deployed (they would clobber the blocks):
 *   - .claude/agents/gsd-executor.md: injected-skills block (C5/C6)
 *   - .claude/agents/gsd-planner.md: capability-inheritance block
 *
 * NOTE: test spawns a child process via spawnSync but lives under tests/ —
 * the ProcessContext chokepoint audit covers src/ only.
 *
 * See SHIP-v1.49.1028-DESIGN.md §C.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const REPO = process.cwd();

// --- memoized dry-run output ---
// Spawn installer ONCE; parse all `differs: <target>` lines from stdout.
// dry-run exits 1 when warnings > 0, which is the steady state (2 intentional
// differs) — do NOT assert exit code 0; assert on parsed output.
let _dryRunResult: { raw: string; differsLines: string[]; differsSet: string[] } | null = null;
function getDryRunResult() {
  if (_dryRunResult) return _dryRunResult;
  const result = spawnSync(
    process.execPath,
    [join(REPO, 'project-claude', 'install.cjs'), '--dry-run'],
    { encoding: 'utf8', cwd: REPO },
  );
  const raw = result.stdout ?? '';
  // Parse all `  ⚠ differs: <target> (...)` lines, extract the target path.
  const differsLines: string[] = [];
  for (const line of raw.split('\n')) {
    const m = line.match(/differs:\s+(\S+)/);
    if (m) differsLines.push(m[1]);
  }
  const differsSet = [...new Set(differsLines)].sort();
  _dryRunResult = { raw, differsLines, differsSet };
  return _dryRunResult;
}

// Wrap everything that touches .claude/ in skipIf — CI checkouts have no
// .claude/ (wholly gitignored); local pre-tag-gate enforces the suite.
describe.skipIf(!existsSync(join(REPO, '.claude', 'skills')))(
  'install-parity drift-guard (audit §3.2, #10461 layer-1/layer-2)',
  () => {
    // ------------------------------------------------------------------ //
    // Test 1: ANTI-VACUOUS
    // ------------------------------------------------------------------ //
    describe('anti-vacuous: marker blocks present/absent in expected places', () => {
      it('installed gsd-executor.md contains injected-skills START marker', () => {
        const content = readFileSync(
          join(REPO, '.claude', 'agents', 'gsd-executor.md'),
          'utf8',
        );
        expect(content).toContain(
          '<!-- PROJECT:gsd-skill-creator:injected-skills START -->',
        );
      });

      it('installed gsd-executor.md contains injected-skills END marker', () => {
        const content = readFileSync(
          join(REPO, '.claude', 'agents', 'gsd-executor.md'),
          'utf8',
        );
        expect(content).toContain(
          '<!-- PROJECT:gsd-skill-creator:injected-skills END -->',
        );
      });

      it('installed gsd-planner.md contains capability-inheritance START marker', () => {
        const content = readFileSync(
          join(REPO, '.claude', 'agents', 'gsd-planner.md'),
          'utf8',
        );
        expect(content).toContain(
          '<!-- PROJECT:gsd-skill-creator:capability-inheritance START -->',
        );
      });

      it('installed gsd-planner.md contains capability-inheritance END marker', () => {
        const content = readFileSync(
          join(REPO, '.claude', 'agents', 'gsd-planner.md'),
          'utf8',
        );
        expect(content).toContain(
          '<!-- PROJECT:gsd-skill-creator:capability-inheritance END -->',
        );
      });

      it('source gsd-executor.md contains NO PROJECT:gsd-skill-creator markers', () => {
        const content = readFileSync(
          join(REPO, 'project-claude', 'agents', 'gsd-executor.md'),
          'utf8',
        );
        expect(content).not.toContain('PROJECT:gsd-skill-creator');
      });

      it('source gsd-planner.md contains NO PROJECT:gsd-skill-creator markers', () => {
        const content = readFileSync(
          join(REPO, 'project-claude', 'agents', 'gsd-planner.md'),
          'utf8',
        );
        expect(content).not.toContain('PROJECT:gsd-skill-creator');
      });
    });

    // ------------------------------------------------------------------ //
    // Test 2: PARITY (core)
    // ------------------------------------------------------------------ //
    it('parity: deduped differ-target set is exactly the two intentional agents', () => {
      const { differsSet } = getDryRunResult();
      expect(differsSet).toEqual([
        '.claude/agents/gsd-executor.md',
        '.claude/agents/gsd-planner.md',
      ]);
    });

    // ------------------------------------------------------------------ //
    // Test 3: NO DOUBLE-PROCESSING
    // Pins A2 autoDiscover claimed-set fix. Reverting the fix makes
    // skill-integration/SKILL.md, team-control/SKILL.md, and
    // gupp-propulsion/SKILL.md appear twice in the raw output.
    // ------------------------------------------------------------------ //
    it('no-double-processing: raw differs-line count equals deduped count', () => {
      const { differsLines, differsSet } = getDryRunResult();
      expect(differsLines.length).toBe(differsSet.length);
    });

    // ------------------------------------------------------------------ //
    // Test 4: MARKER-AWARE EXCEPTION GUARD
    // For each agent: installed content with the marker block removed must
    // equal the source file BYTE-EXACT.
    // Removal pattern: the block is a pure insertion of the form
    //   \n\n<!-- PROJECT:gsd-skill-creator:<id> START -->
    //   ...
    //   <!-- PROJECT:gsd-skill-creator:<id> END -->\n
    // appended after the last line of the source file. Replacing the full
    // insertion (\n\n<!-- START -->...<!-- END -->\n) with \n (the trailing
    // newline of the original source) restores byte equality.
    // ------------------------------------------------------------------ //
    describe('marker-aware exception guard: stripping block restores source byte-equality', () => {
      function stripMarkerBlock(content: Buffer, id: string): Buffer {
        // Match: \n\n<!-- PROJECT:gsd-skill-creator:<id> START -->
        //        ...everything (including newlines)...
        //        <!-- PROJECT:gsd-skill-creator:<id> END -->\n
        // Replace with: \n  (the trailing newline of the original source)
        const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(
          `\\n\\n<!-- PROJECT:gsd-skill-creator:${escapedId} START -->[\\s\\S]*?<!-- PROJECT:gsd-skill-creator:${escapedId} END -->\\n`,
        );
        const str = content.toString('binary');
        const stripped = str.replace(pattern, '\n');
        return Buffer.from(stripped, 'binary');
      }

      it('gsd-executor.md: stripped installed == source bytes', () => {
        const installed = readFileSync(
          join(REPO, '.claude', 'agents', 'gsd-executor.md'),
        );
        const source = readFileSync(
          join(REPO, 'project-claude', 'agents', 'gsd-executor.md'),
        );
        const stripped = stripMarkerBlock(installed, 'injected-skills');
        expect(stripped.length).toBe(source.length);
        expect(stripped.equals(source)).toBe(true);
      });

      it('gsd-planner.md: stripped installed == source bytes', () => {
        const installed = readFileSync(
          join(REPO, '.claude', 'agents', 'gsd-planner.md'),
        );
        const source = readFileSync(
          join(REPO, 'project-claude', 'agents', 'gsd-planner.md'),
        );
        const stripped = stripMarkerBlock(installed, 'capability-inheritance');
        expect(stripped.length).toBe(source.length);
        expect(stripped.equals(source)).toBe(true);
      });
    });
  },
);

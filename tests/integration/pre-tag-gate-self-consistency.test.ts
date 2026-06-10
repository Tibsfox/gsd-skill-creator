/**
 * pre-tag-gate self-consistency — denominator parity + legend accuracy +
 * exit-code uniqueness/completeness  (Ship 0.2, milestone v1.49.966).
 *
 * Three #10461-class drift findings inside tools/pre-tag-gate.sh, each closed in
 * v966 and pinned here by a Layer-2 drift-guard (sibling of
 * tests/integration/bypass-vocab-parity.test.ts):
 *
 *   A. STEP-DENOMINATOR PARITY. The gate prints `step X/Y` labels. Pre-v966 the
 *      denominator Y had drifted: early steps were frozen at /15 while later
 *      additions ran a "running total" (15/16, 16/16, ... 20/20). v966 normalized
 *      every Y to the canonical count — the max integer step number, which is also
 *      the "all N checks PASS" final-summary count. This pins all three quantities
 *      EQUAL, so a future step-addition that bumps the summary but forgets a
 *      denominator (or vice-versa) fails loudly here.
 *
 *   B. EXIT-CODE LEGEND ACCURACY. The header "Exit codes:" legend claimed exit 15
 *      (discipline-coverage) and exit 19 (project-md) were "default WARN-only", but
 *      BOTH default-BLOCK above a ceiling (v822 UNCODIFIED + v912 PARTIAL for
 *      discipline-coverage; SC_PROJECT_MD_MAX_PATCH_DRIFT for project-md). v966
 *      corrected the two entries. The genuinely-WARN-only entries (10/13/14/16/23)
 *      are the positive control: if one of THOSE ever gains a default-BLOCK path,
 *      the author must update both the code and the legend (this test fails until
 *      they do).
 *
 *   C. EXIT-CODE UNIQUENESS + LEGEND COMPLETENESS. exit code 21 collided — tools-suite
 *      (v913) AND state-backups (v961) both used it. The v961 author believed 21 was
 *      "unused"; full enumeration was skipped (the same failure the v965 review's
 *      exit-22 collision exposed — see the post-v965 handoff process-learning #1).
 *      v966 reassigned state-backups 21 -> 24. This block enumerates EVERY emitted
 *      `exit N` and EVERY legend entry — operationalizing "verify exit-code
 *      uniqueness by FULL enumeration" as a permanent gate: the legend has no
 *      duplicate code, and the legend's documented codes are EXACTLY the emitted
 *      non-zero set (exit 28 + 76 were added to the legend in v966).
 *
 * Layer-1 enforcement: this is tests/integration/*.test.ts (NOT *.integration.test.ts),
 * so the `root` vitest project runs it on every bare `npx vitest run` — pre-tag-gate
 * step 2 + CI's test job — every ship.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const GATE_PATH = join(REPO_ROOT, 'tools/pre-tag-gate.sh');
const gate = readFileSync(GATE_PATH, 'utf8');

// ---- parsers ----

/** Every `step X/Y` label (comment headers + log lines). */
function extractStepLabels(src: string): Array<{ num: number; den: number }> {
  const out: Array<{ num: number; den: number }> = [];
  // \s+ (not a literal space) so a future "step  13/20" reformat is still parsed.
  for (const m of src.matchAll(/step\s+([0-9.]+)\/([0-9]+)/g)) {
    out.push({ num: Number(m[1]), den: Number(m[2]) });
  }
  return out;
}

/** The "all N checks PASS" final-summary count. */
function extractSummaryCount(src: string): number {
  const m = src.match(/all (\d+) checks PASS/);
  if (!m) throw new Error('final "all N checks PASS" summary not found');
  return Number(m[1]);
}

/**
 * The header "Exit codes:" legend, parsed to `{code, desc}[]`. Bounded to the
 * contiguous comment block between "# Exit codes:" and the first blank `#` line so a
 * later `#   <number>  ...` comment cannot leak in. Returns an ARRAY (not a Map) so a
 * duplicate code is visible to the uniqueness assertion below.
 */
function extractLegend(src: string): Array<{ code: number; desc: string }> {
  const startIdx = src.indexOf('# Exit codes:');
  if (startIdx === -1) throw new Error('"# Exit codes:" legend block not found');
  const lines = src.slice(startIdx).split('\n');
  const entries: Array<{ code: number; desc: string }> = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('#')) break; // end of the comment block
    if (line.trim() === '#') break; // blank separator ends the legend
    const m = line.match(/^#\s+(\d+)\s{2,}(.+)$/);
    if (m) entries.push({ code: Number(m[1]), desc: m[2].trim() });
  }
  return entries;
}

/** Every emitted `exit N` (including the trailing `exit 0`). */
function extractEmittedExitCodes(src: string): number[] {
  const out: number[] = [];
  // `exit\s+` (one-or-more whitespace), NOT a literal single space: the shell accepts
  // `exit  24` / `exit\t24`, so a single-space pattern would silently drop a future
  // oddly-spaced code from the enumeration and let it slip past COMPLETENESS below.
  for (const m of src.matchAll(/^\s*exit\s+(\d+)\b/gm)) out.push(Number(m[1]));
  return out;
}

const occurrences = (src: string, re: RegExp): number => (src.match(re) || []).length;
const sortedNums = (xs: Iterable<number>): number[] => [...xs].sort((a, b) => a - b);

const labels = extractStepLabels(gate);
const legend = extractLegend(gate);
const legendCodes = legend.map((e) => e.code);
const legendByCode = new Map(legend.map((e) => [e.code, e.desc] as const));
const emitted = extractEmittedExitCodes(gate);
const emittedNonZero = emitted.filter((c) => c !== 0);

describe('pre-tag-gate self-consistency (Ship 0.2)', () => {
  // ====================================================================
  // A — step-denominator parity
  // ====================================================================
  describe('A — step-denominator parity', () => {
    it('ANTI-VACUOUS — the parser found a substantial set of step labels', () => {
      // Floor well below the live count (107) — only guards against a parser
      // break producing an empty set that makes the parity checks vacuous.
      expect(labels.length).toBeGreaterThanOrEqual(20);
    });

    it('PARITY — every step label shares ONE denominator', () => {
      const dens = new Set(labels.map((l) => l.den));
      expect([...dens]).toEqual([21]); // canonical count: v966 normalized, v983 bumped 20→21 (step 21 trip-vocab)
    });

    it('PARITY — the shared denominator equals the "all N checks PASS" summary count', () => {
      const dens = [...new Set(labels.map((l) => l.den))];
      expect(dens).toHaveLength(1);
      expect(dens[0]).toBe(extractSummaryCount(gate));
    });

    it('PARITY — the shared denominator equals the highest integer step number', () => {
      const maxStep = Math.max(...labels.map((l) => l.num));
      const dens = [...new Set(labels.map((l) => l.den))];
      expect(dens[0]).toBe(maxStep);
      expect(maxStep).toBe(extractSummaryCount(gate));
    });

    it('ANCHOR — an early step (0.5) and the last step (21) both carry the canonical /21', () => {
      // Pins that the normalization reached the early steps (the pre-v966 /15 region)
      // AND the running-total tail — a partial revert trips one of these. v983 bumped
      // the canonical denominator 20→21 when step 21 (trip-vocab) was added.
      expect(gate).toMatch(/step 0\.5\/21:/);
      expect(gate).toMatch(/step 21\/21:/);
      expect(gate).not.toMatch(/step [0-9.]+\/15:/); // the frozen /15 denominator is gone
      expect(gate).not.toMatch(/step [0-9.]+\/20:/); // the pre-v983 /20 denominator is gone
    });
  });

  // ====================================================================
  // B — exit-code legend accuracy
  // ====================================================================
  describe('B — exit-code legend accuracy', () => {
    it('exit 15 (discipline-coverage) is documented as default-BLOCK, NOT "default WARN-only"', () => {
      const desc = legendByCode.get(15);
      expect(desc).toBeDefined();
      expect(desc!).not.toMatch(/default WARN-only/i);
      expect(desc!).toMatch(/ceiling|BLOCK/);
    });

    it('exit 19 (project-md) is documented as default-BLOCK, NOT "default WARN-only"', () => {
      const desc = legendByCode.get(19);
      expect(desc).toBeDefined();
      expect(desc!).not.toMatch(/default WARN-only/i);
      expect(desc!).toMatch(/patch-drift|BLOCK/);
    });

    it('POSITIVE CONTROL — the genuinely WARN-only steps still say "default WARN-only"', () => {
      // 10 apply-to-self · 13 citation-debt-sync · 14 story-drift · 16 sps-cohort-uniqueness —
      // all block ONLY under the require flag (verified against the gate_required guards in
      // the step bodies). 23 adoption-freshness and 25 trip-vocab were WARN-only until
      // v1.49.1029 when they were promoted to default-BLOCK. If one gains a ceiling-BLOCK
      // path, this fails until both code and legend are updated.
      for (const code of [10, 13, 14, 16]) {
        const desc = legendByCode.get(code);
        expect(desc, `legend entry for exit ${code}`).toBeDefined();
        expect(desc!, `exit ${code} should remain default WARN-only`).toMatch(/default WARN-only/i);
      }
    });

    it('exit 23 (adoption-freshness) is documented as default-BLOCK, NOT "default WARN-only"', () => {
      const desc = legendByCode.get(23);
      expect(desc).toBeDefined();
      expect(desc!).not.toMatch(/default WARN-only/i);
      expect(desc!).toMatch(/BLOCKER as of v1\.49\.1029/);
    });

    it('exit 25 (trip-vocab) is documented as default-BLOCK, NOT "default WARN-only"', () => {
      const desc = legendByCode.get(25);
      expect(desc).toBeDefined();
      expect(desc!).not.toMatch(/default WARN-only/i);
      expect(desc!).toMatch(/BLOCKER as of v1\.49\.1029/);
    });
  });

  // ====================================================================
  // C — exit-code uniqueness + legend completeness (full enumeration)
  // ====================================================================
  describe('C — exit-code uniqueness + legend completeness', () => {
    it('ANTI-VACUOUS — both enumerations found substantial sets', () => {
      expect(legendCodes.length).toBeGreaterThanOrEqual(20);
      expect(emittedNonZero.length).toBeGreaterThanOrEqual(20);
    });

    it('the exit-21 collision is resolved — tools-suite owns 21, state-backups owns 24', () => {
      // Mirrors the v965 review's exit-22->23 fix pinned by v1-49-965-meta-test C4.
      expect(occurrences(gate, /^\s*exit\s+21\b/gm)).toBe(1); // tools-suite, alone
      expect(occurrences(gate, /^\s*exit\s+24\b/gm)).toBe(1); // state-backups, alone
      // The state-backups step body now exits 24 (not the colliding 21).
      expect(gate).toMatch(/state-md-clean-backups[\s\S]*?\n\s*exit\s+24\b/);
    });

    it('UNIQUENESS — the exit-code legend has no duplicate code', () => {
      // Directly catches the v961-style mistake: documenting/using a code already taken.
      expect(legendCodes.length).toBe(new Set(legendCodes).size);
    });

    it('COMPLETENESS — the legend documents EXACTLY the emitted non-zero exit codes', () => {
      // Bidirectional: no emitted code is undocumented (caught exit 28 + 76 in v966),
      // and no legend code lacks an emitter. Code 0 (success) is legend-only by design.
      const documented = new Set(legendCodes);
      documented.delete(0);
      expect(sortedNums(new Set(emittedNonZero))).toEqual(sortedNums(documented));
    });
  });
});

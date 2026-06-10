/**
 * Adversarial ship-review discipline — drift-guard (v1.49.968 Ship 1.1;
 * extended v1.49.1029 Ship 3 for the v2 judge stage).
 *
 * Ship 1.1 codifies the project's empirically-best QA mechanism (the ad-hoc
 * "adversarial Workflow review" that caught real defects pre-push in v965, v966,
 * and 11/35 F4 ships) as a load-bearing T14 step. Ship 3 (v1.49.1029) folds in
 * the NASA 4-auditor judge IP (AUDIT-2026-06-09 §4b): a cross-lens synthesis
 * judge with independent re-read, an exception allow-list of known-correct
 * steady states, and a 3-way verdict enum. Three surfaces must stay in
 * sync, and one learned isolation invariant must not silently regress:
 *
 *   1. tools/ship-review/adversarial-ship-review.mjs — the reusable Workflow script.
 *   2. docs/adversarial-ship-review.md               — the canonical process doc.
 *   3. docs/T14-SHIP-SEQUENCE.md                      — the step that triggers it.
 *
 * This is the #10461 "gate-enforce-every-runnable-surface + drift-guard pairing"
 * applied to a documented-process surface:
 *   - Layer 1 (enforcement): this is tests/integration/*.test.ts (NOT
 *     *.integration.test.ts), so the `root` vitest project runs it on every bare
 *     `npx vitest run` — pre-tag-gate step 2 + CI — every ship.
 *   - Layer 2 (drift-guard): the assertions below pin the workflow's structural
 *     contract, the cross-references between the three surfaces, and the
 *     read-only/no-worktree isolation invariant (feedback_workflow-agents-
 *     invalidate-file-read-state). Deleting the step, the doc, or the workflow —
 *     or switching reviewers to worktree isolation — fails here.
 *
 * Why pin "no worktree isolation": a fresh worktree lacks node_modules, so tsx/
 * vitest probes fail there; the learned best practice (v963/v964) is read-only
 * Explore reviewers + additive-only probes. A future edit that adds
 * `isolation: 'worktree'` to the reviewer agents would reintroduce the failure
 * mode and must be a deliberate act that updates this pin.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const WORKFLOW_PATH = join(REPO_ROOT, 'tools/ship-review/adversarial-ship-review.mjs');
const DOC_PATH = join(REPO_ROOT, 'docs/adversarial-ship-review.md');
const T14_PATH = join(REPO_ROOT, 'docs/T14-SHIP-SEQUENCE.md');

// The five review lenses are the load-bearing structure of the workflow. They are
// the dimension `key:` values in ALL_DIMENSIONS; parity-pinned so a renamed/dropped
// lens is caught.
const EXPECTED_DIMENSIONS = [
  'correctness',
  'scope',
  'guard-soundness',
  'doc-accuracy',
  'security',
];

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

// Extract the dimension keys declared in the workflow's ALL_DIMENSIONS array. Each
// entry opens with `key: '<name>',` — capture those literals.
function extractDimensionKeys(src: string): Set<string> {
  const keys = new Set<string>();
  for (const m of src.matchAll(/^\s*key:\s*'([a-z0-9-]+)'\s*,/gm)) {
    keys.add(m[1]);
  }
  return keys;
}

const sorted = (s: Iterable<string>): string[] => [...s].sort();

describe('adversarial ship-review discipline — drift-guard (v1.49.968 Ship 1.1)', () => {
  it('ANTI-VACUOUS — all three surfaces exist and are substantial', () => {
    for (const p of [WORKFLOW_PATH, DOC_PATH, T14_PATH]) {
      expect(existsSync(p), `${p} must exist`).toBe(true);
      expect(statSync(p).size).toBeGreaterThan(400);
    }
  });

  it('WORKFLOW — declares the five review lenses (parity with EXPECTED_DIMENSIONS)', () => {
    const keys = extractDimensionKeys(read(WORKFLOW_PATH));
    expect(sorted(keys)).toEqual(sorted(EXPECTED_DIMENSIONS));
  });

  it('WORKFLOW — is a valid Workflow script with a Review→Verify→Judge shape', () => {
    const src = read(WORKFLOW_PATH);
    expect(src).toMatch(/export const meta\s*=/);
    expect(src).toContain("name: 'adversarial-ship-review'");
    // All three phases present; review→verify pipelined, judge after.
    expect(src).toMatch(/phase:\s*'Review'/);
    expect(src).toMatch(/phase:\s*'Verify'/);
    expect(src).toMatch(/phase:\s*'Judge'/);
    expect(src).toMatch(/\bpipeline\s*\(/);
  });

  it('WORKFLOW — reviewers, refuters, and the judge are read-only Explore agents, NEVER worktree-isolated', () => {
    const src = read(WORKFLOW_PATH);
    // Read-only enforcement: the Explore agentType has no Edit/Write in its toolkit.
    // Exact-count parity (3 agent sites: review lens, per-finding refuter, synthesis
    // judge) — dropping Explore from ANY of them is caught, not hidden by the others.
    const exploreSites = src.match(/agentType:\s*'Explore'/g) ?? [];
    expect(exploreSites.length).toBe(3);
    // The learned isolation invariant: reviewers must not use worktree isolation
    // (fresh worktree lacks node_modules → probes fail). Pin the ABSENCE of the
    // isolation option so adding it back is a deliberate, guard-updating act.
    expect(src).not.toMatch(/isolation:\s*'worktree'/);
  });

  it('WORKFLOW v2 — cross-lens judge: 3-way verdict enum, no-resurrection rule, fail-safe fallback', () => {
    const src = read(WORKFLOW_PATH);
    // The 3-way verdict enum (NASA judge IP) — all three literals present, and
    // wired as a schema enum (not just prose).
    for (const v of ['real-fix-now', 'real-minor-optional', 'rejected-false-positive']) {
      expect(src, `3-way verdict literal "${v}" must be present`).toContain(`'${v}'`);
    }
    expect(src).toMatch(/verdict:\s*\{\s*type:\s*'string',\s*enum:\s*\['real-fix-now'/);
    // The judge may not resurrect refuter-rejected findings (context only).
    expect(src).toMatch(/NOT resurrect/);
    // Fail-safe: a dead judge (null) with confirmed findings must degrade to
    // all-confirmed-are-fix-now, never silently drop a confirmed defect.
    expect(src).toMatch(/fail-safe/i);
    expect(src).toMatch(/JUDGE UNAVAILABLE/);
  });

  it('WORKFLOW v2 — exception allow-list: standing steady-states + args.exceptions, injected into prompts', () => {
    const src = read(WORKFLOW_PATH);
    // The standing allow-list exists and is non-empty (INV-1 STORY-drift is the
    // canonical first entry).
    expect(src).toMatch(/STANDING_EXCEPTIONS\s*=\s*\[/);
    expect(src).toMatch(/STORY-drift/);
    // Ship-specific exceptions arrive via args and are CONCATENATED (standing list
    // can never be silently replaced by a caller).
    expect(src).toMatch(/STANDING_EXCEPTIONS\.concat/);
    // The combined list is injected into the shared prompt context used by every
    // reviewer/refuter/judge agent.
    expect(src).toMatch(/exceptionsBlock\(\)/);
  });

  it('WORKFLOW v2 — findings carry enum severity + confidence', () => {
    const src = read(WORKFLOW_PATH);
    expect(src).toMatch(/enum:\s*\['BLOCKER',\s*'MAJOR',\s*'MINOR',\s*'INFO'\]/);
    expect(src).toMatch(/required:\s*\['severity',\s*'title',\s*'detail',\s*'location',\s*'confidence'\]/);
  });

  it('T14 — the ship sequence references the pre-push review step + the workflow', () => {
    const t14 = read(T14_PATH);
    expect(t14).toMatch(/adversarial[\s-]?ship[\s-]?review|Adversarial ship review/i);
    expect(t14).toContain('tools/ship-review/adversarial-ship-review.mjs');
    expect(t14).toContain('docs/adversarial-ship-review.md');
    // It is a PRE-PUSH step (runs before `git push origin dev`).
    expect(t14).toMatch(/PRE-PUSH|before `git push origin dev`/);
  });

  it('CANONICAL DOC — documents the lenses, isolation discipline, and staged promotion', () => {
    const doc = read(DOC_PATH);
    expect(doc).toContain('tools/ship-review/adversarial-ship-review.mjs');
    // The doc names the learned isolation discipline.
    expect(doc).toMatch(/Explore/);
    expect(doc).toMatch(/worktree/);
    // Promotion lineage (#10463): staged advisory rung → gate-enforced at v1029.
    expect(doc).toMatch(/#10463|[Ss]taged/);
    // Every expected lens is named in the doc's lens list.
    for (const dim of EXPECTED_DIMENSIONS) {
      expect(doc, `canonical doc should name the "${dim}" lens`).toMatch(
        new RegExp(dim.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i'),
      );
    }
    // v2: the doc documents the synthesis judge and the 3-way verdict semantics.
    expect(doc).toMatch(/synthesis judge/i);
    expect(doc).toContain('real-fix-now');
    expect(doc).toContain('real-minor-optional');
    expect(doc).toContain('rejected-false-positive');
  });
});

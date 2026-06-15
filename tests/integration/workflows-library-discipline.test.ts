/**
 * Workflows library discipline — drift-guard (v1.49.1031 Ship 5).
 *
 * Ship 5 promotes the generic skeletons of the untracked NASA-ops machinery
 * (AUDIT-2026-06-09 nasa-ops-machinery lens, PROMOTE verdict) into the
 * committed `tools/workflows/` library. The promoted IP is exactly the
 * knowledge that clone-chains lose:
 *
 *   - the ANCHOR-LEAK guard (born from the caught v1023 Dawn defect, held 3
 *     consecutive clean ships, yet present in only 3/11 review and 3/6 build
 *     clones — clone-selection silently regressed it);
 *   - the rotation-vs-continuation SHARED-prompt flip (previously one
 *     untracked handoff paragraph);
 *   - the read-only Explore pinning for review/audit agents (absent from ALL
 *     untracked clones — a content auditor could mutate the pages under
 *     review);
 *   - the multi-wave audit topology with refuters over EVERY fresh-claim wave.
 *
 * Four surfaces must stay in sync:
 *   1. tools/workflows/content-adversarial-review.mjs — 4-auditor + judge content review.
 *   2. tools/workflows/decompose-build.mjs            — page + artifact-tree DECOMPOSE-build.
 *   3. tools/workflows/audit-harness.mjs              — retrospective-audit harness.
 *   4. docs/workflows-library.md                      — the canonical process doc;
 *      plus the cross-referencing docs (NASA discipline §0 + its #10408
 *      supersession = audit Lead A; T14 NASA appendix; sub-agent-dispatch
 *      #10408 annotation).
 *
 * Layering follows adversarial-ship-review-discipline.test.ts: this file is
 * tests/integration/*.test.ts (NOT *.integration.test.ts), so the root vitest
 * project runs it on every bare `npx vitest run` — pre-tag-gate + CI — every
 * ship. The scripts are Workflow-runtime scripts (top-level return; injected
 * agent/parallel/phase/log/args/budget globals), so assertions pin structure
 * via source text, the same proven approach as the sibling guard.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const REVIEW_PATH = join(REPO_ROOT, 'tools/workflows/content-adversarial-review.mjs');
const BUILD_PATH = join(REPO_ROOT, 'tools/workflows/decompose-build.mjs');
const AUDIT_PATH = join(REPO_ROOT, 'tools/workflows/audit-harness.mjs');
const DOC_PATH = join(REPO_ROOT, 'docs/workflows-library.md');
const NASA_DOC_PATH = join(REPO_ROOT, 'docs/nasa-mission-authoring-discipline.md');
const T14_PATH = join(REPO_ROOT, 'docs/T14-SHIP-SEQUENCE.md');
const DISPATCH_DOC_PATH = join(REPO_ROOT, 'docs/sub-agent-dispatch-discipline.md');

// The full DECOMPOSE-build task roster — parity-pinned so a renamed or dropped
// task is caught. The first 7 are the page decomposition identical across all 6
// untracked ancestor builds (evidence fleet wf_28691c0e). The 4 artifacts-*/
// retro-forest tasks were added 2026-06-15 to close W6 collapse debt (the
// original 8 tasks dropped the artifact tree, retrospective chain, and forest
// module from every forward degree). 'readme' is the conditional task (args.readme).
const EXPECTED_BUILD_TASKS = [
  'index.html',
  'research',
  'organism',
  'math-sim',
  'papers-curriculum',
  'jsons',
  'pointers-shader',
  'artifacts-story-audio',
  'artifacts-circuits',
  'artifacts-sims',
  'retro-forest',
  'readme',
];

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

// Extract `label: '<name>'` literals from a workflow script's task/auditor arrays.
function extractLabels(src: string): Set<string> {
  const labels = new Set<string>();
  for (const m of src.matchAll(/^\s*label:\s*'([^']+)'\s*,/gm)) {
    labels.add(m[1]);
  }
  return labels;
}

const sorted = (s: Iterable<string>): string[] => [...s].sort();

describe('workflows library discipline — drift-guard (v1.49.1031 Ship 5)', () => {
  it('ANTI-VACUOUS — all three skeletons + canonical doc exist and are substantial', () => {
    for (const p of [REVIEW_PATH, BUILD_PATH, AUDIT_PATH, DOC_PATH]) {
      expect(existsSync(p), `${p} must exist`).toBe(true);
      expect(statSync(p).size).toBeGreaterThan(2000);
    }
  });

  describe('content-adversarial-review.mjs', () => {
    it('is a Workflow script with the 4-auditor + judge topology', () => {
      const src = read(REVIEW_PATH);
      expect(src).toMatch(/export const meta\s*=/);
      expect(src).toContain("name: 'content-adversarial-review'");
      // The invariant auditor roster: 2 fact clusters + framing/anchor + structure/leak.
      const labels = extractLabels(src);
      for (const l of ['fact:cluster-a', 'fact:cluster-b', 'framing:anchor-canonicality', 'structure:leak-nav-shader']) {
        expect(labels.has(l), `auditor label "${l}" must be present`).toBe(true);
      }
      expect(src).toMatch(/phase\('Audit'\)/);
      expect(src).toMatch(/phase\('Synthesize'\)/);
      expect(src).toMatch(/label:\s*'judge:synthesis'/);
    });

    it('pins auditors AND judge as read-only Explore agents, never worktree-isolated', () => {
      const src = read(REVIEW_PATH);
      // Exact-count parity: 4 auditors (one shared dispatch site) + judge would
      // undercount — pin the literal sites: the auditors' parallel dispatch and
      // the judge call each carry agentType 'Explore'. 2 sites minimum, and no
      // non-Explore agentType anywhere in this file.
      const exploreSites = src.match(/agentType:\s*'Explore'/g) ?? [];
      expect(exploreSites.length).toBe(2); // auditor dispatch site + judge site
      expect(src).not.toMatch(/agentType:\s*'general-purpose'/);
      expect(src).not.toMatch(/isolation:\s*'worktree'/);
    });

    it('carries the ANCHOR-LEAK guard as a first-class auditor duty', () => {
      const src = read(REVIEW_PATH);
      expect(src).toMatch(/ANCHOR CANONICALITY/);
      expect(src).toMatch(/canonicalAnchors/);
      // Predecessor anchors must be flagged when stamped at the current version,
      // and the research.html/research.md sets must match.
      expect(src).toMatch(/research\.html and research\.md stamp DIFFERENT anchor sets/);
    });

    it('commits the rotation|continuation mode flip', () => {
      const src = read(REVIEW_PATH);
      expect(src).toMatch(/'rotation',\s*'continuation'|\['rotation',\s*'continuation'\]/);
      expect(src).toMatch(/MODE = ROTATION/);
      expect(src).toMatch(/MODE = CONTINUATION/);
      // Rotation: everything predecessor is a leak except the single nav-prev note.
      expect(src).toMatch(/SINGLE deliberate nav-prev/);
      // Continuation: shared axis vocabulary is never a leak.
      expect(src).toMatch(/SHARED and CORRECT/);
    });

    it('judge: 3-way verdict enum (schema-wired), independent re-read, aggressive FP rejection, fail-safe', () => {
      const src = read(REVIEW_PATH);
      for (const v of ['real-fix-now', 'real-minor-optional', 'rejected-false-positive']) {
        expect(src, `3-way verdict literal "${v}" must be present`).toContain(`'${v}'`);
      }
      expect(src).toMatch(/verdict:\s*\{\s*type:\s*'string',\s*enum:\s*\['real-fix-now'/);
      // Anti-hallucination: the judge re-reads the cited file itself.
      expect(src).toMatch(/really present/);
      expect(src).toMatch(/false positives AGGRESSIVELY|Reject false positives/i);
      expect(src).toMatch(/CRITICAL EXCEPTIONS/);
      // A dead judge must never silently pass the review.
      expect(src).toMatch(/JUDGE UNAVAILABLE/);
    });

    it('payload discipline: leak vocabulary arrives via args, and required args fail loudly', () => {
      const src = read(REVIEW_PATH);
      expect(src).toMatch(/leakVocab/);
      expect(src).toMatch(/throw new Error\(/);
      // args may arrive as a JSON string on scriptPath invocations.
      expect(src).toMatch(/JSON\.parse\(args\)/);
      // Return contract proven across all 11 ancestors.
      expect(src).toMatch(/rawCount/);
      expect(src).toMatch(/allConfirmed/);
      expect(src).toMatch(/fixNow/);
    });
  });

  describe('decompose-build.mjs', () => {
    it('is a Workflow script with the full page + artifact-tree task roster', () => {
      const src = read(BUILD_PATH);
      expect(src).toMatch(/export const meta\s*=/);
      expect(src).toContain("name: 'decompose-build'");
      const labels = extractLabels(src);
      expect(sorted(labels)).toEqual(sorted(EXPECTED_BUILD_TASKS));
      expect(src).toMatch(/phase\('Rewrite'\)/);
      expect(src).toMatch(/\bparallel\s*\(/);
    });

    it('W6-debt closure: covers the artifact tree, retrospective chain, and forest module', () => {
      // The 2026-06-15 fix — without these a forward degree re-accrues collapse
      // debt (only track pages + JSONs + shader shipped). Pin each surface.
      const src = read(BUILD_PATH);
      expect(src).toMatch(/artifacts\/story\//);
      expect(src).toMatch(/artifacts\/circuits\//);
      expect(src).toMatch(/artifacts\/audio\//);
      expect(src).toMatch(/artifacts\/sims\//);
      expect(src).toMatch(/retrospective\/lessons-carryover\.json/);
      expect(src).toMatch(/retrospective\/corpus-deltas\.md/);
      expect(src).toMatch(/forest-module\//);
      // and re-registers the new module so it actually loads (and passes the audit)
      expect(src).toMatch(/nasa-forest-manifest-regen\.mjs/);
      // filenames are preserved so index.html artifact links stay valid
      expect(src).toMatch(/KEEPING THE EXISTING FILENAMES/);
    });

    it('SHARED contract: brief-first, preserve-structure, discipline items, footers', () => {
      const src = read(BUILD_PATH);
      expect(src).toMatch(/REQUIRED: first read/);
      expect(src).toMatch(/preserving the HTML\/JSON\/markdown STRUCTURE/);
      expect(src).toMatch(/<=200 words/);
      expect(src).toMatch(/<=5 times per paragraph/);
      expect(src).toMatch(/NEW LOCKED at \$\{VERSION\}/);
      expect(src).toMatch(/Do NOT commit\/tag\/push\/FTP/);
      expect(src).toMatch(/trip-vocab-check\.mjs <file> --mode page/);
      expect(src).toMatch(/VERDICT PASS/);
    });

    it('ANCHORS guard and mode flip are REQUIRED args', () => {
      const src = read(BUILD_PATH);
      expect(src).toMatch(/'anchorsBlock'/); // in the REQUIRED list
      expect(src).toMatch(/'rotation',\s*'continuation'|\['rotation',\s*'continuation'\]/);
      expect(src).toMatch(/TOPIC-CHANGE NOTE \(ROTATION/);
      expect(src).toMatch(/TOPIC-CHANGE NOTE \(CONTINUATION/);
      expect(src).toMatch(/throw new Error\(/);
    });

    it('build agents write files: general-purpose, NOT Explore, never worktree', () => {
      const src = read(BUILD_PATH);
      // The deliberate asymmetry vs the review skeleton — pinned both ways.
      expect(src).toMatch(/agentType:\s*'general-purpose'/);
      expect(src).not.toMatch(/agentType:\s*'Explore'/);
      expect(src).not.toMatch(/isolation:\s*'worktree'/);
    });

    // ---- leading-edge nav hardening (folded in after the v1.221 GRACE ship) ----
    // A freshly-built degree is the newest, so its index nav right cell is the
    // Series hub, NOT a "Next mission -> successor" dead link the consistency
    // audit BLOCKS. These pin the rule into the tooling so it stops being a
    // manual post-build fix each ship.
    it('leading-edge nav: index emits Series hub for the newest degree, never a dead next link', () => {
      const src = read(BUILD_PATH);
      expect(src).toMatch(/const LEADING_EDGE = A\.leadingEdge !== false/);
      expect(src).toMatch(/Series hub/);
      expect(src).toMatch(/NAV_DEAD_TARGET \+ DEAD_INTERNAL_LINKS/);
      // the index task consumes the computed right-cell guidance, not a raw next link
      expect(src).toMatch(/\$\{NAV_RIGHT\}/);
    });

    it('predecessor nav promotion is wired into the retro-forest finalization', () => {
      const src = read(BUILD_PATH);
      // The companion deterministic script must exist and be invoked when leading-edge.
      expect(existsSync(join(REPO_ROOT, 'tools/nasa-nav-promote-predecessor.mjs'))).toBe(true);
      expect(src).toMatch(/nasa-nav-promote-predecessor\.mjs --predecessor \$\{PRED\.degree\} --new-degree \$\{DEGREE\}/);
      expect(src).toMatch(/skip nav promotion — leadingEdge:false/);
    });

    it('forest-module filename is coordinated between the index href and the retro rename', () => {
      const src = read(BUILD_PATH);
      expect(src).toMatch(/const FOREST_MODULE_FILE = A\.forestModuleFile \|\| null/);
      // index task references the coordinated href note
      expect(src).toMatch(/\$\{FOREST_LINK_NOTE\}/);
      // retro task renames to exactly that file when provided, keeps clone name otherwise (no desync either way)
      expect(src).toMatch(/RENAME the file to EXACTLY/);
      expect(src).toMatch(/KEEP THE CLONE FILENAME/);
    });

    it('index task carries the H1/breadcrumb length guidance (audit BLOCKs overflow)', () => {
      const src = read(BUILD_PATH);
      expect(src).toMatch(/HEADER LENGTH \(audit limits\)/);
      expect(src).toMatch(/<h1> text <=200 chars/);
      expect(src).toMatch(/breadcrumb"> text <=160 chars/);
      expect(src).toMatch(/H1_LONG \/ BREADCRUMB_LONG/);
    });
  });

  describe('audit-harness.mjs', () => {
    it('is a Workflow script with the full multi-wave phase roster', () => {
      const src = read(AUDIT_PATH);
      expect(src).toMatch(/export const meta\s*=/);
      expect(src).toContain("name: 'audit-harness'");
      for (const p of ['Scout', 'Verify-Prior', 'Coverage', 'Surfaces', 'Lenses', 'Verify-New', 'Critic', 'Gap-fill', 'Synthesis']) {
        expect(src, `phase "${p}" must be declared`).toContain(`title: '${p}'`);
      }
    });

    it('every fresh-claim wave is adversarially refuted (CONFIRMED|REFUTED|UNVERIFIABLE)', () => {
      const src = read(AUDIT_PATH);
      expect(src).toMatch(/CONFIRMED \| REFUTED \| UNVERIFIABLE/);
      // Lenses are refuted too — the 2026-06-03 unverified-lens gap stays closed.
      expect(src).toMatch(/refute-lenses/);
      expect(src).toMatch(/refute-new-/);
    });

    it('keeps the proven mechanics: retry-once, budget-gated gap-fill, scout-derived live counts, read-only rules', () => {
      const src = read(AUDIT_PATH);
      expect(src).toMatch(/retrying \$\{opts\.label\}/);
      expect(src).toMatch(/budget\.remaining\(\)/);
      expect(src).toMatch(/budget\.total/);
      expect(src).toMatch(/phase\('Scout'\)/);
      expect(src).toMatch(/READ-ONLY on the repo/);
      // Synthesis writes draft + results + manifest in-workflow.
      expect(src).toMatch(/results\.json/);
      expect(src).toMatch(/_run-manifest\.md/);
      // Specs are required: a generic audit cannot invent its scope.
      expect(src).toMatch(/cannot invent its scope/);
    });
  });

  describe('doc cross-references', () => {
    it('canonical doc names all three skeletons, the isolation discipline, and both modes', () => {
      const doc = read(DOC_PATH);
      expect(doc).toContain('tools/workflows/content-adversarial-review.mjs');
      expect(doc).toContain('decompose-build.mjs');
      expect(doc).toContain('audit-harness.mjs');
      expect(doc).toMatch(/Explore/);
      expect(doc).toMatch(/worktree/);
      expect(doc).toMatch(/rotation/);
      expect(doc).toMatch(/continuation/);
      expect(doc).toMatch(/ANCHOR-LEAK/);
      expect(doc).toContain('tests/integration/workflows-library-discipline.test.ts');
      // The promotion boundary: per-mission instances stay untracked.
      expect(doc).toMatch(/never-commit-mission-packages/);
    });

    it('NASA discipline doc carries the resume-era machinery section + the #10408 supersession (Lead A)', () => {
      const doc = read(NASA_DOC_PATH);
      expect(doc).toMatch(/Resume-era machinery/);
      expect(doc).toContain('tools/workflows/decompose-build.mjs');
      expect(doc).toContain('tools/workflows/content-adversarial-review.mjs');
      expect(doc).toMatch(/#10408[^]*?SUPERSEDED for catalog-clone rewrites/);
      // The stale freeze claim must not return.
      expect(doc).not.toMatch(/currently frozen at degree/);
    });

    it('T14 doc carries the NASA per-ship appendix referencing the library', () => {
      const t14 = read(T14_PATH);
      expect(t14).toMatch(/NASA per-ship T14 variant/);
      expect(t14).toContain('tools/workflows/decompose-build.mjs');
      expect(t14).toContain('workflows-library.md');
    });

    it('sub-agent-dispatch doc annotates #10408 supersession at its canonical home', () => {
      const doc = read(DISPATCH_DOC_PATH);
      expect(doc).toMatch(/#10408[^]*?SUPERSEDED for catalog-clone rewrites/);
      expect(doc).toContain('tools/workflows/decompose-build.mjs');
    });
  });
});

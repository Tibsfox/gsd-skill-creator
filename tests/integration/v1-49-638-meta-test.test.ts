/**
 * v1.49.638 Integration Meta-Test (Cluster #5 housekeeping)
 *
 * Exercises every new gate/discipline this milestone shipped, asserting
 * the substrate state at ship-time. Counter-cadence milestone: engine
 * state is intentionally unchanged from predecessor v1.49.637.
 *
 * Gates exercised:
 *   C1 — Atlas per-project query API (get_or_open_for_project) exists
 *        in src-tauri/src/intelligence/atlas.rs.
 *   C2 — STORY-gate ordering canonical doc + invariant test + pre-tag-gate
 *        removal (Lesson #10197 closure).
 *   C3 — Substrate-probe discipline doc tracked at docs/.
 *   C4 — CI install step deferred to Cluster #6 (assertion confirms
 *        revert in place; if re-added without coordination, this fires).
 *   C5 — Flake audit doc + 4 sample fixes (2 ORDER BY rowid tiebreakers,
 *        2 hookTimeout protections).
 *   counter-cadence — engine state matches predecessor v1.49.637.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();

describe('v1.49.638 integration meta-test (Cluster #5 housekeeping)', () => {
  // ==========================================================================
  // C1 — Atlas LRU per-project API
  // ==========================================================================
  it('C1 — atlas.rs exposes per-project query API (get_or_open_for_project)', () => {
    const atlas = readFileSync(
      join(REPO_ROOT, 'src-tauri/src/intelligence/atlas.rs'),
      'utf8',
    );
    expect(atlas).toMatch(/pub fn get_or_open_for_project/);
    // Reuses path_for_project resolver (no duplicated path logic)
    expect(atlas).toMatch(/path_for_project/);
  });

  // ==========================================================================
  // C2 — STORY-gate ordering (Lesson #10197 closure)
  // ==========================================================================
  it('C2 — T14-SHIP-SEQUENCE.md documents STORY-gate post bump-version', () => {
    const doc = readFileSync(
      join(REPO_ROOT, 'docs/T14-SHIP-SEQUENCE.md'),
      'utf8',
    );
    // INV-1 invariant declared
    expect(doc).toMatch(/STORY-gate runs POST bump-version/i);
    // Lesson #10197 cited as closure rationale
    expect(doc).toMatch(/Lesson #10197/);
    // Ordering: bump-version BEFORE append-story-entry
    expect(doc).toMatch(/bump-version[\s\S]*?append-story-entry/);
  });

  it('C2 — pre-tag-gate.sh no longer carries the no-op STORY-gate step', () => {
    const script = readFileSync(
      join(REPO_ROOT, 'tools/pre-tag-gate.sh'),
      'utf8',
    );
    // No active or commented-out append-story-entry invocation
    expect(script).not.toMatch(/append-story-entry/);
    // No legacy STORY-gate step header
    expect(script).not.toMatch(/STORY-gate/);
  });

  it('C2 — invariant test for T14 STORY-gate ordering exists', () => {
    const inv = readFileSync(
      join(REPO_ROOT, 'tests/integration/c2-story-gate-ordering.test.ts'),
      'utf8',
    );
    // Invariant test must exist and reference the canonical doc
    expect(inv.length).toBeGreaterThan(0);
    expect(inv).toMatch(/T14-SHIP-SEQUENCE/);
  });

  // ==========================================================================
  // C3 — Substrate-probe discipline doc
  // ==========================================================================
  it('C3 — SUBSTRATE-PROBE-DISCIPLINE.md tracked at docs/ and cites Lesson #10192', () => {
    const doc = readFileSync(
      join(REPO_ROOT, 'docs/SUBSTRATE-PROBE-DISCIPLINE.md'),
      'utf8',
    );
    expect(doc).toMatch(/Lesson #10192/);
    expect(doc).toMatch(/substrate/i);
    // Discipline rule: spec author runs probe themselves
    expect(doc).toMatch(/substrate-evidence|Stage-1 substrate/);
  });

  // ==========================================================================
  // C4 — Deferral assertion (revert is in place; re-add without
  //      coordination will fire this test)
  // ==========================================================================
  it('C4 — CI workflow does NOT install project-claude hooks (deferred to Cluster #6)', () => {
    const ci = readFileSync(
      join(REPO_ROOT, '.github/workflows/ci.yml'),
      'utf8',
    );
    // The v1.49.638 W1B.T2 install step (ada42df28) was reverted at
    // 33f4af237 and the gap routed forward to Cluster #6. If the install
    // line returns without a Cluster #6 closure dispatch, this test
    // forces the conversation.
    expect(ci).not.toMatch(/node project-claude\/install\.cjs/);
  });

  // ==========================================================================
  // C5 — Flake audit + 4 sample fixes
  // ==========================================================================
  it('C5 — flake-audit-2026-05-11.md documents 4 fixes', () => {
    const doc = readFileSync(
      join(REPO_ROOT, 'docs/test-discipline/flake-audit-2026-05-11.md'),
      'utf8',
    );
    expect(doc).toMatch(/4 fixes applied/);
    expect(doc).toMatch(/Stage 2 corrections/);
  });

  it('C5 — kb/store.ts carries ORDER BY rowid tiebreakers at briefing + snapshot reads', () => {
    const store = readFileSync(
      join(REPO_ROOT, 'src/intelligence/kb/store.ts'),
      'utf8',
    );
    // getCurrentBriefing: generated_at DESC, rowid DESC LIMIT 1
    expect(store).toMatch(/generated_at DESC,\s*rowid DESC/);
    // listSnapshotsForProject: taken_at DESC, rowid DESC
    expect(store).toMatch(/taken_at DESC,\s*rowid DESC/);
  });

  it('C5 — projects.test.ts + findings.test.ts beforeEach carries 30s hookTimeout', () => {
    const projects = readFileSync(
      join(REPO_ROOT, 'src/intelligence/kb/__tests__/projects.test.ts'),
      'utf8',
    );
    const findings = readFileSync(
      join(REPO_ROOT, 'src/intelligence/kb/__tests__/findings.test.ts'),
      'utf8',
    );
    // Both files carry the 30000 hookTimeout (2nd-arg to beforeEach)
    expect(projects).toMatch(/}, 30000\);/);
    expect(findings).toMatch(/}, 30000\);/);
    // And both cite the C5 origin so future audits trace lineage
    expect(projects).toMatch(/v1\.49\.638 W1C C5/);
    expect(findings).toMatch(/v1\.49\.638 W1C C5/);
  });

  // ==========================================================================
  // counter-cadence — engine state UNCHANGED vs predecessor v1.49.637
  // ==========================================================================
  it('counter-cadence — predecessor release-notes (v1.49.637) still exists', () => {
    // No engine forward-progress this milestone; predecessor must remain
    // on-disk as the authoritative engine-state reference.
    const predecessor = readFileSync(
      join(REPO_ROOT, 'docs/release-notes/v1.49.637/README.md'),
      'utf8',
    );
    expect(predecessor.length).toBeGreaterThan(0);
  });
});

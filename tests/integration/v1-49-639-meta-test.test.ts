/**
 * v1.49.639 Housekeeping Cluster #6 — Integration meta-test
 *
 * Mirrors the v1.49.585 W4 / v1.49.634 / v1.49.635 / v1.49.636 / v1.49.637
 * integration meta-test pattern: per-component invariant assertions that
 * each new gate from the cluster's components fires correctly.
 *
 * Spec: .planning/missions/v1-49-639-housekeeping-cluster-6/components/06-integration-verify-ship.md
 *
 * Components asserted (6 carry-forwards closed this milestone):
 *   1. C1 (CF-1+CF-2): self-mod-guard CI divergence diagnostic — closed
 *      via pre-existing skip-guard pattern (Lesson #10180); TRACE
 *      instrumentation reverted post-finding
 *   2. C2 (CF-4): substrate-probe discipline v2 — adjacency-check
 *      sub-section + audit-method-corrections.md inventory landed
 *   3. C3 (CF-5): pr-review-gate project-aware conversion — hook now
 *      whitelist-scoped; gsd-skill-creator unblocked
 *   4. C4 (CF-6): source-side ORDER-BY tiebreakers — 3 sites in
 *      src/intelligence/kb/store.ts patched
 *   5. C5 (CF-3): meta-lesson #10197 promotion decision — Branch (ii)
 *      Disconfirm; lesson stays as regular
 *   6. counter-cadence: engine state UNCHANGED from v1.49.638
 *
 * Skip-guard pattern (Lesson #10180): assertions touching gitignored
 * working-tree paths (.planning/) or USER-LEVEL config (~/.claude/)
 * use it.runIf(...) so CI gracefully skips rather than false-failing.
 * Tracked-file assertions (docs/, src/, tests/) run unconditionally.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';

const REPO_ROOT = process.cwd();

// Tracked-file paths (assert unconditionally; CI has these)
const SUBSTRATE_PROBE_DOC = resolve(REPO_ROOT, 'docs/SUBSTRATE-PROBE-DISCIPLINE.md');
const AUDIT_METHOD_CORRECTIONS = resolve(REPO_ROOT, 'docs/test-discipline/audit-method-corrections.md');
const KB_STORE = resolve(REPO_ROOT, 'src/intelligence/kb/store.ts');
const STATE_MD = resolve(REPO_ROOT, '.planning/STATE.md');

// Gitignored / user-level paths (skip-guard pattern)
const C1_TRACE_RECORD = resolve(REPO_ROOT, '.planning/c1-self-mod-guard-trace-record.md');
const C5_DECISION = resolve(REPO_ROOT, '.planning/c5-meta-lesson-decision.md');
const PR_GATE_HOOK = join(homedir(), '.claude/hooks/pr-review-gate.sh');

describe('v1.49.639 integration meta-test', () => {

  // ─── C1 (CF-1 + CF-2 paired): self-mod-guard CI divergence ────────────

  it.runIf(existsSync(C1_TRACE_RECORD))(
    'C1: trace record documents the path-a-close finding',
    () => {
      const content = readFileSync(C1_TRACE_RECORD, 'utf-8');
      expect(content, 'records resolution path').toMatch(/path-a-close/);
      expect(content, 'cites CI run URL').toMatch(/actions\/runs/);
      expect(content, 'documents the skip-guard mechanism').toMatch(/it\.runIf\(HOOK_AVAILABLE\)/);
      expect(content, 'closes 5-cluster journey').toMatch(/5-cluster|5th-and-final|5 cluster/i);
    },
  );

  // ─── C2 (CF-4): substrate-probe discipline v2 ────────────────────────

  it('C2: SUBSTRATE-PROBE-DISCIPLINE.md has §2.4 adjacency-check sub-section', () => {
    const content = readFileSync(SUBSTRATE_PROBE_DOC, 'utf-8');
    expect(content, '§2.4 heading present').toMatch(/### 2\.4 Grep adjacency check requirement/);
    expect(content, 'mentions 33% false-positive rate').toMatch(/33%/);
    expect(content, 'references companion inventory').toMatch(/audit-method-corrections\.md/);
  });

  it('C2: audit-method-corrections.md exists with ≥4 concepts', () => {
    expect(existsSync(AUDIT_METHOD_CORRECTIONS)).toBe(true);
    const content = readFileSync(AUDIT_METHOD_CORRECTIONS, 'utf-8');
    const sections = content.match(/^### 2\.\d+ /gm) || [];
    expect(sections.length).toBeGreaterThanOrEqual(4);
  });

  // ─── C3 (CF-5): pr-review-gate project-aware ─────────────────────────

  it.runIf(existsSync(PR_GATE_HOOK))(
    'C3: user-level pr-review-gate hook contains project-aware whitelist',
    () => {
      const content = readFileSync(PR_GATE_HOOK, 'utf-8');
      expect(content, 'project-aware bypass marker').toMatch(/Project-aware bypass/);
      expect(content, 'whitelist variable').toMatch(/PR_REVIEW_WHITELIST/);
      // gsd-skill-creator NOT in default whitelist (unblocked)
      const defaultWhitelist = content.match(/PR_REVIEW_WHITELIST="([^"$]+)/);
      expect(defaultWhitelist).not.toBeNull();
      expect(defaultWhitelist![1].trim().split(/\s+/)).not.toContain('gsd-skill-creator');
    },
  );

  // ─── C4 (CF-6): source-side ORDER-BY tiebreakers ─────────────────────

  it('C4: kb store.ts ORDER-BY clauses have tiebreakers (3 patches landed)', () => {
    const content = readFileSync(KB_STORE, 'utf-8');
    // Site 871: bundles emitted_at + b.id DESC tiebreaker
    expect(content, 'site 871 has b.id DESC tiebreaker').toMatch(
      /ORDER BY b\.emitted_at DESC, b\.id DESC/,
    );
    // Site 916: meeting_log recorded_at + id ASC tiebreaker
    expect(content, 'site 916 has id ASC tiebreaker').toMatch(
      /ORDER BY recorded_at ASC, id ASC/,
    );
    // Site 301: orderBy variable resolves to forms with id ASC tiebreaker
    expect(content, 'site 301 conditional orderBy includes id ASC').toMatch(
      /'last_activity_at DESC, id ASC'/,
    );
  });

  // ─── C5 (CF-3): meta-lesson #10197 promotion decision ───────────────

  it.runIf(existsSync(C5_DECISION))(
    'C5: meta-lesson decision records Branch (ii) Disconfirm',
    () => {
      const content = readFileSync(C5_DECISION, 'utf-8');
      expect(content, 'records Branch (ii) Disconfirm').toMatch(/Branch chosen.*\(ii\) Disconfirm|\(ii\) Disconfirm/);
      expect(content, 'documents disconfirmation rationale').toMatch(/disconfirm|hypothesis.*not validated|stays as a regular lesson|stays as regular/i);
    },
  );

  // ─── Counter-cadence: engine state unchanged ────────────────────────

  it.runIf(existsSync(STATE_MD))(
    'counter-cadence: engine state UNCHANGED from v1.49.638 baseline',
    () => {
      const content = readFileSync(STATE_MD, 'utf-8');
      // Forward-skip: STATE describes the CURRENT milestone. When STATE
      // has advanced past v639, this point-in-time assertion no longer
      // applies (added v1.49.653 L-02 retrospective fixup).
      const m = content.match(/^milestone:\s*v?(\d+)\.(\d+)\.(\d+)/m);
      if (m && parseInt(m[3], 10) > 639) return;
      expect(content, 'NASA degree 108 (unchanged)').toMatch(/nasa_degree:\s*108/);
      expect(content, 'counter_cadence flag set').toMatch(/counter_cadence:\s*true/);
      expect(content, 'no_engine_state_advance flag set').toMatch(/no_engine_state_advance:\s*true/);
    },
  );

});

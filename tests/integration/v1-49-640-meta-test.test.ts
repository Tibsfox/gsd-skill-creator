/**
 * v1.49.640 Housekeeping Cluster #7 — Integration meta-test
 *
 * Mirrors the v1.49.585 W4 / v1.49.634-639 integration meta-test pattern:
 * per-component invariant assertions that each new gate from the cluster's
 * components fires correctly.
 *
 * Spec: .planning/missions/v1-49-640-housekeeping-cluster-7/components/03-integration-verify-ship.md
 *
 * Components asserted (3 CF inventory items routed; 2 closed in-cluster):
 *   1. C1 (CF-7): Security Audit closure — hybrid path b+d; gsd-pi removed
 *      from package.json; fast-xml-parser + yaml added as direct deps;
 *      0 npm audit vulnerabilities
 *   2. C2 (Lesson #10199): closure-verification gate codification —
 *      MISSION-PACKAGE-DISCIPLINE.md exists; cf-closure-verification-templates.md
 *      exists; SUBSTRATE-PROBE-DISCIPLINE.md cross-references the new sibling doc
 *   3. CF-9 carry-forward: cartridge-migration-phase2.md unchanged; routed to
 *      Cluster #8
 *   4. counter-cadence: engine state UNCHANGED from v1.49.639 baseline
 *      (CF-8 routing option (b) chosen at W0)
 *
 * Skip-guard pattern (Lesson #10180): assertions touching gitignored
 * working-tree paths (.planning/) use it.runIf(...) so CI gracefully
 * skips rather than false-failing. Tracked-file assertions (docs/, src/,
 * tests/, package.json) run unconditionally.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = process.cwd();

// Tracked-file paths (assert unconditionally; CI has these)
const PACKAGE_JSON = resolve(REPO_ROOT, 'package.json');
const MISSION_PACKAGE_DISCIPLINE = resolve(REPO_ROOT, 'docs/MISSION-PACKAGE-DISCIPLINE.md');
const CF_PROBE_TEMPLATES = resolve(REPO_ROOT, 'docs/test-discipline/cf-closure-verification-templates.md');
const SUBSTRATE_PROBE_DOC = resolve(REPO_ROOT, 'docs/SUBSTRATE-PROBE-DISCIPLINE.md');

// Gitignored working-tree paths (skip-guard pattern)
const CF7_RECORD = resolve(REPO_ROOT, '.planning/c0-cf7-closure-verification-record.md');
const CF7_FIX_RECORD = resolve(REPO_ROOT, '.planning/c1-cf7-fix-record.md');
const CF8_DECISION = resolve(REPO_ROOT, '.planning/c0-cf8-forward-cadence-decision.md');
const CF9_RECORD = resolve(REPO_ROOT, '.planning/c0-cf9-cartridge-status-record.md');
const STATE_MD = resolve(REPO_ROOT, '.planning/STATE.md');

describe('v1.49.640 integration meta-test', () => {

  // ─── C1 (CF-7): Security Audit closure ───────────────────────────────

  it('C1: package.json no longer declares gsd-pi (phantom dep removed)', () => {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf-8'));
    const allDeps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
      ...(pkg.optionalDependencies ?? {}),
    };
    expect(allDeps, 'gsd-pi must not appear in any dep field').not.toHaveProperty('gsd-pi');
  });

  it('C1: package.json declares fast-xml-parser and yaml as direct deps', () => {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf-8'));
    const allDeps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
      ...(pkg.optionalDependencies ?? {}),
    };
    expect(allDeps, 'fast-xml-parser must be declared (was hidden transitive)').toHaveProperty('fast-xml-parser');
    expect(allDeps, 'yaml must be declared (was hidden transitive)').toHaveProperty('yaml');
  });

  it.runIf(existsSync(CF7_RECORD))(
    'C1: CF-7 closure-verification record documents path b+d hybrid',
    () => {
      const content = readFileSync(CF7_RECORD, 'utf-8');
      expect(content, 'cites still-real status from W0').toMatch(/still.real|STATUS.*still/i);
      expect(content, 'cites operator path-b decision').toMatch(/Path \(b\)|path b|path-b/i);
      expect(content, 'cites Lesson #10199 as governing discipline').toMatch(/Lesson #10199|10199/);
    },
  );

  it.runIf(existsSync(CF7_FIX_RECORD))(
    'C1: CF-7 fix record documents hybrid (b)+(d) closure',
    () => {
      const content = readFileSync(CF7_FIX_RECORD, 'utf-8');
      expect(content, 'records hybrid path').toMatch(/Hybrid|hybrid|\(b\).*\(d\)|b.*d/);
      expect(content, 'cites gsd-pi removal').toMatch(/gsd-pi/i);
      expect(content, 'cites 0 vulnerabilities final state').toMatch(/0 vulnerabilit|found 0 vulnerab/i);
    },
  );

  // ─── C2 (Lesson #10199): closure-verification gate codification ──────

  it('C2: MISSION-PACKAGE-DISCIPLINE.md exists at expected path', () => {
    expect(existsSync(MISSION_PACKAGE_DISCIPLINE), 'discipline doc must exist').toBe(true);
  });

  it('C2: discipline doc references Lesson #10199 source incident', () => {
    const content = readFileSync(MISSION_PACKAGE_DISCIPLINE, 'utf-8');
    expect(content, 'cites Lesson #10199').toMatch(/Lesson #10199|#10199/);
    expect(content, 'cites v1.49.634-638 5-cluster chain').toMatch(/v1\.49\.634.*v1\.49\.638|5-cluster|5 cluster/);
    expect(content, 'documents the source incident framing error').toMatch(/framing error|skip.guard|HOOK_AVAILABLE/);
  });

  it('C2: discipline doc defines at least 1 mechanical probe', () => {
    const content = readFileSync(MISSION_PACKAGE_DISCIPLINE, 'utf-8');
    // Code-block-style probe template required
    expect(content, 'doc contains code block').toMatch(/```(bash|sh|ts|js)/);
    expect(content, 'doc enumerates probe SHAPE categories').toMatch(/test.marker|tool.output|config.state|upstream.spec/i);
  });

  it('C2: cf-closure-verification-templates.md companion exists with 4 templates', () => {
    expect(existsSync(CF_PROBE_TEMPLATES), 'companion templates must exist').toBe(true);
    const content = readFileSync(CF_PROBE_TEMPLATES, 'utf-8');
    // 4 template categories + hidden-transitive guard
    expect(content).toMatch(/Template 1.*[Tt]ool/);
    expect(content).toMatch(/Template 2.*[Tt]est/);
    expect(content).toMatch(/Template 3.*[Cc]onfig/);
    expect(content).toMatch(/Template 4.*[Uu]pstream/);
  });

  it('C2: SUBSTRATE-PROBE-DISCIPLINE.md cross-references MISSION-PACKAGE-DISCIPLINE', () => {
    const content = readFileSync(SUBSTRATE_PROBE_DOC, 'utf-8');
    expect(content, 'cross-ref to new sibling doc').toMatch(/MISSION-PACKAGE-DISCIPLINE/);
  });

  // ─── CF-8 routing: counter-cadence decision documented ───────────────

  it.runIf(existsSync(CF8_DECISION))(
    'CF-8: forward-cadence routing decision documents option (b)',
    () => {
      const content = readFileSync(CF8_DECISION, 'utf-8');
      expect(content, 'records option (b)').toMatch(/option\s+\(?b\)?|Continue counter.cadence/i);
      expect(content, 'engine state target unchanged').toMatch(/nasa_degree:?\s*108|NASA degree:?\s*108/);
    },
  );

  // ─── CF-9 carry-forward: cartridge status unchanged ──────────────────

  it.runIf(existsSync(CF9_RECORD))(
    'CF-9: cartridge-migration-phase2.md status record routes to Cluster #8',
    () => {
      const content = readFileSync(CF9_RECORD, 'utf-8');
      expect(content, 'records unchanged status').toMatch(/unchanged|continued/i);
      expect(content, 'routes to next cluster').toMatch(/Cluster #?8|carry.forward/i);
    },
  );

  // ─── Counter-cadence: engine state unchanged ─────────────────────────

  it.runIf(existsSync(STATE_MD))(
    'counter-cadence: engine state UNCHANGED from v1.49.639 baseline',
    () => {
      const content = readFileSync(STATE_MD, 'utf-8');
      const m = content.match(/^milestone:\s*v?(\d+)\.(\d+)\.(\d+)/m);
      if (m && parseInt(m[3], 10) > 640) return; // forward-skip (v1.49.653 L-02 retrofix)
      expect(content, 'NASA degree 108 (unchanged)').toMatch(/nasa_degree:\s*108/);
      expect(content, 'counter_cadence flag set').toMatch(/counter_cadence:\s*true/);
      expect(content, 'no_engine_state_advance flag set').toMatch(/no_engine_state_advance:\s*true/);
    },
  );

});

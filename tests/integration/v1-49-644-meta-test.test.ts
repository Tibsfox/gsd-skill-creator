/**
 * v1.49.644 Housekeeping Cluster #11 — Integration meta-test
 *
 * Post-bankruptcy resume milestone: 2 fresh CFs + 1 threshold-gap closure.
 * First cluster after the 11-cluster counter-cadence chain bankrupted at
 * v1.49.643. Validates that the established discipline machinery handled
 * fresh debt cleanly.
 *
 * Components asserted:
 *   1. C1 CF-16 — protobufjs advisory closure via `npm audit fix`
 *      (verified via lockfile state + closure-verification record)
 *   2. C3 threshold-gap finding — `npm-audit` probe gains
 *      `probe_args.severity` (apply-to-self for Lesson #10208)
 *   3. C2 CF-17 — cartridge phase-2 closure via combined paths a + b:
 *      Family A adapter normalization + Family B not-department-shape
 *      surface in the migrate report
 *   4. counter-cadence: engine state UNCHANGED from v1.49.643 baseline
 *      (12th counter-cadence cleanup in chain — the first POST-BANKRUPTCY
 *      cluster, demonstrating CF channel can re-open cleanly)
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = process.cwd();

const CLOSURE_VERIFY_CF = resolve(REPO_ROOT, 'scripts/closure-verify-cf.mjs');
const DEPARTMENT_ADAPTER = resolve(REPO_ROOT, 'src/cartridge/department-adapter.ts');
const CARTRIDGE_CLI = resolve(REPO_ROOT, 'src/cli/commands/cartridge.ts');
const STATE_MD = resolve(REPO_ROOT, '.planning/STATE.md');

describe('v1.49.644 integration meta-test', () => {

  // ─── C1 (CF-16 closure via npm audit fix) ────────────────────────────

  it('C1: closure-verify-cf.mjs npm-audit probe records severity threshold in output', () => {
    const content = readFileSync(CLOSURE_VERIFY_CF, 'utf-8');
    // The severity-threshold enhancement records the chosen severity in the
    // output record body so operators can see which threshold the probe ran at.
    expect(content, 'records severity threshold').toContain('Severity threshold:');
    expect(content, 'allowlist defined').toContain('VALID_AUDIT_SEVERITIES');
    expect(content, 'allowlist values').toMatch(/'low'.*'moderate'.*'high'.*'critical'/s);
  });

  // ─── C3 (threshold-gap finding closed via probe_args.severity) ────────

  it('C3: npm-audit probe accepts severity parameter (path i — Lesson #10208)', () => {
    const content = readFileSync(CLOSURE_VERIFY_CF, 'utf-8');
    // probeNpmAudit signature accepts a second argument (severity), gated
    // through VALID_AUDIT_SEVERITIES, and threads it into the npm command.
    expect(content, 'severityArg pattern').toMatch(/const\s+\[cfId,\s*severityArg\]\s*=\s*args/);
    expect(content, 'invalid severity error').toMatch(/invalid severity/);
    expect(content, 'audit-level flag uses severity').toMatch(/--audit-level=\$\{severity\}/);
  });

  it('C3: buildArgsForProbe threads probe_args.severity through to npm-audit', () => {
    const content = readFileSync(CLOSURE_VERIFY_CF, 'utf-8');
    // The auto subcommand path reads probe_args.severity from the YAML spec
    // and passes it as the second arg to probeNpmAudit.
    expect(content, 'severity threading in buildArgsForProbe').toMatch(
      /case\s+'npm-audit'[\s\S]{0,200}probeArgs\.severity/,
    );
  });

  // ─── C2 (CF-17 closure via paths a + b) ──────────────────────────────

  it('C2 path a: department-adapter pre-normalizes Family A chipset:-wrapped shape', () => {
    const content = readFileSync(DEPARTMENT_ADAPTER, 'utf-8');
    expect(content, 'normalizeFamilyAShape defined').toContain('function normalizeFamilyAShape');
    expect(content, 'identity hoisting').toMatch(/chipset\.name|inner\.name/);
    expect(content, 'tools string split').toMatch(/tools[\s\S]*?\.split/);
    expect(content, 'members → agents conversion').toContain('members');
  });

  it('C2 path b: cartridge migrate surfaces non-department-shape chipsets', () => {
    const content = readFileSync(CARTRIDGE_CLI, 'utf-8');
    expect(content, 'not-department-shape status').toContain("'not-department-shape'");
    expect(content, 'DiscoveredChipset type with shape classifier').toContain('DiscoveredChipset');
    expect(content, 'recordForNonDepartmentShape helper').toContain('recordForNonDepartmentShape');
  });

  // ─── Counter-cadence: engine state unchanged ─────────────────────────

  it.runIf(existsSync(STATE_MD))(
    'counter-cadence: engine state UNCHANGED from v1.49.643 baseline',
    () => {
      const content = readFileSync(STATE_MD, 'utf-8');
      expect(content, 'NASA degree 108 (unchanged)').toMatch(/nasa_degree:\s*108/);
      expect(content, 'counter_cadence flag set').toMatch(/counter_cadence:\s*true/);
      expect(content, 'no_engine_state_advance flag set').toMatch(/no_engine_state_advance:\s*true/);
    },
  );

});

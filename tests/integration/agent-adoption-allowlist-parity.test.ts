/**
 * Agent adoption allowlist + baseline parity drift-guard (Ship 2.3, v1.49.975).
 *
 * The agent-tier sibling of the src/ adoption scan. `tools/agent-adoption-scan.mjs`
 * classifies each source-of-truth agent (project-claude/agents/*.md) as living /
 * test-only / dormant by grepping the installed dispatch corpus. The live scan
 * needs the gitignored .claude/ tree, so it runs LOCALLY (observability). This
 * test pins the COMMITTED artifacts (CI-safe, tracked-only):
 *
 *   - tools/agent-adoption-scan.allowlist.json — the 7 exemptions (4 description-
 *     dispatched, 2 script-twins, 1 dated-gate orphan).
 *   - docs/AGENT-ADOPTION-BASELINE.json — the point-in-time scan snapshot.
 *   - docs/AGENT-ADOPTION-VERDICTS.md — the per-agent decision surface.
 *
 * #10461 gate-enforce + drift-guard pairing:
 *   - Layer 1 (enforcement): named *.test.ts (NOT *.integration.test.ts) so the
 *     `root` vitest project runs it on every `npx vitest run` — pre-tag-gate
 *     step 2 + CI — with no new shell step / denominator (gate count stays 20).
 *   - Layer 2 (drift-guard): pins allowlist↔source integrity, the no-un-allowlisted-
 *     dormant invariant (no silent agent shelfware), the baseline↔source agent-set
 *     parity (forces a baseline refresh when agents are added/removed), the dated
 *     triage gate on gsd-intel-updater, and verdict-doc coverage. Mutation-proven:
 *     dropping an allowlist entry, adding a source agent without refreshing the
 *     baseline, or removing the dated gate fails this test.
 *
 * See docs/AGENT-ADOPTION-VERDICTS.md.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO = process.cwd();
const AGENTS_DIR = join(REPO, 'project-claude', 'agents');
const ALLOWLIST_PATH = join(REPO, 'tools', 'agent-adoption-scan.allowlist.json');
const BASELINE_PATH = join(REPO, 'docs', 'AGENT-ADOPTION-BASELINE.json');
const VERDICTS_PATH = join(REPO, 'docs', 'AGENT-ADOPTION-VERDICTS.md');

// The exact set of source agents that have no scripted dispatch site but are
// NOT dormant-to-retire (the disposition recorded at Ship 2.3).
const EXPECTED_ALLOWLIST = [
  'changelog-generator', // description-dispatched (generic infra)
  'codebase-navigator', //  description-dispatched (generic infra)
  'doc-linter', //          description-dispatched (generic infra)
  'gsd-intel-updater', //   orphan — parked with a dated retire-or-resume gate
  'gsd-orchestrator', //    description-dispatched (GSD intent router)
  'pipeline-reconciler', // script-twin of tools/release-history/pipeline-reconciler.mjs
  'quality-drift-watcher', // script-twin of tools/release-history/quality-drift-check.mjs
].sort();

function sourceAgents(): string[] {
  return readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => f.replace(/\.md$/, ''))
    .sort();
}

interface AllowlistEntry { agent?: string; reason?: string; addedAt?: string; addedBy?: string }
function loadAllowlist(): AllowlistEntry[] {
  return JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8')).entries ?? [];
}

interface BaselineRecord { agent: string; status: string; allowlisted: boolean }
function loadBaseline(): BaselineRecord[] {
  return JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
}

describe('agent-adoption allowlist + baseline parity', () => {
  it('all committed artifacts exist', () => {
    expect(existsSync(ALLOWLIST_PATH)).toBe(true);
    expect(existsSync(BASELINE_PATH)).toBe(true);
    expect(existsSync(VERDICTS_PATH)).toBe(true);
  });

  it('every allowlist entry is well-formed (agent + reason + provenance)', () => {
    for (const e of loadAllowlist()) {
      expect(e.agent, `entry missing agent: ${JSON.stringify(e)}`).toBeTruthy();
      expect((e.reason ?? '').length, `entry ${e.agent} missing reason`).toBeGreaterThan(20);
      expect(e.addedAt, `entry ${e.agent} missing addedAt`).toBeTruthy();
      expect(e.addedBy, `entry ${e.agent} missing addedBy`).toBeTruthy();
    }
  });

  it('every allowlisted agent is a real source-of-truth agent', () => {
    const src = new Set(sourceAgents());
    for (const e of loadAllowlist()) {
      expect(src.has(e.agent!), `allowlisted agent ${e.agent} is not in project-claude/agents/`).toBe(true);
    }
  });

  it('the allowlist is exactly the expected disposition set (no drift)', () => {
    const actual = loadAllowlist().map((e) => e.agent!).sort();
    expect(actual).toEqual(EXPECTED_ALLOWLIST);
  });

  it('gsd-intel-updater carries a dated retire-or-resume triage gate', () => {
    const entry = loadAllowlist().find((e) => e.agent === 'gsd-intel-updater');
    expect(entry).toBeTruthy();
    expect(entry!.reason).toMatch(/2027-06-04/);
    expect(entry!.reason!.toLowerCase()).toMatch(/retire-or-resume|triage/);
  });

  it('baseline agent-set equals the source-of-truth agent-set (baseline is fresh)', () => {
    const baselineAgents = loadBaseline().map((r) => r.agent).sort();
    expect(baselineAgents).toEqual(sourceAgents());
  });

  it('no un-allowlisted dormant agent in the baseline (no silent agent shelfware)', () => {
    const allow = new Set(loadAllowlist().map((e) => e.agent!));
    const unAllowlistedDormant = loadBaseline()
      .filter((r) => r.status === 'dormant' && !allow.has(r.agent))
      .map((r) => r.agent);
    expect(unAllowlistedDormant, `dormant agents missing an allowlist entry or a wire: ${unAllowlistedDormant.join(', ')}`).toEqual([]);
  });

  it('baseline allowlisted flag agrees with the allowlist file', () => {
    const allow = new Set(loadAllowlist().map((e) => e.agent!));
    for (const r of loadBaseline()) {
      expect(r.allowlisted, `baseline allowlisted flag for ${r.agent} disagrees with the allowlist`).toBe(allow.has(r.agent));
    }
  });

  it('the verdicts doc names every allowlisted agent', () => {
    const doc = readFileSync(VERDICTS_PATH, 'utf8');
    for (const e of loadAllowlist()) {
      expect(doc.includes(e.agent!), `AGENT-ADOPTION-VERDICTS.md does not mention ${e.agent}`).toBe(true);
    }
  });
});

/**
 * agent-teams primitive — dormant disposition drift-guard (D2, milestone v1.49.971).
 *
 * Decision-gate D2 (settled 2026-06-03) marked the agent-teams primitive DORMANT
 * on the dev line: there is no `team run` runtime, so the 4 demo teams were
 * de-installed (kept only as reference examples) and the `team spawn` scaffold
 * foot-gun (it wrote stub agent files into .claude/agents/) was disabled. The
 * validated CLI (create/list/validate/estimate/status) stays.
 *
 * This file is the #10461 "gate-enforce-every-runnable-surface + drift-guard"
 * pairing for that disposition. It is Layer-1 (named *.test.ts, NOT
 * *.integration.test.ts) so the `root` vitest project runs it on every
 * `npx vitest run` — pre-tag-gate step 2 + CI — without adding a shell gate step
 * (avoids the 20->21 denominator re-normalization deferred since v968).
 *
 * It is an INDEPENDENT oracle: it re-reads the repo (manifest, source, READMEs)
 * and pins the dormancy invariants, with anti-vacuous floors (#10450 — a
 * drift-guard must itself fail loudly, never pass because a file is missing).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REPO = process.cwd();
const MANIFEST = join(REPO, 'project-claude', 'manifest.json');
const TEAM_SPAWN = join(REPO, 'src', 'cli', 'commands', 'team-spawn.ts');

const DEMO_TEAMS = [
  'code-review-team',
  'doc-generation-team',
  'gsd-debug-team',
  'gsd-research-team',
] as const;

// The 4 demo teams remain as reference examples here (the v1.49.970 catalog).
const EXAMPLE_README = {
  'code-review-team': 'examples/teams/code/code-review-team/README.md',
  'doc-generation-team': 'examples/teams/migration/doc-generation-team/README.md',
  'gsd-debug-team': 'examples/teams/ops/gsd-debug-team/README.md',
  'gsd-research-team': 'examples/teams/migration/gsd-research-team/README.md',
} as const;

interface StandaloneEntry {
  source: string;
  target: string;
  description?: string;
}

function manifestStandalone(): StandaloneEntry[] {
  const m = JSON.parse(readFileSync(MANIFEST, 'utf8')) as {
    files?: { standalone?: StandaloneEntry[] };
  };
  return m.files?.standalone ?? [];
}

describe('agent-teams primitive — dormant disposition drift-guard (D2, v1.49.971)', () => {
  it('DECOMMISSION — the manifest installs zero teams into .claude/teams/', () => {
    const standalone = manifestStandalone();
    // anti-vacuous: the manifest is real and non-trivial.
    expect(standalone.length, 'manifest should have many standalone entries').toBeGreaterThan(20);
    const teamInstalls = standalone.filter((e) => e.target?.startsWith('.claude/teams/'));
    expect(
      teamInstalls.map((e) => e.target),
      'no team should install to .claude/teams/ (primitive is dormant — D2)',
    ).toEqual([]);
  });

  it('SOURCE REMOVED — project-claude/teams/ no longer ships the 4 demo team sources', () => {
    for (const t of DEMO_TEAMS) {
      expect(
        existsSync(join(REPO, 'project-claude', 'teams', t, 'config.json')),
        `project-claude/teams/${t}/config.json should be removed (decommissioned — D2)`,
      ).toBe(false);
    }
  });

  it('SCAFFOLD DISABLED — team-spawn.ts no longer scaffolds agent files', () => {
    expect(existsSync(TEAM_SPAWN), 'team-spawn.ts should exist').toBe(true);
    const src = readFileSync(TEAM_SPAWN, 'utf8');
    // The self-mod foot-gun: the interactive scaffold that wrote .claude/agents/*.md.
    expect(src, 'team-spawn must not define offerInteractiveFix (scaffold removed)').not.toContain(
      'offerInteractiveFix',
    );
    expect(src, 'team-spawn must not import/use writeTeamAgentFiles (scaffold removed)').not.toContain(
      'writeTeamAgentFiles',
    );
    // anti-vacuous: the readiness CHECK (the kept behavior) is still there.
    expect(src, 'team-spawn must still validate member agents (readiness check kept)').toContain(
      'validateMemberAgents',
    );
  });

  it('DORMANCY MARKER — the 4 demo example READMEs carry the dormant banner', () => {
    for (const t of DEMO_TEAMS) {
      const p = join(REPO, EXAMPLE_README[t]);
      expect(existsSync(p), `${EXAMPLE_README[t]} should exist (kept as reference example)`).toBe(true);
      expect(
        readFileSync(p, 'utf8'),
        `${EXAMPLE_README[t]} should carry the dormant banner`,
      ).toContain('reference example only');
    }
  });

  it('DOC — the dormancy disposition is documented and cross-linked', () => {
    const dormantDoc = join(REPO, 'docs', 'AGENT-TEAMS-DORMANT.md');
    expect(existsSync(dormantDoc), 'docs/AGENT-TEAMS-DORMANT.md should exist').toBe(true);
    expect(
      readFileSync(join(REPO, 'docs', 'AGENT-TEAMS.md'), 'utf8'),
      'docs/AGENT-TEAMS.md should link to the dormant disposition doc',
    ).toContain('AGENT-TEAMS-DORMANT.md');
  });
});

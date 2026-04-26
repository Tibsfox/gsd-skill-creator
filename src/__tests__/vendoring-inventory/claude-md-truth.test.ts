/**
 * OOPS-GSD v1.49.576 — C6 / OGA-062, OGA-063 (CLAUDE.md truth alignment)
 *
 * Verifies the "Key File Locations" section of CLAUDE.md reflects
 * filesystem reality:
 *
 *   CF-MED-062 — agent count is 49 (or 49+) rather than the stale
 *     "GSD executor, verifier, planner subagents" three-agent claim.
 *   CF-MED-063 — at least 6 of the load-bearing previously-undocumented
 *     src/ subsystems are listed: memory, vtm, dacp,
 *     mathematical-foundations, coherent-functors, predictive-skill-loader.
 *   CF-MED-063b — no /media/foxy/ absolute paths leaked into CLAUDE.md
 *     (use $REPO/... per the C6 spec anti-patterns).
 *
 * @module __tests__/vendoring-inventory/claude-md-truth
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();
const CLAUDE_MD = join(REPO_ROOT, 'CLAUDE.md');

const REQUIRED_LOAD_BEARING_SUBSYSTEMS = [
  'src/memory/',
  'src/vtm/',
  'src/dacp/',
  'src/mathematical-foundations/',
  'src/coherent-functors/',
  'src/predictive-skill-loader/',
];

describe('OGA-062/063 — CLAUDE.md "Key File Locations" truth alignment', () => {
  const content = readFileSync(CLAUDE_MD, 'utf8');

  it('CF-MED-062 — agent count reflects truth (49 or 49+) not stale 3-agent claim', () => {
    // Stale claim: ".claude/agents/` -- GSD executor, verifier, planner subagents"
    // Truth claim must mention "49" near .claude/agents/
    const agentsLine = content.match(/.claude\/agents\/[^\n]*/);
    expect(agentsLine, 'no .claude/agents/ description line found').not.toBeNull();
    const line = agentsLine![0];
    expect(
      /\b49\b/.test(line),
      `agents line must mention truth count 49: ${line}`,
    ).toBe(true);
  });

  it('CF-MED-063 — lists ≥6 load-bearing src/ subsystems', () => {
    const present = REQUIRED_LOAD_BEARING_SUBSYSTEMS.filter((s) =>
      content.includes(s),
    );
    expect(
      present.length,
      `expected ≥6 load-bearing subsystems documented; found ${present.length}: ${present.join(', ')}`,
    ).toBeGreaterThanOrEqual(6);
  });

  it('CF-MED-063b — no /media/foxy/ absolute paths in CLAUDE.md', () => {
    expect(
      content.includes('/media/foxy/'),
      'CLAUDE.md must not embed /media/foxy/ absolute paths; use $REPO/...',
    ).toBe(false);
  });
});

/**
 * MA/MB/MD control-theory island park + intrinsic-telemetry retirement
 * drift-guard (D3, milestone v1.49.972).
 *
 * Decision-gate D3 (settled 2026-06-03) PARKED the control-theory learning
 * substrate (`ace` the import sink + 7 modules reachable only within the island)
 * via 8 adoption-scan allowlist entries + docs/learning-substrate-parked.md with a
 * generic resume condition + a dated retire-or-resume review gate; and separately
 * RETIRED `intrinsic-telemetry` (genuine shelfware, un-registered from
 * heuristics-free-skill-space).
 *
 * This is the #10461 "gate-enforce + drift-guard" pairing. Layer-1 (named
 * *.test.ts, NOT *.integration.test.ts) so the root vitest project runs it every
 * `npx vitest run` — pre-tag-gate step 2 + CI — with no new shell gate step.
 * Independent oracle: re-reads the allowlist, source, and doc; anti-vacuous floors
 * (#10450 — a drift-guard must itself fail loudly).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REPO = process.cwd();

// The 8 island modules (the MA/MB/MD control-theory modules unreachable from
// production; the other 3 family modules — stochastic, embeddings,
// representation-audit — have real production callers and are NOT parked).
const ISLAND = [
  'ace',
  'eligibility',
  'lyapunov',
  'projection',
  'dead-zone',
  'langevin',
  'temperature',
  'learnable-k_h',
] as const;

interface AllowlistEntry {
  module: string;
  reason: string;
  addedAt: string;
  addedBy: string;
}

function allowlist(): AllowlistEntry[] {
  const a = JSON.parse(
    readFileSync(join(REPO, 'tools', 'adoption-scan.allowlist.json'), 'utf8'),
  ) as { entries?: AllowlistEntry[] };
  return a.entries ?? [];
}

describe('MA/MB/MD control-theory island park + intrinsic-telemetry retirement (D3, v1.49.972)', () => {
  it('PARK — all 8 island modules are allowlisted with the D3 park provenance', () => {
    const entries = allowlist();
    // anti-vacuous: the allowlist is the real, grown file (12 prior + 8 island).
    expect(entries.length, 'allowlist should hold the prior + island entries').toBeGreaterThanOrEqual(20);
    for (const mod of ISLAND) {
      const e = entries.find((x) => x.module === mod);
      expect(e, `island module ${mod} must be allowlisted (parked — D3)`).toBeTruthy();
      expect(e!.addedBy, `${mod} allowlist entry must carry the D3 park provenance`).toContain(
        'control-theory island park',
      );
      expect(e!.reason, `${mod} reason must name the control-theory island`).toContain('control-theory');
    }
  });

  it('PARK — the park carries a generic resume condition + a dated review gate', () => {
    const entries = allowlist();
    const ace = entries.find((x) => x.module === 'ace');
    expect(ace, 'ace must be allowlisted').toBeTruthy();
    // Generic (not v1.50-specific) resume + a dated retire-or-resume gate.
    expect(ace!.reason).toContain('generic resume');
    expect(ace!.reason).toMatch(/retire-or-resume review by \d{4}-\d{2}-\d{2}/);
  });

  it('PARK — docs/learning-substrate-parked.md exists and lists all 8 modules + the dated gate', () => {
    const doc = join(REPO, 'docs', 'learning-substrate-parked.md');
    expect(existsSync(doc), 'docs/learning-substrate-parked.md should exist').toBe(true);
    const text = readFileSync(doc, 'utf8');
    for (const mod of ISLAND) {
      expect(text, `park doc should reference src/${mod}/`).toContain(`src/${mod}/`);
    }
    expect(text, 'park doc should carry the dated review gate').toMatch(/2027-06-04/);
  });

  it('RETIRE — intrinsic-telemetry is removed and un-registered from heuristics-free-skill-space', () => {
    expect(
      existsSync(join(REPO, 'src', 'intrinsic-telemetry')),
      'src/intrinsic-telemetry/ should be deleted (retired — D3)',
    ).toBe(false);
    const settings = readFileSync(
      join(REPO, 'src', 'heuristics-free-skill-space', 'settings.ts'),
      'utf8',
    );
    const index = readFileSync(
      join(REPO, 'src', 'heuristics-free-skill-space', 'index.ts'),
      'utf8',
    );
    expect(settings, 'settings.ts must not reference intrinsic_telemetry').not.toContain('intrinsic_telemetry');
    expect(index, 'index.ts must not register intrinsic_telemetry').not.toContain('intrinsic_telemetry');
    // anti-vacuous: a sibling Half-B module remains registered (the retire was surgical).
    expect(index, 'sigreg must still be registered (surgical retire)').toContain('sigreg');
  });
});

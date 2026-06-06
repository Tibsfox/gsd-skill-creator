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
 *
 * Ship 3.1 (v1.49.977) extends this guard with the REACHABILITY dimension: the
 * reachability-aware adoption scanner is run live (imported, not snapshot-read, so
 * the guard is ordering-independent of the ship-time baseline refresh) and the
 * verified island verdict is pinned — 7/8 island modules report
 * reachableFromProduction:false (the headline reclassify of lyapunov/projection),
 * while `ace` (the sink) reports true because it has a real static edge from the
 * production M5 selector (orchestration/selector.ts), runtime-flag-gated default-OFF
 * but statically reachable. Pinning the truth (not forcing ace false) keeps the
 * static scanner honest.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
// @ts-expect-error — adoption-scan.mjs is an untyped tool script; scan() returns the
// ModuleAdoptionRecord[] documented in tools/adoption-scan.mjs.
import { scan } from '../../tools/adoption-scan.mjs';

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

describe('reachability-v2 — control-theory island reachability (Ship 3.1, v1.49.977)', () => {
  // Run the reachability-aware scanner live so this guard is independent of the
  // ship-time baseline refresh ordering (pre-tag-gate runs before the v977 baseline
  // is written). scan() resolves ROOT from process.cwd() = repo root under vitest.
  const records = scan() as Array<{
    module: string;
    status: string;
    reachableFromProduction: boolean;
    allowlisted: boolean;
  }>;
  const byModule = new Map(records.map((r) => [r.module, r]));

  it('REACHABILITY field is present and boolean on every record (anti-vacuous)', () => {
    expect(records.length, 'scan should cover the real src/ tree').toBeGreaterThanOrEqual(150);
    for (const r of records) {
      expect(
        typeof r.reachableFromProduction,
        `${r.module} must carry a boolean reachableFromProduction`,
      ).toBe('boolean');
    }
  });

  it('the 7 non-sink island modules report reachableFromProduction:false', () => {
    // ace (the sink) is excluded — it has a real static edge from the production M5
    // selector and is asserted separately below.
    for (const mod of ISLAND.filter((m) => m !== 'ace')) {
      const r = byModule.get(mod);
      expect(r, `island module ${mod} must be in the scan`).toBeTruthy();
      expect(
        r!.reachableFromProduction,
        `${mod} must be unreachable from production (intra-island importers only)`,
      ).toBe(false);
    }
  });

  it('lyapunov and projection are `living` by import-surface yet unreachable (the headline reclassify)', () => {
    for (const mod of ['lyapunov', 'projection'] as const) {
      const r = byModule.get(mod)!;
      expect(r.status, `${mod} still reads living by import-surface`).toBe('living');
      expect(r.reachableFromProduction, `${mod} is unreachable from production`).toBe(false);
    }
  });

  it('ace (the sink) reports reachableFromProduction:true — static M5-selector edge, runtime-flag-gated', () => {
    // ace/actor-update.ts is statically imported by the reachable orchestration/selector.ts
    // (a value import, not type-only). The flag-off byte-identical guarantee is RUNTIME, not
    // static — so a static reachability scanner correctly reports ace reachable. Pinning this
    // documents WHY ace is true and flags any future removal of the M5 edge.
    const ace = byModule.get('ace')!;
    expect(ace.status).toBe('living');
    expect(ace.reachableFromProduction).toBe(true);
  });

  it('oracle is non-trivial — genuinely production-reachable modules report true', () => {
    // If this fails, the BFS is broken (e.g. reporting everything unreachable), which
    // would make the island assertions vacuously pass.
    for (const mod of ['cli', 'embeddings', 'storage', 'validation'] as const) {
      const r = byModule.get(mod);
      expect(r, `${mod} must be in the scan`).toBeTruthy();
      expect(r!.reachableFromProduction, `${mod} must be reachable from production`).toBe(true);
    }
  });
});

// The reachability-only shelfware modules disposed via ALLOWLIST at v1.49.978.
// Ship 3.2 allowlisted 14; Ship 3.3 (v1.49.979) WIRED three of them — commands,
// learn, scan-arxiv (the sc-learn/scan-arxiv CLI registration) — leaving 11; then
// v1.49.987 WIRED amiga (the dispatch `amiga` command gave the dormant
// meta-mission/CE-1 substrate its production runtime consumer) — leaving 10 here.
// (git + skill were the two of the Ship-3.1 "16" already WIRED at Ship 3.2.)
const SHIP32_ALLOWLISTED = [
  'audio-engineering',
  'bayes-ab',
  'cache',
  'components',
  'dependency-auditor',
  'engines',
  'health-diagnostician',
  'skill-isotropy',
  'skill-promotion',
  'umwelt',
] as const;

// Ship 3.3 (v1.49.979) WIRE-cluster follow-up: registering the sc-learn +
// scan-arxiv CLI surface flips these three modules reachableFromProduction.
// scan-arxiv.ts is the over-determining root — dispatch → commands/scan-arxiv.ts
// → scan-arxiv/bridge.ts → commands/sc-learn.ts → learn/* — so a single edge
// flips all three; the `learn` command registration is the operator-chosen
// first-class surface (and fixes the previously-dead bridge.ts run-ingestion.sh
// line). Module-level reachable=true is coarse: learn/heuristics/* (6 files),
// commands/{sc-install,sc-unlearn,security-init}, and scan-arxiv/{dedup-cli,
// aggregate-generators,primitive-enrichment} remain unreachable (file-level
// residual noted in docs/SHELFWARE-VERDICTS.md).
const SHIP33_WIRED = ['commands', 'learn', 'scan-arxiv'] as const;

describe('Ship 3.2 — reachability-only shelfware disposition (v1.49.978)', () => {
  const records = scan() as Array<{
    module: string;
    status: string;
    reachableFromProduction: boolean;
    allowlisted: boolean;
  }>;
  const byModule = new Map(records.map((r) => [r.module, r]));

  it('the reachability-only shelfware set is EMPTY — every living-but-unreachable module is allowlisted', () => {
    const unreachableLiving = records.filter(
      (r) => r.status === 'living' && !r.reachableFromProduction,
    );
    // anti-vacuous (#10450): there ARE living-but-unreachable modules (the allowlisted
    // island + the v978 parked substrate); the headline invariant is meaningful only
    // because this set is non-empty.
    expect(
      unreachableLiving.length,
      'there should be living-but-unreachable modules to keep this guard non-vacuous',
    ).toBeGreaterThan(5);
    const nonAllowlisted = unreachableLiving.filter((r) => !r.allowlisted).map((r) => r.module);
    expect(
      nonAllowlisted,
      'after Ship 3.2 NO living-but-unreachable module may be non-allowlisted (all wired/allowlisted/retired)',
    ).toEqual([]);
  });

  it('ALLOWLIST — the 10 still-parked modules carry the v978 provenance + dated gate and read allowlisted-unreachable', () => {
    const entries = allowlist();
    for (const mod of SHIP32_ALLOWLISTED) {
      const e = entries.find((x) => x.module === mod);
      expect(e, `${mod} must be allowlisted (Ship 3.2 disposition)`).toBeTruthy();
      expect(e!.addedBy, `${mod} must carry the v978 Ship 3.2 provenance`).toContain('Ship 3.2');
      expect(
        e!.reason,
        `${mod} must carry the dated retire-or-resume gate (no open-ended park)`,
      ).toMatch(/retire-or-resume review by 2027-06-05/);
      const r = byModule.get(mod);
      expect(r, `${mod} must be in the scan`).toBeTruthy();
      expect(r!.allowlisted, `${mod} must read allowlisted in the live scan`).toBe(true);
      expect(r!.reachableFromProduction, `${mod} is parked, still unreachable`).toBe(false);
    }
  });

  it('WIRE — git and skill are now reachable from production (no allowlist needed)', () => {
    for (const mod of ['git', 'skill'] as const) {
      const r = byModule.get(mod);
      expect(r, `${mod} must be in the scan`).toBeTruthy();
      expect(r!.reachableFromProduction, `${mod} must be reachable after the dispatch wire`).toBe(true);
      expect(r!.allowlisted, `${mod} should NOT need an allowlist (it is wired)`).toBe(false);
    }
  });

  it('WIRE (Ship 3.3) — commands, learn, scan-arxiv reachable via the sc-learn/scan-arxiv CLI registration (no allowlist)', () => {
    const entries = allowlist().map((e) => e.module);
    for (const mod of SHIP33_WIRED) {
      const r = byModule.get(mod);
      expect(r, `${mod} must be in the scan`).toBeTruthy();
      expect(
        r!.reachableFromProduction,
        `${mod} must be reachable after the Ship 3.3 dispatch wire (learn/arxiv commands)`,
      ).toBe(true);
      expect(r!.allowlisted, `${mod} should NOT read allowlisted in the live scan (it is wired)`).toBe(false);
      expect(
        entries,
        `${mod} allowlist entry must be REMOVED at Ship 3.3 (mirrors git/skill — wired, not allowlisted)`,
      ).not.toContain(mod);
    }
  });

  it('WIRE (v1.49.987) — amiga is reachable via the dispatch `amiga` command (no allowlist)', () => {
    // Promoting tools/spike-amiga-revive.mjs into src/cli/commands/amiga.ts (wired
    // in dispatch.ts) gives the dormant meta-mission detector + CE-1 ledger their
    // first production runtime consumer: dispatch → commands/amiga.ts →
    // amiga/spike/* → amiga/meta-mission + amiga/ce1. So amiga flips
    // reachableFromProduction:true and, per the git/skill + Ship-3.3 precedent,
    // carries NO allowlist entry (wired, not allowlisted).
    const r = byModule.get('amiga');
    expect(r, 'amiga must be in the scan').toBeTruthy();
    expect(
      r!.reachableFromProduction,
      'amiga must be reachable after the dispatch amiga-command wire',
    ).toBe(true);
    expect(r!.allowlisted, 'amiga should NOT read allowlisted (it is wired)').toBe(false);
    expect(
      allowlist().map((e) => e.module),
      'amiga allowlist entry must be REMOVED at v1.49.987 (mirrors git/skill — wired, not allowlisted)',
    ).not.toContain('amiga');
  });

  it('RETIRE — upstream + upstream-intelligence are deleted, but the config namespace survives', () => {
    expect(existsSync(join(REPO, 'src', 'upstream')), 'src/upstream/ should be deleted').toBe(false);
    expect(
      existsSync(join(REPO, 'src', 'upstream-intelligence')),
      'src/upstream-intelligence/ should be deleted',
    ).toBe(false);
    expect(byModule.has('upstream'), 'upstream should be gone from the scan').toBe(false);
    expect(byModule.has('upstream-intelligence'), 'upstream-intelligence should be gone from the scan').toBe(false);
    const mods = allowlist().map((e) => e.module);
    expect(mods, 'upstream allowlist entry removed').not.toContain('upstream');
    expect(mods, 'upstream-intelligence allowlist entry removed').not.toContain('upstream-intelligence');
    // The `gsd-skill-creator.upstream-intelligence.*.enabled` config namespace is how the
    // 10 living Half-B modules read their flags — it is NOT the retired barrel module and
    // MUST survive the retire.
    const settings = readFileSync(join(REPO, 'src', 'skilldex-auditor', 'settings.ts'), 'utf8');
    expect(
      settings,
      'the upstream-intelligence config namespace must survive the module retire',
    ).toContain('upstream-intelligence');
  });
});

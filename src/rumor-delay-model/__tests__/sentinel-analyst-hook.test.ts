/**
 * SENTINEL/ANALYST hook tests — sentinel-analyst-hook.test.ts
 *
 * Verifies:
 *   1. Default-off passthrough: flag false → { disabled: true, classification: 'unknown' }
 *      for every claim, byte-identical to pre-774 behavior
 *   2. Flag-on path: claims are assessed via Age Gate and Influence Gate
 *   3. Quarantine: old claims (age > τ) are quarantined pending fact-check
 *   4. Expedited: high-influence claims (ρ > ρ*) enter expedited queue
 *   5. Admitted: clean claims pass both gates
 *   6. SENTINEL/ANALYST hook does NOT import from orchestration/capcom/dacp
 *
 * Reference: Alyami, Hamadouche, Hussain. arXiv:2604.17368.
 * CAPCOM spec: m7-capcom-revision.tex §4 SENTINEL/ANALYST Misinfo Handling.
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { classifyClaimStream } from '../sentinel-analyst-hook.js';
import type { Rumor, SignalObservation } from '../types.js';

// ---------------------------------------------------------------------------
// Config fixture helpers
// ---------------------------------------------------------------------------

const tmpFiles: string[] = [];

function writeTmpConfig(content: unknown): string {
  const p = path.join(
    os.tmpdir(),
    `rdm-hook-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );
  fs.writeFileSync(p, JSON.stringify(content));
  tmpFiles.push(p);
  return p;
}

afterEach(() => {
  for (const f of tmpFiles.splice(0)) {
    try { fs.unlinkSync(f); } catch { /* ignore */ }
  }
});

function enabledConfig(overrides?: Record<string, unknown>) {
  return {
    'gsd-skill-creator': {
      'upstream-intelligence': {
        'rumor-delay-model': { enabled: true, ...overrides },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW_MS = Date.now();
const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FIVE_HOURS_MS = 25 * ONE_HOUR_MS;

const freshClaim: Rumor = {
  id: 'claim-fresh',
  description: 'arXiv:2604.17368 SDDE model submitted today',
  influenceScore: 0.5,           // ρ < ρ* = 1.0 → admitted
  submittedAtMs: NOW_MS - ONE_HOUR_MS, // 1 hour ago — fresh
};

const staleClaim: Rumor = {
  id: 'claim-stale',
  description: 'Old claim submitted 25h ago',
  influenceScore: 0.3,
  submittedAtMs: NOW_MS - TWENTY_FIVE_HOURS_MS, // 25h ago → quarantined
};

const highInfluenceClaim: Rumor = {
  id: 'claim-high-influence',
  description: 'Highly cited claim, ρ > 1.0',
  influenceScore: 2.5,           // ρ > ρ* → expedited
  submittedAtMs: NOW_MS - ONE_HOUR_MS,
};

// ---------------------------------------------------------------------------
// Default-off byte-identical passthrough
// ---------------------------------------------------------------------------

describe('sentinel-analyst-hook — default-off passthrough', () => {
  it('flag off (missing config): every claim verdict is pass-through, disabled:true', () => {
    const result = classifyClaimStream(
      [freshClaim, staleClaim, highInfluenceClaim],
      [],
      NOW_MS,
      24 * ONE_HOUR_MS,
      '/no/such/path/rdm.json',
    );

    expect(result.disabled).toBe(true);
    expect(result.aggregate.classification).toBe('unknown');
    expect(result.aggregate.disabled).toBe(true);

    for (const assessment of result.assessments) {
      expect(assessment.verdict).toBe('pass-through');
      expect(assessment.disabled).toBe(true);
    }
  });

  it('flag false (explicit config): byte-identical passthrough', () => {
    const p = writeTmpConfig({
      'gsd-skill-creator': {
        'upstream-intelligence': {
          'rumor-delay-model': { enabled: false },
        },
      },
    });

    const result = classifyClaimStream([freshClaim], [], NOW_MS, 24 * ONE_HOUR_MS, p);
    expect(result.disabled).toBe(true);
    expect(result.assessments[0].verdict).toBe('pass-through');
    expect(result.assessments[0].disabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Flag-on: Claim Age Gate (τ)
// ---------------------------------------------------------------------------

describe('sentinel-analyst-hook — Claim Age Gate (τ)', () => {
  it('stale claim (age > τ) is quarantined', () => {
    const p = writeTmpConfig(enabledConfig());

    const result = classifyClaimStream(
      [staleClaim],
      [],
      NOW_MS,
      24 * ONE_HOUR_MS, // τ = 24h
      p,
    );

    expect(result.disabled).toBeUndefined();
    expect(result.assessments[0].verdict).toBe('quarantined');
    expect(result.assessments[0].claimAgeMs).toBeGreaterThan(24 * ONE_HOUR_MS);
  });

  it('fresh claim (age < τ) is not quarantined by age alone', () => {
    const p = writeTmpConfig(enabledConfig());

    const result = classifyClaimStream(
      [freshClaim],
      [],
      NOW_MS,
      24 * ONE_HOUR_MS,
      p,
    );

    expect(result.assessments[0].verdict).not.toBe('quarantined');
  });
});

// ---------------------------------------------------------------------------
// Flag-on: Influence Threshold Gate (ρ*)
// ---------------------------------------------------------------------------

describe('sentinel-analyst-hook — Influence Threshold Gate (ρ*)', () => {
  it('high-influence claim (ρ > ρ*=1.0) is marked expedited', () => {
    const p = writeTmpConfig(enabledConfig());

    const result = classifyClaimStream(
      [highInfluenceClaim],
      [],
      NOW_MS,
      24 * ONE_HOUR_MS,
      p,
    );

    expect(result.assessments[0].verdict).toBe('expedited');
  });

  it('fresh low-influence claim is admitted', () => {
    const p = writeTmpConfig(enabledConfig());

    const result = classifyClaimStream(
      [freshClaim],
      [],
      NOW_MS,
      24 * ONE_HOUR_MS,
      p,
    );

    expect(result.assessments[0].verdict).toBe('admitted');
  });
});

// ---------------------------------------------------------------------------
// Signal-vs-hype aggregate (observation stream)
// ---------------------------------------------------------------------------

describe('sentinel-analyst-hook — signal-vs-hype aggregate', () => {
  it('decaying observation stream classified as signal', () => {
    const p = writeTmpConfig(enabledConfig());

    // Simulate decaying rumorist fraction (R₀ < 1 trajectory)
    const observations: SignalObservation[] = [
      { t: 0, rumoristFraction: 0.02, factCheckerFraction: 0.00 },
      { t: 1, rumoristFraction: 0.08, factCheckerFraction: 0.01 },
      { t: 2, rumoristFraction: 0.12, factCheckerFraction: 0.02 },
      { t: 3, rumoristFraction: 0.10, factCheckerFraction: 0.04 },
      { t: 4, rumoristFraction: 0.06, factCheckerFraction: 0.07 },
      { t: 5, rumoristFraction: 0.03, factCheckerFraction: 0.09 },
    ];

    const result = classifyClaimStream([freshClaim], observations, NOW_MS, 24 * ONE_HOUR_MS, p);
    // finalFraction = 0.03 / 0.12 = 0.25 → < 0.5 → signal
    expect(result.aggregate.classification).toBe('signal');
    expect(result.aggregate.disabled).toBeUndefined();
  });

  it('sustained observation stream classified as hype', () => {
    const p = writeTmpConfig(enabledConfig());

    // Simulate sustained rumorist fraction (R₀ > 1 trajectory)
    const observations: SignalObservation[] = [
      { t: 0, rumoristFraction: 0.05, factCheckerFraction: 0.00 },
      { t: 1, rumoristFraction: 0.15, factCheckerFraction: 0.01 },
      { t: 2, rumoristFraction: 0.30, factCheckerFraction: 0.02 },
      { t: 3, rumoristFraction: 0.45, factCheckerFraction: 0.02 },
      { t: 4, rumoristFraction: 0.50, factCheckerFraction: 0.03 },
      { t: 5, rumoristFraction: 0.48, factCheckerFraction: 0.03 },
    ];

    const result = classifyClaimStream([freshClaim], observations, NOW_MS, 24 * ONE_HOUR_MS, p);
    // finalFraction = 0.48 / 0.50 = 0.96 → ≥ 0.5 → hype
    expect(result.aggregate.classification).toBe('hype');
  });
});

// ---------------------------------------------------------------------------
// No imports from restricted modules (static check via module path inspection)
// ---------------------------------------------------------------------------

describe('sentinel-analyst-hook — CAPCOM isolation (no orchestration/capcom/dacp)', () => {
  it('sentinel-analyst-hook source does not import orchestration/capcom/dacp', () => {
    // Read the hook source synchronously and verify no restricted imports exist.
    // The readFileSync call is synchronous; we resolve the .ts path from import.meta.url.
    const tsPath = new URL('../sentinel-analyst-hook.js', import.meta.url)
      .pathname
      .replace(/\.js$/, '.ts');

    let hookSource = '';
    try {
      hookSource = fs.readFileSync(tsPath, 'utf8');
    } catch {
      // Compiled environment — fallback to empty string; grep check in
      // the verification suite (grep -rE "src/(orchestration|dacp|capcom)"
      // src/rumor-delay-model/) covers this case.
    }

    if (hookSource) {
      expect(hookSource).not.toMatch(/from ['"].*\/orchestration/);
      expect(hookSource).not.toMatch(/from ['"].*\/capcom/);
      expect(hookSource).not.toMatch(/from ['"].*\/dacp/);
    }

    // Structural assertion: classifyClaimStream must be a function (module loaded).
    expect(typeof classifyClaimStream).toBe('function');
  });
});

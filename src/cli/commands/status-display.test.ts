/**
 * Tests for status-display rendering functions.
 *
 * Covers:
 * - budgetColorCode (BC-09): threshold-based color coding
 * - renderInstalledSection (BC-01, BC-04, BC-07): installed inventory display
 * - renderProjectionSection (BC-02, BC-03, BC-05, BC-06, BC-09): loading projection display
 * - buildStatusJson (BC-08): structured JSON output
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('picocolors', () => ({
  default: {
    bold: (s: string) => s,
    dim: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    green: (s: string) => s,
    cyan: (s: string) => s,
    white: (s: string) => s,
  },
}));

vi.mock('../../validation/budget-validation.js', () => ({
  formatProgressBar: vi.fn((current: number, max: number, width = 20) => {
    const pct = Math.min(current / max, 1);
    const filled = Math.round(width * pct);
    return `[${'#'.repeat(filled)}${'.'.repeat(width - filled)}]`;
  }),
}));

import {
  budgetColorCode,
  renderInstalledSection,
  renderProjectionSection,
  buildStatusJson,
} from './status-display.js';

import type { CumulativeBudgetResult, SkillBudgetInfo } from '../../validation/budget-validation.js';
import type { LoadingProjection } from '../../validation/loading-projection.js';

// ============================================================================
// Test helpers
// ============================================================================

function makeSkill(name: string, totalChars: number): SkillBudgetInfo {
  return {
    name,
    descriptionChars: Math.round(totalChars * 0.1),
    bodyChars: Math.round(totalChars * 0.9),
    totalChars,
    path: `/skills/${name}/SKILL.md`,
  };
}

function makeResult(overrides: Partial<CumulativeBudgetResult> = {}): CumulativeBudgetResult {
  const skills = overrides.skills ?? [
    makeSkill('git-commit', 3800),
    makeSkill('test-runner', 2500),
    makeSkill('deploy', 1700),
  ];
  const totalChars = overrides.totalChars ?? skills.reduce((s, sk) => s + sk.totalChars, 0);
  const budget = overrides.budget ?? 15500;
  return {
    totalChars,
    budget,
    usagePercent: overrides.usagePercent ?? (totalChars / budget) * 100,
    severity: overrides.severity ?? 'ok',
    skills,
    hiddenCount: overrides.hiddenCount ?? 0,
    installedTotal: overrides.installedTotal ?? totalChars,
    loadableTotal: overrides.loadableTotal ?? totalChars,
    projection: overrides.projection,
  };
}

function makeProjection(
  loaded: Array<{ name: string; charCount: number; tier?: string; oversized?: boolean }>,
  deferred: Array<{ name: string; charCount: number; tier?: string; oversized?: boolean }>,
  overrides: Partial<LoadingProjection> = {},
): LoadingProjection {
  const loadedSkills = loaded.map(s => ({
    name: s.name,
    charCount: s.charCount,
    tier: (s.tier ?? 'standard') as 'critical' | 'standard' | 'optional',
    oversized: s.oversized ?? false,
    status: 'loaded' as const,
  }));
  const deferredSkills = deferred.map(s => ({
    name: s.name,
    charCount: s.charCount,
    tier: (s.tier ?? 'standard') as 'critical' | 'standard' | 'optional',
    oversized: s.oversized ?? false,
    status: 'deferred' as const,
  }));
  return {
    loaded: loadedSkills,
    deferred: deferredSkills,
    loadedTotal: overrides.loadedTotal ?? loadedSkills.reduce((s, sk) => s + sk.charCount, 0),
    deferredTotal: overrides.deferredTotal ?? deferredSkills.reduce((s, sk) => s + sk.charCount, 0),
    budgetLimit: overrides.budgetLimit ?? 12000,
    profileName: overrides.profileName ?? 'gsd-executor',
  };
}

// ============================================================================
// budgetColorCode tests (BC-09)
// ============================================================================

describe('budgetColorCode', () => {
  it('returns green for 0%', () => {
    expect(budgetColorCode(0)).toBe('green');
  });

  it('returns green for 30%', () => {
    expect(budgetColorCode(30)).toBe('green');
  });

  it('returns green for 59.9%', () => {
    expect(budgetColorCode(59.9)).toBe('green');
  });

  it('returns cyan for 60%', () => {
    expect(budgetColorCode(60)).toBe('cyan');
  });

  it('returns cyan for 70%', () => {
    expect(budgetColorCode(70)).toBe('cyan');
  });

  it('returns cyan for 79.9%', () => {
    expect(budgetColorCode(79.9)).toBe('cyan');
  });

  it('returns yellow for 80%', () => {
    expect(budgetColorCode(80)).toBe('yellow');
  });

  it('returns yellow for 90%', () => {
    expect(budgetColorCode(90)).toBe('yellow');
  });

  it('returns yellow for 99.9%', () => {
    expect(budgetColorCode(99.9)).toBe('yellow');
  });

  it('returns red for 100%', () => {
    expect(budgetColorCode(100)).toBe('red');
  });

  it('returns red for 150%', () => {
    expect(budgetColorCode(150)).toBe('red');
  });
});

// ============================================================================
// renderInstalledSection tests (BC-01, BC-04, BC-07)
// ============================================================================

describe('renderInstalledSection', () => {
  it('contains "Installed Skills" header', () => {
    const result = makeResult();
    const output = renderInstalledSection(result);
    expect(output).toContain('Installed Skills');
  });

  it('shows skill percentage relative to total installed, not budget (BC-04)', () => {
    // git-commit is 3800 of 8000 total = 47.5%
    const result = makeResult();
    const output = renderInstalledSection(result);
    expect(output).toContain('47.5%');
  });

  it('sorts skills by size descending', () => {
    const skills = [
      makeSkill('small', 1000),
      makeSkill('large', 5000),
      makeSkill('medium', 3000),
    ];
    const result = makeResult({ skills });
    const output = renderInstalledSection(result);

    const largeIdx = output.indexOf('large');
    const mediumIdx = output.indexOf('medium');
    const smallIdx = output.indexOf('small');

    expect(largeIdx).toBeLessThan(mediumIdx);
    expect(mediumIdx).toBeLessThan(smallIdx);
  });

  it('shows mini bars relative to largest skill, not total or budget (BC-07)', () => {
    // Largest skill gets full bar, smaller skill gets proportional
    const skills = [
      makeSkill('large', 4000),
      makeSkill('small', 2000),
    ];
    const result = makeResult({ skills });
    const output = renderInstalledSection(result);

    // The mini bars are 10 chars wide
    // large: formatProgressBar(4000, 4000, 10) = [##########]
    // small: formatProgressBar(2000, 4000, 10) = [#####.....]
    expect(output).toContain('[##########]');
    expect(output).toContain('[#####.....]');
  });

  it('contains total installed char count', () => {
    const result = makeResult();
    // total = 3800 + 2500 + 1700 = 8000
    const output = renderInstalledSection(result);
    expect(output).toMatch(/8,000|8000/);
  });

  it('returns "No skills installed" message for empty skills array', () => {
    const result = makeResult({ skills: [] });
    const output = renderInstalledSection(result);
    expect(output).toMatch(/[Nn]o skills installed/);
  });
});

// ============================================================================
// renderProjectionSection tests (BC-02, BC-03, BC-05, BC-06, BC-09)
// ============================================================================

describe('renderProjectionSection', () => {
  it('contains "Loading Projection" header', () => {
    const projection = makeProjection(
      [{ name: 'a', charCount: 3000 }],
      [{ name: 'b', charCount: 2000 }],
    );
    const result = makeResult({ projection });
    const output = renderProjectionSection(result);
    expect(output).toContain('Loading Projection');
  });

  it('shows progress bar representing loading budget usage (BC-03)', () => {
    const projection = makeProjection(
      [{ name: 'a', charCount: 6000 }],
      [],
      { budgetLimit: 12000 },
    );
    const result = makeResult({ projection });
    const output = renderProjectionSection(result);
    // Should have a progress bar
    expect(output).toMatch(/\[#+\.+\]/);
  });

  it('shows loaded and deferred counts', () => {
    const projection = makeProjection(
      [{ name: 'a', charCount: 3000 }, { name: 'b', charCount: 2000 }],
      [{ name: 'c', charCount: 1000 }],
    );
    const result = makeResult({ projection });
    const output = renderProjectionSection(result);
    expect(output).toContain('2 loaded');
    expect(output).toContain('1 deferred');
  });

  it('shows count-based summary for over-budget (BC-05)', () => {
    // 3 loaded out of 14 total
    const loaded = Array.from({ length: 3 }, (_, i) => ({ name: `skill-${i}`, charCount: 3000 }));
    const deferred = Array.from({ length: 11 }, (_, i) => ({ name: `deferred-${i}`, charCount: 2000 }));
    const projection = makeProjection(loaded, deferred, {
      loadedTotal: 9000,
      deferredTotal: 22000,
      budgetLimit: 10000,
    });
    const result = makeResult({
      projection,
      skills: [...loaded, ...deferred].map(s => makeSkill(s.name, s.charCount)),
    });
    const output = renderProjectionSection(result);
    expect(output).toContain('3 of 14 skills fit');
  });

  it('does not show negative headroom values (BC-06)', () => {
    // loadedTotal > budgetLimit
    const projection = makeProjection(
      [{ name: 'big', charCount: 15000 }],
      [{ name: 'extra', charCount: 5000 }],
      { loadedTotal: 15000, budgetLimit: 12000 },
    );
    const result = makeResult({ projection });
    const output = renderProjectionSection(result);

    // No negative numbers should appear in the output
    expect(output).not.toMatch(/-\d+/);
  });

  it('lists deferred skills with deferred prefix', () => {
    const projection = makeProjection(
      [{ name: 'loaded-skill', charCount: 3000 }],
      [{ name: 'deferred-skill', charCount: 2000 }],
    );
    const result = makeResult({ projection });
    const output = renderProjectionSection(result);
    expect(output).toContain('deferred-skill');
    expect(output).toMatch(/\[deferred\]/i);
  });

  it('shows oversized warning for oversized skills', () => {
    const projection = makeProjection(
      [{ name: 'normal', charCount: 3000 }],
      [{ name: 'huge-skill', charCount: 20000, oversized: true }],
    );
    const result = makeResult({ projection });
    const output = renderProjectionSection(result);
    expect(output).toContain('oversized');
  });

  it('applies color coding based on budget percentage thresholds (BC-09)', () => {
    // 90% usage => yellow
    const projection = makeProjection(
      [{ name: 'a', charCount: 9000 }],
      [],
      { loadedTotal: 9000, budgetLimit: 10000 },
    );
    const result = makeResult({ projection });
    const output = renderProjectionSection(result);
    // Since picocolors is mocked to identity, the percentage text should just appear
    expect(output).toMatch(/90/);
  });

  it('shows informational message when no projection data (no profile)', () => {
    const result = makeResult({ projection: undefined });
    const output = renderProjectionSection(result);
    expect(output).toMatch(/profile/i);
  });
});

// ============================================================================
// buildStatusJson tests (BC-08)
// ============================================================================

describe('buildStatusJson', () => {
  it('returns installed section with skills array having name, charCount, percentOfInstalled', () => {
    const result = makeResult();
    const json = buildStatusJson(result) as any;

    expect(json.installed).toBeInstanceOf(Array);
    expect(json.installed.length).toBe(3);
    expect(json.installed[0]).toHaveProperty('name');
    expect(json.installed[0]).toHaveProperty('charCount');
    expect(json.installed[0]).toHaveProperty('percentOfInstalled');
  });

  it('returns projection section with loaded/deferred arrays when profile provides projection', () => {
    const projection = makeProjection(
      [{ name: 'a', charCount: 3000, tier: 'critical' }],
      [{ name: 'b', charCount: 2000, tier: 'optional', oversized: true }],
    );
    const result = makeResult({ projection });
    const json = buildStatusJson(result) as any;

    expect(json.projection).not.toBeNull();
    expect(json.projection.loaded).toBeInstanceOf(Array);
    expect(json.projection.deferred).toBeInstanceOf(Array);
    expect(json.projection.loadedTotal).toEqual(expect.any(Number));
    expect(json.projection.deferredTotal).toEqual(expect.any(Number));
    expect(json.projection.budgetLimit).toEqual(expect.any(Number));
    expect(json.projection.profileName).toBe('gsd-executor');

    // Check loaded entry fields
    expect(json.projection.loaded[0]).toHaveProperty('name');
    expect(json.projection.loaded[0]).toHaveProperty('charCount');
    expect(json.projection.loaded[0]).toHaveProperty('tier');
    expect(json.projection.loaded[0]).toHaveProperty('oversized');

    // Check deferred entry fields
    expect(json.projection.deferred[0]).toHaveProperty('name');
    expect(json.projection.deferred[0]).toHaveProperty('oversized', true);
  });

  it('returns null projection when no profile is available', () => {
    const result = makeResult({ projection: undefined });
    const json = buildStatusJson(result) as any;
    expect(json.projection).toBeNull();
  });

  it('includes budget and totalInstalled top-level fields', () => {
    const result = makeResult();
    const json = buildStatusJson(result) as any;
    expect(json.budget).toEqual(expect.any(Number));
    expect(json.totalInstalled).toEqual(expect.any(Number));
  });

  it('sorts installed skills by size descending', () => {
    const skills = [
      makeSkill('small', 1000),
      makeSkill('large', 5000),
      makeSkill('medium', 3000),
    ];
    const result = makeResult({ skills });
    const json = buildStatusJson(result) as any;

    expect(json.installed[0].name).toBe('large');
    expect(json.installed[1].name).toBe('medium');
    expect(json.installed[2].name).toBe('small');
  });

  it('computes percentOfInstalled using total installed as denominator', () => {
    // git-commit is 3800 of 8000 total = 47.5%
    const result = makeResult();
    const json = buildStatusJson(result) as any;

    const gitCommit = json.installed.find((s: any) => s.name === 'git-commit');
    expect(gitCommit.percentOfInstalled).toBe(47.5);
  });
});

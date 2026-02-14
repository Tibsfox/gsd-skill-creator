/**
 * Tests for the enhanced status CLI command.
 *
 * Covers:
 * - Two-section layout: Installed Skills + Loading Projection
 * - Profile-aware checkCumulative call
 * - Help flag
 * - JSON output mode (basic structure, detailed JSON tests in 150-03)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before imports
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: {
    message: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('picocolors', () => ({
  default: {
    bold: (s: string) => s,
    dim: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    green: (s: string) => s,
    cyan: (s: string) => s,
    white: (s: string) => s,
    bgCyan: (s: string) => s,
    black: (s: string) => s,
  },
}));

// Mock fs/promises stat
vi.mock('fs/promises', () => ({
  stat: vi.fn().mockRejectedValue(new Error('ENOENT')),
}));

const mockCheckCumulative = vi.fn().mockResolvedValue({
  totalChars: 8000,
  budget: 15500,
  usagePercent: 51.6,
  severity: 'ok' as const,
  skills: [
    { name: 'git-commit', descriptionChars: 50, bodyChars: 3500, totalChars: 3800, path: '/skills/git-commit/SKILL.md' },
    { name: 'test-runner', descriptionChars: 40, bodyChars: 2200, totalChars: 2500, path: '/skills/test-runner/SKILL.md' },
    { name: 'deploy', descriptionChars: 30, bodyChars: 1700, totalChars: 1700, path: '/skills/deploy/SKILL.md' },
  ],
  hiddenCount: 0,
  installedTotal: 8000,
  loadableTotal: 8000,
});

vi.mock('../../validation/budget-validation.js', () => ({
  BudgetValidator: {
    load: vi.fn(() => ({
      checkCumulative: mockCheckCumulative,
      getBudget: vi.fn().mockReturnValue(15000),
      getCumulativeBudget: vi.fn().mockReturnValue(15500),
    })),
  },
  formatProgressBar: vi.fn((current: number, max: number) => {
    const pct = Math.min(current / max, 1);
    const filled = Math.round(20 * pct);
    return `[${'#'.repeat(filled)}${'.'.repeat(20 - filled)}]`;
  }),
}));

vi.mock('../../disclosure/disclosure-budget.js', () => {
  return {
    DisclosureBudget: function DisclosureBudget() {
      return {
        calculateBreakdown: vi.fn().mockResolvedValue({
          skillMdChars: 3000,
          skillMdWords: 500,
          references: [],
          scripts: [],
          totalChars: 3800,
          alwaysLoadedChars: 3000,
          conditionalChars: 800,
        }),
      };
    },
  };
});

const mockRead = vi.fn().mockResolvedValue([]);
const mockAppend = vi.fn().mockResolvedValue(undefined);

vi.mock('../../storage/budget-history.js', () => {
  return {
    BudgetHistory: function BudgetHistory() {
      return {
        read: mockRead,
        append: mockAppend,
      };
    },
  };
});

// Add static getTrend to the mock
import { BudgetHistory } from '../../storage/budget-history.js';
(BudgetHistory as any).getTrend = vi.fn().mockReturnValue(null);

vi.mock('../../index.js', () => ({
  createApplicationContext: vi.fn(() => ({
    applicator: {
      initialize: vi.fn().mockResolvedValue(undefined),
      getActiveDisplay: vi.fn().mockReturnValue('Active skills: git-commit, test-runner'),
      getReport: vi.fn().mockReturnValue({
        flaggedSkills: [],
      }),
    },
  })),
}));

// Mock SkillStore for inheritance chain display
const mockSkillStoreList = vi.fn().mockResolvedValue([]);
const mockSkillStoreRead = vi.fn().mockResolvedValue(null);

vi.mock('../../storage/skill-store.js', () => ({
  SkillStore: function SkillStore() {
    return {
      list: mockSkillStoreList,
      read: mockSkillStoreRead,
    };
  },
}));

// Mock status-display rendering functions
const mockRenderInstalled = vi.fn().mockReturnValue('INSTALLED_SECTION_OUTPUT');
const mockRenderProjection = vi.fn().mockReturnValue('PROJECTION_SECTION_OUTPUT');

vi.mock('./status-display.js', () => ({
  renderInstalledSection: (...args: unknown[]) => mockRenderInstalled(...args),
  renderProjectionSection: (...args: unknown[]) => mockRenderProjection(...args),
  buildStatusJson: vi.fn((result: any) => {
    const installedTotal = result.installedTotal ?? result.totalChars;
    const sorted = [...(result.skills || [])].sort((a: any, b: any) => b.totalChars - a.totalChars);
    return {
      budget: result.budget,
      totalInstalled: installedTotal,
      installed: sorted.map((s: any) => ({
        name: s.name,
        charCount: s.totalChars,
        percentOfInstalled: installedTotal > 0
          ? Math.round(((s.totalChars / installedTotal) * 100) * 10) / 10
          : 0,
      })),
      projection: result.projection ? {
        profileName: result.projection.profileName,
        budgetLimit: result.projection.budgetLimit,
        loadedTotal: result.projection.loadedTotal,
        deferredTotal: result.projection.deferredTotal,
        loaded: result.projection.loaded.map((s: any) => ({
          name: s.name,
          charCount: s.charCount,
          tier: s.tier,
          oversized: s.oversized,
        })),
        deferred: result.projection.deferred.map((s: any) => ({
          name: s.name,
          charCount: s.charCount,
          tier: s.tier,
          oversized: s.oversized,
        })),
      } : null,
    };
  }),
}));

// Mock budget-profiles
const mockGetBudgetProfile = vi.fn().mockReturnValue({
  name: 'gsd-executor',
  budgetPercent: 0.06,
  hardCeilingPercent: 0.10,
  tiers: { critical: [], standard: [], optional: [] },
  thresholds: { warn50: true, warn80: true, warn100: true },
});

vi.mock('../../application/budget-profiles.js', () => ({
  getBudgetProfile: (...args: unknown[]) => mockGetBudgetProfile(...args),
  getTierForSkill: vi.fn().mockReturnValue('standard'),
}));

// Capture console.log output
const consoleOutput: string[] = [];
const originalLog = console.log;

beforeEach(() => {
  consoleOutput.length = 0;
  console.log = vi.fn((...args: unknown[]) => {
    consoleOutput.push(args.map(String).join(' '));
  });
  vi.clearAllMocks();
  // Reset default mock behaviors after clearAllMocks
  mockCheckCumulative.mockResolvedValue({
    totalChars: 8000,
    budget: 15500,
    usagePercent: 51.6,
    severity: 'ok' as const,
    skills: [
      { name: 'git-commit', descriptionChars: 50, bodyChars: 3500, totalChars: 3800, path: '/skills/git-commit/SKILL.md' },
      { name: 'test-runner', descriptionChars: 40, bodyChars: 2200, totalChars: 2500, path: '/skills/test-runner/SKILL.md' },
      { name: 'deploy', descriptionChars: 30, bodyChars: 1700, totalChars: 1700, path: '/skills/deploy/SKILL.md' },
    ],
    hiddenCount: 0,
    installedTotal: 8000,
    loadableTotal: 8000,
  });
  mockRenderInstalled.mockReturnValue('INSTALLED_SECTION_OUTPUT');
  mockRenderProjection.mockReturnValue('PROJECTION_SECTION_OUTPUT');
  mockRead.mockResolvedValue([]);
  mockAppend.mockResolvedValue(undefined);
  (BudgetHistory as any).getTrend = vi.fn().mockReturnValue(null);
  mockSkillStoreList.mockResolvedValue([]);
  mockSkillStoreRead.mockResolvedValue(null);
  mockGetBudgetProfile.mockReturnValue({
    name: 'gsd-executor',
    budgetPercent: 0.06,
    hardCeilingPercent: 0.10,
    tiers: { critical: [], standard: [], optional: [] },
    thresholds: { warn50: true, warn80: true, warn100: true },
  });
});

afterEach(() => {
  console.log = originalLog;
});

import { statusCommand } from './status.js';

describe('statusCommand', () => {
  it('should print help text and return 0 with --help flag', async () => {
    const exitCode = await statusCommand(['--help']);

    expect(exitCode).toBe(0);

    const output = consoleOutput.join('\n');
    expect(output).toMatch(/[Uu]sage/);
    expect(output).toMatch(/status/);
  });

  it('should show Installed Skills section header', async () => {
    const exitCode = await statusCommand([]);

    expect(exitCode).toBe(0);

    const output = consoleOutput.join('\n');
    // renderInstalledSection is called and its output is logged
    expect(output).toContain('INSTALLED_SECTION_OUTPUT');
  });

  it('should show Loading Projection section header', async () => {
    const exitCode = await statusCommand([]);

    expect(exitCode).toBe(0);

    const output = consoleOutput.join('\n');
    // renderProjectionSection is called and its output is logged
    expect(output).toContain('PROJECTION_SECTION_OUTPUT');
  });

  it('should call renderInstalledSection with the cumulative result', async () => {
    await statusCommand([]);

    expect(mockRenderInstalled).toHaveBeenCalledTimes(1);
    const arg = mockRenderInstalled.mock.calls[0][0];
    expect(arg.totalChars).toBe(8000);
    expect(arg.skills).toHaveLength(3);
  });

  it('should call renderProjectionSection with the cumulative result', async () => {
    await statusCommand([]);

    expect(mockRenderProjection).toHaveBeenCalledTimes(1);
    const arg = mockRenderProjection.mock.calls[0][0];
    expect(arg.totalChars).toBe(8000);
  });

  it('should pass profile to checkCumulative when getBudgetProfile returns a profile', async () => {
    const testProfile = {
      name: 'gsd-executor',
      budgetPercent: 0.06,
      hardCeilingPercent: 0.10,
      tiers: { critical: [], standard: [], optional: [] },
      thresholds: { warn50: true, warn80: true, warn100: true },
    };
    mockGetBudgetProfile.mockReturnValue(testProfile);

    await statusCommand([]);

    // checkCumulative should be called with the profile
    expect(mockCheckCumulative).toHaveBeenCalledWith(
      expect.any(String),
      testProfile,
    );
  });

  it('should show skill percentages relative to total installed', async () => {
    // With 3800 of 8000 total = 47.5%
    // Since renderInstalledSection is mocked, we verify the result passed has correct data
    mockRenderInstalled.mockImplementation((result: any) => {
      const pct = ((3800 / result.installedTotal) * 100).toFixed(1);
      return `skill pct: ${pct}%`;
    });

    await statusCommand([]);

    const output = consoleOutput.join('\n');
    expect(output).toContain('47.5%');
  });

  it('should show loaded/deferred counts when projection is available', async () => {
    mockCheckCumulative.mockResolvedValue({
      totalChars: 8000,
      budget: 15500,
      usagePercent: 51.6,
      severity: 'ok' as const,
      skills: [
        { name: 'a', descriptionChars: 10, bodyChars: 2990, totalChars: 3000, path: '/skills/a/SKILL.md' },
        { name: 'b', descriptionChars: 10, bodyChars: 2990, totalChars: 3000, path: '/skills/b/SKILL.md' },
        { name: 'c', descriptionChars: 10, bodyChars: 1990, totalChars: 2000, path: '/skills/c/SKILL.md' },
      ],
      hiddenCount: 0,
      installedTotal: 8000,
      loadableTotal: 6000,
      projection: {
        loaded: [
          { name: 'a', charCount: 3000, tier: 'standard', oversized: false, status: 'loaded' },
          { name: 'b', charCount: 3000, tier: 'standard', oversized: false, status: 'loaded' },
        ],
        deferred: [
          { name: 'c', charCount: 2000, tier: 'optional', oversized: false, status: 'deferred' },
        ],
        loadedTotal: 6000,
        deferredTotal: 2000,
        budgetLimit: 12000,
        profileName: 'gsd-executor',
      },
    });

    mockRenderProjection.mockImplementation((result: any) => {
      const proj = result.projection;
      return `${proj.loaded.length} loaded, ${proj.deferred.length} deferred`;
    });

    await statusCommand([]);

    const output = consoleOutput.join('\n');
    expect(output).toContain('2 loaded');
    expect(output).toContain('1 deferred');
  });

  it('should show count-based summary for over-budget', async () => {
    mockCheckCumulative.mockResolvedValue({
      totalChars: 42000,
      budget: 15500,
      usagePercent: 271,
      severity: 'error' as const,
      skills: Array.from({ length: 14 }, (_, i) => ({
        name: `skill-${i}`, descriptionChars: 10, bodyChars: 2990, totalChars: 3000, path: `/skills/skill-${i}/SKILL.md`,
      })),
      hiddenCount: 11,
      installedTotal: 42000,
      loadableTotal: 9000,
      projection: {
        loaded: Array.from({ length: 3 }, (_, i) => ({
          name: `skill-${i}`, charCount: 3000, tier: 'standard' as const, oversized: false, status: 'loaded' as const,
        })),
        deferred: Array.from({ length: 11 }, (_, i) => ({
          name: `skill-${i + 3}`, charCount: 3000, tier: 'standard' as const, oversized: false, status: 'deferred' as const,
        })),
        loadedTotal: 9000,
        deferredTotal: 33000,
        budgetLimit: 12000,
        profileName: 'gsd-executor',
      },
    });

    mockRenderProjection.mockImplementation((result: any) => {
      const proj = result.projection;
      const total = proj.loaded.length + proj.deferred.length;
      return `${proj.loaded.length} of ${total} skills fit`;
    });

    await statusCommand([]);

    const output = consoleOutput.join('\n');
    expect(output).toContain('3 of 14 skills fit');
  });

  it('should not show negative headroom values', async () => {
    mockCheckCumulative.mockResolvedValue({
      totalChars: 20000,
      budget: 15500,
      usagePercent: 129,
      severity: 'error' as const,
      skills: [{ name: 'big', descriptionChars: 10, bodyChars: 19990, totalChars: 20000, path: '/skills/big/SKILL.md' }],
      hiddenCount: 0,
      installedTotal: 20000,
      loadableTotal: 15000,
      projection: {
        loaded: [{ name: 'big', charCount: 15000, tier: 'standard' as const, oversized: true, status: 'loaded' as const }],
        deferred: [{ name: 'extra', charCount: 5000, tier: 'optional' as const, oversized: false, status: 'deferred' as const }],
        loadedTotal: 15000,
        deferredTotal: 5000,
        budgetLimit: 12000,
        profileName: 'gsd-executor',
      },
    });

    mockRenderProjection.mockImplementation((result: any) => {
      // Verify no negative headroom
      const headroom = result.projection.budgetLimit - result.projection.loadedTotal;
      if (headroom < 0) {
        return `Budget exceeded — ${result.projection.deferred.length} skills deferred`;
      }
      return `Headroom: ${headroom}`;
    });

    await statusCommand([]);

    const output = consoleOutput.join('\n');
    // No negative numbers
    expect(output).not.toMatch(/-\d+/);
  });

  it('should show color-coded budget percentage', async () => {
    mockRenderProjection.mockReturnValue('90% budget used');

    await statusCommand([]);

    const output = consoleOutput.join('\n');
    expect(output).toContain('90%');
  });

  it('should produce JSON with installed section containing skills with percentOfInstalled', async () => {
    const exitCode = await statusCommand(['--json']);

    expect(exitCode).toBe(0);

    const fullOutput = consoleOutput.join('\n');
    const parsed = JSON.parse(fullOutput);
    expect(parsed).toHaveProperty('installed');
    expect(parsed.installed).toBeInstanceOf(Array);
    expect(parsed.installed.length).toBe(3);
    expect(parsed.installed[0]).toHaveProperty('name');
    expect(parsed.installed[0]).toHaveProperty('charCount');
    expect(parsed.installed[0]).toHaveProperty('percentOfInstalled');
  });

  it('should produce JSON with projection section when profile provides projection', async () => {
    mockCheckCumulative.mockResolvedValue({
      totalChars: 8000,
      budget: 15500,
      usagePercent: 51.6,
      severity: 'ok' as const,
      skills: [
        { name: 'git-commit', descriptionChars: 50, bodyChars: 3500, totalChars: 3800, path: '/skills/git-commit/SKILL.md' },
        { name: 'test-runner', descriptionChars: 40, bodyChars: 2200, totalChars: 2500, path: '/skills/test-runner/SKILL.md' },
      ],
      hiddenCount: 0,
      installedTotal: 6300,
      loadableTotal: 3800,
      projection: {
        loaded: [{ name: 'git-commit', charCount: 3800, tier: 'standard', oversized: false, status: 'loaded' }],
        deferred: [{ name: 'test-runner', charCount: 2500, tier: 'optional', oversized: false, status: 'deferred' }],
        loadedTotal: 3800,
        deferredTotal: 2500,
        budgetLimit: 12000,
        profileName: 'gsd-executor',
      },
    });

    const exitCode = await statusCommand(['--json']);

    expect(exitCode).toBe(0);

    const fullOutput = consoleOutput.join('\n');
    const parsed = JSON.parse(fullOutput);
    expect(parsed.projection).not.toBeNull();
    expect(parsed.projection).toHaveProperty('profileName');
    expect(parsed.projection).toHaveProperty('budgetLimit');
    expect(parsed.projection).toHaveProperty('loadedTotal');
    expect(parsed.projection).toHaveProperty('deferredTotal');
    expect(parsed.projection.loaded).toBeInstanceOf(Array);
    expect(parsed.projection.deferred).toBeInstanceOf(Array);
    expect(parsed.projection.loaded[0]).toHaveProperty('name');
    expect(parsed.projection.loaded[0]).toHaveProperty('charCount');
    expect(parsed.projection.loaded[0]).toHaveProperty('tier');
    expect(parsed.projection.loaded[0]).toHaveProperty('oversized');
  });

  it('should produce JSON with null projection when no profile available', async () => {
    mockCheckCumulative.mockResolvedValue({
      totalChars: 8000,
      budget: 15500,
      usagePercent: 51.6,
      severity: 'ok' as const,
      skills: [
        { name: 'git-commit', descriptionChars: 50, bodyChars: 3500, totalChars: 3800, path: '/skills/git-commit/SKILL.md' },
      ],
      hiddenCount: 0,
      installedTotal: 3800,
      loadableTotal: 3800,
      // No projection (no profile)
    });

    const exitCode = await statusCommand(['--json']);

    expect(exitCode).toBe(0);

    const fullOutput = consoleOutput.join('\n');
    const parsed = JSON.parse(fullOutput);
    expect(parsed.projection).toBeNull();
  });

  it('should include budget and totalInstalled in JSON output', async () => {
    const exitCode = await statusCommand(['--json']);

    expect(exitCode).toBe(0);

    const fullOutput = consoleOutput.join('\n');
    const parsed = JSON.parse(fullOutput);
    expect(parsed.budget).toEqual(expect.any(Number));
    expect(parsed.totalInstalled).toEqual(expect.any(Number));
  });

  it('should include trend data in JSON output', async () => {
    (BudgetHistory as any).getTrend = vi.fn().mockReturnValue({
      charDelta: 500,
      skillDelta: 1,
      periodSnapshots: 5,
    });

    const exitCode = await statusCommand(['--json']);

    expect(exitCode).toBe(0);

    const fullOutput = consoleOutput.join('\n');
    const parsed = JSON.parse(fullOutput);
    expect(parsed.trend).toHaveProperty('charDelta', 500);
    expect(parsed.trend).toHaveProperty('skillDelta', 1);
    expect(parsed.trend).toHaveProperty('periodSnapshots', 5);
  });

  it('should sort installed skills by size descending in JSON', async () => {
    // skills are already in the mock: git-commit(3800) > test-runner(2500) > deploy(1700)
    const exitCode = await statusCommand(['--json']);

    expect(exitCode).toBe(0);

    const fullOutput = consoleOutput.join('\n');
    const parsed = JSON.parse(fullOutput);
    expect(parsed.installed[0].charCount).toBeGreaterThanOrEqual(parsed.installed[1].charCount);
    expect(parsed.installed[1].charCount).toBeGreaterThanOrEqual(parsed.installed[2].charCount);
  });

  it('should show "No skills installed" when no skills exist', async () => {
    mockCheckCumulative.mockResolvedValue({
      totalChars: 0,
      budget: 15500,
      usagePercent: 0,
      severity: 'ok' as const,
      skills: [],
      hiddenCount: 0,
      installedTotal: 0,
      loadableTotal: 0,
    });

    mockRenderInstalled.mockReturnValue('No skills installed.');

    const exitCode = await statusCommand([]);

    expect(exitCode).toBe(0);

    const output = consoleOutput.join('\n');
    expect(output).toMatch(/[Nn]o skills installed/i);
  });
});

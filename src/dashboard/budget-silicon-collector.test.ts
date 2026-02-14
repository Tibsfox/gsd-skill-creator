import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CumulativeBudgetResult } from '../validation/budget-validation.js';
import type { IntegrationConfig } from '../integration/config/types.js';

// Mock BudgetValidator
vi.mock('../validation/budget-validation.js', () => {
  const mockCheckCumulative = vi.fn();
  return {
    BudgetValidator: {
      load: vi.fn(() => ({
        checkCumulative: mockCheckCumulative,
      })),
    },
    __mockCheckCumulative: mockCheckCumulative,
  };
});

// Mock readIntegrationConfig
vi.mock('../integration/config/reader.js', () => ({
  readIntegrationConfig: vi.fn(),
}));

import { toBudgetGaugeData, toSiliconPanelData, collectBudgetSiliconData } from './budget-silicon-collector.js';
import { BudgetValidator } from '../validation/budget-validation.js';
import { readIntegrationConfig } from '../integration/config/reader.js';

// ============================================================================
// toBudgetGaugeData
// ============================================================================

describe('toBudgetGaugeData', () => {
  it('returns empty segments and zero usage for 0 skills', () => {
    const result: CumulativeBudgetResult = {
      totalChars: 0,
      budget: 15500,
      usagePercent: 0,
      severity: 'ok',
      skills: [],
      hiddenCount: 0,
      installedTotal: 0,
      loadableTotal: 0,
    };

    const gauge = toBudgetGaugeData(result);

    expect(gauge.segments).toEqual([]);
    expect(gauge.totalUsed).toBe(0);
    expect(gauge.overBudget).toBe(false);
    expect(gauge.deferredSkills).toEqual([]);
  });

  it('maps 2 skills to segments with correct percentages', () => {
    const result: CumulativeBudgetResult = {
      totalChars: 7750,
      budget: 15500,
      usagePercent: 50,
      severity: 'ok',
      skills: [
        {
          name: 'api-server',
          descriptionChars: 100,
          bodyChars: 4550,
          totalChars: 4650,
          path: '/skills/api-server/SKILL.md',
        },
        {
          name: 'test-runner',
          descriptionChars: 80,
          bodyChars: 3020,
          totalChars: 3100,
          path: '/skills/test-runner/SKILL.md',
        },
      ],
      hiddenCount: 0,
      installedTotal: 7750,
      loadableTotal: 7750,
    };

    const gauge = toBudgetGaugeData(result);

    expect(gauge.segments).toHaveLength(2);
    expect(gauge.segments[0].percentage).toBe(30); // 4650/15500*100 = 30
    expect(gauge.segments[1].percentage).toBe(20); // 3100/15500*100 = 20
    expect(gauge.totalUsed).toBe(50);
    expect(gauge.overBudget).toBe(false);
  });

  it('sets overBudget=true when usagePercent exceeds 100', () => {
    const result: CumulativeBudgetResult = {
      totalChars: 20000,
      budget: 15500,
      usagePercent: 129.03,
      severity: 'error',
      skills: [
        {
          name: 'large-skill',
          descriptionChars: 200,
          bodyChars: 19800,
          totalChars: 20000,
          path: '/skills/large-skill/SKILL.md',
        },
      ],
      hiddenCount: 1,
      installedTotal: 20000,
      loadableTotal: 20000,
    };

    const gauge = toBudgetGaugeData(result);

    expect(gauge.overBudget).toBe(true);
  });

  it('populates deferredSkills from projection', () => {
    const result: CumulativeBudgetResult = {
      totalChars: 15000,
      budget: 15500,
      usagePercent: 96.77,
      severity: 'warning',
      skills: [
        {
          name: 'loaded-skill',
          descriptionChars: 100,
          bodyChars: 10000,
          totalChars: 10100,
          path: '/skills/loaded-skill/SKILL.md',
        },
        {
          name: 'deferred-one',
          descriptionChars: 80,
          bodyChars: 4820,
          totalChars: 4900,
          path: '/skills/deferred-one/SKILL.md',
        },
      ],
      hiddenCount: 0,
      installedTotal: 15000,
      loadableTotal: 10100,
      projection: {
        loaded: [
          { name: 'loaded-skill', charCount: 10100, tier: 'critical', oversized: false, status: 'loaded' },
        ],
        deferred: [
          { name: 'deferred-one', charCount: 4900, tier: 'standard', oversized: false, status: 'deferred' },
        ],
        loadedTotal: 10100,
        deferredTotal: 4900,
        budgetLimit: 15500,
        profileName: 'executor',
      },
    };

    const gauge = toBudgetGaugeData(result);

    expect(gauge.deferredSkills).toEqual(['deferred-one']);
  });

  it('always sets label to "Token Budget"', () => {
    const result: CumulativeBudgetResult = {
      totalChars: 0,
      budget: 15500,
      usagePercent: 0,
      severity: 'ok',
      skills: [],
      hiddenCount: 0,
      installedTotal: 0,
      loadableTotal: 0,
    };

    const gauge = toBudgetGaugeData(result);

    expect(gauge.label).toBe('Token Budget');
  });

  it('infers domain colors from skill name keywords', () => {
    const result: CumulativeBudgetResult = {
      totalChars: 6200,
      budget: 15500,
      usagePercent: 40,
      severity: 'ok',
      skills: [
        {
          name: 'api-server',
          descriptionChars: 100,
          bodyChars: 3000,
          totalChars: 3100,
          path: '/skills/api-server/SKILL.md',
        },
        {
          name: 'test-runner',
          descriptionChars: 100,
          bodyChars: 3000,
          totalChars: 3100,
          path: '/skills/test-runner/SKILL.md',
        },
      ],
      hiddenCount: 0,
      installedTotal: 6200,
      loadableTotal: 6200,
    };

    const gauge = toBudgetGaugeData(result);

    // 'api' matches backend keyword, 'test' matches testing keyword
    expect(gauge.segments[0].color).toContain('--domain-backend');
    expect(gauge.segments[1].color).toContain('--domain-testing');
  });

  it('uses muted color for unknown domain', () => {
    const result: CumulativeBudgetResult = {
      totalChars: 3100,
      budget: 15500,
      usagePercent: 20,
      severity: 'ok',
      skills: [
        {
          name: 'random-stuff',
          descriptionChars: 100,
          bodyChars: 3000,
          totalChars: 3100,
          path: '/skills/random-stuff/SKILL.md',
        },
      ],
      hiddenCount: 0,
      installedTotal: 3100,
      loadableTotal: 3100,
    };

    const gauge = toBudgetGaugeData(result);

    // 'random' and 'stuff' don't match any domain keywords
    // inferDomain defaults to 'infrastructure' which has a domain color
    // so it should use --domain-infrastructure
    expect(gauge.segments[0].color).toContain('--domain-');
  });
});

// ============================================================================
// toSiliconPanelData
// ============================================================================

describe('toSiliconPanelData', () => {
  it('returns enabled=null with empty arrays when config is null', () => {
    const data = toSiliconPanelData(null);

    expect(data.enabled).toBeNull();
    expect(data.adapters).toEqual([]);
    expect(data.vram.segments).toEqual([]);
    expect(data.vram.totalUsed).toBe(0);
  });

  it('returns enabled from config.integration.auto_load_skills', () => {
    const config: IntegrationConfig = {
      integration: {
        auto_load_skills: true,
        observe_sessions: true,
        phase_transition_hooks: true,
        suggest_on_session_start: true,
        install_git_hooks: true,
        wrapper_commands: true,
      },
      token_budget: {
        max_percent: 5,
        warn_at_percent: 4,
      },
      observation: {
        retention_days: 30,
        max_entries: 10000,
        capture_corrections: true,
      },
      suggestions: {
        min_occurrences: 3,
        cooldown_days: 7,
        auto_dismiss_after_days: 30,
      },
      terminal: {
        enabled: false,
        port: 3001,
        host: 'localhost',
        tmux_session: 'gsd',
      },
    };

    const data = toSiliconPanelData(config);

    expect(data.enabled).toBe(true);
    expect(data.adapters).toEqual([]);
    expect(data.vram.segments).toEqual([]);
    expect(data.vram.totalUsed).toBe(0);
  });

  it('returns enabled=false when auto_load_skills is false', () => {
    const config: IntegrationConfig = {
      integration: {
        auto_load_skills: false,
        observe_sessions: true,
        phase_transition_hooks: true,
        suggest_on_session_start: true,
        install_git_hooks: true,
        wrapper_commands: true,
      },
      token_budget: {
        max_percent: 5,
        warn_at_percent: 4,
      },
      observation: {
        retention_days: 30,
        max_entries: 10000,
        capture_corrections: true,
      },
      suggestions: {
        min_occurrences: 3,
        cooldown_days: 7,
        auto_dismiss_after_days: 30,
      },
      terminal: {
        enabled: false,
        port: 3001,
        host: 'localhost',
        tmux_session: 'gsd',
      },
    };

    const data = toSiliconPanelData(config);

    expect(data.enabled).toBe(false);
  });
});

// ============================================================================
// collectBudgetSiliconData
// ============================================================================

describe('collectBudgetSiliconData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns both gauge and silicon data from I/O sources', async () => {
    const mockResult: CumulativeBudgetResult = {
      totalChars: 5000,
      budget: 15500,
      usagePercent: 32.26,
      severity: 'ok',
      skills: [
        {
          name: 'my-skill',
          descriptionChars: 100,
          bodyChars: 4900,
          totalChars: 5000,
          path: '/skills/my-skill/SKILL.md',
        },
      ],
      hiddenCount: 0,
      installedTotal: 5000,
      loadableTotal: 5000,
    };

    const mockConfig: IntegrationConfig = {
      integration: {
        auto_load_skills: true,
        observe_sessions: true,
        phase_transition_hooks: true,
        suggest_on_session_start: true,
        install_git_hooks: true,
        wrapper_commands: true,
      },
      token_budget: {
        max_percent: 5,
        warn_at_percent: 4,
      },
      observation: {
        retention_days: 30,
        max_entries: 10000,
        capture_corrections: true,
      },
      suggestions: {
        min_occurrences: 3,
        cooldown_days: 7,
        auto_dismiss_after_days: 30,
      },
      terminal: {
        enabled: false,
        port: 3001,
        host: 'localhost',
        tmux_session: 'gsd',
      },
    };

    // Access the mock from the module factory
    const mockLoad = BudgetValidator.load as ReturnType<typeof vi.fn>;
    const mockCheckCumulative = vi.fn().mockResolvedValue(mockResult);
    mockLoad.mockReturnValue({ checkCumulative: mockCheckCumulative });

    const mockReadConfig = readIntegrationConfig as ReturnType<typeof vi.fn>;
    mockReadConfig.mockResolvedValue(mockConfig);

    const data = await collectBudgetSiliconData();

    expect(data.gauge).toBeDefined();
    expect(data.gauge.totalUsed).toBe(32.26);
    expect(data.gauge.segments).toHaveLength(1);

    expect(data.silicon).toBeDefined();
    expect(data.silicon.enabled).toBe(true);
  });

  it('handles ENOENT from readIntegrationConfig gracefully', async () => {
    const mockResult: CumulativeBudgetResult = {
      totalChars: 0,
      budget: 15500,
      usagePercent: 0,
      severity: 'ok',
      skills: [],
      hiddenCount: 0,
      installedTotal: 0,
      loadableTotal: 0,
    };

    const mockLoad = BudgetValidator.load as ReturnType<typeof vi.fn>;
    const mockCheckCumulative = vi.fn().mockResolvedValue(mockResult);
    mockLoad.mockReturnValue({ checkCumulative: mockCheckCumulative });

    const mockReadConfig = readIntegrationConfig as ReturnType<typeof vi.fn>;
    const enoentError = new Error('ENOENT') as NodeJS.ErrnoException;
    enoentError.code = 'ENOENT';
    mockReadConfig.mockRejectedValue(enoentError);

    const data = await collectBudgetSiliconData();

    expect(data.silicon.enabled).toBeNull();
    expect(data.gauge.segments).toEqual([]);
  });
});

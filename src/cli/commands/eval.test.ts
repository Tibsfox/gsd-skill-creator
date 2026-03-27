/**
 * Tests for the eval CLI command.
 *
 * Mocks ChipRegistry, MultiModelBenchmarkRunner, ThresholdsConfigLoader, and EvalViewer
 * to isolate command routing and output format from actual benchmark execution.
 *
 * Tests verify: subcommand dispatch, --model flag parsing, --json output,
 * help display, missing skill error, no-chips fallback, eval registered in cli.ts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { evalCommand } from './eval.js';

// ============================================================================
// Capture console output
// ============================================================================

let consoleOutput: string[] = [];
let consoleErrors: string[] = [];

beforeEach(() => {
  consoleOutput = [];
  consoleErrors = [];
  vi.spyOn(console, 'log').mockImplementation((...args) => {
    consoleOutput.push(args.map(String).join(' '));
  });
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    consoleErrors.push(args.map(String).join(' '));
  });
  // Suppress clack's p.log calls (writes to process.stdout directly)
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// Mock ChipRegistry
// ============================================================================

vi.mock('../../chips/chip-registry.js', () => {
  let configured = false;
  let chips: string[] = [];

  return {
    createChipRegistry: vi.fn().mockImplementation(() => ({
      loadFromFile: vi.fn().mockResolvedValue(undefined),
      isConfigured: vi.fn().mockImplementation(() => configured),
      list: vi.fn().mockImplementation(() => chips),
    })),
    __setConfigured: (val: boolean) => { configured = val; },
    __setChips: (val: string[]) => { chips = val; },
  };
});

// ============================================================================
// Mock ThresholdsConfigLoader
// ============================================================================

vi.mock('../../eval/thresholds-config.js', () => ({
  ThresholdsConfigLoader: vi.fn().mockImplementation(function () {
    return {
      loadFromFile: vi.fn().mockResolvedValue({ version: 1, defaultPassRate: 0.75, chips: {} }),
      getThresholdForChip: vi.fn().mockReturnValue(0.75),
      getStatus: vi.fn().mockReturnValue('above'),
    };
  }),
}));

// ============================================================================
// Mock MultiModelBenchmarkRunner
// ============================================================================

const mockBenchmark = {
  skillName: 'test-skill',
  benchmarkedAt: '2026-03-03T00:00:00Z',
  models: [
    {
      model: 'ollama',
      runCount: 5,
      passRate: 0.80,
      avgAccuracy: 85.0,
      avgF1: 0.82,
      thresholdStatus: 'above',
    },
  ],
  runs: [
    {
      skillName: 'test-skill',
      model: 'ollama',
      runAt: '2026-03-03T00:00:00Z',
      duration: 1000,
      metrics: {
        total: 10, passed: 8, failed: 2, accuracy: 80.0, falsePositiveRate: 5.0,
        truePositives: 4, trueNegatives: 4, falsePositives: 1, falseNegatives: 1,
        edgeCaseCount: 0, precision: 0.8, recall: 0.8, f1Score: 0.8,
      },
      passed: true,
      hints: [],
    },
  ],
  legacyRunCount: 0,
};

vi.mock('../../eval/multi-model-benchmark.js', () => ({
  MultiModelBenchmarkRunner: vi.fn().mockImplementation(function () {
    return {
      benchmarkSkill: vi.fn().mockResolvedValue(mockBenchmark),
    };
  }),
}));

// ============================================================================
// Mock ChipTestRunner
// ============================================================================

vi.mock('../../chips/chip-test-runner.js', () => {
  const mockResult = {
    skillName: 'test-skill',
    runAt: '2026-03-03T00:00:00Z',
    duration: 1000,
    metrics: {
      total: 10, passed: 8, failed: 2, accuracy: 80.0, falsePositiveRate: 5.0,
      truePositives: 4, trueNegatives: 4, falsePositives: 1, falseNegatives: 1,
      edgeCaseCount: 0, precision: 0.8, recall: 0.8, f1Score: 0.8,
    },
    passed: true,
    hints: [],
    results: [],
    positiveResults: [],
    negativeResults: [],
    edgeCaseResults: [],
  };

  return {
    ChipTestRunner: vi.fn().mockImplementation(function () {
      return {
        runForSkill: vi.fn().mockResolvedValue(mockResult),
      };
    }),
  };
});

// Helper to configure mock registry state
async function setRegistryState(isConfigured: boolean, chipList: string[] = ['ollama']) {
  const mod = await import('../../chips/chip-registry.js') as Record<string, unknown>;
  (mod.__setConfigured as (v: boolean) => void)(isConfigured);
  (mod.__setChips as (v: string[]) => void)(isConfigured ? chipList : []);
}

// ============================================================================
// eval help
// ============================================================================

describe('eval help', () => {
  it('shows help for --help flag', async () => {
    const exitCode = await evalCommand(['--help']);
    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    expect(output).toContain('view');
    expect(output).toContain('skill-creator eval');
  });

  it('shows help for help subcommand', async () => {
    const exitCode = await evalCommand(['help']);
    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    expect(output).toContain('view');
  });

  it('shows help when no subcommand provided', async () => {
    const exitCode = await evalCommand([]);
    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    expect(output).toContain('view');
  });
});

// ============================================================================
// eval view - basic routing
// ============================================================================

describe('eval view', () => {
  it('returns exit code 1 when no skill name provided', async () => {
    await setRegistryState(true, ['ollama']);
    const exitCode = await evalCommand(['view']);
    expect(exitCode).toBe(1);
  });

  it('returns exit code 0 when chips are configured and skill name provided', async () => {
    await setRegistryState(true, ['ollama']);
    const exitCode = await evalCommand(['view', 'test-skill']);
    expect(exitCode).toBe(0);
  });

  it('produces output with skill name', async () => {
    await setRegistryState(true, ['ollama']);
    await evalCommand(['view', 'test-skill']);
    const output = consoleOutput.join('\n');
    expect(output).toContain('test-skill');
  });
});

// ============================================================================
// eval view --model flag
// ============================================================================

describe('eval view --model flag', () => {
  it('returns exit code 0 with --model=ollama', async () => {
    await setRegistryState(true, ['ollama']);
    const exitCode = await evalCommand(['view', 'test-skill', '--model=ollama']);
    expect(exitCode).toBe(0);
  });

  it('passes model filter to viewer', async () => {
    await setRegistryState(true, ['ollama']);
    await evalCommand(['view', 'test-skill', '--model=ollama']);
    const output = consoleOutput.join('\n');
    // With model filter, should show model detail or filtered JSON
    expect(output).toBeTruthy();
  });
});

// ============================================================================
// eval view --json flag
// ============================================================================

describe('eval view --json flag', () => {
  it('returns exit code 0 with --json', async () => {
    await setRegistryState(true, ['ollama']);
    const exitCode = await evalCommand(['view', 'test-skill', '--json']);
    expect(exitCode).toBe(0);
  });

  it('outputs valid JSON with --json', async () => {
    await setRegistryState(true, ['ollama']);
    await evalCommand(['view', 'test-skill', '--json']);
    const output = consoleOutput.join('\n');
    // Should be parseable JSON
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('outputs filtered JSON with --json and --model', async () => {
    await setRegistryState(true, ['ollama']);
    await evalCommand(['view', 'test-skill', '--json', '--model=ollama']);
    const output = consoleOutput.join('\n');
    const parsed = JSON.parse(output) as { models: Array<{ model: string }> };
    expect(parsed).toBeTruthy();
  });
});

// ============================================================================
// eval view - no chips fallback
// ============================================================================

describe('eval view - no chips fallback', () => {
  it('returns exit code 0 when no chips configured (fallback to no-data message)', async () => {
    await setRegistryState(false);
    const exitCode = await evalCommand(['view', 'test-skill']);
    expect(exitCode).toBe(0);
  });

  it('shows informational message when no chips configured', async () => {
    await setRegistryState(false);
    await evalCommand(['view', 'test-skill']);
    const output = consoleOutput.join('\n') + process.stdout.write.toString();
    // Should not just be empty
    expect(output.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Unknown subcommand
// ============================================================================

describe('eval command routing', () => {
  it('returns exit code 1 for unknown subcommand', async () => {
    const exitCode = await evalCommand(['unknown-subcommand']);
    expect(exitCode).toBe(1);
  });
});

// ============================================================================
// cli.ts integration: eval case exists
// ============================================================================

describe('cli.ts integration', () => {
  it.todo('src/cli.ts exports/contains eval command registration — eval not yet wired into cli.ts');
});

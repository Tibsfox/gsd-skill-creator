/**
 * Tests for ChipRegistry.
 *
 * Filesystem is mocked via vi.mock('node:fs/promises') -- no real I/O.
 * Chip health/capabilities methods are mocked per test as needed.
 *
 * Covers:
 * - loadFromFile() with valid chipset.json
 * - loadFromFile() with missing file (CHIP-06 backward compatibility)
 * - loadFromFile() with invalid JSON
 * - loadFromFile() with invalid schema
 * - loadFromFile() with role referencing nonexistent chip name
 * - get() / getByRole() / list() accessors
 * - isConfigured() returns false before load, true after
 * - healthCheck() calls health() on all chips in parallel
 * - capabilitiesReport() calls capabilities() on all chips
 * - register() allows programmatic chip addition
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChipRegistry, createChipRegistry } from './chip-registry.js';
import type { ModelChip, ChipHealth, ChipCapabilities } from './types.js';

// ============================================================================
// Mock node:fs/promises
// ============================================================================

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { readFile } from 'node:fs/promises';

const mockReadFile = readFile as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockReadFile.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// Helpers
// ============================================================================

function makeEnoentError(): NodeJS.ErrnoException {
  const err = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
  err.code = 'ENOENT';
  return err;
}

function makeChipsetJson(content: object): string {
  return JSON.stringify(content);
}

const validChipset = {
  version: 1,
  chips: [
    {
      name: 'ollama',
      type: 'openai-compatible',
      baseUrl: 'http://localhost:11434',
      defaultModel: 'llama3',
    },
    {
      name: 'claude',
      type: 'anthropic',
      apiKey: 'sk-ant-test',
      defaultModel: 'claude-sonnet-4-20250514',
    },
  ],
  roles: {
    executor: 'ollama',
    grader: 'claude',
  },
};

function makeMockChip(name: string, healthResult: Partial<ChipHealth> = {}): ModelChip {
  return {
    name,
    type: 'openai-compatible',
    chat: vi.fn(),
    health: vi.fn().mockResolvedValue({
      available: true,
      latencyMs: 42,
      lastChecked: new Date().toISOString(),
      ...healthResult,
    }),
    capabilities: vi.fn().mockResolvedValue({
      models: ['model-a'],
      maxContextLength: 4096,
      supportsStreaming: false,
      supportsTools: false,
    } satisfies ChipCapabilities),
  };
}

// ============================================================================
// createChipRegistry factory
// ============================================================================

describe('createChipRegistry()', () => {
  it('creates a new ChipRegistry instance', () => {
    const registry = createChipRegistry();
    expect(registry).toBeInstanceOf(ChipRegistry);
  });

  it('returns unconfigured registry (no file load)', () => {
    const registry = createChipRegistry();
    expect(registry.isConfigured()).toBe(false);
  });
});

// ============================================================================
// ChipRegistry -- loadFromFile()
// ============================================================================

describe('ChipRegistry.loadFromFile()', () => {
  it('populates registry from valid chipset.json', async () => {
    mockReadFile.mockResolvedValueOnce(makeChipsetJson(validChipset));

    const registry = new ChipRegistry();
    await registry.loadFromFile('/path/to/chipset.json');

    expect(registry.isConfigured()).toBe(true);
    expect(registry.list()).toHaveLength(2);
    expect(registry.list()).toContain('ollama');
    expect(registry.list()).toContain('claude');
  });

  it('returns silently when file does not exist (CHIP-06 backward compat)', async () => {
    mockReadFile.mockRejectedValueOnce(makeEnoentError());

    const registry = new ChipRegistry();
    await expect(registry.loadFromFile('/path/to/chipset.json')).resolves.toBeUndefined();
    expect(registry.isConfigured()).toBe(false);
    expect(registry.list()).toHaveLength(0);
  });

  it('throws when JSON is invalid', async () => {
    mockReadFile.mockResolvedValueOnce('{ not valid json }}}');

    const registry = new ChipRegistry();
    await expect(registry.loadFromFile('/path/to/chipset.json')).rejects.toThrow();
  });

  it('throws when schema is invalid (missing version)', async () => {
    const badChipset = {
      chips: validChipset.chips,
      // missing required 'version' field
    };
    mockReadFile.mockResolvedValueOnce(makeChipsetJson(badChipset));

    const registry = new ChipRegistry();
    await expect(registry.loadFromFile('/path/to/chipset.json')).rejects.toThrow();
  });

  it('throws when schema is invalid (wrong version)', async () => {
    const badChipset = { ...validChipset, version: 2 };
    mockReadFile.mockResolvedValueOnce(makeChipsetJson(badChipset));

    const registry = new ChipRegistry();
    await expect(registry.loadFromFile('/path/to/chipset.json')).rejects.toThrow();
  });

  it('throws when role references nonexistent chip name', async () => {
    const badChipset = {
      ...validChipset,
      roles: {
        executor: 'nonexistent-chip',
      },
    };
    mockReadFile.mockResolvedValueOnce(makeChipsetJson(badChipset));

    const registry = new ChipRegistry();
    await expect(registry.loadFromFile('/path/to/chipset.json')).rejects.toThrow(
      /nonexistent-chip/,
    );
  });

  it('loads chipset without roles section', async () => {
    const chipsetNoRoles = {
      version: 1,
      chips: validChipset.chips,
    };
    mockReadFile.mockResolvedValueOnce(makeChipsetJson(chipsetNoRoles));

    const registry = new ChipRegistry();
    await registry.loadFromFile('/path/to/chipset.json');

    expect(registry.isConfigured()).toBe(true);
    expect(registry.list()).toHaveLength(2);
  });
});

// ============================================================================
// ChipRegistry -- get() and getByRole()
// ============================================================================

describe('ChipRegistry.get()', () => {
  it('returns chip by name after loading', async () => {
    mockReadFile.mockResolvedValueOnce(makeChipsetJson(validChipset));

    const registry = new ChipRegistry();
    await registry.loadFromFile('/path/to/chipset.json');

    const chip = registry.get('ollama');
    expect(chip).toBeDefined();
    expect(chip!.name).toBe('ollama');
    expect(chip!.type).toBe('openai-compatible');
  });

  it('returns undefined for unknown chip name', async () => {
    mockReadFile.mockResolvedValueOnce(makeChipsetJson(validChipset));

    const registry = new ChipRegistry();
    await registry.loadFromFile('/path/to/chipset.json');

    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('returns undefined when registry is not configured', () => {
    const registry = new ChipRegistry();
    expect(registry.get('any-chip')).toBeUndefined();
  });
});

describe('ChipRegistry.getByRole()', () => {
  it('resolves role to chip instance', async () => {
    mockReadFile.mockResolvedValueOnce(makeChipsetJson(validChipset));

    const registry = new ChipRegistry();
    await registry.loadFromFile('/path/to/chipset.json');

    const chip = registry.getByRole('executor');
    expect(chip).toBeDefined();
    expect(chip!.name).toBe('ollama');

    const grader = registry.getByRole('grader');
    expect(grader).toBeDefined();
    expect(grader!.name).toBe('claude');
  });

  it('returns undefined for unassigned role', async () => {
    mockReadFile.mockResolvedValueOnce(makeChipsetJson(validChipset));

    const registry = new ChipRegistry();
    await registry.loadFromFile('/path/to/chipset.json');

    // 'analyzer' is not assigned in validChipset.roles
    expect(registry.getByRole('analyzer')).toBeUndefined();
  });

  it('returns undefined when no roles configured', async () => {
    const chipsetNoRoles = { version: 1, chips: validChipset.chips };
    mockReadFile.mockResolvedValueOnce(makeChipsetJson(chipsetNoRoles));

    const registry = new ChipRegistry();
    await registry.loadFromFile('/path/to/chipset.json');

    expect(registry.getByRole('executor')).toBeUndefined();
  });
});

// ============================================================================
// ChipRegistry -- list()
// ============================================================================

describe('ChipRegistry.list()', () => {
  it('returns all registered chip names', async () => {
    mockReadFile.mockResolvedValueOnce(makeChipsetJson(validChipset));

    const registry = new ChipRegistry();
    await registry.loadFromFile('/path/to/chipset.json');

    const names = registry.list();
    expect(names).toHaveLength(2);
    expect(names).toContain('ollama');
    expect(names).toContain('claude');
  });

  it('returns empty array when not configured', () => {
    const registry = new ChipRegistry();
    expect(registry.list()).toEqual([]);
  });
});

// ============================================================================
// ChipRegistry -- isConfigured()
// ============================================================================

describe('ChipRegistry.isConfigured()', () => {
  it('returns false before any load', () => {
    const registry = new ChipRegistry();
    expect(registry.isConfigured()).toBe(false);
  });

  it('returns false after failed load (missing file)', async () => {
    mockReadFile.mockRejectedValueOnce(makeEnoentError());

    const registry = new ChipRegistry();
    await registry.loadFromFile('/path/to/chipset.json');

    expect(registry.isConfigured()).toBe(false);
  });

  it('returns true after successful load', async () => {
    mockReadFile.mockResolvedValueOnce(makeChipsetJson(validChipset));

    const registry = new ChipRegistry();
    await registry.loadFromFile('/path/to/chipset.json');

    expect(registry.isConfigured()).toBe(true);
  });
});

// ============================================================================
// ChipRegistry -- healthCheck()
// ============================================================================

describe('ChipRegistry.healthCheck()', () => {
  it('calls health() on all chips and returns results indexed by name', async () => {
    const registry = new ChipRegistry();
    const chip1 = makeMockChip('chip1', { available: true, latencyMs: 10 });
    const chip2 = makeMockChip('chip2', { available: false, latencyMs: null });
    registry.register('chip1', chip1);
    registry.register('chip2', chip2);

    const results = await registry.healthCheck();

    expect(chip1.health).toHaveBeenCalledOnce();
    expect(chip2.health).toHaveBeenCalledOnce();
    expect(results['chip1'].available).toBe(true);
    expect(results['chip1'].latencyMs).toBe(10);
    expect(results['chip2'].available).toBe(false);
    expect(results['chip2'].latencyMs).toBeNull();
  });

  it('returns empty object when no chips registered', async () => {
    const registry = new ChipRegistry();
    const results = await registry.healthCheck();
    expect(results).toEqual({});
  });

  it('runs health checks in parallel (Promise.allSettled)', async () => {
    const registry = new ChipRegistry();
    const callOrder: string[] = [];

    // Create chips whose health() resolves asynchronously
    const chip1: ModelChip = {
      name: 'chip1',
      type: 'openai-compatible',
      chat: vi.fn(),
      health: vi.fn().mockImplementation(async () => {
        callOrder.push('chip1-start');
        await Promise.resolve(); // yield
        callOrder.push('chip1-end');
        return { available: true, latencyMs: 5, lastChecked: new Date().toISOString() };
      }),
      capabilities: vi.fn(),
    };
    const chip2: ModelChip = {
      name: 'chip2',
      type: 'anthropic',
      chat: vi.fn(),
      health: vi.fn().mockImplementation(async () => {
        callOrder.push('chip2-start');
        await Promise.resolve();
        callOrder.push('chip2-end');
        return { available: true, latencyMs: 8, lastChecked: new Date().toISOString() };
      }),
      capabilities: vi.fn(),
    };

    registry.register('chip1', chip1);
    registry.register('chip2', chip2);

    await registry.healthCheck();

    // Both chips started before either finished (parallel execution)
    const chip1Start = callOrder.indexOf('chip1-start');
    const chip2Start = callOrder.indexOf('chip2-start');
    const chip1End = callOrder.indexOf('chip1-end');

    expect(chip1Start).toBeLessThan(chip1End);
    expect(chip2Start).toBeLessThan(chip1End);
  });
});

// ============================================================================
// ChipRegistry -- capabilitiesReport()
// ============================================================================

describe('ChipRegistry.capabilitiesReport()', () => {
  it('calls capabilities() on all chips and returns results indexed by name', async () => {
    const registry = new ChipRegistry();
    const chip1 = makeMockChip('chip1');
    const chip2 = makeMockChip('chip2');
    registry.register('chip1', chip1);
    registry.register('chip2', chip2);

    const results = await registry.capabilitiesReport();

    expect(chip1.capabilities).toHaveBeenCalledOnce();
    expect(chip2.capabilities).toHaveBeenCalledOnce();
    expect(results['chip1'].models).toEqual(['model-a']);
    expect(results['chip2'].models).toEqual(['model-a']);
  });

  it('returns empty object when no chips registered', async () => {
    const registry = new ChipRegistry();
    const results = await registry.capabilitiesReport();
    expect(results).toEqual({});
  });
});

// ============================================================================
// ChipRegistry -- register()
// ============================================================================

describe('ChipRegistry.register()', () => {
  it('adds a chip and sets isConfigured=true', () => {
    const registry = new ChipRegistry();
    expect(registry.isConfigured()).toBe(false);

    const chip = makeMockChip('my-chip');
    registry.register('my-chip', chip);

    expect(registry.isConfigured()).toBe(true);
    expect(registry.get('my-chip')).toBe(chip);
    expect(registry.list()).toContain('my-chip');
  });

  it('overwrites existing chip with same name', () => {
    const registry = new ChipRegistry();
    const chip1 = makeMockChip('alpha');
    const chip2 = makeMockChip('alpha');

    registry.register('alpha', chip1);
    registry.register('alpha', chip2);

    expect(registry.get('alpha')).toBe(chip2);
    expect(registry.list()).toHaveLength(1);
  });

  it('allows programmatic registration for testing (CLI --chip override pattern)', () => {
    const registry = new ChipRegistry();
    const chip = makeMockChip('override-chip');

    registry.register('override-chip', chip);

    expect(registry.get('override-chip')).toBe(chip);
    expect(registry.isConfigured()).toBe(true);
  });
});

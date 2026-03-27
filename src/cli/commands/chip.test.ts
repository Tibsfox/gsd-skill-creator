/**
 * Tests for the chip CLI command.
 *
 * Mocks ChipRegistry to avoid file system and network access.
 * Tests verify: subcommand dispatch, output format (human/json), error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { chipCommand } from './chip.js';

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
  // Suppress clack's p.log calls
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

  const mockRegistry = {
    loadFromFile: vi.fn().mockImplementation(async () => {
      // Default: not configured (no chipset.json)
    }),
    isConfigured: vi.fn().mockImplementation(() => configured),
    list: vi.fn().mockImplementation(() => chips),
    healthCheck: vi.fn().mockResolvedValue({
      ollama: { available: true, latencyMs: 42, lastChecked: '2026-03-03T00:00:00Z' },
    }),
    capabilitiesReport: vi.fn().mockResolvedValue({
      ollama: {
        models: ['llama3', 'mistral'],
        maxContextLength: 8192,
        supportsStreaming: true,
        supportsTools: false,
      },
    }),
  };

  return {
    createChipRegistry: vi.fn().mockImplementation(() => {
      // Reset state per call so tests can configure independently
      return {
        ...mockRegistry,
        loadFromFile: vi.fn().mockResolvedValue(undefined),
        isConfigured: vi.fn().mockReturnValue(configured),
        list: vi.fn().mockReturnValue(chips),
        healthCheck: mockRegistry.healthCheck,
        capabilitiesReport: mockRegistry.capabilitiesReport,
      };
    }),
    // Expose setters for tests
    __setConfigured: (val: boolean) => { configured = val; },
    __setChips: (val: string[]) => { chips = val; },
  };
});

// Helper to configure mock registry state
async function setRegistryState(isConfigured: boolean, chipList: string[] = ['ollama']) {
  const mod = await import('../../chips/chip-registry.js') as Record<string, unknown>;
  (mod.__setConfigured as (v: boolean) => void)(isConfigured);
  (mod.__setChips as (v: string[]) => void)(isConfigured ? chipList : []);
}

// ============================================================================
// chip status
// ============================================================================

describe('chip status', () => {
  it('shows helpful message when no chipset.json', async () => {
    await setRegistryState(false);
    const exitCode = await chipCommand(['status']);
    expect(exitCode).toBe(0);
    // Should not error
    expect(consoleErrors).toHaveLength(0);
  });

  it('status --json shows configured=false when no chipset', async () => {
    await setRegistryState(false);
    const exitCode = await chipCommand(['status', '--json']);
    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    const parsed = JSON.parse(output) as { configured: boolean; chips: string[] };
    expect(parsed.configured).toBe(false);
    expect(parsed.chips).toEqual([]);
  });

  it('status --json shows configured=true with chip list', async () => {
    await setRegistryState(true, ['ollama', 'claude']);
    const exitCode = await chipCommand(['status', '--json']);
    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    const parsed = JSON.parse(output) as { configured: boolean; chips: string[] };
    expect(parsed.configured).toBe(true);
    expect(parsed.chips).toContain('ollama');
    expect(parsed.chips).toContain('claude');
  });
});

// ============================================================================
// chip health
// ============================================================================

describe('chip health', () => {
  it('shows no-chipset message when registry not configured', async () => {
    await setRegistryState(false);
    const exitCode = await chipCommand(['health']);
    expect(exitCode).toBe(0);
    expect(consoleErrors).toHaveLength(0);
  });

  it('health --json returns health record with configured=true', async () => {
    await setRegistryState(true);
    const exitCode = await chipCommand(['health', '--json']);
    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    const parsed = JSON.parse(output) as { configured: boolean; health: Record<string, unknown> };
    expect(parsed.configured).toBe(true);
    expect(parsed.health).toHaveProperty('ollama');
  });

  it('health --json shows availability and latency', async () => {
    await setRegistryState(true);
    const exitCode = await chipCommand(['health', '--json']);
    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    const parsed = JSON.parse(output) as {
      health: Record<string, { available: boolean; latencyMs: number }>;
    };
    expect(parsed.health.ollama.available).toBe(true);
    expect(parsed.health.ollama.latencyMs).toBe(42);
  });
});

// ============================================================================
// chip list
// ============================================================================

describe('chip list', () => {
  it('shows no-chipset message when not configured', async () => {
    await setRegistryState(false);
    const exitCode = await chipCommand(['list']);
    expect(exitCode).toBe(0);
    expect(consoleErrors).toHaveLength(0);
  });

  it('list --json shows chip names and models', async () => {
    await setRegistryState(true, ['ollama']);
    const exitCode = await chipCommand(['list', '--json']);
    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    const parsed = JSON.parse(output) as {
      configured: boolean;
      chips: Array<{ name: string; models: string[] }>;
    };
    expect(parsed.configured).toBe(true);
    expect(parsed.chips).toHaveLength(1);
    expect(parsed.chips[0].name).toBe('ollama');
    expect(parsed.chips[0].models).toContain('llama3');
  });
});

// ============================================================================
// chip capabilities
// ============================================================================

describe('chip capabilities', () => {
  it('shows no-chipset message when not configured', async () => {
    await setRegistryState(false);
    const exitCode = await chipCommand(['capabilities']);
    expect(exitCode).toBe(0);
    expect(consoleErrors).toHaveLength(0);
  });

  it('capabilities --json shows model lists and context lengths', async () => {
    await setRegistryState(true, ['ollama']);
    const exitCode = await chipCommand(['capabilities', '--json']);
    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    const parsed = JSON.parse(output) as {
      configured: boolean;
      capabilities: Record<string, { models: string[]; maxContextLength: number }>;
    };
    expect(parsed.configured).toBe(true);
    expect(parsed.capabilities.ollama.models).toContain('llama3');
    expect(parsed.capabilities.ollama.maxContextLength).toBe(8192);
  });

  it('caps alias works for capabilities', async () => {
    await setRegistryState(true, ['ollama']);
    const exitCode = await chipCommand(['caps', '--json']);
    expect(exitCode).toBe(0);
  });
});

// ============================================================================
// Unknown subcommand / help
// ============================================================================

describe('chip command routing', () => {
  it('returns exit code 1 for unknown subcommand', async () => {
    await setRegistryState(false);
    const exitCode = await chipCommand(['unknown-subcommand']);
    expect(exitCode).toBe(1);
  });

  it('shows help for --help flag', async () => {
    const exitCode = await chipCommand(['--help']);
    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    expect(output).toContain('status');
    expect(output).toContain('health');
    expect(output).toContain('list');
    expect(output).toContain('capabilities');
  });

  it('shows help with no subcommand', async () => {
    const exitCode = await chipCommand([]);
    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    expect(output).toContain('status');
  });
});

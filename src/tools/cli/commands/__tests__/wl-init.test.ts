import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wlInitCommand } from '../wl-init.js';

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  confirm: vi.fn(),
  select: vi.fn(),
  isCancel: vi.fn(),
  cancel: vi.fn(),
}));

vi.mock('../../../../integrations/wasteland/config.js', () => ({
  saveConfig: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../../integrations/wasteland/dolthub-client.js', () => ({
  createClient: vi.fn().mockReturnValue({
    execute: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
  }),
}));

import * as p from '@clack/prompts';
import { saveConfig } from '../../../../integrations/wasteland/config.js';
import { createClient } from '../../../../integrations/wasteland/dolthub-client.js';

const ALL_FLAGS = [
  '--handle', 'fox',
  '--email', 'fox@test.com',
  '--fork', 'fox/wl-commons',
  '--local-dir', '/tmp/commons',
  '--display-name', 'Fox',
  '--dolthub-org', 'fox',
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('wlInitCommand --help', () => {
  it('returns 0 for --help', async () => {
    const result = await wlInitCommand(['--help']);
    expect(result).toBe(0);
  });

  it('returns 0 for -h', async () => {
    const result = await wlInitCommand(['-h']);
    expect(result).toBe(0);
  });
});

describe('wlInitCommand dry-run (no --execute)', () => {
  it('returns 0 without --execute when all flags provided', async () => {
    const result = await wlInitCommand(ALL_FLAGS);
    expect(result).toBe(0);
  });

  it('does NOT call client.execute() without --execute flag', async () => {
    await wlInitCommand(ALL_FLAGS);
    const mockClient = vi.mocked(createClient).mock.results[0];
    // createClient should NOT have been called on the dry-run path
    expect(vi.mocked(createClient)).not.toHaveBeenCalled();
  });

  it('prints SQL text in console output', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await wlInitCommand(ALL_FLAGS);
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    expect(output).toMatch(/INSERT INTO rigs/i);
    consoleSpy.mockRestore();
  });
});

describe('wlInitCommand --execute', () => {
  it('calls client.execute() once when --execute is passed', async () => {
    const mockExecute = vi.fn().mockResolvedValue({ stdout: '', stderr: '' });
    vi.mocked(createClient).mockReturnValue({
      execute: mockExecute,
      query: vi.fn(),
      localQuery: vi.fn(),
      generateSQL: vi.fn(),
    });
    await wlInitCommand([...ALL_FLAGS, '--execute']);
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('returns 0 on successful --execute', async () => {
    const mockExecute = vi.fn().mockResolvedValue({ stdout: '', stderr: '' });
    vi.mocked(createClient).mockReturnValue({
      execute: mockExecute,
      query: vi.fn(),
      localQuery: vi.fn(),
      generateSQL: vi.fn(),
    });
    const result = await wlInitCommand([...ALL_FLAGS, '--execute']);
    expect(result).toBe(0);
  });
});

describe('wlInitCommand --json', () => {
  it('returns 0 and outputs parseable JSON with --json and all required flags', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = await wlInitCommand([...ALL_FLAGS, '--json']);
    const output = consoleSpy.mock.calls.map(c => c.join(' ')).join('\n');
    consoleSpy.mockRestore();
    expect(result).toBe(0);
    // Find and parse JSON from output
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    expect(jsonMatch).not.toBeNull();
    const parsed = JSON.parse(jsonMatch![0]);
    expect(parsed).toHaveProperty('status');
  });
});

describe('wlInitCommand saveConfig', () => {
  it('calls saveConfig() once with constructed config when all flags provided', async () => {
    await wlInitCommand(ALL_FLAGS);
    expect(vi.mocked(saveConfig)).toHaveBeenCalledTimes(1);
    const [config] = vi.mocked(saveConfig).mock.calls[0];
    expect(config).toMatchObject({
      handle: 'fox',
      email: 'fox@test.com',
      dolthub_org: 'fox',
    });
  });
});

describe('wlInitCommand cancellation', () => {
  it('returns 1 when user cancels prompt (Ctrl+C)', async () => {
    const cancelSymbol = Symbol('cancel');
    vi.mocked(p.isCancel).mockReturnValue(true);
    vi.mocked(p.text).mockResolvedValue(cancelSymbol as unknown as string);
    // Pass no flags so prompts are triggered
    const result = await wlInitCommand([]);
    expect(result).toBe(1);
  });
});

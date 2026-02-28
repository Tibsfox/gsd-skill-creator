/**
 * Tests for DACP export-templates CLI command.
 *
 * Mocks filesystem reads to isolate CLI logic.
 * Verifies exit codes, format selection, and empty-state handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock functions
const { mockLog, mockReadFile } = vi.hoisted(() => ({
  mockLog: {
    error: vi.fn(),
    message: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
  mockReadFile: vi.fn(),
}));

// Mock @clack/prompts
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: mockLog,
}));

// Mock picocolors pass-through
vi.mock('picocolors', () => ({
  default: {
    bold: (s: string) => s,
    dim: (s: string) => s,
    cyan: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    green: (s: string) => s,
    bgCyan: (s: string) => s,
    black: (s: string) => s,
  },
}));

// Mock node:fs/promises
vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
}));

// Mock node:os
vi.mock('node:os', () => ({
  homedir: () => '/mock/home',
}));

import { dacpExportTemplatesCommand } from './dacp-export-templates.js';

// ── Fixtures ─────────────────────────────────────────────────────────

const mockTemplates = [
  {
    id: 'skill-handoff',
    name: 'Skill Handoff',
    handoff_type: 'skill-handoff',
    description: 'Template for skill-to-skill handoffs',
    default_fidelity: 2,
    data_schema_refs: ['skill-context.json'],
    code_script_refs: ['validate-skill.sh'],
    test_fixture_refs: ['skill-handoff-fixture.json'],
  },
  {
    id: 'phase-transition',
    name: 'Phase Transition',
    handoff_type: 'phase-transition',
    description: 'Template for GSD phase transitions',
    default_fidelity: 1,
    data_schema_refs: ['phase-context.json', 'plan-summary.json'],
    code_script_refs: [],
    test_fixture_refs: ['phase-transition-fixture.json'],
  },
];

function setupValidRegistry(): void {
  mockReadFile.mockResolvedValue(JSON.stringify(mockTemplates));
}

function setupEmptyRegistry(): void {
  mockReadFile.mockResolvedValue(JSON.stringify([]));
}

function setupMissingRegistry(): void {
  mockReadFile.mockRejectedValue(
    Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
  );
}

// ── Tests ────────────────────────────────────────────────────────────

describe('dacpExportTemplatesCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 and prints usage for --help', async () => {
    const result = await dacpExportTemplatesCommand(['--help']);
    expect(result).toBe(0);
  });

  it('outputs JSON by default with 2 templates', async () => {
    setupValidRegistry();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpExportTemplatesCommand([]);

    expect(result).toBe(0);
    const jsonCalls = consoleSpy.mock.calls.filter((c: unknown[]) => {
      try {
        JSON.parse(String(c[0]));
        return true;
      } catch {
        return false;
      }
    });
    expect(jsonCalls.length).toBeGreaterThanOrEqual(1);

    const output = JSON.parse(String(jsonCalls[0][0]));
    expect(Array.isArray(output)).toBe(true);
    expect(output.length).toBe(2);
    expect(output[0].id).toBe('skill-handoff');

    consoleSpy.mockRestore();
  });

  it('outputs JSON explicitly with --format=json', async () => {
    setupValidRegistry();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpExportTemplatesCommand(['--format=json']);

    expect(result).toBe(0);
    const jsonCalls = consoleSpy.mock.calls.filter((c: unknown[]) => {
      try {
        JSON.parse(String(c[0]));
        return true;
      } catch {
        return false;
      }
    });
    expect(jsonCalls.length).toBeGreaterThanOrEqual(1);

    consoleSpy.mockRestore();
  });

  it('outputs YAML with --format=yaml', async () => {
    setupValidRegistry();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpExportTemplatesCommand(['--format=yaml']);

    expect(result).toBe(0);
    expect(consoleSpy).toHaveBeenCalled();
    const output = String(consoleSpy.mock.calls[0][0]);
    // YAML output should contain keys without JSON brackets
    expect(output).toContain('skill-handoff');
    expect(output).toContain('name:');
    expect(output).not.toMatch(/^\s*[\[{]/); // Not JSON

    consoleSpy.mockRestore();
  });

  it('outputs template names only with --quiet', async () => {
    setupValidRegistry();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpExportTemplatesCommand(['--quiet']);

    expect(result).toBe(0);
    // Should output each template name on its own line
    const calls = consoleSpy.mock.calls.map((c: unknown[]) => String(c[0]));
    expect(calls.some((c: string) => c.includes('Skill Handoff'))).toBe(true);
    expect(calls.some((c: string) => c.includes('Phase Transition'))).toBe(
      true,
    );

    consoleSpy.mockRestore();
  });

  it('prints "No templates found" for empty registry', async () => {
    setupEmptyRegistry();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpExportTemplatesCommand([]);

    expect(result).toBe(0);
    const allCalls = [
      ...mockLog.message.mock.calls.map((c: unknown[]) => String(c[0])),
      ...mockLog.info.mock.calls.map((c: unknown[]) => String(c[0])),
      ...consoleSpy.mock.calls.map((c: unknown[]) => String(c[0])),
    ].join('\n');

    expect(allCalls).toMatch(/[Nn]o templates found/);

    consoleSpy.mockRestore();
  });

  it('prints "No templates found" for missing registry file', async () => {
    setupMissingRegistry();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await dacpExportTemplatesCommand([]);

    expect(result).toBe(0);
    const allCalls = [
      ...mockLog.message.mock.calls.map((c: unknown[]) => String(c[0])),
      ...mockLog.info.mock.calls.map((c: unknown[]) => String(c[0])),
      ...consoleSpy.mock.calls.map((c: unknown[]) => String(c[0])),
    ].join('\n');

    expect(allCalls).toMatch(/[Nn]o templates found/);

    consoleSpy.mockRestore();
  });

  it('shows template details in text output', async () => {
    setupValidRegistry();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Default output without --quiet or --json should show styled table
    const result = await dacpExportTemplatesCommand([]);

    expect(result).toBe(0);
    // Default is JSON format output
    const allCalls = consoleSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join('\n');
    expect(allCalls).toContain('skill-handoff');

    consoleSpy.mockRestore();
  });
});

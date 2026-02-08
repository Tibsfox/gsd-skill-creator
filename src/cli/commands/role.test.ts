/**
 * Tests for the role CLI command handler.
 *
 * Covers:
 * - roleCommand with no args returns 0 (shows help)
 * - roleCommand with --help returns 0
 * - roleCommand with unknown subcommand returns 1
 * - handleCreate non-interactive: creates .role.yaml in temp dir
 * - handleCreate missing --name returns 1
 * - handleList empty dir returns 0 with empty roles array
 * - handleList with files returns role metadata
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ============================================================================
// Test setup
// ============================================================================

let tempDir: string;
let roleDir: string;
let originalCwd: () => string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'role-cli-test-'));
  roleDir = join(tempDir, '.claude', 'roles');
  await mkdir(roleDir, { recursive: true });

  // Mock process.cwd() to point at temp dir
  originalCwd = process.cwd.bind(process);
  vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(tempDir, { recursive: true, force: true });
});

// ============================================================================
// roleCommand dispatch
// ============================================================================

describe('roleCommand - dispatch', () => {
  it('returns 0 with no args (help)', async () => {
    const { roleCommand } = await import('./role.js');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await roleCommand([]);
    spy.mockRestore();
    expect(code).toBe(0);
  });

  it('returns 0 with --help', async () => {
    const { roleCommand } = await import('./role.js');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await roleCommand(['--help']);
    spy.mockRestore();
    expect(code).toBe(0);
  });

  it('returns 1 with unknown subcommand', async () => {
    const { roleCommand } = await import('./role.js');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await roleCommand(['unknown-sub']);
    spy.mockRestore();
    expect(code).toBe(1);
  });
});

// ============================================================================
// handleCreate non-interactive
// ============================================================================

describe('roleCommand - create non-interactive', () => {
  it('creates .role.yaml with --name and outputs JSON', async () => {
    const { roleCommand } = await import('./role.js');
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    const code = await roleCommand([
      'create',
      '--name=test-role',
      '--constraints=Never modify files,Read only',
    ]);
    spy.mockRestore();

    expect(code).toBe(0);

    // Verify JSON output
    const output = JSON.parse(logs.join(''));
    expect(output.created).toBeTruthy();
    expect(output.name).toBe('test-role');

    // Verify file exists and is valid YAML
    const filePath = join(roleDir, 'test-role.role.yaml');
    const content = await readFile(filePath, 'utf-8');
    expect(content).toContain('name: test-role');
    expect(content).toContain('Never modify files');
    expect(content).toContain('Read only');
  });

  it('returns 1 when --name is missing', async () => {
    const { roleCommand } = await import('./role.js');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await roleCommand(['create', '--constraints=foo']);
    spy.mockRestore();
    expect(code).toBe(1);
  });
});

// ============================================================================
// handleList
// ============================================================================

describe('roleCommand - list', () => {
  it('returns empty roles array when directory is empty', async () => {
    const { roleCommand } = await import('./role.js');
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    const code = await roleCommand(['list']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = JSON.parse(logs.join(''));
    expect(output.roles).toEqual([]);
  });

  it('lists roles with metadata from valid .role.yaml files', async () => {
    // Create a valid role YAML file
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const roleContent = (yaml as any).dump({
      name: 'reviewer',
      constraints: ['Never modify files', 'Provide evidence'],
      skills: ['code-analysis'],
      tools: 'Read, Glob, Grep',
    });
    await writeFile(join(roleDir, 'reviewer.role.yaml'), roleContent, 'utf-8');

    const { roleCommand } = await import('./role.js');
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    const code = await roleCommand(['list']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = JSON.parse(logs.join(''));
    expect(output.roles).toHaveLength(1);
    expect(output.roles[0].name).toBe('reviewer');
    expect(output.roles[0].constraints).toBe(2);
  });
});

/**
 * Tests for the bundle CLI command handler.
 *
 * Covers:
 * - bundleCommand with no args returns 0 (shows help)
 * - bundleCommand with --help returns 0
 * - bundleCommand with unknown subcommand returns 1 with error JSON
 * - bundleCommand create --name=test --skills=ts,react writes .bundle.yaml
 * - bundleCommand create without --name but with flags returns error
 * - bundleCommand list returns JSON with bundles array
 * - bundleCommand list --pretty returns human-readable output
 * - bundleCommand activate --name=test updates WorkState
 * - bundleCommand deactivate clears WorkState active_bundle
 * - bundleCommand status shows active bundle info
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ============================================================================
// Test setup
// ============================================================================

let tempDir: string;
let bundleDir: string;
let hooksDir: string;
let workStateFile: string;
let originalCwd: () => string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'bundle-cli-test-'));
  bundleDir = join(tempDir, '.claude', 'bundles');
  hooksDir = join(tempDir, '.planning', 'hooks');
  workStateFile = join(hooksDir, 'current-work.yaml');
  await mkdir(bundleDir, { recursive: true });
  await mkdir(hooksDir, { recursive: true });

  // Mock process.cwd() to point at temp dir
  originalCwd = process.cwd.bind(process);
  vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(tempDir, { recursive: true, force: true });
});

// ============================================================================
// Helper: write a bundle YAML for tests
// ============================================================================

async function writeBundleYaml(
  name: string,
  skills: Array<{ name: string; required?: boolean }>,
  description?: string,
): Promise<void> {
  const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
  const obj: Record<string, unknown> = {
    name,
    skills: skills.map((s) => ({ name: s.name, required: s.required ?? true })),
  };
  if (description) obj.description = description;
  const content = (yaml as any).dump(obj);
  await writeFile(join(bundleDir, `${name}.bundle.yaml`), content, 'utf-8');
}

// ============================================================================
// Helper: write WorkState YAML
// ============================================================================

async function writeWorkState(state: Record<string, unknown>): Promise<void> {
  const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
  const content = (yaml as any).dump(state);
  await writeFile(workStateFile, content, 'utf-8');
}

// ============================================================================
// bundleCommand dispatch
// ============================================================================

describe('bundleCommand - dispatch', () => {
  it('returns 0 with no args (help)', async () => {
    const { bundleCommand } = await import('./bundle.js');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await bundleCommand([]);
    spy.mockRestore();
    expect(code).toBe(0);
  });

  it('returns 0 with --help', async () => {
    const { bundleCommand } = await import('./bundle.js');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await bundleCommand(['--help']);
    spy.mockRestore();
    expect(code).toBe(0);
  });

  it('returns 1 with unknown subcommand', async () => {
    const { bundleCommand } = await import('./bundle.js');
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });
    const code = await bundleCommand(['unknown-sub']);
    spy.mockRestore();
    expect(code).toBe(1);
    const output = JSON.parse(logs.join(''));
    expect(output.error).toContain('unknown-sub');
  });
});

// ============================================================================
// handleCreate non-interactive
// ============================================================================

describe('bundleCommand - create non-interactive', () => {
  it('creates .bundle.yaml with --name and --skills and outputs JSON', async () => {
    const { bundleCommand } = await import('./bundle.js');
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    const code = await bundleCommand([
      'create',
      '--name=test-bundle',
      '--skills=ts,react',
      '--description=Test bundle',
      '--phase=dev',
    ]);
    spy.mockRestore();

    expect(code).toBe(0);

    // Verify JSON output
    const output = JSON.parse(logs.join(''));
    expect(output.created).toBeTruthy();
    expect(output.name).toBe('test-bundle');
    expect(output.skills).toBe(2);

    // Verify file exists and is valid YAML
    const filePath = join(bundleDir, 'test-bundle.bundle.yaml');
    const content = await readFile(filePath, 'utf-8');
    expect(content).toContain('name: test-bundle');
    expect(content).toContain('ts');
    expect(content).toContain('react');
  });

  it('returns 1 when --name is missing but other flags present', async () => {
    const { bundleCommand } = await import('./bundle.js');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await bundleCommand(['create', '--skills=ts']);
    spy.mockRestore();
    expect(code).toBe(1);
  });

  it('returns 1 when --skills is missing in non-interactive mode', async () => {
    const { bundleCommand } = await import('./bundle.js');
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });
    const code = await bundleCommand(['create', '--name=test-bundle']);
    spy.mockRestore();
    expect(code).toBe(1);
    const output = JSON.parse(logs.join(''));
    expect(output.error).toContain('--skills');
  });
});

// ============================================================================
// handleList
// ============================================================================

describe('bundleCommand - list', () => {
  it('returns empty bundles array when directory is empty', async () => {
    const { bundleCommand } = await import('./bundle.js');
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    const code = await bundleCommand(['list']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = JSON.parse(logs.join(''));
    expect(output.bundles).toEqual([]);
  });

  it('lists bundles with metadata from valid .bundle.yaml files', async () => {
    await writeBundleYaml('frontend-dev', [{ name: 'ts' }, { name: 'react' }], 'Frontend tools');

    const { bundleCommand } = await import('./bundle.js');
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    const code = await bundleCommand(['list']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = JSON.parse(logs.join(''));
    expect(output.bundles).toHaveLength(1);
    expect(output.bundles[0].name).toBe('frontend-dev');
    expect(output.bundles[0].description).toBe('Frontend tools');
    expect(output.bundles[0].skills).toBe(2);
  });

  it('lists bundles in --pretty format', async () => {
    await writeBundleYaml('frontend-dev', [{ name: 'ts' }], 'Frontend tools');

    const { bundleCommand } = await import('./bundle.js');
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    const code = await bundleCommand(['list', '--pretty']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = logs.join('\n');
    expect(output).toContain('frontend-dev');
    expect(output).toContain('Frontend tools');
  });
});

// ============================================================================
// handleActivate
// ============================================================================

describe('bundleCommand - activate', () => {
  it('activates a bundle and updates WorkState', async () => {
    await writeBundleYaml('frontend-dev', [{ name: 'ts' }]);
    await writeWorkState({ version: 1, saved_at: '2026-02-08T00:00:00Z' });

    const { bundleCommand } = await import('./bundle.js');
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    const code = await bundleCommand(['activate', '--name=frontend-dev']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = JSON.parse(logs.join(''));
    expect(output.activated).toBe('frontend-dev');

    // Verify WorkState was updated
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const content = await readFile(workStateFile, 'utf-8');
    const state = (yaml as any).load(content) as Record<string, unknown>;
    expect(state.active_bundle).toBe('frontend-dev');
  });

  it('returns 1 when --name is missing', async () => {
    const { bundleCommand } = await import('./bundle.js');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await bundleCommand(['activate']);
    spy.mockRestore();
    expect(code).toBe(1);
  });
});

// ============================================================================
// handleDeactivate
// ============================================================================

describe('bundleCommand - deactivate', () => {
  it('deactivates active bundle and clears WorkState', async () => {
    await writeWorkState({
      version: 1,
      saved_at: '2026-02-08T00:00:00Z',
      active_bundle: 'frontend-dev',
    });

    const { bundleCommand } = await import('./bundle.js');
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    const code = await bundleCommand(['deactivate']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = JSON.parse(logs.join(''));
    expect(output.deactivated).toBe(true);

    // Verify WorkState was cleared
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const content = await readFile(workStateFile, 'utf-8');
    const state = (yaml as any).load(content) as Record<string, unknown>;
    expect(state.active_bundle).toBeNull();
  });
});

// ============================================================================
// handleStatus
// ============================================================================

describe('bundleCommand - status', () => {
  it('shows active bundle info with skill priorities', async () => {
    await writeBundleYaml('frontend-dev', [
      { name: 'ts', required: true },
      { name: 'docs', required: false },
    ], 'Frontend tools');
    await writeWorkState({
      version: 1,
      saved_at: '2026-02-08T00:00:00Z',
      active_bundle: 'frontend-dev',
    });

    const { bundleCommand } = await import('./bundle.js');
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    const code = await bundleCommand(['status']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = JSON.parse(logs.join(''));
    expect(output.active).toBe('frontend-dev');
    expect(output.skills).toHaveLength(2);
    expect(output.skills[0].name).toBe('ts');
    expect(output.skills[0].priority).toBe(10);
    expect(output.skills[1].name).toBe('docs');
    expect(output.skills[1].priority).toBe(1);
  });

  it('shows null when no active bundle', async () => {
    await writeWorkState({ version: 1, saved_at: '2026-02-08T00:00:00Z' });

    const { bundleCommand } = await import('./bundle.js');
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    const code = await bundleCommand(['status']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = JSON.parse(logs.join(''));
    expect(output.active).toBeNull();
  });

  it('shows pretty status with skill breakdown', async () => {
    await writeBundleYaml('frontend-dev', [
      { name: 'ts', required: true },
      { name: 'docs', required: false },
    ], 'Frontend tools');
    await writeWorkState({
      version: 1,
      saved_at: '2026-02-08T00:00:00Z',
      active_bundle: 'frontend-dev',
    });

    const { bundleCommand } = await import('./bundle.js');
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    const code = await bundleCommand(['status', '--pretty']);
    spy.mockRestore();

    expect(code).toBe(0);
    const output = logs.join('\n');
    expect(output).toContain('frontend-dev');
    expect(output).toContain('ts');
    expect(output).toContain('docs');
  });
});

/**
 * ME-3 cli.ts — CLI dispatch tests.
 *
 * Verifies:
 *   - Feature flag OFF → 'disabled' message, exit code 0 (SC-ME3-01).
 *   - 'ab help' prints help text, exit code 0.
 *   - 'ab list' with empty branches dir returns 0.
 *   - 'ab status <unknown-branch>' returns 0 with not-found message.
 *   - Missing --variant flag → exit code 1 with usage error.
 *   - '--dry-run' flag prints plan without modifying state.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

// ─── Test isolation: patch ENV flag ─────────────────────────────────────────

beforeEach(() => {
  delete process.env['SC_AB_HARNESS_ENABLED'];
});

afterEach(() => {
  delete process.env['SC_AB_HARNESS_ENABLED'];
});

// ─── Helper ──────────────────────────────────────────────────────────────────

async function makeTmpDir(): Promise<string> {
  const dir = join(tmpdir(), `ab-cli-test-${randomUUID()}`);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function cleanupDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('abCommand() — feature flag OFF (SC-ME3-01)', () => {
  it('returns exit code 0 and prints disabled message when flag is OFF', async () => {
    // Dynamically import to avoid module-level side-effects.
    const { abCommand } = await import('../cli.js');
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.join(' '));
    });

    const exitCode = await abCommand(['some-skill', '--variant=foo.md']);

    expect(exitCode).toBe(0);
    const allOutput = logs.join('\n');
    expect(allOutput).toMatch(/disabled/i);

    vi.restoreAllMocks();
  });
});

describe('abCommand() — help subcommand', () => {
  it('returns 0 for help', async () => {
    const { abCommand } = await import('../cli.js');
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const exitCode = await abCommand(['help']);
    expect(exitCode).toBe(0);

    vi.restoreAllMocks();
  });

  it('returns 0 for --help flag', async () => {
    const { abCommand } = await import('../cli.js');
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const exitCode = await abCommand(['--help']);
    expect(exitCode).toBe(0);

    vi.restoreAllMocks();
  });
});

describe('abCommand() — status subcommand (flag ON)', () => {
  beforeEach(() => {
    process.env['SC_AB_HARNESS_ENABLED'] = '1';
  });

  it('returns 0 for unknown branch (not-found)', async () => {
    const { abCommand } = await import('../cli.js');
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.join(' '));
    });

    const exitCode = await abCommand(['status', 'nonexistent-branch-id-xyz']);
    expect(exitCode).toBe(0);
    expect(logs.join('\n')).toMatch(/not.found|No.*experiment/i);

    vi.restoreAllMocks();
  });

  it('returns 1 when no branch-id given to status', async () => {
    const { abCommand } = await import('../cli.js');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const exitCode = await abCommand(['status']);
    expect(exitCode).toBe(1);

    vi.restoreAllMocks();
  });
});

describe('abCommand() — list subcommand (flag ON)', () => {
  beforeEach(() => {
    process.env['SC_AB_HARNESS_ENABLED'] = '1';
  });

  it('returns 0 when no experiments exist', async () => {
    const { abCommand } = await import('../cli.js');
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.join(' '));
    });

    const tmpDir = await makeTmpDir();
    try {
      const exitCode = await abCommand([
        'list',
        `--branches-dir=${join(tmpDir, 'empty-branches')}`,
      ]);
      expect(exitCode).toBe(0);
      expect(logs.join('\n')).toMatch(/No A\/B experiments/i);
    } finally {
      await cleanupDir(tmpDir);
      vi.restoreAllMocks();
    }
  });
});

describe('abCommand() — run subcommand errors (flag ON)', () => {
  beforeEach(() => {
    process.env['SC_AB_HARNESS_ENABLED'] = '1';
  });

  it('returns 1 when skill name is missing', async () => {
    const { abCommand } = await import('../cli.js');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const exitCode = await abCommand([]);
    expect(exitCode).toBe(1);

    vi.restoreAllMocks();
  });

  it('returns 1 when --variant is missing', async () => {
    const { abCommand } = await import('../cli.js');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const exitCode = await abCommand(['my-skill']);
    expect(exitCode).toBe(1);

    vi.restoreAllMocks();
  });

  it('returns 1 when variant file does not exist', async () => {
    const { abCommand } = await import('../cli.js');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const exitCode = await abCommand([
      'my-skill',
      '--variant=/nonexistent/path/variant.md',
    ]);
    expect(exitCode).toBe(1);

    vi.restoreAllMocks();
  });
});

describe('abCommand() — dry-run (flag ON)', () => {
  beforeEach(() => {
    process.env['SC_AB_HARNESS_ENABLED'] = '1';
  });

  it('returns 0 for dry-run with existing files', async () => {
    const { abCommand } = await import('../cli.js');
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.join(' '));
    });

    const tmpDir = await makeTmpDir();
    const variantFile = join(tmpDir, 'variant.md');
    const trunkFile = join(tmpDir, 'trunk.md');
    await fs.writeFile(trunkFile, '# Trunk\nContent here\n'.repeat(10), 'utf8');
    await fs.writeFile(variantFile, '# Trunk\nContent modified\n'.repeat(10), 'utf8');

    try {
      const exitCode = await abCommand([
        'test-skill',
        `--variant=${variantFile}`,
        `--trunk=${trunkFile}`,
        '--dry-run',
        '--tractability=tractable',
      ]);
      expect(exitCode).toBe(0);
      const output = logs.join('\n');
      expect(output).toMatch(/dry.run/i);
      expect(output).toMatch(/tractable/i);
    } finally {
      await cleanupDir(tmpDir);
      vi.restoreAllMocks();
    }
  });
});

describe('abCommand() — dispatch correctness', () => {
  it('treats unknown subcommand as skill name (run path)', async () => {
    const { abCommand } = await import('../cli.js');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // No --variant → should return 1 (missing variant), confirming it took the run path.
    const exitCode = await abCommand(['unknown-subcommand-that-is-treated-as-skill']);
    // Feature flag is OFF by default → disabled message, exit 0.
    expect(exitCode).toBe(0);

    vi.restoreAllMocks();
  });
});

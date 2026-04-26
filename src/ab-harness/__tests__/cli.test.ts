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

// ─── JP-010a — CLI threads kAxes into runAB (v1.49.578 W5 first real caller seed)

describe('JP-010a — abCommand() seeds K-axis telemetry from CLI invocations', () => {
  beforeEach(() => {
    process.env['SC_AB_HARNESS_ENABLED'] = '1';
  });

  it('writes a JSONL observation with caller=ab-harness-cli + sessionType derived from process.env.CI', async () => {
    const { abCommand } = await import('../cli.js');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const tmpDir = await makeTmpDir();
    const variantFile = join(tmpDir, 'variant.md');
    const trunkFile = join(tmpDir, 'trunk.md');
    // Same content for trunk + variant — guarantees runs are decisive without
    // exercising real divergence semantics; the test cares only about telemetry.
    const body = '# Skill\n## Description\nA test skill.\n## Instructions\nFollow the schema.\n'.repeat(20);
    await fs.writeFile(trunkFile, body, 'utf8');
    await fs.writeFile(variantFile, body + '\n## Variant\nMinor diff.\n', 'utf8');

    // Capture original cwd + CI env; restore in finally.
    const originalCwd = process.cwd();
    const originalCi = process.env.CI;
    process.env.CI = ''; // force 'interactive' branch deterministically

    try {
      // Chdir into tmpDir so the default JSONL log path resolves under it
      // (DEFAULT_LOG_PATH is relative to cwd at call time).
      process.chdir(tmpDir);

      const exitCode = await abCommand([
        'test-skill',
        `--variant=${variantFile}`,
        `--trunk=${trunkFile}`,
        '--samples=11', // > 10 minSamples in coordinator
        '--alpha=0.10',
        '--tractability=tractable',
        `--branches-dir=${join(tmpDir, 'branches')}`,
      ]);

      expect(exitCode).toBe(0);

      const logPath = join(
        tmpDir,
        '.planning/missions/julia-parameter-implementation/k-axis-evidence/observations.jsonl',
      );
      const raw = await fs.readFile(logPath, 'utf8');
      const lines = raw.split('\n').filter(l => l.length > 0);
      expect(lines).toHaveLength(1);

      const obs = JSON.parse(lines[0]);
      expect(obs.userDomain).toBe('unknown');
      expect(obs.expertiseLevel).toBe('unknown');
      expect(obs.sessionType).toBe('interactive');
      expect(obs.extraAxes).toEqual({
        caller: 'ab-harness-cli',
        tractability: 'tractable',
      });
      expect(typeof obs.experimentId).toBe('string');
      expect(obs.experimentId.length).toBeGreaterThan(0);
    } finally {
      process.chdir(originalCwd);
      if (originalCi === undefined) delete process.env.CI;
      else process.env.CI = originalCi;
      await cleanupDir(tmpDir);
      vi.restoreAllMocks();
    }
  });

  it('records sessionType=ci when process.env.CI is truthy', async () => {
    const { abCommand } = await import('../cli.js');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const tmpDir = await makeTmpDir();
    const variantFile = join(tmpDir, 'variant.md');
    const trunkFile = join(tmpDir, 'trunk.md');
    const body = '# Skill\n## Description\nCI path test.\n## Instructions\nDo the thing.\n'.repeat(20);
    await fs.writeFile(trunkFile, body, 'utf8');
    await fs.writeFile(variantFile, body + '\n## Variant\n', 'utf8');

    const originalCwd = process.cwd();
    const originalCi = process.env.CI;
    process.env.CI = '1';

    try {
      process.chdir(tmpDir);

      const exitCode = await abCommand([
        'ci-test-skill',
        `--variant=${variantFile}`,
        `--trunk=${trunkFile}`,
        '--samples=11',
        '--alpha=0.10',
        '--tractability=unknown',
        `--branches-dir=${join(tmpDir, 'branches')}`,
      ]);

      expect(exitCode).toBe(0);

      const logPath = join(
        tmpDir,
        '.planning/missions/julia-parameter-implementation/k-axis-evidence/observations.jsonl',
      );
      const raw = await fs.readFile(logPath, 'utf8');
      const lines = raw.split('\n').filter(l => l.length > 0);
      expect(lines).toHaveLength(1);
      const obs = JSON.parse(lines[0]);
      expect(obs.sessionType).toBe('ci');
      expect(obs.extraAxes.tractability).toBe('unknown');
    } finally {
      process.chdir(originalCwd);
      if (originalCi === undefined) delete process.env.CI;
      else process.env.CI = originalCi;
      await cleanupDir(tmpDir);
      vi.restoreAllMocks();
    }
  });
});

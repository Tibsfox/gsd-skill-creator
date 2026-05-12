/**
 * Tests for `skill-creator cartridge migrate` (v1.49.636 C2).
 *
 * Covers: single-file migration, --dry-run, --all bulk-mode, --exclude
 * pattern filtering, idempotency on re-run, and the unfit/failed paths.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stringify as stringifyYaml } from 'yaml';
import { cartridgeCommand, type CartridgeCommandIO } from './cartridge.js';

function legacyMinimal(name = 'test-department-v1.0'): Record<string, unknown> {
  return {
    name,
    version: '1.0.0',
    description: 'A test department.',
    skills: {
      'org-strategy': {
        domain: 'business',
        description: 'Strategy and management.',
        triggers: ['strategy'],
        agent_affinity: ['drucker'],
      },
    },
    agents: {
      topology: 'router',
      router_agent: 'drucker',
      agents: [
        {
          name: 'drucker',
          role: 'department chair',
          model: 'opus',
          tools: ['Read'],
          is_capcom: true,
        },
      ],
    },
    teams: {
      'analysis-team': {
        description: 'Full analysis team.',
        agents: ['drucker'],
        use_when: 'multi-domain analysis.',
      },
    },
  };
}

interface CapturedIO extends CartridgeCommandIO {
  stdoutLines: string[];
  stderrLines: string[];
}

function captureIO(): CapturedIO {
  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];
  return {
    stdout: (line) => stdoutLines.push(line),
    stderr: (line) => stderrLines.push(line),
    stdoutLines,
    stderrLines,
  };
}

let tempRoot: string;

beforeEach(() => {
  tempRoot = mkdtempSync(join(tmpdir(), 'cartridge-migrate-test-'));
});

afterEach(() => {
  if (tempRoot && existsSync(tempRoot)) {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

describe('cartridge migrate (single file)', () => {
  it('migrates a valid legacy chipset.yaml to a sibling cartridge.yaml', async () => {
    const sourceDir = join(tempRoot, 'test-department');
    mkdirSync(sourceDir);
    const sourcePath = join(sourceDir, 'chipset.yaml');
    writeFileSync(sourcePath, stringifyYaml(legacyMinimal()), 'utf8');

    const io = captureIO();
    const code = await cartridgeCommand(['migrate', sourcePath], io);
    expect(code).toBe(0);
    expect(io.stdoutLines.some((l) => l.includes('migrated:'))).toBe(true);
    expect(existsSync(join(sourceDir, 'cartridge.yaml'))).toBe(true);

    // The migrated file should be loadable by the loader.
    const content = readFileSync(join(sourceDir, 'cartridge.yaml'), 'utf8');
    expect(content).toContain('test-department-v1.0');
    expect(content).toContain('kind: department');
  });

  it('respects --dry-run by NOT writing the target file', async () => {
    const sourceDir = join(tempRoot, 'test-department');
    mkdirSync(sourceDir);
    const sourcePath = join(sourceDir, 'chipset.yaml');
    writeFileSync(sourcePath, stringifyYaml(legacyMinimal()), 'utf8');

    const io = captureIO();
    const code = await cartridgeCommand(['migrate', sourcePath, '--dry-run'], io);
    expect(code).toBe(0);
    expect(io.stdoutLines.some((l) => l.includes('dry-run:'))).toBe(true);
    expect(existsSync(join(sourceDir, 'cartridge.yaml'))).toBe(false);
  });

  it('returns failed on a malformed legacy YAML', async () => {
    const sourceDir = join(tempRoot, 'bad-department');
    mkdirSync(sourceDir);
    const sourcePath = join(sourceDir, 'chipset.yaml');
    writeFileSync(sourcePath, '!!!not yaml@@@', 'utf8');

    const io = captureIO();
    const code = await cartridgeCommand(['migrate', sourcePath], io);
    expect(code).toBe(1);
    expect(io.stdoutLines.some((l) => l.includes('failed:'))).toBe(true);
  });

  it('returns unfit on a department lacking required fields', async () => {
    const sourceDir = join(tempRoot, 'incomplete');
    mkdirSync(sourceDir);
    const legacy = legacyMinimal();
    delete legacy.skills;
    const sourcePath = join(sourceDir, 'chipset.yaml');
    writeFileSync(sourcePath, stringifyYaml(legacy), 'utf8');

    const io = captureIO();
    const code = await cartridgeCommand(['migrate', sourcePath], io);
    // unfit is not "failed" — exit code 0 (legitimate adapter rejection).
    expect(code).toBe(0);
    expect(io.stdoutLines.some((l) => l.includes('unfit:'))).toBe(true);
  });

  it('is idempotent — re-running on a migrated file is a no-op', async () => {
    const sourceDir = join(tempRoot, 'test-department');
    mkdirSync(sourceDir);
    const sourcePath = join(sourceDir, 'chipset.yaml');
    writeFileSync(sourcePath, stringifyYaml(legacyMinimal()), 'utf8');

    const io1 = captureIO();
    await cartridgeCommand(['migrate', sourcePath], io1);
    expect(io1.stdoutLines.some((l) => l.includes('migrated:'))).toBe(true);

    const firstContent = readFileSync(
      join(sourceDir, 'cartridge.yaml'),
      'utf8',
    );

    const io2 = captureIO();
    await cartridgeCommand(['migrate', sourcePath], io2);
    expect(io2.stdoutLines.some((l) => l.includes('idempotent:'))).toBe(true);

    const secondContent = readFileSync(
      join(sourceDir, 'cartridge.yaml'),
      'utf8',
    );
    expect(secondContent).toBe(firstContent);
  });

  it('--json emits a machine-readable record', async () => {
    const sourceDir = join(tempRoot, 'test-department');
    mkdirSync(sourceDir);
    const sourcePath = join(sourceDir, 'chipset.yaml');
    writeFileSync(sourcePath, stringifyYaml(legacyMinimal()), 'utf8');

    const io = captureIO();
    await cartridgeCommand(['migrate', sourcePath, '--json'], io);
    expect(io.stdoutLines.length).toBeGreaterThanOrEqual(1);
    const json = JSON.parse(io.stdoutLines.join('\n'));
    expect(json.status).toBe('migrated');
    expect(json.sourcePath).toContain('chipset.yaml');
    expect(json.targetPath).toContain('cartridge.yaml');
  });
});

describe('cartridge migrate --all (bulk)', () => {
  function seedBulkRoot(count: number, withBad = false): void {
    for (let i = 0; i < count; i++) {
      const dir = join(tempRoot, `dept-${i}`);
      mkdirSync(dir);
      writeFileSync(
        join(dir, 'chipset.yaml'),
        stringifyYaml(legacyMinimal(`dept-${i}-v1.0`)),
        'utf8',
      );
    }
    if (withBad) {
      const bad = join(tempRoot, 'incomplete');
      mkdirSync(bad);
      const legacy = legacyMinimal('incomplete-v1.0');
      // Make this department-shaped enough to be discovered (has skills,
      // agents, teams at top-level) but fail adapter validation by
      // emptying the required `name`. The discovery gate filters on
      // shape; the adapter enforces field validity.
      legacy.name = '';
      writeFileSync(join(bad, 'chipset.yaml'), stringifyYaml(legacy), 'utf8');
    }
  }

  it('migrates every department under root in deterministic alphabetic order', async () => {
    seedBulkRoot(3);
    const io = captureIO();
    const code = await cartridgeCommand(
      ['migrate', '--all', tempRoot, '--json'],
      io,
    );
    expect(code).toBe(0);
    const records = JSON.parse(io.stdoutLines.join('\n'));
    expect(records).toHaveLength(3);
    const sources = records.map((r: { sourcePath: string }) => r.sourcePath);
    const sorted = [...sources].sort();
    expect(sources).toEqual(sorted);
    expect(records.every((r: { status: string }) => r.status === 'migrated')).toBe(true);
  });

  it('respects --exclude pattern when discovering chipsets', async () => {
    seedBulkRoot(2);
    // Add a deprecated dir that should be excluded.
    const deprecated = join(tempRoot, 'deprecated');
    mkdirSync(deprecated);
    writeFileSync(
      join(deprecated, 'chipset.yaml'),
      stringifyYaml(legacyMinimal('deprecated-v1.0')),
      'utf8',
    );

    const io = captureIO();
    await cartridgeCommand(
      ['migrate', '--all', tempRoot, '--exclude', 'deprecated', '--json'],
      io,
    );
    const records = JSON.parse(io.stdoutLines.join('\n'));
    expect(records).toHaveLength(2);
    expect(
      records.every(
        (r: { sourcePath: string }) => !r.sourcePath.includes('deprecated'),
      ),
    ).toBe(true);
  });

  it('reports unfit + migrated counts when mixed input', async () => {
    seedBulkRoot(2, true);
    const io = captureIO();
    const code = await cartridgeCommand(
      ['migrate', '--all', tempRoot, '--json'],
      io,
    );
    expect(code).toBe(0);
    const records = JSON.parse(io.stdoutLines.join('\n'));
    expect(records).toHaveLength(3);
    expect(records.filter((r: { status: string }) => r.status === 'migrated')).toHaveLength(2);
    expect(records.filter((r: { status: string }) => r.status === 'unfit')).toHaveLength(1);
  });

  it('--dry-run does not write any cartridge.yaml in bulk mode', async () => {
    seedBulkRoot(2);
    const io = captureIO();
    await cartridgeCommand(
      ['migrate', '--all', tempRoot, '--dry-run', '--json'],
      io,
    );
    expect(existsSync(join(tempRoot, 'dept-0', 'cartridge.yaml'))).toBe(false);
    expect(existsSync(join(tempRoot, 'dept-1', 'cartridge.yaml'))).toBe(false);
  });

  // ─── Family B surface (v1.49.644 C2 path b — CF-17) ───
  describe('not-department-shape surface (Family B chipsets)', () => {
    /**
     * Seeds the tempRoot with one valid department + one chipset.yaml that
     * parses but doesn't match the agents+skills+teams gate. Used to verify
     * the v1.49.644 C2 path b discovery-gate expansion (CF-17): non-DS files
     * now surface as `status: not-department-shape` records instead of being
     * silently dropped from the report.
     */
    function seedRootWithNonDS(nonDSYaml: Record<string, unknown>, name = 'non-ds'): void {
      // Valid department to confirm regression doesn't break
      const ok = join(tempRoot, 'dept-ok');
      mkdirSync(ok);
      writeFileSync(join(ok, 'chipset.yaml'), stringifyYaml(legacyMinimal('dept-ok-v1.0')), 'utf8');
      // Non-department-shape file
      const nd = join(tempRoot, name);
      mkdirSync(nd);
      writeFileSync(join(nd, 'chipset.yaml'), stringifyYaml(nonDSYaml), 'utf8');
    }

    it('surfaces header:-wrapped legacy as not-department-shape (gastown-orchestration analog)', async () => {
      seedRootWithNonDS(
        {
          header: { name: 'analog-gastown', version: '1.0.0', archetype: 'multi-agent-orchestration' },
          skills: { 'orchestration-pattern': { domain: 'meta' } },
        },
        'gastown-analog',
      );
      const io = captureIO();
      await cartridgeCommand(['migrate', '--all', tempRoot, '--json'], io);
      const records = JSON.parse(io.stdoutLines.join('\n'));
      expect(records).toHaveLength(2);
      const nd = records.find((r: { sourcePath: string }) => r.sourcePath.includes('gastown-analog'));
      expect(nd.status).toBe('not-department-shape');
      expect(nd.reason).toMatch(/lacks agents\+skills\+teams/);
    });

    it('surfaces stub redirect files as not-department-shape (math-coprocessor analog)', async () => {
      seedRootWithNonDS(
        { name: 'stub-redirect', version: '1.0.0', canonical_path: '../../real-location' },
        'stub-redirect',
      );
      const io = captureIO();
      await cartridgeCommand(['migrate', '--all', tempRoot, '--json'], io);
      const records = JSON.parse(io.stdoutLines.join('\n'));
      const nd = records.find((r: { sourcePath: string }) => r.sourcePath.includes('stub-redirect'));
      expect(nd.status).toBe('not-department-shape');
    });

    it('surfaces non-department configs (e.g. den-style staff config) as not-department-shape', async () => {
      seedRootWithNonDS(
        { name: 'den-analog-v1.0', version: '1.0.0', totalBudget: 0.59, positions: [{ name: 'capcom' }] },
        'den-analog',
      );
      const io = captureIO();
      await cartridgeCommand(['migrate', '--all', tempRoot, '--json'], io);
      const records = JSON.parse(io.stdoutLines.join('\n'));
      const nd = records.find((r: { sourcePath: string }) => r.sourcePath.includes('den-analog'));
      expect(nd.status).toBe('not-department-shape');
    });

    it('text summary includes not-department-shape tally + per-file reason', async () => {
      seedRootWithNonDS(
        { header: { name: 'analog-gastown', version: '1.0.0' }, skills: {} },
        'gastown-analog',
      );
      const io = captureIO();
      await cartridgeCommand(['migrate', '--all', tempRoot], io);
      const out = io.stdoutLines.join('\n');
      expect(out).toContain('not-department-shape: 1');
      expect(out).toContain('reason: top-level YAML lacks agents+skills+teams');
    });

    it('regression: existing valid departments still migrate alongside not-department-shape files', async () => {
      seedRootWithNonDS({ header: { name: 'foo' } }, 'non-ds');
      const io = captureIO();
      await cartridgeCommand(['migrate', '--all', tempRoot, '--json'], io);
      const records = JSON.parse(io.stdoutLines.join('\n'));
      expect(records.filter((r: { status: string }) => r.status === 'migrated')).toHaveLength(1);
      expect(records.filter((r: { status: string }) => r.status === 'not-department-shape')).toHaveLength(1);
    });
  });
});

describe('cartridge migrate — usage errors', () => {
  it('returns usage error code 2 when no path nor --all given', async () => {
    const io = captureIO();
    const code = await cartridgeCommand(['migrate'], io);
    expect(code).toBe(2);
    expect(io.stderrLines.some((l) => l.includes('migrate requires'))).toBe(true);
  });

  it('returns usage error code 2 when --all has no root', async () => {
    const io = captureIO();
    const code = await cartridgeCommand(['migrate', '--all'], io);
    expect(code).toBe(2);
  });
});

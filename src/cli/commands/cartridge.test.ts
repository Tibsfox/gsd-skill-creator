/**
 * Cartridge CLI tests — CL-01..CL-14 + help smoke.
 *
 * Tests the pure `cartridgeCommand(args, io)` entry point with an injected IO
 * sink. Does not spawn the real binary — these are library-level tests.
 */

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cartridgeCommand, type CartridgeCommandIO } from './cartridge.js';

interface CapturedIO extends CartridgeCommandIO {
  out: string[];
  err: string[];
}

function makeIO(): CapturedIO {
  const out: string[] = [];
  const err: string[] = [];
  return {
    out,
    err,
    stdout: (line) => out.push(line),
    stderr: (line) => err.push(line),
  };
}

let workRoot: string;
let scaffoldDir: string;

beforeEach(() => {
  workRoot = mkdtempSync(join(tmpdir(), 'cartridge-cli-'));
  scaffoldDir = join(workRoot, 'scaffolded');
});

afterEach(() => {
  rmSync(workRoot, { recursive: true, force: true });
});

async function scaffold(io: CapturedIO, template = 'department'): Promise<string> {
  const code = await cartridgeCommand(
    ['scaffold', template, scaffoldDir, 'cli-test'],
    io,
  );
  expect(code).toBe(0);
  io.out.length = 0;
  io.err.length = 0;
  return join(scaffoldDir, 'cartridge.yaml');
}

describe('cartridge CLI', () => {
  it('CL-01 scaffold + load round-trip', async () => {
    const io = makeIO();
    const path = await scaffold(io);
    const loadCode = await cartridgeCommand(['load', path], io);
    expect(loadCode).toBe(0);
    const stdout = io.out.join('\n');
    expect(stdout).toContain('cli-test');
  });

  it('CL-02 validate returns 0 for a scaffolded department cartridge', async () => {
    const io = makeIO();
    const path = await scaffold(io);
    const code = await cartridgeCommand(['validate', path, '--json'], io);
    expect(code).toBe(0);
    const parsed = JSON.parse(io.out.join('\n'));
    expect(parsed.valid).toBe(true);
    expect(parsed.errors).toEqual([]);
  });

  it('CL-03 metrics --json emits machine-readable shape', async () => {
    const io = makeIO();
    const path = await scaffold(io);
    const code = await cartridgeCommand(['metrics', path, '--json'], io);
    expect(code).toBe(0);
    const m = JSON.parse(io.out.join('\n'));
    expect(m.id).toBe('cli-test');
    expect(m.skillCount).toBeGreaterThanOrEqual(1);
    expect(m.agentCount).toBeGreaterThanOrEqual(1);
    expect(m.groveRecordTypeCount).toBeGreaterThanOrEqual(1);
  });

  it('CL-04 eval runs the evaluation chipset gates', async () => {
    const io = makeIO();
    const path = await scaffold(io);
    const code = await cartridgeCommand(['eval', path, '--json'], io);
    expect(code).toBe(0);
    const report = JSON.parse(io.out.join('\n'));
    expect(report.passedCount).toBeGreaterThanOrEqual(1);
    expect(report.failedCount).toBe(0);
  });

  it('CL-05 dedup reports no collisions on a fresh scaffold', async () => {
    const io = makeIO();
    const path = await scaffold(io);
    const code = await cartridgeCommand(['dedup', path, '--json'], io);
    expect(code).toBe(0);
    const report = JSON.parse(io.out.join('\n'));
    expect(report.collisions).toEqual([]);
  });

  it('CL-06 fork writes a forked cartridge with new id', async () => {
    const io = makeIO();
    const path = await scaffold(io);
    const outPath = join(workRoot, 'fork.yaml');
    const code = await cartridgeCommand(
      ['fork', path, 'forked-cli', '--out', outPath, '--json'],
      io,
    );
    expect(code).toBe(0);
    const parsed = JSON.parse(io.out.join('\n'));
    expect(parsed.id).toBe('forked-cli');
    expect(parsed.provenance.forkOf).toBe('cli-test');
    const written = readFileSync(outPath, 'utf8');
    expect(written).toContain('forked-cli');
  });

  it('CL-07 unknown subcommand returns exit 2 and prints usage', async () => {
    const io = makeIO();
    const code = await cartridgeCommand(['not-a-command'], io);
    expect(code).toBe(2);
    expect(io.err.join('\n')).toContain('unknown subcommand');
    expect(io.err.join('\n')).toContain('Usage:');
  });

  it('CL-08 validate returns 1 on a broken cartridge', async () => {
    const io = makeIO();
    await scaffold(io);
    // Overwrite with a malformed version: department with missing affinity
    const yamlPath = join(scaffoldDir, 'chipsets', 'department.yaml');
    const broken = `skills:
  orphan-skill:
    domain: cli
    description: References a non-existent agent
    agent_affinity: ghost-agent
agents:
  topology: router
  router_agent: placeholder-agent
  agents:
    - name: placeholder-agent
      role: lead
teams: {}
`;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { writeFileSync } = await import('node:fs');
    writeFileSync(yamlPath, broken, 'utf8');

    const io2 = makeIO();
    const code = await cartridgeCommand(
      ['validate', join(scaffoldDir, 'cartridge.yaml'), '--json'],
      io2,
    );
    expect(code).toBe(1);
    const parsed = JSON.parse(io2.out.join('\n'));
    expect(parsed.valid).toBe(false);
    expect(parsed.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('CL-09 missing positional arg returns exit 2', async () => {
    const io = makeIO();
    const code = await cartridgeCommand(['load'], io);
    expect(code).toBe(2);
  });

  it('CL-10 scaffold with invalid template name returns exit 1', async () => {
    const io = makeIO();
    const code = await cartridgeCommand(
      ['scaffold', 'not-a-template', scaffoldDir, 'cli-test'],
      io,
    );
    expect(code).toBe(1);
    expect(io.err.join('\n').toLowerCase()).toContain('template');
  });

  it('CL-11 metrics on nonexistent path returns exit 1', async () => {
    const io = makeIO();
    const missing = join(workRoot, 'does-not-exist.yaml');
    const code = await cartridgeCommand(['metrics', missing, '--json'], io);
    expect(code).toBe(1);
    const parsed = JSON.parse(io.out.join('\n'));
    expect(parsed.ok).toBe(false);
    expect(typeof parsed.error).toBe('string');
  });

  it('CL-12 dedup on nonexistent path returns exit 1', async () => {
    const io = makeIO();
    const missing = join(workRoot, 'ghost.yaml');
    const code = await cartridgeCommand(['dedup', missing], io);
    expect(code).toBe(1);
    expect(io.err.join('\n')).toContain('cartridge:');
  });

  it('CL-13 fork missing newId returns exit 2', async () => {
    const io = makeIO();
    const path = await scaffold(io);
    const code = await cartridgeCommand(['fork', path], io);
    expect(code).toBe(2);
    expect(io.err.join('\n')).toContain('fork requires');
  });

  it('CL-14 eval on nonexistent path returns exit 1', async () => {
    const io = makeIO();
    const missing = join(workRoot, 'phantom.yaml');
    const code = await cartridgeCommand(['eval', missing, '--json'], io);
    expect(code).toBe(1);
    const parsed = JSON.parse(io.out.join('\n'));
    expect(parsed.ok).toBe(false);
  });

  it('CL-15 --allow-validation-debt downgrades agent_affinity errors to warnings', async () => {
    const io = makeIO();
    await scaffold(io);
    const yamlPath = join(scaffoldDir, 'chipsets', 'department.yaml');
    const broken = `skills:
  orphan-skill:
    domain: cli
    description: References a non-existent agent
    agent_affinity: ghost-agent
agents:
  topology: router
  router_agent: placeholder-agent
  agents:
    - name: placeholder-agent
      role: lead
teams: {}
`;
    const { writeFileSync } = await import('node:fs');
    writeFileSync(yamlPath, broken, 'utf8');

    const strictIO = makeIO();
    const strictCode = await cartridgeCommand(
      ['validate', join(scaffoldDir, 'cartridge.yaml'), '--json'],
      strictIO,
    );
    expect(strictCode).toBe(1);

    const allowIO = makeIO();
    const allowCode = await cartridgeCommand(
      [
        'validate',
        join(scaffoldDir, 'cartridge.yaml'),
        '--json',
        '--allow-validation-debt',
      ],
      allowIO,
    );
    expect(allowCode).toBe(0);
    const parsed = JSON.parse(allowIO.out.join('\n'));
    expect(parsed.valid).toBe(true);
    expect(parsed.errors).toEqual([]);
    expect(parsed.warnings.length).toBeGreaterThanOrEqual(1);
    const joined = parsed.warnings
      .map((w: { message: string }) => w.message)
      .join('\n');
    expect(joined).toContain('known-validation-debt');
  });

  it('cartridge --help prints usage and exits 0 (smoke)', async () => {
    const io = makeIO();
    const code = await cartridgeCommand(['--help'], io);
    expect(code).toBe(0);
    const out = io.out.join('\n');
    expect(out).toContain('Usage:');
    for (const sub of ['load', 'validate', 'scaffold', 'metrics', 'eval', 'dedup', 'fork']) {
      expect(out).toContain(`cartridge ${sub}`);
    }
  });
});

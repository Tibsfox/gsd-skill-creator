/**
 * Cartridge CLI tests — CL-01..CL-16 + help smoke.
 *
 * Tests the pure `cartridgeCommand(args, io)` entry point with an injected IO
 * sink. Does not spawn the real binary — these are library-level tests.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cartridgeCommand, positionalArgs, type CartridgeCommandIO } from './cartridge.js';

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

  it('CL-16 validate accepts a kind:research-output cartridge', async () => {
    // Regression: handleValidate used loadCartridge(), which throws for
    // research-output cartridges. It now uses loadAnyCartridge() + dispatches
    // to validateResearchOutputCartridge(), so the 5 committed research-output
    // example cartridges validate via the CLI.
    const io = makeIO();
    const path = fileURLToPath(
      new URL(
        '../../../examples/cartridges/svg-substrate/cartridge.yaml',
        import.meta.url,
      ),
    );
    const code = await cartridgeCommand(['validate', path, '--json'], io);
    expect(code).toBe(0);
    const parsed = JSON.parse(io.out.join('\n'));
    expect(parsed.valid).toBe(true);
    expect(parsed.errors).toEqual([]);
  });

  it('CL-17 distill mints a validated cartridge from source files', async () => {
    const { writeFileSync } = await import('node:fs');
    const srcA = join(workRoot, 'note-a.md');
    const srcB = join(workRoot, 'paper-b.md');
    writeFileSync(
      srcA,
      'Neural networks learn representations from data. Gradient descent optimizes the weights over epochs.',
      'utf8',
    );
    writeFileSync(
      srcB,
      'Gradient descent is the workhorse optimizer for neural networks. Representations improve as weights update.',
      'utf8',
    );
    const io = makeIO();
    const code = await cartridgeCommand(['distill', srcA, srcB, '--json'], io);
    expect(code).toBe(0);
    const artifact = JSON.parse(io.out.join('\n'));
    expect(artifact.cartridge.chipsets[0].kind).toBe('content');
    expect(artifact.validation.valid).toBe(true);
    expect(artifact.gate.ok).toBe(true);
    expect(artifact.researchOutput.kind).toBe('research-output');
  });

  it('CL-18 distill with no sources returns exit 2', async () => {
    const io = makeIO();
    const code = await cartridgeCommand(['distill'], io);
    expect(code).toBe(2);
    expect(io.err.join('\n')).toContain('distill requires');
  });

  function writeCoLog(pairs: unknown[]): string {
    const logPath = join(workRoot, 'co-occurrence.json');
    writeFileSync(
      logPath,
      JSON.stringify({
        generatedAt: 1_700_000_000_000,
        traceWindowStart: 1_699_000_000_000,
        traceWindowEnd: 1_700_000_000_000,
        pairs,
      }),
      'utf8',
    );
    return logPath;
  }

  function coPair(a: string, b: string, observationCount: number): unknown {
    return {
      event_a: { skillId: a, eventType: 'activation' },
      event_b: { skillId: b, eventType: 'activation' },
      probability: 0.8,
      temporalLagMs: 200,
      observationCount,
      windowMs: 30_000,
    };
  }

  it('CL-19 distill-cooccurrence mints a DRAFT and writes it with --out', async () => {
    const logPath = writeCoLog([
      coPair('alpha', 'beta', 8),
      coPair('beta', 'gamma', 6),
    ]);
    const outPath = join(workRoot, 'draft.yaml');
    const io = makeIO();
    const code = await cartridgeCommand(
      ['distill-cooccurrence', logPath, '--min-support', '4', '--out', outPath, '--json'],
      io,
    );
    expect(code).toBe(0);
    const report = JSON.parse(io.out.join('\n'));
    expect(report.ok).toBe(true);
    expect(report.skillCount).toBe(3);
    expect(report.validation.valid).toBe(true);
    const draft = readFileSync(outPath, 'utf8');
    expect(draft).toContain('co-activation');
  });

  it('CL-20 distill-cooccurrence refuses to mint below min-support', async () => {
    const logPath = writeCoLog([coPair('alpha', 'beta', 2)]);
    const io = makeIO();
    const code = await cartridgeCommand(
      ['distill-cooccurrence', logPath, '--min-support', '5', '--json'],
      io,
    );
    expect(code).toBe(1);
    const report = JSON.parse(io.out.join('\n'));
    expect(report.ok).toBe(false);
    expect(report.reason).toMatch(/too thin/);
  });

  it('CL-21 distill-cooccurrence with no log path returns exit 2', async () => {
    const io = makeIO();
    const code = await cartridgeCommand(['distill-cooccurrence'], io);
    expect(code).toBe(2);
    expect(io.err.join('\n')).toContain('distill-cooccurrence requires');
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

describe('positionalArgs', () => {
  it('does not let a valueless boolean flag swallow a following positional', () => {
    // The --enrich footgun: a valueless flag must not consume the next source path.
    expect(positionalArgs(['--enrich', 'a.md', 'b.md'])).toEqual(['a.md', 'b.md']);
    expect(positionalArgs(['a.md', '--enrich', 'b.md'])).toEqual(['a.md', 'b.md']);
    expect(positionalArgs(['a.md', 'b.md', '--enrich'])).toEqual(['a.md', 'b.md']);
    expect(positionalArgs(['--json', 'a.md'])).toEqual(['a.md']);
  });

  it('still consumes the value of a value-taking flag', () => {
    expect(positionalArgs(['--id', 'my-id', 'a.md'])).toEqual(['a.md']);
    expect(positionalArgs(['--template=department', 'a.md'])).toEqual(['a.md']);
  });
});

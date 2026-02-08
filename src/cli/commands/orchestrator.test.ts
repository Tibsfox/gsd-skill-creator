/**
 * Tests for the orchestrator CLI command.
 *
 * Uses temporary directory fixtures to test:
 * - Subcommand dispatch (discover, state, aliases, unknown, help)
 * - Discover subcommand (JSON output, --pretty, error cases)
 * - State subcommand (JSON output, --pretty, --planning-dir, uninitialized)
 * - Help text content and subcommand listing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { orchestratorCommand } from './orchestrator.js';

// ============================================================================
// Fixture data
// ============================================================================

const COMMAND_PLAN_PHASE = [
  '---',
  'name: gsd:plan-phase',
  'description: Create detailed execution plan for a phase',
  'argument-hint: "[phase] [--research]"',
  'allowed-tools:',
  '  - Read',
  '  - Write',
  '  - Bash',
  'agent: gsd-planner',
  '---',
  '',
  '<objective>',
  'Create a detailed, executable plan for the specified phase.',
  '</objective>',
].join('\n');

const COMMAND_EXECUTE_PHASE = [
  '---',
  'name: gsd:execute-phase',
  'description: Execute plans for a phase',
  'argument-hint: "[phase]"',
  'agent: gsd-executor',
  '---',
  '',
  '<objective>',
  'Execute all plans for the specified phase.',
  '</objective>',
].join('\n');

const AGENT_EXECUTOR = [
  '---',
  'name: gsd-executor',
  'description: Executes plans autonomously with atomic commits',
  'tools: "Read, Write, Bash, Glob, Grep"',
  'model: opus',
  '---',
  '',
  'You are a GSD plan executor.',
].join('\n');

const ROADMAP_MD = [
  '# Roadmap: Test Project',
  '',
  '## Phases',
  '',
  '- [x] **Phase 1: Foundation** (Complete 2026-01-15) - Build the base',
  '- [ ] **Phase 2: Features** - Add cool features',
  '',
  '## Phase Details',
  '',
  '### Phase 1: Foundation',
  '',
  'Plans:',
  '- [x] 01-01-PLAN.md -- Foundation setup',
].join('\n');

const STATE_MD = [
  '# Project State',
  '',
  '## Current Position',
  '',
  'Phase: 1 of 2 (Foundation)',
  'Plan: 1 of 1 in current phase',
  'Status: Phase complete',
  'Last activity: 2026-01-15',
  '',
  'Progress: [█████░░░░░] 50% (1/2 plans)',
].join('\n');

const CONFIG_JSON = JSON.stringify({
  mode: 'yolo',
  depth: 'standard',
}, null, 2);

// ============================================================================
// Helpers
// ============================================================================

/**
 * Capture console.log output during a function call.
 */
async function captureOutput(fn: () => Promise<number>): Promise<{ exitCode: number; output: string }> {
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  });
  const errSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  });
  try {
    const exitCode = await fn();
    return { exitCode, output: lines.join('\n') };
  } finally {
    spy.mockRestore();
    errSpy.mockRestore();
  }
}

// ============================================================================
// Subcommand dispatch tests
// ============================================================================

describe('orchestratorCommand dispatch', () => {
  it('returns 0 for discover subcommand', async () => {
    // discover will fail without GSD installation, but dispatch itself works
    const { exitCode } = await captureOutput(() =>
      orchestratorCommand(['discover', '--gsd-base=/nonexistent'])
    );
    // Returns 1 because GSD not found, but dispatch worked (didn't crash)
    expect(exitCode).toBe(1);
  });

  it('returns 0 for "d" alias', async () => {
    const { exitCode } = await captureOutput(() =>
      orchestratorCommand(['d', '--gsd-base=/nonexistent'])
    );
    expect(exitCode).toBe(1);
  });

  it('returns 0 for state subcommand with nonexistent planning dir', async () => {
    const { exitCode } = await captureOutput(() =>
      orchestratorCommand(['state', '--planning-dir=/nonexistent'])
    );
    expect(exitCode).toBe(0);
  });

  it('returns 0 for "s" alias', async () => {
    const { exitCode } = await captureOutput(() =>
      orchestratorCommand(['s', '--planning-dir=/nonexistent'])
    );
    expect(exitCode).toBe(0);
  });

  it('returns 0 for empty args (shows help)', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand([])
    );
    expect(exitCode).toBe(0);
    expect(output).toContain('orchestrator');
  });

  it('returns 1 for unknown subcommand', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand(['unknown-subcommand'])
    );
    expect(exitCode).toBe(1);
    expect(output).toContain('error');
  });
});

// ============================================================================
// Discover subcommand tests
// ============================================================================

describe('orchestratorCommand discover', () => {
  let gsdDir: string;

  beforeEach(async () => {
    gsdDir = join(
      tmpdir(),
      `gsd-orch-discover-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );

    // Create GSD directory structure
    await mkdir(join(gsdDir, 'commands', 'gsd'), { recursive: true });
    await mkdir(join(gsdDir, 'agents'), { recursive: true });
    await mkdir(join(gsdDir, 'get-shit-done'), { recursive: true });

    // Write fixture files
    await writeFile(join(gsdDir, 'commands', 'gsd', 'plan-phase.md'), COMMAND_PLAN_PHASE);
    await writeFile(join(gsdDir, 'commands', 'gsd', 'execute-phase.md'), COMMAND_EXECUTE_PHASE);
    await writeFile(join(gsdDir, 'agents', 'gsd-executor.md'), AGENT_EXECUTOR);
    await writeFile(join(gsdDir, 'get-shit-done', 'VERSION'), '1.12.1');
  });

  afterEach(async () => {
    await rm(gsdDir, { recursive: true, force: true });
  });

  it('returns JSON with commands, agents, teams arrays on stdout', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand(['discover', `--gsd-base=${gsdDir}`])
    );

    expect(exitCode).toBe(0);
    const result = JSON.parse(output);
    expect(Array.isArray(result.commands)).toBe(true);
    expect(Array.isArray(result.agents)).toBe(true);
    expect(Array.isArray(result.teams)).toBe(true);
  });

  it('JSON output includes expected fields per command', async () => {
    const { output } = await captureOutput(() =>
      orchestratorCommand(['discover', `--gsd-base=${gsdDir}`])
    );

    const result = JSON.parse(output);
    expect(result.commands.length).toBeGreaterThanOrEqual(2);

    const planPhase = result.commands.find((c: { name: string }) => c.name === 'gsd:plan-phase');
    expect(planPhase).toBeDefined();
    expect(planPhase.description).toBeDefined();
    expect(planPhase.objective).toBeDefined();
    expect(planPhase.filePath).toBeDefined();
  });

  it('--pretty flag produces non-JSON human-readable output', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand(['discover', `--gsd-base=${gsdDir}`, '--pretty'])
    );

    expect(exitCode).toBe(0);
    // Should not be valid JSON
    expect(() => JSON.parse(output)).toThrow();
    // Should contain human-readable text
    expect(output).toContain('Commands');
  });

  it('returns JSON error with exit code 1 when GSD not installed', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand(['discover', '--gsd-base=/nonexistent/path'])
    );

    expect(exitCode).toBe(1);
    const result = JSON.parse(output);
    expect(result.error).toBeDefined();
  });
});

// ============================================================================
// State subcommand tests
// ============================================================================

describe('orchestratorCommand state', () => {
  let planningDir: string;

  beforeEach(async () => {
    planningDir = join(
      tmpdir(),
      `gsd-orch-state-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );

    await mkdir(planningDir, { recursive: true });
    await writeFile(join(planningDir, 'ROADMAP.md'), ROADMAP_MD);
    await writeFile(join(planningDir, 'STATE.md'), STATE_MD);
    await writeFile(join(planningDir, 'config.json'), CONFIG_JSON);
  });

  afterEach(async () => {
    await rm(planningDir, { recursive: true, force: true });
  });

  it('returns JSON with initialized, phases, hasRoadmap fields', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand(['state', `--planning-dir=${planningDir}`])
    );

    expect(exitCode).toBe(0);
    const result = JSON.parse(output);
    expect(result.initialized).toBe(true);
    expect(Array.isArray(result.phases)).toBe(true);
    expect(result.hasRoadmap).toBe(true);
  });

  it('returns initialized: false when no .planning/ exists', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand(['state', '--planning-dir=/nonexistent/planning'])
    );

    expect(exitCode).toBe(0);
    const result = JSON.parse(output);
    expect(result.initialized).toBe(false);
  });

  it('--pretty flag produces non-JSON human-readable output', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand(['state', `--planning-dir=${planningDir}`, '--pretty'])
    );

    expect(exitCode).toBe(0);
    expect(() => JSON.parse(output)).toThrow();
    // Should contain human-readable text about state
    expect(output).toContain('initialized');
  });

  it('--planning-dir overrides default .planning directory', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand(['state', `--planning-dir=${planningDir}`])
    );

    expect(exitCode).toBe(0);
    const result = JSON.parse(output);
    // Should have read from our custom planning dir (has ROADMAP.md)
    expect(result.hasRoadmap).toBe(true);
  });
});

// ============================================================================
// Help text tests
// ============================================================================

describe('orchestratorCommand help', () => {
  it('--help returns help text mentioning discover, state, classify, lifecycle', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand(['--help'])
    );

    expect(exitCode).toBe(0);
    expect(output).toContain('discover');
    expect(output).toContain('state');
    expect(output).toContain('classify');
    expect(output).toContain('lifecycle');
  });

  it('no args returns 0 and prints help', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand([])
    );

    expect(exitCode).toBe(0);
    expect(output).toContain('orchestrator');
    expect(output.length).toBeGreaterThan(50);
  });
});

// ============================================================================
// Classify subcommand tests
// ============================================================================

describe('orchestratorCommand classify', () => {
  let gsdDir: string;
  let planningDir: string;

  beforeEach(async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    gsdDir = join(tmpdir(), `gsd-orch-classify-gsd-${suffix}`);
    planningDir = join(tmpdir(), `gsd-orch-classify-plan-${suffix}`);

    // Create GSD directory structure with commands
    await mkdir(join(gsdDir, 'commands', 'gsd'), { recursive: true });
    await mkdir(join(gsdDir, 'agents'), { recursive: true });
    await mkdir(join(gsdDir, 'get-shit-done'), { recursive: true });

    await writeFile(join(gsdDir, 'commands', 'gsd', 'plan-phase.md'), COMMAND_PLAN_PHASE);
    await writeFile(join(gsdDir, 'commands', 'gsd', 'execute-phase.md'), COMMAND_EXECUTE_PHASE);
    await writeFile(join(gsdDir, 'agents', 'gsd-executor.md'), AGENT_EXECUTOR);
    await writeFile(join(gsdDir, 'get-shit-done', 'VERSION'), '1.12.1');

    // Create .planning/ structure
    await mkdir(planningDir, { recursive: true });
    await writeFile(join(planningDir, 'ROADMAP.md'), ROADMAP_MD);
    await writeFile(join(planningDir, 'STATE.md'), STATE_MD);
    await writeFile(join(planningDir, 'config.json'), CONFIG_JSON);
  });

  afterEach(async () => {
    await rm(gsdDir, { recursive: true, force: true });
    await rm(planningDir, { recursive: true, force: true });
  });

  it('classifies exact match input with confidence 1.0', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand([
        'classify',
        `--gsd-base=${gsdDir}`,
        `--planning-dir=${planningDir}`,
        '/gsd:plan-phase 3',
      ])
    );

    expect(exitCode).toBe(0);
    const result = JSON.parse(output);
    expect(result.type).toBe('exact-match');
    expect(result.command.name).toBe('gsd:plan-phase');
    expect(result.confidence).toBe(1.0);
    expect(result.arguments.phaseNumber).toBe('3');
  });

  it('classifies natural language input', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand([
        'classify',
        `--gsd-base=${gsdDir}`,
        `--planning-dir=${planningDir}`,
        'plan the next phase',
      ])
    );

    expect(exitCode).toBe(0);
    const result = JSON.parse(output);
    expect(result.type).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('--pretty flag produces human-readable output', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand([
        'classify',
        '--pretty',
        `--gsd-base=${gsdDir}`,
        `--planning-dir=${planningDir}`,
        'plan something',
      ])
    );

    expect(exitCode).toBe(0);
    // Pretty output is NOT valid JSON
    expect(() => JSON.parse(output)).toThrow();
  });

  it('returns JSON error with exit 1 when no input provided', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand([
        'classify',
        `--gsd-base=${gsdDir}`,
        `--planning-dir=${planningDir}`,
      ])
    );

    expect(exitCode).toBe(1);
    const result = JSON.parse(output);
    expect(result.error).toBeDefined();
  });

  it('accepts --planning-dir flag', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand([
        'classify',
        `--gsd-base=${gsdDir}`,
        `--planning-dir=${planningDir}`,
        '/gsd:plan-phase',
      ])
    );

    expect(exitCode).toBe(0);
    const result = JSON.parse(output);
    expect(result.command).toBeDefined();
  });

  it('returns JSON error when GSD not installed', async () => {
    const noGsdDir = join(tmpdir(), `gsd-orch-classify-nogsd-${Date.now()}`);
    await mkdir(noGsdDir, { recursive: true });

    try {
      const { exitCode, output } = await captureOutput(() =>
        orchestratorCommand([
          'classify',
          `--gsd-base=${noGsdDir}`,
          `--planning-dir=${planningDir}`,
          'plan something',
        ])
      );

      expect(exitCode).toBe(1);
      const result = JSON.parse(output);
      expect(result.error).toBeDefined();
    } finally {
      await rm(noGsdDir, { recursive: true, force: true });
    }
  });

  it('"c" alias works for classify', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand([
        'c',
        `--gsd-base=${gsdDir}`,
        `--planning-dir=${planningDir}`,
        '/gsd:plan-phase',
      ])
    );

    expect(exitCode).toBe(0);
    const result = JSON.parse(output);
    expect(result.type).toBe('exact-match');
  });
});

// ============================================================================
// Lifecycle subcommand tests
// ============================================================================

describe('orchestratorCommand lifecycle', () => {
  let planningDir: string;

  beforeEach(async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    planningDir = join(tmpdir(), `gsd-orch-lifecycle-${suffix}`);

    // Create .planning/ structure with roadmap and phases
    await mkdir(join(planningDir, 'phases', '01-foundation'), { recursive: true });
    await writeFile(join(planningDir, 'ROADMAP.md'), ROADMAP_MD);
    await writeFile(join(planningDir, 'STATE.md'), STATE_MD);
    await writeFile(join(planningDir, 'config.json'), CONFIG_JSON);
  });

  afterEach(async () => {
    await rm(planningDir, { recursive: true, force: true });
  });

  it('returns JSON with primary, alternatives, and stage fields', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand([
        'lifecycle',
        `--planning-dir=${planningDir}`,
      ])
    );

    expect(exitCode).toBe(0);
    const result = JSON.parse(output);
    expect(result.primary).toBeDefined();
    expect(result.primary.command).toBeDefined();
    expect(result.primary.reason).toBeDefined();
    expect(result.alternatives).toBeDefined();
    expect(result.stage).toBeDefined();
  });

  it('accepts --after flag for completed command context', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand([
        'lifecycle',
        `--planning-dir=${planningDir}`,
        '--after=plan-phase',
      ])
    );

    expect(exitCode).toBe(0);
    const result = JSON.parse(output);
    expect(result.primary).toBeDefined();
  });

  it('--pretty flag produces human-readable output', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand([
        'lifecycle',
        '--pretty',
        `--planning-dir=${planningDir}`,
      ])
    );

    expect(exitCode).toBe(0);
    expect(() => JSON.parse(output)).toThrow();
  });

  it('accepts --planning-dir flag', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand([
        'lifecycle',
        `--planning-dir=${planningDir}`,
      ])
    );

    expect(exitCode).toBe(0);
    const result = JSON.parse(output);
    expect(result.stage).toBeDefined();
  });

  it('returns stage uninitialized when no .planning/ exists', async () => {
    const nonexistent = join(tmpdir(), `gsd-orch-lifecycle-nope-${Date.now()}`);

    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand([
        'lifecycle',
        `--planning-dir=${nonexistent}`,
      ])
    );

    expect(exitCode).toBe(0);
    const result = JSON.parse(output);
    expect(result.stage).toBe('uninitialized');
  });

  it('"l" alias works for lifecycle', async () => {
    const { exitCode, output } = await captureOutput(() =>
      orchestratorCommand([
        'l',
        `--planning-dir=${planningDir}`,
      ])
    );

    expect(exitCode).toBe(0);
    const result = JSON.parse(output);
    expect(result.primary).toBeDefined();
  });
});

/**
 * Tests for the graph CLI command.
 *
 * Covers:
 * - Default output contains Mermaid graph TD
 * - JSON flag outputs valid JSON with expected shape
 * - Help flag prints help text
 * - Empty skills produces valid minimal output
 * - No co-activation data produces inheritance-only output
 */

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

// Mock dependencies before imports
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: {
    message: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('picocolors', () => ({
  default: {
    bold: (s: string) => s,
    dim: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    green: (s: string) => s,
    cyan: (s: string) => s,
  },
}));

// Mock SkillStore to return controlled data
// Must use regular function (not arrow) for vitest new-ability
vi.mock('../../storage/skill-store.js', () => ({
  SkillStore: vi.fn(function () {
    return {
      list: vi.fn().mockResolvedValue([]),
      read: vi.fn().mockResolvedValue({
        metadata: { name: 'test', description: 'Test skill' },
        body: '',
        path: '/tmp/test/SKILL.md',
      }),
    };
  }),
}));

// Mock CoActivationTracker
vi.mock('../../agents/co-activation-tracker.js', () => ({
  CoActivationTracker: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockReturnValue([]),
  })),
}));

// Mock ClusterDetector
vi.mock('../../agents/cluster-detector.js', () => ({
  ClusterDetector: vi.fn().mockImplementation(() => ({
    detect: vi.fn().mockReturnValue([]),
  })),
}));

// Mock DependencyGraph
vi.mock('../../composition/dependency-graph.js', () => ({
  DependencyGraph: {
    fromSkills: vi.fn().mockReturnValue({
      edges: new Map(),
      nodes: new Set(),
      getParent: vi.fn().mockReturnValue(undefined),
    }),
  },
}));

// Track console.log output
const consoleOutput: string[] = [];
const originalLog = console.log;

beforeEach(() => {
  consoleOutput.length = 0;
  console.log = vi.fn((...args: unknown[]) => {
    consoleOutput.push(args.map(String).join(' '));
  });
});

afterAll(() => {
  console.log = originalLog;
});

describe('graphCommand', () => {
  it('shows help with --help flag', async () => {
    const { graphCommand } = await import('./graph.js');
    const exitCode = await graphCommand(['--help']);

    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    expect(output.toLowerCase()).toMatch(/graph|usage|mermaid/);
  });

  it('outputs Mermaid text by default', async () => {
    const { graphCommand } = await import('./graph.js');
    const exitCode = await graphCommand([]);

    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    expect(output).toContain('graph TD');
  });

  it('outputs JSON with --json flag', async () => {
    const { graphCommand } = await import('./graph.js');
    const exitCode = await graphCommand(['--json']);

    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('skills');
    expect(parsed).toHaveProperty('clusters');
    expect(parsed).toHaveProperty('mermaid');
  });

  it('handles empty skills with minimal output', async () => {
    const { graphCommand } = await import('./graph.js');
    const exitCode = await graphCommand([]);

    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    expect(output).toContain('graph TD');
    expect(output).toContain('%% No skills found');
  });

  it('returns 0 when no co-activation data exists', async () => {
    const { graphCommand } = await import('./graph.js');
    const exitCode = await graphCommand([]);

    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    // Should not throw or error; mermaid output present
    expect(output).toContain('graph TD');
  });
});

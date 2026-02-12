/**
 * Tests for the impact CLI command.
 *
 * Covers:
 * - Help flag display
 * - No arguments shows help
 * - Skill not found returns exit code 1
 * - Leaf skill shows "No downstream skills affected"
 * - Direct and transitive dependents displayed
 * - Impact warning for widely-depended-on skills
 * - JSON output with expected shape
 * - Inheritance chain display
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock SkillStore
const mockList = vi.fn();
const mockRead = vi.fn();

vi.mock('../../storage/skill-store.js', () => ({
  SkillStore: function SkillStore() {
    return {
      list: mockList,
      read: mockRead,
    };
  },
}));

// Mock picocolors to passthrough
vi.mock('picocolors', () => ({
  default: {
    bold: (s: string) => s,
    dim: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    green: (s: string) => s,
    cyan: (s: string) => s,
    white: (s: string) => s,
    bgCyan: (s: string) => s,
    black: (s: string) => s,
  },
}));

// Capture console output
const consoleOutput: string[] = [];
const consoleErrors: string[] = [];
const originalLog = console.log;
const originalError = console.error;

beforeEach(() => {
  consoleOutput.length = 0;
  consoleErrors.length = 0;
  console.log = vi.fn((...args: unknown[]) => {
    consoleOutput.push(args.map(String).join(' '));
  });
  console.error = vi.fn((...args: unknown[]) => {
    consoleErrors.push(args.map(String).join(' '));
  });
  vi.clearAllMocks();
});

afterEach(() => {
  console.log = originalLog;
  console.error = originalError;
});

import { impactCommand } from './impact.js';

describe('impactCommand', () => {
  it('should show help with --help flag and return 0', async () => {
    const exitCode = await impactCommand(['--help']);

    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    expect(output).toMatch(/[Uu]sage/);
    expect(output).toMatch(/impact/);
  });

  it('should show help with no arguments and return 0', async () => {
    const exitCode = await impactCommand([]);

    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    expect(output).toMatch(/[Uu]sage/);
  });

  it('should return 1 for skill not found', async () => {
    mockList.mockResolvedValue(['skill-a']);
    mockRead.mockResolvedValue({
      metadata: { name: 'skill-a', description: 'Skill A' },
      body: '',
      path: '/skills/skill-a/SKILL.md',
    });

    const exitCode = await impactCommand(['nonexistent']);

    expect(exitCode).toBe(1);
    const output = consoleErrors.join('\n');
    expect(output).toMatch(/not found/i);
  });

  it('should show "No downstream skills affected" for leaf skill', async () => {
    mockList.mockResolvedValue(['base', 'leaf']);
    mockRead.mockImplementation(async (name: string) => {
      if (name === 'base') return {
        metadata: { name: 'base', description: 'Base' },
        body: '', path: '/skills/base/SKILL.md',
      };
      if (name === 'leaf') return {
        metadata: { name: 'leaf', description: 'Leaf', extends: 'base' },
        body: '', path: '/skills/leaf/SKILL.md',
      };
      return null;
    });

    const exitCode = await impactCommand(['leaf']);

    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    expect(output).toMatch(/[Nn]o downstream skills affected/);
  });

  it('should show direct dependents and transitive impact', async () => {
    mockList.mockResolvedValue(['root', 'child-a', 'child-b', 'grandchild']);
    mockRead.mockImplementation(async (name: string) => {
      const skills: Record<string, any> = {
        'root': { metadata: { name: 'root', description: 'Root' }, body: '', path: '/skills/root/SKILL.md' },
        'child-a': { metadata: { name: 'child-a', description: 'A', extends: 'root' }, body: '', path: '/skills/child-a/SKILL.md' },
        'child-b': { metadata: { name: 'child-b', description: 'B', extends: 'root' }, body: '', path: '/skills/child-b/SKILL.md' },
        'grandchild': { metadata: { name: 'grandchild', description: 'GC', extends: 'child-a' }, body: '', path: '/skills/grandchild/SKILL.md' },
      };
      return skills[name] || null;
    });

    const exitCode = await impactCommand(['root']);

    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    expect(output).toMatch(/child-a/);
    expect(output).toMatch(/child-b/);
    expect(output).toMatch(/grandchild/);
    expect(output).toMatch(/3/); // 3 affected skills
  });

  it('should show caution warning for widely-depended-on skill', async () => {
    mockList.mockResolvedValue(['base', 'child1', 'child2']);
    mockRead.mockImplementation(async (name: string) => {
      const skills: Record<string, any> = {
        'base': { metadata: { name: 'base', description: 'Base' }, body: '', path: '/skills/base/SKILL.md' },
        'child1': { metadata: { name: 'child1', description: 'C1', extends: 'base' }, body: '', path: '/skills/child1/SKILL.md' },
        'child2': { metadata: { name: 'child2', description: 'C2', extends: 'base' }, body: '', path: '/skills/child2/SKILL.md' },
      };
      return skills[name] || null;
    });

    const exitCode = await impactCommand(['base']);

    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    expect(output).toMatch(/[Cc]aution/);
    expect(output).toMatch(/2/); // 2 dependents
  });

  it('should output valid JSON with --json flag', async () => {
    mockList.mockResolvedValue(['base', 'child']);
    mockRead.mockImplementation(async (name: string) => {
      const skills: Record<string, any> = {
        'base': { metadata: { name: 'base', description: 'Base' }, body: '', path: '/skills/base/SKILL.md' },
        'child': { metadata: { name: 'child', description: 'C', extends: 'base' }, body: '', path: '/skills/child/SKILL.md' },
      };
      return skills[name] || null;
    });

    const exitCode = await impactCommand(['base', '--json']);

    expect(exitCode).toBe(0);
    const fullOutput = consoleOutput.join('\n');
    const parsed = JSON.parse(fullOutput);
    expect(parsed).toHaveProperty('skill', 'base');
    expect(parsed).toHaveProperty('inheritanceChain');
    expect(parsed).toHaveProperty('directDependents');
    expect(parsed).toHaveProperty('transitiveDependents');
    expect(parsed).toHaveProperty('totalAffected');
    expect(parsed).toHaveProperty('warnings');
  });

  it('should show inheritance chain for the queried skill', async () => {
    mockList.mockResolvedValue(['grandparent', 'parent', 'child']);
    mockRead.mockImplementation(async (name: string) => {
      const skills: Record<string, any> = {
        'grandparent': { metadata: { name: 'grandparent', description: 'GP' }, body: '', path: '/skills/grandparent/SKILL.md' },
        'parent': { metadata: { name: 'parent', description: 'P', extends: 'grandparent' }, body: '', path: '/skills/parent/SKILL.md' },
        'child': { metadata: { name: 'child', description: 'C', extends: 'parent' }, body: '', path: '/skills/child/SKILL.md' },
      };
      return skills[name] || null;
    });

    const exitCode = await impactCommand(['child']);

    expect(exitCode).toBe(0);
    const output = consoleOutput.join('\n');
    // Should show the inheritance chain
    expect(output).toMatch(/grandparent/);
    expect(output).toMatch(/parent/);
    expect(output).toMatch(/child/);
  });
});

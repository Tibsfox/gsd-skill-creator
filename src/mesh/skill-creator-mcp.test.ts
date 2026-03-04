import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  SkillCreatorMcpServer,
  SKILL_CREATOR_TOOLS,
  createSkillCreatorMcpServer,
  createSkillCreatorMcpServerFromDeps,
} from './skill-creator-mcp.js';
import type { SkillCreatorMcpConfig, McpEvalResult, SkillCreatorDeps } from './skill-creator-mcp.js';

// ============================================================================
// Mock helpers
// ============================================================================

function mockChipRegistry(chips: string[] = ['gpt-4']) {
  return {
    get: (name: string) => (chips.includes(name) ? { name } : undefined),
    list: () => chips,
    isConfigured: () => true,
  } as any;
}

function mockEvalResult(overrides?: Partial<McpEvalResult>): McpEvalResult {
  return {
    metrics: {
      accuracy: 85,
      total: 10,
      passed: 8,
      failed: 2,
      f1Score: 0.88,
      precision: 0.9,
      recall: 0.85,
    },
    results: [
      { testId: 't1', passed: true, explanation: 'Correct', prompt: 'test prompt', expected: 'positive' },
      { testId: 't2', passed: false, explanation: 'Off-topic', prompt: 'bad prompt', expected: 'positive' },
    ],
    hints: ['Consider improving domain coverage'],
    duration: 1200,
    ...overrides,
  };
}

function mockEvalRunner(result?: McpEvalResult) {
  return {
    runForSkill: async () => result ?? mockEvalResult(),
  };
}

function mockGrader() {
  return {
    buildCapabilityProfile: async (chipName: string) => ({
      model: chipName,
      tier: 'cloud' as const,
      maxContextLength: 200000,
      supportsTools: true,
    }),
    generateModelHints: () => ['Focus on prompt specificity'],
  };
}

function mockBenchmarkRunner() {
  return {
    benchmarkSkill: async (name: string, chips: string[]) => ({
      skillName: name,
      models: chips.map((c) => ({ model: c, passRate: 0.8, avgAccuracy: 80, avgF1: 0.85 })),
      runs: chips.map((c) => ({ model: c, passed: true, metrics: { accuracy: 80 } })),
    }),
  };
}

// ============================================================================
// SKILL_CREATOR_TOOLS
// ============================================================================

describe('SKILL_CREATOR_TOOLS', () => {
  it('returns 10 tools', () => {
    expect(SKILL_CREATOR_TOOLS).toHaveLength(10);
  });

  it('each tool has name, description, and inputSchema', () => {
    for (const tool of SKILL_CREATOR_TOOLS) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
    }
  });

  it('contains all expected tool names', () => {
    const names = SKILL_CREATOR_TOOLS.map((t) => t.name);
    expect(names).toContain('skill.create');
    expect(names).toContain('skill.eval');
    expect(names).toContain('skill.grade');
    expect(names).toContain('skill.compare');
    expect(names).toContain('skill.analyze');
    expect(names).toContain('skill.optimize');
    expect(names).toContain('skill.package');
    expect(names).toContain('skill.benchmark');
    expect(names).toContain('skill.status');
    expect(names).toContain('skill.list');
  });
});

// ============================================================================
// SkillCreatorMcpServer — schema validation
// ============================================================================

describe('SkillCreatorMcpServer', () => {
  describe('listTools', () => {
    it('returns SKILL_CREATOR_TOOLS', () => {
      const server = new SkillCreatorMcpServer();
      expect(server.listTools()).toBe(SKILL_CREATOR_TOOLS);
    });
  });

  describe('handleToolCall — validation', () => {
    it('returns error content for unknown tool', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.nonexistent', {});
      expect(result.content[0].text).toContain('Unknown tool');
      expect(result.isError).toBe(true);
    });

    it('validates args against inputSchema and returns error for invalid args', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.create', {
        skillName: 123,
      });
      expect(result.content[0].text.toLowerCase()).toContain('validation');
    });

    it('response format matches MCP { content: [{ type, text }] }', async () => {
      let skillsDir: string;
      skillsDir = await mkdtemp(join(tmpdir(), 'mcp-fmt-'));
      try {
        const server = new SkillCreatorMcpServer({ skillsDir });
        const result = await server.handleToolCall('skill.create', {
          skillName: 'test',
          description: 'test desc',
        });
        expect(result).toHaveProperty('content');
        expect(Array.isArray(result.content)).toBe(true);
        expect(result.content[0]).toHaveProperty('type');
        expect(result.content[0]).toHaveProperty('text');
        expect(typeof result.content[0].text).toBe('string');
      } finally {
        await rm(skillsDir, { recursive: true, force: true });
      }
    });
  });

  // ==========================================================================
  // skill.create — wired handler
  // ==========================================================================

  describe('skill.create', () => {
    let skillsDir: string;

    beforeEach(async () => {
      skillsDir = await mkdtemp(join(tmpdir(), 'mcp-create-'));
    });

    afterEach(async () => {
      await rm(skillsDir, { recursive: true, force: true });
    });

    it('creates skill directory with SKILL.md, test-cases.json, manifest', async () => {
      const server = new SkillCreatorMcpServer({ skillsDir });
      const result = await server.handleToolCall('skill.create', {
        skillName: 'my-skill',
        description: 'A test skill',
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.created).toBe(true);
      expect(data.files).toContain('SKILL.md');
      expect(data.files).toContain('test-cases.json');
      expect(data.files).toContain('skill-manifest.json');

      // Verify files exist on disk
      await expect(stat(join(skillsDir, 'my-skill', 'SKILL.md'))).resolves.toBeTruthy();
      await expect(stat(join(skillsDir, 'my-skill', 'test-cases.json'))).resolves.toBeTruthy();
      await expect(stat(join(skillsDir, 'my-skill', 'skill-manifest.json'))).resolves.toBeTruthy();
    });

    it('returns JSON result, not "Would" string', async () => {
      const server = new SkillCreatorMcpServer({ skillsDir });
      const result = await server.handleToolCall('skill.create', {
        skillName: 'test-skill',
        description: 'A test skill',
      });
      expect(result.content[0].text).not.toContain('Would');
      expect(() => JSON.parse(result.content[0].text)).not.toThrow();
    });

    it('initializes OperationTracker in draft state', async () => {
      const server = new SkillCreatorMcpServer({ skillsDir });
      await server.handleToolCall('skill.create', {
        skillName: 'tracked-skill',
        description: 'Track this',
      });

      const statusJson = await readFile(join(skillsDir, 'tracked-skill', '.skill-status.json'), 'utf-8');
      const status = JSON.parse(statusJson);
      expect(status.state).toBe('draft');
    });
  });

  // ==========================================================================
  // skill.eval — wired handler
  // ==========================================================================

  describe('skill.eval', () => {
    let skillsDir: string;

    beforeEach(async () => {
      skillsDir = await mkdtemp(join(tmpdir(), 'mcp-eval-'));
    });

    afterEach(async () => {
      await rm(skillsDir, { recursive: true, force: true });
    });

    it('returns structured scores from eval runner', async () => {
      const config: SkillCreatorMcpConfig = {
        skillsDir,
        chipRegistry: mockChipRegistry(),
        evalRunner: mockEvalRunner(),
      };
      const server = new SkillCreatorMcpServer(config);

      // Create skill dir so tracker can save
      const { mkdirSync } = await import('node:fs');
      mkdirSync(join(skillsDir, 'test-skill'), { recursive: true });

      const result = await server.handleToolCall('skill.eval', {
        skillName: 'test-skill',
        chipName: 'gpt-4',
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.skillName).toBe('test-skill');
      expect(data.chipName).toBe('gpt-4');
      expect(data.metrics.accuracy).toBe(85);
      expect(data.testCount).toBe(2);
    });

    it('returns isError:true for invalid chipName', async () => {
      const config: SkillCreatorMcpConfig = {
        skillsDir,
        chipRegistry: mockChipRegistry(['gpt-4']),
        evalRunner: mockEvalRunner(),
      };
      const server = new SkillCreatorMcpServer(config);
      const result = await server.handleToolCall('skill.eval', {
        skillName: 'test-skill',
        chipName: 'nonexistent-chip',
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Chip not found');
    });

    it('returns isError:true when no chip registry configured', async () => {
      const server = new SkillCreatorMcpServer({ skillsDir });
      const result = await server.handleToolCall('skill.eval', {
        skillName: 'test-skill',
        chipName: 'gpt-4',
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('registry');
    });
  });

  // ==========================================================================
  // skill.grade — wired handler
  // ==========================================================================

  describe('skill.grade', () => {
    let skillsDir: string;

    beforeEach(async () => {
      skillsDir = await mkdtemp(join(tmpdir(), 'mcp-grade-'));
    });

    afterEach(async () => {
      await rm(skillsDir, { recursive: true, force: true });
    });

    it('returns per-test grades from grader', async () => {
      const config: SkillCreatorMcpConfig = {
        skillsDir,
        chipRegistry: mockChipRegistry(),
        grader: mockGrader(),
      };
      const server = new SkillCreatorMcpServer(config);

      // Create skill dir for tracker
      const { mkdirSync } = await import('node:fs');
      mkdirSync(join(skillsDir, 'test-skill'), { recursive: true });

      const result = await server.handleToolCall('skill.grade', {
        skillName: 'test-skill',
        chipName: 'gpt-4',
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.skillName).toBe('test-skill');
      expect(data.chipName).toBe('gpt-4');
      expect(data.profile.tier).toBe('cloud');
      expect(data.hints).toContain('Focus on prompt specificity');
    });

    it('returns isError:true when no grader configured', async () => {
      const server = new SkillCreatorMcpServer({ skillsDir, chipRegistry: mockChipRegistry() });
      const result = await server.handleToolCall('skill.grade', {
        skillName: 'test-skill',
        chipName: 'gpt-4',
      });
      expect(result.isError).toBe(true);
    });
  });

  // ==========================================================================
  // skill.compare — wired handler
  // ==========================================================================

  describe('skill.compare', () => {
    it('returns comparison matrix across chips', async () => {
      const skillsDir = await mkdtemp(join(tmpdir(), 'mcp-compare-'));
      try {
        const config: SkillCreatorMcpConfig = {
          skillsDir,
          chipRegistry: mockChipRegistry(['gpt-4', 'llama-7b']),
          evalRunner: mockEvalRunner(),
        };
        const server = new SkillCreatorMcpServer(config);
        const result = await server.handleToolCall('skill.compare', {
          skillName: 'test-skill',
          chips: ['gpt-4', 'llama-7b'],
        });

        expect(result.isError).toBeUndefined();
        const data = JSON.parse(result.content[0].text);
        expect(data.comparison).toHaveLength(2);
        expect(data.comparison[0].chipName).toBe('gpt-4');
        expect(data.comparison[1].chipName).toBe('llama-7b');
      } finally {
        await rm(skillsDir, { recursive: true, force: true });
      }
    });

    it('returns zero metrics for unknown chips in comparison', async () => {
      const skillsDir = await mkdtemp(join(tmpdir(), 'mcp-compare2-'));
      try {
        const config: SkillCreatorMcpConfig = {
          skillsDir,
          chipRegistry: mockChipRegistry(['gpt-4']),
          evalRunner: mockEvalRunner(),
        };
        const server = new SkillCreatorMcpServer(config);
        const result = await server.handleToolCall('skill.compare', {
          skillName: 'test-skill',
          chips: ['gpt-4', 'unknown-chip'],
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.comparison[1].metrics.accuracy).toBe(0);
      } finally {
        await rm(skillsDir, { recursive: true, force: true });
      }
    });
  });

  // ==========================================================================
  // skill.analyze — wired handler
  // ==========================================================================

  describe('skill.analyze', () => {
    it('returns categorized failure patterns', async () => {
      const skillsDir = await mkdtemp(join(tmpdir(), 'mcp-analyze-'));
      try {
        const config: SkillCreatorMcpConfig = {
          skillsDir,
          chipRegistry: mockChipRegistry(),
          evalRunner: mockEvalRunner(),
        };
        const server = new SkillCreatorMcpServer(config);
        const result = await server.handleToolCall('skill.analyze', {
          skillName: 'test-skill',
          chipName: 'gpt-4',
        });

        expect(result.isError).toBeUndefined();
        const data = JSON.parse(result.content[0].text);
        expect(data.totalTests).toBe(2);
        expect(data.failedTests).toBe(1);
        expect(data.patterns).toHaveProperty('false-negative');
      } finally {
        await rm(skillsDir, { recursive: true, force: true });
      }
    });
  });

  // ==========================================================================
  // skill.optimize — wired handler
  // ==========================================================================

  describe('skill.optimize', () => {
    let skillsDir: string;

    beforeEach(async () => {
      skillsDir = await mkdtemp(join(tmpdir(), 'mcp-optimize-'));
    });

    afterEach(async () => {
      await rm(skillsDir, { recursive: true, force: true });
    });

    it('returns prompt modification suggestions', async () => {
      const { mkdirSync } = await import('node:fs');
      mkdirSync(join(skillsDir, 'test-skill'), { recursive: true });

      const config: SkillCreatorMcpConfig = {
        skillsDir,
        chipRegistry: mockChipRegistry(),
        evalRunner: mockEvalRunner(),
      };
      const server = new SkillCreatorMcpServer(config);
      const result = await server.handleToolCall('skill.optimize', {
        skillName: 'test-skill',
        chipName: 'gpt-4',
        targetPassRate: 0.95,
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.suggestions.length).toBeGreaterThan(0);
      expect(data.targetPassRate).toBe(0.95);
    });
  });

  // ==========================================================================
  // skill.package — wired handler
  // ==========================================================================

  describe('skill.package', () => {
    let skillsDir: string;

    beforeEach(async () => {
      skillsDir = await mkdtemp(join(tmpdir(), 'mcp-package-'));
    });

    afterEach(async () => {
      await rm(skillsDir, { recursive: true, force: true });
    });

    it('returns bundle info with manifest', async () => {
      const { mkdirSync } = await import('node:fs');
      mkdirSync(join(skillsDir, 'test-skill'), { recursive: true });

      const server = new SkillCreatorMcpServer({ skillsDir });
      const result = await server.handleToolCall('skill.package', {
        skillName: 'test-skill',
        version: '1.0.0',
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.version).toBe('1.0.0');
      expect(data.manifest.name).toBe('test-skill');
    });
  });

  // ==========================================================================
  // skill.benchmark — wired handler
  // ==========================================================================

  describe('skill.benchmark', () => {
    it('returns mean/p50/p95 stats with benchmark runner', async () => {
      const skillsDir = await mkdtemp(join(tmpdir(), 'mcp-bench-'));
      try {
        const config: SkillCreatorMcpConfig = {
          skillsDir,
          benchmarkRunner: mockBenchmarkRunner(),
        };
        const server = new SkillCreatorMcpServer(config);
        const result = await server.handleToolCall('skill.benchmark', {
          skillName: 'test-skill',
          chips: ['gpt-4'],
        });

        expect(result.isError).toBeUndefined();
        const data = JSON.parse(result.content[0].text);
        expect(data.models[0].passRate).toBe(0.8);
      } finally {
        await rm(skillsDir, { recursive: true, force: true });
      }
    });

    it('runs multi-iteration eval when no benchmark runner', async () => {
      const skillsDir = await mkdtemp(join(tmpdir(), 'mcp-bench2-'));
      try {
        const config: SkillCreatorMcpConfig = {
          skillsDir,
          chipRegistry: mockChipRegistry(),
          evalRunner: mockEvalRunner(),
        };
        const server = new SkillCreatorMcpServer(config);
        const result = await server.handleToolCall('skill.benchmark', {
          skillName: 'test-skill',
          chips: ['gpt-4'],
          iterations: 3,
        });

        expect(result.isError).toBeUndefined();
        const data = JSON.parse(result.content[0].text);
        expect(data.chips[0].iterations).toBe(3);
        expect(data.chips[0].mean).toBe(85);
      } finally {
        await rm(skillsDir, { recursive: true, force: true });
      }
    });
  });

  // ==========================================================================
  // skill.status — wired handler
  // ==========================================================================

  describe('skill.status', () => {
    let skillsDir: string;

    beforeEach(async () => {
      skillsDir = await mkdtemp(join(tmpdir(), 'mcp-status-'));
    });

    afterEach(async () => {
      await rm(skillsDir, { recursive: true, force: true });
    });

    it('returns state and history for existing skill', async () => {
      const { mkdirSync } = await import('node:fs');
      const { OperationTracker } = await import('./operation-tracker.js');

      const skillDir = join(skillsDir, 'my-skill');
      mkdirSync(skillDir, { recursive: true });

      // Set up tracker state
      const tracker = new OperationTracker(skillDir);
      await tracker.load();
      tracker.advance('tested');
      await tracker.save();

      const server = new SkillCreatorMcpServer({ skillsDir });
      const result = await server.handleToolCall('skill.status', { skillName: 'my-skill' });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.name).toBe('my-skill');
      expect(data.state).toBe('tested');
      expect(data.history).toHaveLength(1);
    });

    it('returns draft state for skill with no status file', async () => {
      const { mkdirSync } = await import('node:fs');
      mkdirSync(join(skillsDir, 'new-skill'), { recursive: true });

      const server = new SkillCreatorMcpServer({ skillsDir });
      const result = await server.handleToolCall('skill.status', { skillName: 'new-skill' });

      const data = JSON.parse(result.content[0].text);
      expect(data.state).toBe('draft');
      expect(data.history).toHaveLength(0);
    });
  });

  // ==========================================================================
  // skill.list — wired handler
  // ==========================================================================

  describe('skill.list', () => {
    let skillsDir: string;

    beforeEach(async () => {
      skillsDir = await mkdtemp(join(tmpdir(), 'mcp-list-'));
    });

    afterEach(async () => {
      await rm(skillsDir, { recursive: true, force: true });
    });

    it('returns array of skills with metadata', async () => {
      const { mkdirSync, writeFileSync } = await import('node:fs');
      mkdirSync(join(skillsDir, 'alpha'), { recursive: true });
      mkdirSync(join(skillsDir, 'beta'), { recursive: true });
      writeFileSync(join(skillsDir, 'alpha', 'SKILL.md'), '# Alpha', 'utf-8');
      writeFileSync(join(skillsDir, 'beta', 'SKILL.md'), '# Beta', 'utf-8');

      const server = new SkillCreatorMcpServer({ skillsDir });
      const result = await server.handleToolCall('skill.list', {});

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.total).toBe(2);
      expect(data.skills).toHaveLength(2);
      expect(data.skills[0].name).toBe('alpha');
    });

    it('filters skills by name when filter provided', async () => {
      const { mkdirSync, writeFileSync } = await import('node:fs');
      mkdirSync(join(skillsDir, 'alpha-skill'), { recursive: true });
      mkdirSync(join(skillsDir, 'beta-skill'), { recursive: true });
      writeFileSync(join(skillsDir, 'alpha-skill', 'SKILL.md'), '# Alpha', 'utf-8');
      writeFileSync(join(skillsDir, 'beta-skill', 'SKILL.md'), '# Beta', 'utf-8');

      const server = new SkillCreatorMcpServer({ skillsDir });
      const result = await server.handleToolCall('skill.list', { filter: 'alpha' });

      const data = JSON.parse(result.content[0].text);
      expect(data.total).toBe(1);
      expect(data.skills[0].name).toBe('alpha-skill');
    });

    it('returns empty array for empty skills directory', async () => {
      const server = new SkillCreatorMcpServer({ skillsDir });
      const result = await server.handleToolCall('skill.list', {});

      const data = JSON.parse(result.content[0].text);
      expect(data.total).toBe(0);
      expect(data.skills).toEqual([]);
    });
  });

  // ==========================================================================
  // Error handling — all handlers catch and return isError
  // ==========================================================================

  describe('error handling', () => {
    it('catches exceptions in handlers and returns isError:true', async () => {
      const config: SkillCreatorMcpConfig = {
        skillsDir: '/nonexistent/path/that/will/fail',
        chipRegistry: mockChipRegistry(),
        evalRunner: {
          runForSkill: async () => { throw new Error('eval exploded'); },
        },
      };
      const server = new SkillCreatorMcpServer(config);
      const result = await server.handleToolCall('skill.eval', {
        skillName: 'test',
        chipName: 'gpt-4',
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('eval exploded');
    });

    it('no handler returns "Would" string text', async () => {
      const skillsDir = await mkdtemp(join(tmpdir(), 'mcp-nowould-'));
      try {
        const config: SkillCreatorMcpConfig = {
          skillsDir,
          chipRegistry: mockChipRegistry(['gpt-4', 'llama-7b']),
          evalRunner: mockEvalRunner(),
          grader: mockGrader(),
          benchmarkRunner: mockBenchmarkRunner(),
        };
        const server = new SkillCreatorMcpServer(config);

        // Create skill dir
        const { mkdirSync } = await import('node:fs');
        mkdirSync(join(skillsDir, 'test-skill'), { recursive: true });

        const tools = ['skill.create', 'skill.eval', 'skill.grade', 'skill.compare',
          'skill.analyze', 'skill.optimize', 'skill.package', 'skill.benchmark',
          'skill.status', 'skill.list'];

        const argsMap: Record<string, unknown> = {
          'skill.create': { skillName: 'new-skill', description: 'desc' },
          'skill.eval': { skillName: 'test-skill', chipName: 'gpt-4' },
          'skill.grade': { skillName: 'test-skill', chipName: 'gpt-4' },
          'skill.compare': { skillName: 'test-skill', chips: ['gpt-4'] },
          'skill.analyze': { skillName: 'test-skill', chipName: 'gpt-4' },
          'skill.optimize': { skillName: 'test-skill', chipName: 'gpt-4' },
          'skill.package': { skillName: 'test-skill', version: '1.0.0' },
          'skill.benchmark': { skillName: 'test-skill', chips: ['gpt-4'] },
          'skill.status': { skillName: 'test-skill' },
          'skill.list': {},
        };

        for (const tool of tools) {
          const result = await server.handleToolCall(tool, argsMap[tool]);
          expect(result.content[0].text).not.toContain('Would');
        }
      } finally {
        await rm(skillsDir, { recursive: true, force: true });
      }
    });
  });
});

// ============================================================================
// createSkillCreatorMcpServer
// ============================================================================

describe('createSkillCreatorMcpServer', () => {
  it('returns a SkillCreatorMcpServer instance', () => {
    const server = createSkillCreatorMcpServer();
    expect(server).toBeInstanceOf(SkillCreatorMcpServer);
  });

  it('accepts config parameter', () => {
    const server = createSkillCreatorMcpServer({ skillsDir: '/tmp/test' });
    expect(server).toBeInstanceOf(SkillCreatorMcpServer);
  });

  it('returned server has working listTools', () => {
    const server = createSkillCreatorMcpServer();
    expect(server.listTools()).toHaveLength(10);
  });
});

// ============================================================================
// SkillCreatorDeps-based handlers (skill.create, skill.eval, skill.grade)
// ============================================================================

function makeDeps(overrides: Partial<SkillCreatorDeps> = {}): SkillCreatorDeps {
  const mockSkillStore = {
    create: vi.fn().mockResolvedValue({ path: '/mock/skills/test-skill/SKILL.md', metadata: {}, body: '' }),
    list: vi.fn().mockResolvedValue([]),
    exists: vi.fn().mockResolvedValue(false),
  };
  const mockTestStore = {
    add: vi.fn().mockResolvedValue({ id: 'mock-id', prompt: 'test', expected: 'positive' }),
    list: vi.fn().mockResolvedValue([]),
  };
  const mockResultStore = {
    list: vi.fn().mockResolvedValue([]),
    getLatest: vi.fn().mockResolvedValue({
      results: [
        { testId: 't1', passed: true, explanation: 'Good', prompt: 'p1', expected: 'positive' },
        { testId: 't2', passed: false, explanation: 'Off-topic', prompt: 'p2', expected: 'positive' },
        { testId: 't3', passed: false, explanation: 'Wrong domain', prompt: 'p3', expected: 'negative' },
      ],
      hints: ['Improve coverage', 'Narrow activation scope'],
      metrics: { total: 3, passed: 1, failed: 2, accuracy: 33 },
    }),
  };
  const mockChipTestRunner = {
    runForSkill: vi.fn().mockResolvedValue({
      metrics: { total: 5, passed: 4, failed: 1, accuracy: 0.8, f1Score: 0.85, precision: 0.88, recall: 0.82 },
      results: [
        { testId: 't1', passed: true, explanation: 'Good', prompt: 'p1', expected: 'positive' },
        { testId: 't2', passed: false, explanation: 'Off-topic', prompt: 'p2', expected: 'positive' },
      ],
      hints: ['Improve coverage'],
      chipName: 'test-chip',
    }),
  };
  const mockGrader = {
    buildCapabilityProfile: vi.fn().mockResolvedValue({
      model: 'test-chip',
      tier: 'cloud' as const,
      maxContextLength: 200000,
      supportsTools: true,
      supportsStreaming: true,
      modelCount: 1,
    }),
    generateModelHints: vi.fn().mockReturnValue(['Hint from grader']),
  };
  const mockRegistry = {
    get: vi.fn().mockReturnValue({ name: 'test-chip' }),
    list: vi.fn().mockReturnValue(['test-chip']),
    isConfigured: vi.fn().mockReturnValue(true),
  };
  const mockLifecycleResolver = {
    resolve: vi.fn().mockResolvedValue('draft'),
    listAll: vi.fn().mockResolvedValue([]),
  };

  return {
    registry: mockRegistry as any,
    chipTestRunner: mockChipTestRunner as any,
    grader: mockGrader as any,
    benchmarkRunner: { benchmarkSkill: vi.fn().mockResolvedValue({ skillName: '', models: [], runs: [] }) } as any,
    skillStore: mockSkillStore as any,
    testStore: mockTestStore as any,
    resultStore: mockResultStore as any,
    lifecycleResolver: mockLifecycleResolver as any,
    scope: 'project' as const,
    ...overrides,
  };
}

describe('SkillCreatorDeps-based handlers', () => {
  // -------------------------------------------------------------------------
  // skill.create via deps
  // -------------------------------------------------------------------------
  describe('skill.create with SkillCreatorDeps', () => {
    it('returns JSON with created:true and path', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.create', {
        skillName: 'test-skill',
        description: 'A test skill',
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.created).toBe(true);
      expect(data.path).toContain('SKILL.md');
    });

    it('calls skillStore.create with skillName and metadata containing name field', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      await server.handleToolCall('skill.create', {
        skillName: 'my-skill',
        description: 'desc',
      });

      expect((deps.skillStore as any).create).toHaveBeenCalledWith(
        'my-skill',
        expect.objectContaining({ name: 'my-skill', description: 'desc' }),
        expect.any(String),
      );
    });

    it('adds a starter test case via testStore.add', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      await server.handleToolCall('skill.create', {
        skillName: 'my-skill',
        description: 'desc',
      });

      expect((deps.testStore as any).add).toHaveBeenCalledWith(
        'my-skill',
        expect.objectContaining({ prompt: expect.any(String), expected: 'positive' }),
      );
    });

    it('returns isError:true when skillStore.create throws', async () => {
      const deps = makeDeps({
        skillStore: {
          create: vi.fn().mockRejectedValue(new Error('Invalid skill name')),
          list: vi.fn().mockResolvedValue([]),
          exists: vi.fn().mockResolvedValue(false),
        } as any,
      });
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.create', {
        skillName: 'bad-name',
        description: 'desc',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid skill name');
    });

    it('does not return "Would" placeholder text', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.create', {
        skillName: 'test-skill',
        description: 'A test skill',
      });
      expect(result.content[0].text).not.toContain('Would');
      expect(() => JSON.parse(result.content[0].text)).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // skill.eval via deps
  // -------------------------------------------------------------------------
  describe('skill.eval with SkillCreatorDeps', () => {
    it('returns JSON containing metrics and results keys', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.eval', {
        skillName: 'test-skill',
        chipName: 'test-chip',
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('results');
      expect(data.metrics.total).toBe(5);
      expect(data.metrics.passed).toBe(4);
    });

    it('passes chipName as chip option to runForSkill', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      await server.handleToolCall('skill.eval', {
        skillName: 'test-skill',
        chipName: 'test-chip',
      });

      expect((deps.chipTestRunner as any).runForSkill).toHaveBeenCalledWith(
        'test-skill',
        expect.objectContaining({ chip: 'test-chip' }),
      );
    });

    it('returns isError:true when chipTestRunner.runForSkill throws', async () => {
      const deps = makeDeps({
        chipTestRunner: {
          runForSkill: vi.fn().mockRejectedValue(new Error('Chip not found: bad-chip')),
        } as any,
      });
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.eval', {
        skillName: 'test-skill',
        chipName: 'bad-chip',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Chip not found');
    });
  });

  // -------------------------------------------------------------------------
  // skill.grade via deps
  // -------------------------------------------------------------------------
  describe('skill.grade with SkillCreatorDeps', () => {
    it('returns JSON with profile, hints, and results', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.grade', {
        skillName: 'test-skill',
        chipName: 'test-chip',
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data).toHaveProperty('profile');
      expect(data).toHaveProperty('hints');
      expect(data).toHaveProperty('results');
      expect(data.profile.tier).toBe('cloud');
      expect(data.hints).toContain('Hint from grader');
    });

    it('passes graderChip to runForSkill options', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      await server.handleToolCall('skill.grade', {
        skillName: 'test-skill',
        chipName: 'test-chip',
        graderChip: 'grader-chip',
      });

      expect((deps.chipTestRunner as any).runForSkill).toHaveBeenCalledWith(
        'test-skill',
        expect.objectContaining({ chip: 'test-chip', graderChip: 'grader-chip' }),
      );
    });

    it('calls buildCapabilityProfile with chipName and registry', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      await server.handleToolCall('skill.grade', {
        skillName: 'test-skill',
        chipName: 'test-chip',
      });

      expect((deps.grader as any).buildCapabilityProfile).toHaveBeenCalledWith(
        'test-chip',
        deps.registry,
      );
    });

    it('returns isError:true when chipTestRunner throws in skill.grade', async () => {
      const deps = makeDeps({
        chipTestRunner: {
          runForSkill: vi.fn().mockRejectedValue(new Error('Runner failed')),
        } as any,
      });
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.grade', {
        skillName: 'test-skill',
        chipName: 'test-chip',
      });

      expect(result.isError).toBe(true);
    });

    it('works without graderChip (keyword matching path)', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.grade', {
        skillName: 'test-skill',
        chipName: 'test-chip',
        // no graderChip
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data).toHaveProperty('metrics');
    });
  });

  // -------------------------------------------------------------------------
  // skill.compare via deps (Task 1)
  // -------------------------------------------------------------------------
  describe('skill.compare with SkillCreatorDeps', () => {
    it('calls benchmarkRunner.benchmarkSkill and returns per-chip results', async () => {
      const deps = makeDeps({
        benchmarkRunner: {
          benchmarkSkill: vi.fn().mockResolvedValue({
            skillName: 'test-skill',
            benchmarkedAt: '2026-03-04T00:00:00Z',
            models: [
              { model: 'chip-a', runCount: 1, passRate: 0.8, avgAccuracy: 80, avgF1: 0.82, thresholdStatus: 'above' as const },
              { model: 'chip-b', runCount: 1, passRate: 0.6, avgAccuracy: 60, avgF1: 0.63, thresholdStatus: 'below' as const },
            ],
            runs: [],
            legacyRunCount: 0,
          }),
        } as any,
      });
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.compare', {
        skillName: 'test-skill',
        chips: ['chip-a', 'chip-b'],
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.skillName).toBe('test-skill');
      expect(data.chips).toEqual(['chip-a', 'chip-b']);
      expect(data.models).toHaveLength(2);
      expect(data.models[0].model).toBe('chip-a');
    });

    it('calls benchmarkRunner.benchmarkSkill with skillName and chips args', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      await server.handleToolCall('skill.compare', {
        skillName: 'my-skill',
        chips: ['chip-x'],
      });

      expect((deps.benchmarkRunner as any).benchmarkSkill).toHaveBeenCalledWith('my-skill', ['chip-x']);
    });

    it('returns isError:true when benchmarkRunner throws', async () => {
      const deps = makeDeps({
        benchmarkRunner: {
          benchmarkSkill: vi.fn().mockRejectedValue(new Error('Benchmark failed')),
        } as any,
      });
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.compare', {
        skillName: 'test-skill',
        chips: ['chip-a'],
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Benchmark failed');
    });
  });

  // -------------------------------------------------------------------------
  // skill.analyze via deps (Task 1)
  // -------------------------------------------------------------------------
  describe('skill.analyze with SkillCreatorDeps', () => {
    it('returns JSON with issues containing falseNegatives and falsePositives', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.analyze', {
        skillName: 'test-skill',
        chipName: 'test-chip',
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data).toHaveProperty('issues');
      expect(data.issues).toHaveProperty('falseNegatives');
      expect(data.issues).toHaveProperty('falsePositives');
      // p2 failed with expected=positive → falseNegative
      expect(data.issues.falseNegatives).toHaveLength(1);
      // p3 failed with expected=negative → falsePositive
      expect(data.issues.falsePositives).toHaveLength(1);
    });

    it('returns hints from resultStore snapshot', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.analyze', {
        skillName: 'test-skill',
        chipName: 'test-chip',
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.hints).toContain('Improve coverage');
    });

    it('returns isError:true when resultStore.getLatest returns null', async () => {
      const deps = makeDeps({
        resultStore: {
          list: vi.fn().mockResolvedValue([]),
          getLatest: vi.fn().mockResolvedValue(null),
        } as any,
      });
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.analyze', {
        skillName: 'test-skill',
        chipName: 'test-chip',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('test-skill');
    });

    it('calls resultStore.getLatest with skillName', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      await server.handleToolCall('skill.analyze', {
        skillName: 'my-skill',
        chipName: 'chip-x',
      });

      expect((deps.resultStore as any).getLatest).toHaveBeenCalledWith('my-skill');
    });
  });

  // -------------------------------------------------------------------------
  // skill.optimize via deps (Task 1)
  // -------------------------------------------------------------------------
  describe('skill.optimize with SkillCreatorDeps', () => {
    it('returns JSON with hints and failureCount', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.optimize', {
        skillName: 'test-skill',
        chipName: 'test-chip',
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data).toHaveProperty('hints');
      expect(data).toHaveProperty('failureCount');
      expect(data.hints).toContain('Hint from grader');
    });

    it('includes skillName, chipName, and targetPassRate in response', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.optimize', {
        skillName: 'test-skill',
        chipName: 'test-chip',
        targetPassRate: 0.9,
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.skillName).toBe('test-skill');
      expect(data.chipName).toBe('test-chip');
      expect(data.targetPassRate).toBe(0.9);
    });

    it('defaults targetPassRate to 0.75 when not specified', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.optimize', {
        skillName: 'test-skill',
        chipName: 'test-chip',
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.targetPassRate).toBe(0.75);
    });

    it('calls grader.generateModelHints with failed tests and profile', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      await server.handleToolCall('skill.optimize', {
        skillName: 'test-skill',
        chipName: 'test-chip',
      });

      expect((deps.grader as any).generateModelHints).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ prompt: expect.any(String) })]),
        expect.anything(),
      );
    });

    it('returns isError:true when resultStore.getLatest returns null', async () => {
      const deps = makeDeps({
        resultStore: {
          list: vi.fn().mockResolvedValue([]),
          getLatest: vi.fn().mockResolvedValue(null),
        } as any,
      });
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.optimize', {
        skillName: 'test-skill',
        chipName: 'test-chip',
      });

      expect(result.isError).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // skill.package via deps (Task 2)
  // -------------------------------------------------------------------------
  describe('skill.package with SkillCreatorDeps', () => {
    it('returns JSON with manifest containing mesh_hints', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.package', {
        skillName: 'test-skill',
        version: '1.0.0',
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data).toHaveProperty('manifest');
      expect(data.manifest).toHaveProperty('mesh_hints');
    });

    it('returns SkillPackage with variants and benchmarks arrays', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.package', {
        skillName: 'test-skill',
        version: '2.0.0',
        description: 'A packaged skill',
      });

      const data = JSON.parse(result.content[0].text);
      expect(data).toHaveProperty('variants');
      expect(data).toHaveProperty('benchmarks');
      expect(Array.isArray(data.variants)).toBe(true);
      expect(Array.isArray(data.benchmarks)).toBe(true);
    });

    it('manifest.name matches skillName', async () => {
      const deps = makeDeps();
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.package', {
        skillName: 'my-packaged-skill',
        version: '1.0.0',
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.manifest.name).toBe('my-packaged-skill');
    });
  });

  // -------------------------------------------------------------------------
  // skill.benchmark via deps (Task 2)
  // -------------------------------------------------------------------------
  describe('skill.benchmark with SkillCreatorDeps', () => {
    it('returns mean/p50/p95 stats per chip', async () => {
      const deps = makeDeps({
        benchmarkRunner: {
          benchmarkSkill: vi.fn().mockResolvedValue({
            skillName: 'test-skill',
            benchmarkedAt: '2026-03-04T00:00:00Z',
            models: [
              { model: 'chip-a', runCount: 1, passRate: 0.8, avgAccuracy: 80, avgF1: 0.8, thresholdStatus: 'above' as const },
            ],
            runs: [
              { skillName: 'test-skill', model: 'chip-a', runAt: '2026-03-04T00:00:00Z', duration: 100,
                metrics: { total: 5, passed: 4, failed: 1, accuracy: 80, f1Score: 0.8, precision: 0.8, recall: 0.8 },
                passed: true, hints: [] },
            ],
            legacyRunCount: 0,
          }),
        } as any,
      });
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.benchmark', {
        skillName: 'test-skill',
        chips: ['chip-a'],
        iterations: 2,
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data).toHaveProperty('iterations');
      expect(data.iterations).toBe(2);
      expect(data).toHaveProperty('chips');
      const chipStats = data.chips.find((c: { chip: string }) => c.chip === 'chip-a');
      expect(chipStats).toBeDefined();
      expect(chipStats).toHaveProperty('mean');
      expect(chipStats).toHaveProperty('p50');
      expect(chipStats).toHaveProperty('p95');
    });

    it('defaults to 3 iterations when not specified', async () => {
      const benchmarkSkill = vi.fn().mockResolvedValue({
        skillName: 'test-skill',
        benchmarkedAt: '2026-03-04T00:00:00Z',
        models: [],
        runs: [],
        legacyRunCount: 0,
      });
      const deps = makeDeps({ benchmarkRunner: { benchmarkSkill } as any });
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.benchmark', {
        skillName: 'test-skill',
        chips: ['chip-a'],
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.iterations).toBe(3);
      expect(benchmarkSkill).toHaveBeenCalledTimes(3);
    });

    it('returns isError:true when benchmarkRunner throws', async () => {
      const deps = makeDeps({
        benchmarkRunner: {
          benchmarkSkill: vi.fn().mockRejectedValue(new Error('Benchmark error')),
        } as any,
      });
      const server = createSkillCreatorMcpServerFromDeps(deps);
      const result = await server.handleToolCall('skill.benchmark', {
        skillName: 'test-skill',
        chips: ['chip-a'],
      });

      expect(result.isError).toBe(true);
    });
  });
});

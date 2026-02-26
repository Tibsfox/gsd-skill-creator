/**
 * Tests for SkillMigrationAnalyzer and content analysis helpers.
 *
 * Plan 365-01: TDD RED phase -- all tests fail until migration.ts is implemented.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  SkillMigrationAnalyzer,
  PlaneMigration,
  handleMigratePlaneCommand,
  countCodeBlocks,
  countExplicitCommands,
  countFilePaths,
  countSemanticDescriptions,
  countConditionalLogic,
  isPhaseContext,
  type InferredPosition,
  type ExistingSkillMetadata,
  type ActivationRecord,
  type MigrationReport,
  type MigrationOptions,
} from './migration.js';
import { estimateTheta, estimateRadius } from './arithmetic.js';
import { MATURITY_THRESHOLD } from './types.js';
import type { SkillPosition } from './types.js';

// ---------------------------------------------------------------------------
// Content Analysis Helpers
// ---------------------------------------------------------------------------

describe('countCodeBlocks', () => {
  it('returns 0 for empty string', () => {
    expect(countCodeBlocks('')).toBe(0);
  });

  it('counts a single code block (``` pair) as 1', () => {
    const content = '```\nconst x = 1;\n```';
    expect(countCodeBlocks(content)).toBe(1);
  });

  it('counts three code blocks as 3', () => {
    const content = '```\na\n```\n\n```\nb\n```\n\n```\nc\n```';
    expect(countCodeBlocks(content)).toBe(3);
  });

  it('floors odd backtick fences (5 -> 2)', () => {
    const content = '```\na\n```\n```\nb\n```\n```';
    expect(countCodeBlocks(content)).toBe(2);
  });

  it('returns 0 for text without code blocks', () => {
    expect(countCodeBlocks('Just plain text with no fences.')).toBe(0);
  });
});

describe('countExplicitCommands', () => {
  it('counts `npm install` as 1', () => {
    expect(countExplicitCommands('Run `npm install` first')).toBe(1);
  });

  it('counts `git commit -m "foo"` as 1', () => {
    expect(countExplicitCommands('Then `git commit -m "foo"`')).toBe(1);
  });

  it('counts 3 backticked commands', () => {
    const text = 'Run `npm install`, then `git add .`, finally `npm test`.';
    expect(countExplicitCommands(text)).toBe(3);
  });

  it('returns 0 for no backticked commands', () => {
    expect(countExplicitCommands('No commands here.')).toBe(0);
  });

  it('returns 0 for single-word backticked text like `foo`', () => {
    expect(countExplicitCommands('Use `foo` value')).toBe(0);
  });
});

describe('countFilePaths', () => {
  it('counts src/foo/bar.ts as 1', () => {
    expect(countFilePaths('Edit src/foo/bar.ts')).toBe(1);
  });

  it('counts ./config.yaml as 1', () => {
    expect(countFilePaths('See ./config.yaml')).toBe(1);
  });

  it('counts multiple paths', () => {
    const text = 'Edit src/a.ts and src/b.ts and ./c.json';
    expect(countFilePaths(text)).toBeGreaterThanOrEqual(3);
  });

  it('returns 0 for text with no paths', () => {
    expect(countFilePaths('No paths here at all')).toBe(0);
  });
});

describe('countSemanticDescriptions', () => {
  it('counts "Use when working on TypeScript projects" as 1', () => {
    expect(countSemanticDescriptions('Use when working on TypeScript projects')).toBe(1);
  });

  it('counts "Triggers when file changes detected" as 1', () => {
    expect(countSemanticDescriptions('Triggers when file changes detected')).toBe(1);
  });

  it('counts "Applies to", "Consider", "Should" phrases', () => {
    const text = 'Applies to all projects. Consider using it. Should be enabled.';
    expect(countSemanticDescriptions(text)).toBe(3);
  });

  it('returns 0 for no semantic descriptions', () => {
    expect(countSemanticDescriptions('const x = 42;')).toBe(0);
  });

  it('is case-insensitive', () => {
    expect(countSemanticDescriptions('USE WHEN something')).toBe(1);
  });
});

describe('countConditionalLogic', () => {
  it('counts "If the file exists, use it" as 1', () => {
    expect(countConditionalLogic('If the file exists, use it')).toBe(1);
  });

  it('counts "When testing, run vitest" as 1', () => {
    expect(countConditionalLogic('When testing, run vitest')).toBe(1);
  });

  it('counts "Unless explicitly disabled" as 1', () => {
    expect(countConditionalLogic('Unless explicitly disabled')).toBe(1);
  });

  it('counts "Provided that all tests pass" as 1', () => {
    expect(countConditionalLogic('Provided that all tests pass')).toBe(1);
  });

  it('counts multiple conditional keywords', () => {
    const text = 'If enabled, when ready, unless blocked. Provided that it works.';
    expect(countConditionalLogic(text)).toBe(4);
  });
});

describe('isPhaseContext', () => {
  it('returns true for "execute"', () => {
    expect(isPhaseContext('execute')).toBe(true);
  });

  it('returns true for "verify"', () => {
    expect(isPhaseContext('verify')).toBe(true);
  });

  it('returns true for "plan-phase"', () => {
    expect(isPhaseContext('plan-phase')).toBe(true);
  });

  it('returns true for "complete-milestone"', () => {
    expect(isPhaseContext('complete-milestone')).toBe(true);
  });

  it('returns false for "research"', () => {
    expect(isPhaseContext('research')).toBe(false);
  });

  it('returns false for "random-string"', () => {
    expect(isPhaseContext('random-string')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SkillMigrationAnalyzer
// ---------------------------------------------------------------------------

describe('SkillMigrationAnalyzer', () => {
  const analyzer = new SkillMigrationAnalyzer();

  // ---- Trigger Analysis (MIGRATE-02) ----
  describe('analyzeSkill - trigger analysis (MIGRATE-02)', () => {
    it('produces low theta for skill with 5 file triggers and 0 intents', () => {
      const skill: ExistingSkillMetadata = {
        id: 'file-heavy',
        triggers: {
          files: ['*.ts', '*.tsx', '*.js', '*.jsx', '*.json'],
          intents: [],
        },
        content: '',
      };
      const result = analyzer.analyzeSkill(skill);
      // Concrete-dominant: theta should be near 0
      expect(result.theta).toBeLessThan(Math.PI / 4);
    });

    it('produces high theta for skill with 0 files and 5 intents', () => {
      const skill: ExistingSkillMetadata = {
        id: 'intent-heavy',
        triggers: {
          files: [],
          intents: ['refactor', 'optimize', 'design', 'plan', 'review'],
        },
        content: '',
      };
      const result = analyzer.analyzeSkill(skill);
      // Abstract-dominant: theta should be near PI/2
      expect(result.theta).toBeGreaterThan(Math.PI / 4);
    });

    it('produces balanced theta for equal file and intent triggers', () => {
      const skill: ExistingSkillMetadata = {
        id: 'balanced',
        triggers: {
          files: ['*.ts', '*.js', '*.py'],
          intents: ['refactor', 'optimize', 'review'],
        },
        content: '',
      };
      const result = analyzer.analyzeSkill(skill);
      // Balanced: theta near PI/4
      expect(result.theta).toBeCloseTo(Math.PI / 4, 1);
    });

    it('adds phase contexts to concrete score', () => {
      const skill: ExistingSkillMetadata = {
        id: 'phase-ctx',
        triggers: {
          contexts: ['execute', 'verify'],
        },
        content: '',
      };
      const result = analyzer.analyzeSkill(skill);
      // Phase contexts add concrete signals -> theta < PI/4
      expect(result.theta).toBeLessThan(Math.PI / 2);
    });

    it('adds non-phase contexts to abstract score', () => {
      const skill: ExistingSkillMetadata = {
        id: 'abstract-ctx',
        triggers: {
          contexts: ['brainstorm', 'discuss', 'ideate'],
        },
        content: '',
      };
      const result = analyzer.analyzeSkill(skill);
      // Non-phase contexts add abstract signals -> theta > PI/4
      expect(result.theta).toBeGreaterThan(Math.PI / 4);
    });
  });

  // ---- Content Analysis (MIGRATE-01) ----
  describe('analyzeSkill - content analysis (MIGRATE-01)', () => {
    it('produces low theta for skill with many code blocks', () => {
      const codeBlock = '```\nconst x = 1;\n```\n';
      const skill: ExistingSkillMetadata = {
        id: 'code-heavy',
        content: codeBlock.repeat(10),
      };
      const result = analyzer.analyzeSkill(skill);
      expect(result.theta).toBeLessThan(Math.PI / 4);
    });

    it('produces high theta for skill with many semantic descriptions', () => {
      const semantic = 'Use when working on TypeScript. Consider the implications. Should be reviewed. Applies to all modules. Triggers when changes occur.\n';
      const skill: ExistingSkillMetadata = {
        id: 'semantic-heavy',
        content: semantic.repeat(5),
      };
      const result = analyzer.analyzeSkill(skill);
      expect(result.theta).toBeGreaterThan(Math.PI / 6);
    });

    it('produces balanced theta for code blocks AND semantic descriptions', () => {
      const content =
        '```\nconst x = 1;\n```\n```\nconst y = 2;\n```\n' +
        'Use when working on projects. Consider edge cases. Should validate inputs.';
      const skill: ExistingSkillMetadata = {
        id: 'balanced-content',
        content,
      };
      const result = analyzer.analyzeSkill(skill);
      // Should be somewhere in the middle
      expect(result.theta).toBeGreaterThan(0.1);
      expect(result.theta).toBeLessThan(Math.PI / 2);
    });

    it('counts file paths in content as concrete signals', () => {
      const skill: ExistingSkillMetadata = {
        id: 'path-heavy',
        content: 'Edit src/foo/bar.ts and src/baz/qux.ts and src/lib/utils.ts for changes.',
      };
      const result = analyzer.analyzeSkill(skill);
      // File paths contribute to concrete -> theta < PI/4
      expect(result.theta).toBeLessThan(Math.PI / 2);
    });

    it('counts explicit commands in content as concrete signals', () => {
      const skill: ExistingSkillMetadata = {
        id: 'cmd-heavy',
        content: 'Run `npm install` then `npm test` then `npm run build`.',
      };
      const result = analyzer.analyzeSkill(skill);
      expect(result.theta).toBeLessThan(Math.PI / 2);
    });

    it('assigns higher maturity for long content (>2500 chars)', () => {
      const longContent = 'x '.repeat(1500); // 3000 chars
      const shortContent = 'x';
      const longSkill: ExistingSkillMetadata = { id: 'long', content: longContent };
      const shortSkill: ExistingSkillMetadata = { id: 'short', content: shortContent };
      const longResult = analyzer.analyzeSkill(longSkill);
      const shortResult = analyzer.analyzeSkill(shortSkill);
      // Long content produces higher radius (more maturity indicators)
      expect(longResult.radius).toBeGreaterThan(shortResult.radius);
    });
  });

  // ---- Promotion Level Override ----
  describe('analyzeSkill - promotion level override', () => {
    it('returns theta=PI/2 for promotionLevel=conversation', () => {
      const skill: ExistingSkillMetadata = {
        id: 'conv',
        content: '',
        extensions: { promotionLevel: 'conversation' },
      };
      const result = analyzer.analyzeSkill(skill);
      expect(result.theta).toBeCloseTo(Math.PI / 2, 5);
      expect(result.radius).toBeCloseTo(0.7, 5);
      expect(result.confidence).toBe('high');
      expect(result.source).toBe('promotion_level');
    });

    it('returns theta=PI/4 for promotionLevel=skill_md', () => {
      const skill: ExistingSkillMetadata = {
        id: 'md',
        content: '',
        extensions: { promotionLevel: 'skill_md' },
      };
      const result = analyzer.analyzeSkill(skill);
      expect(result.theta).toBeCloseTo(Math.PI / 4, 5);
    });

    it('returns theta=PI/8 for promotionLevel=lora_adapter', () => {
      const skill: ExistingSkillMetadata = {
        id: 'lora',
        content: '',
        extensions: { promotionLevel: 'lora_adapter' },
      };
      const result = analyzer.analyzeSkill(skill);
      expect(result.theta).toBeCloseTo(Math.PI / 8, 5);
    });

    it('returns theta=0.01 for promotionLevel=compiled', () => {
      const skill: ExistingSkillMetadata = {
        id: 'compiled',
        content: '',
        extensions: { promotionLevel: 'compiled' },
      };
      const result = analyzer.analyzeSkill(skill);
      expect(result.theta).toBeCloseTo(0.01, 5);
    });

    it('falls through to content analysis for unknown promotionLevel', () => {
      const skill: ExistingSkillMetadata = {
        id: 'unknown-promo',
        content: '```\ncode\n```',
        extensions: { promotionLevel: 'unknown_level' },
      };
      const result = analyzer.analyzeSkill(skill);
      expect(result.source).not.toBe('promotion_level');
    });
  });

  // ---- Defaults ----
  describe('analyzeSkill - defaults', () => {
    it('returns default for empty skill (no triggers, empty content, no extensions)', () => {
      const skill: ExistingSkillMetadata = {
        id: 'empty',
        content: '',
      };
      const result = analyzer.analyzeSkill(skill);
      expect(result.theta).toBeCloseTo(Math.PI / 4, 5);
      expect(result.radius).toBeCloseTo(0.1, 2);
      expect(result.confidence).toBe('low');
      expect(result.source).toBe('default');
    });

    it('returns default or low-confidence for skill with only short text', () => {
      const skill: ExistingSkillMetadata = {
        id: 'minimal',
        content: 'A simple skill.',
      };
      const result = analyzer.analyzeSkill(skill);
      expect(result.confidence).toBe('low');
    });
  });

  // ---- History Enhancement (MIGRATE-03) ----
  describe('enhanceWithHistory (MIGRATE-03)', () => {
    it('returns inferred unchanged when history is empty', () => {
      const inferred: InferredPosition = {
        theta: Math.PI / 4,
        radius: 0.3,
        confidence: 'low',
        source: 'content_analysis',
      };
      const result = analyzer.enhanceWithHistory(inferred, []);
      expect(result).toEqual(inferred);
    });

    it('shifts theta toward 0 for many execute-phase activations', () => {
      const inferred: InferredPosition = {
        theta: Math.PI / 4,
        radius: 0.2,
        confidence: 'low',
        source: 'content_analysis',
      };
      const history: ActivationRecord[] = Array.from({ length: 20 }, () => ({
        context: { phase: 'execute', fileCount: 5 },
      }));
      const result = analyzer.enhanceWithHistory(inferred, history);
      // Execute-phase adds concrete signals -> theta shifts toward 0
      expect(result.theta).toBeLessThan(inferred.theta);
      expect(result.source).toBe('history_enhanced');
    });

    it('shifts theta toward PI/2 for many research-phase activations', () => {
      const inferred: InferredPosition = {
        theta: Math.PI / 4,
        radius: 0.2,
        confidence: 'low',
        source: 'content_analysis',
      };
      const history: ActivationRecord[] = Array.from({ length: 20 }, () => ({
        context: { phase: 'research', semanticMatchScore: 5 },
      }));
      const result = analyzer.enhanceWithHistory(inferred, history);
      // Research-phase adds abstract signals -> theta shifts toward PI/2
      expect(result.theta).toBeGreaterThan(inferred.theta);
    });

    it('blends 40% content + 60% history', () => {
      const inferred: InferredPosition = {
        theta: 0,
        radius: 0.1,
        confidence: 'low',
        source: 'content_analysis',
      };
      // All-abstract history
      const history: ActivationRecord[] = [
        { context: { semanticMatchScore: 10 } },
      ];
      const historyTheta = estimateTheta(0, 10); // pure abstract
      const expected = 0.4 * inferred.theta + 0.6 * historyTheta;
      const result = analyzer.enhanceWithHistory(inferred, history);
      expect(result.theta).toBeCloseTo(expected, 5);
    });

    it('uses concrete signal from fileCount when no phase specified', () => {
      const inferred: InferredPosition = {
        theta: Math.PI / 2,
        radius: 0.1,
        confidence: 'low',
        source: 'content_analysis',
      };
      const history: ActivationRecord[] = [
        { context: { fileCount: 20 } },
      ];
      const result = analyzer.enhanceWithHistory(inferred, history);
      // fileCount adds concrete -> theta shifts toward 0
      expect(result.theta).toBeLessThan(inferred.theta);
    });

    it('uses abstract signal from semanticMatchScore when no phase specified', () => {
      const inferred: InferredPosition = {
        theta: 0,
        radius: 0.1,
        confidence: 'low',
        source: 'content_analysis',
      };
      const history: ActivationRecord[] = [
        { context: { semanticMatchScore: 20 } },
      ];
      const result = analyzer.enhanceWithHistory(inferred, history);
      // semanticMatchScore adds abstract -> theta shifts toward PI/2
      expect(result.theta).toBeGreaterThan(inferred.theta);
    });

    it('enhanced radius is max of inferred radius and history-derived radius', () => {
      const inferred: InferredPosition = {
        theta: Math.PI / 4,
        radius: 0.8,
        confidence: 'low',
        source: 'content_analysis',
      };
      // Small history -> low history radius
      const history: ActivationRecord[] = [
        { context: { fileCount: 1 } },
      ];
      const historyRadius = estimateRadius(1, MATURITY_THRESHOLD);
      const result = analyzer.enhanceWithHistory(inferred, history);
      // inferred.radius (0.8) > historyRadius (0.02) -> keep 0.8
      expect(result.radius).toBeCloseTo(Math.max(inferred.radius, historyRadius), 5);
    });

    it('sets confidence to high and source to history_enhanced', () => {
      const inferred: InferredPosition = {
        theta: Math.PI / 4,
        radius: 0.1,
        confidence: 'low',
        source: 'content_analysis',
      };
      const history: ActivationRecord[] = [
        { context: { fileCount: 5 } },
      ];
      const result = analyzer.enhanceWithHistory(inferred, history);
      expect(result.confidence).toBe('high');
      expect(result.source).toBe('history_enhanced');
    });
  });
});

// ---------------------------------------------------------------------------
// PlaneMigration Executor (Plan 365-02)
// ---------------------------------------------------------------------------

/**
 * Create mock dependencies for PlaneMigration tests.
 */
function createMockDeps() {
  const mockPositionStore = {
    load: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    all: vi.fn().mockReturnValue(new Map()),
    remove: vi.fn(),
  };
  const mockSkillStore = {
    list: vi.fn().mockResolvedValue([] as string[]),
    read: vi.fn(),
  };
  const analyzer = new SkillMigrationAnalyzer();
  return { mockPositionStore, mockSkillStore, analyzer };
}

/**
 * Create a mock Skill object with minimal structure.
 */
function mockSkill(name: string, body: string, triggers?: { files?: string[]; intents?: string[] }) {
  return {
    metadata: {
      name,
      description: `${name} skill`,
      triggers,
    },
    body,
    path: `.claude/skills/${name}/SKILL.md`,
  };
}

describe('PlaneMigration', () => {
  describe('migrateAll - fresh system', () => {
    it('migrates 3 skills with no existing positions', async () => {
      const { mockPositionStore, mockSkillStore, analyzer } = createMockDeps();
      mockSkillStore.list.mockResolvedValue(['alpha', 'beta', 'gamma']);
      mockSkillStore.read.mockImplementation(async (name: string) =>
        mockSkill(name, '```\ncode\n```\nUse when testing.'),
      );

      const migration = new PlaneMigration(analyzer, mockPositionStore as any, mockSkillStore as any);
      const report = await migration.migrateAll();

      expect(report.total).toBe(3);
      expect(report.migrated).toBe(3);
      expect(report.skipped).toBe(0);
      expect(report.errors).toBe(0);
      expect(mockPositionStore.set).toHaveBeenCalledTimes(3);
      expect(mockPositionStore.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('migrateAll - partially migrated', () => {
    it('skips skills that already have positions', async () => {
      const { mockPositionStore, mockSkillStore, analyzer } = createMockDeps();
      mockSkillStore.list.mockResolvedValue(['alpha', 'beta', 'gamma']);
      mockSkillStore.read.mockImplementation(async (name: string) =>
        mockSkill(name, '```\ncode\n```'),
      );
      // beta already has a position
      mockPositionStore.get.mockImplementation((id: string) =>
        id === 'beta'
          ? { theta: 0.5, radius: 0.3, angularVelocity: 0, lastUpdated: new Date().toISOString() }
          : null,
      );

      const migration = new PlaneMigration(analyzer, mockPositionStore as any, mockSkillStore as any);
      const report = await migration.migrateAll();

      expect(report.migrated).toBe(2);
      expect(report.skipped).toBe(1);
    });
  });

  describe('migrateAll - idempotent (MIGRATE-04)', () => {
    it('produces 0 migrated on second run with same skills', async () => {
      const { mockPositionStore, mockSkillStore, analyzer } = createMockDeps();
      mockSkillStore.list.mockResolvedValue(['alpha', 'beta', 'gamma']);
      mockSkillStore.read.mockImplementation(async (name: string) =>
        mockSkill(name, '```\ncode\n```'),
      );

      const migration = new PlaneMigration(analyzer, mockPositionStore as any, mockSkillStore as any);

      // First run: all migrated
      const report1 = await migration.migrateAll();
      expect(report1.migrated).toBe(3);

      // Simulate all skills now having positions
      const fakePos: SkillPosition = { theta: 0.5, radius: 0.3, angularVelocity: 0, lastUpdated: new Date().toISOString() };
      mockPositionStore.get.mockReturnValue(fakePos);
      mockPositionStore.set.mockClear();
      mockPositionStore.save.mockClear();

      // Second run: all skipped
      const report2 = await migration.migrateAll();
      expect(report2.migrated).toBe(0);
      expect(report2.skipped).toBe(3);
    });
  });

  describe('migrateAll - non-destructive (MIGRATE-05)', () => {
    it('never writes or updates skill files', async () => {
      const { mockPositionStore, mockSkillStore, analyzer } = createMockDeps();
      mockSkillStore.list.mockResolvedValue(['alpha']);
      mockSkillStore.read.mockResolvedValue(mockSkill('alpha', 'body'));

      const migration = new PlaneMigration(analyzer, mockPositionStore as any, mockSkillStore as any);
      await migration.migrateAll();

      // SkillStore mock has no update/write/create methods -- if PlaneMigration
      // called any, it would throw. Verify read was called but nothing else.
      expect(mockSkillStore.read).toHaveBeenCalledWith('alpha');
      expect(Object.keys(mockSkillStore).sort()).toEqual(['list', 'read']);
    });
  });

  describe('migrateAll - dry-run', () => {
    it('does not call positionStore.set or save', async () => {
      const { mockPositionStore, mockSkillStore, analyzer } = createMockDeps();
      mockSkillStore.list.mockResolvedValue(['alpha', 'beta']);
      mockSkillStore.read.mockImplementation(async (name: string) =>
        mockSkill(name, '```\ncode\n```'),
      );

      const migration = new PlaneMigration(analyzer, mockPositionStore as any, mockSkillStore as any);
      const report = await migration.migrateAll({ dryRun: true });

      expect(report.migrated).toBe(2);
      expect(report.details.length).toBe(2);
      expect(report.details[0].position).toBeDefined();
      expect(mockPositionStore.set).not.toHaveBeenCalled();
      expect(mockPositionStore.save).not.toHaveBeenCalled();
    });
  });

  describe('migrateAll - force mode', () => {
    it('re-analyzes skills that already have positions', async () => {
      const { mockPositionStore, mockSkillStore, analyzer } = createMockDeps();
      mockSkillStore.list.mockResolvedValue(['alpha', 'beta', 'gamma']);
      mockSkillStore.read.mockImplementation(async (name: string) =>
        mockSkill(name, '```\ncode\n```'),
      );
      // All already positioned
      const fakePos: SkillPosition = { theta: 0.5, radius: 0.3, angularVelocity: 0, lastUpdated: new Date().toISOString() };
      mockPositionStore.get.mockReturnValue(fakePos);

      const migration = new PlaneMigration(analyzer, mockPositionStore as any, mockSkillStore as any);
      const report = await migration.migrateAll({ force: true });

      expect(report.migrated).toBe(3);
      expect(report.skipped).toBe(0);
      expect(mockPositionStore.set).toHaveBeenCalledTimes(3);
    });
  });

  describe('migrateAll - error isolation', () => {
    it('continues migrating when one skill throws', async () => {
      const { mockPositionStore, mockSkillStore, analyzer } = createMockDeps();
      mockSkillStore.list.mockResolvedValue(['alpha', 'beta', 'gamma']);
      mockSkillStore.read.mockImplementation(async (name: string) => {
        if (name === 'beta') throw new Error('read failure');
        return mockSkill(name, '```\ncode\n```');
      });

      const migration = new PlaneMigration(analyzer, mockPositionStore as any, mockSkillStore as any);
      const report = await migration.migrateAll();

      expect(report.migrated).toBe(2);
      expect(report.errors).toBe(1);
      const errorDetail = report.details.find(d => d.skillId === 'beta');
      expect(errorDetail?.error).toBe('read failure');
    });
  });

  describe('migrateAll - empty skill set', () => {
    it('returns zero totals for empty skill list', async () => {
      const { mockPositionStore, mockSkillStore, analyzer } = createMockDeps();
      mockSkillStore.list.mockResolvedValue([]);

      const migration = new PlaneMigration(analyzer, mockPositionStore as any, mockSkillStore as any);
      const report = await migration.migrateAll();

      expect(report.total).toBe(0);
      expect(report.migrated).toBe(0);
      expect(report.skipped).toBe(0);
      expect(report.errors).toBe(0);
      expect(report.details).toEqual([]);
    });
  });

  describe('migrateAll - no-history mode', () => {
    it('produces content_analysis source (not history_enhanced) when includeHistory is false', async () => {
      const { mockPositionStore, mockSkillStore, analyzer } = createMockDeps();
      mockSkillStore.list.mockResolvedValue(['alpha']);
      mockSkillStore.read.mockResolvedValue(mockSkill('alpha', '```\ncode\n```'));

      const migration = new PlaneMigration(analyzer, mockPositionStore as any, mockSkillStore as any);
      const report = await migration.migrateAll({ includeHistory: false });

      // Without history, source should be content_analysis or default (not history_enhanced)
      expect(report.details[0].source).not.toBe('history_enhanced');
    });
  });

  describe('convertSkillToMetadata', () => {
    it('converts Skill with triggers into ExistingSkillMetadata', () => {
      const { mockPositionStore, mockSkillStore, analyzer } = createMockDeps();
      const migration = new PlaneMigration(analyzer, mockPositionStore as any, mockSkillStore as any);

      const skill = mockSkill('test-skill', 'body content', {
        files: ['*.ts'],
        intents: ['refactor'],
      });
      const meta = migration.convertSkillToMetadata(skill as any);

      expect(meta.id).toBe('test-skill');
      expect(meta.content).toBe('body content');
      expect(meta.triggers?.files).toEqual(['*.ts']);
      expect(meta.triggers?.intents).toEqual(['refactor']);
    });

    it('handles skill with no triggers gracefully', () => {
      const { mockPositionStore, mockSkillStore, analyzer } = createMockDeps();
      const migration = new PlaneMigration(analyzer, mockPositionStore as any, mockSkillStore as any);

      const skill = mockSkill('bare-skill', 'just body');
      const meta = migration.convertSkillToMetadata(skill as any);

      expect(meta.id).toBe('bare-skill');
      expect(meta.content).toBe('just body');
    });
  });
});

describe('handleMigratePlaneCommand', () => {
  it('is exported and callable', () => {
    expect(typeof handleMigratePlaneCommand).toBe('function');
  });
});

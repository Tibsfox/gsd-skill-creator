import { describe, it, expect } from 'vitest';
import { PipelineSchema } from '../schema.js';
import type { SessionObservation } from '../../../types/observation.js';
import type { SkillCandidate, PatternEvidence } from '../../../types/detection.js';
import type { Pipeline, MoveInstruction, WaitInstruction } from '../types.js';
import { LearningCompiler } from './compiler.js';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Factory for creating minimal valid SessionObservation objects.
 * Override any field via the partial parameter.
 */
function makeSession(overrides: Partial<SessionObservation> = {}): SessionObservation {
  const now = Date.now();
  return {
    sessionId: `session-${Math.random().toString(36).slice(2, 8)}`,
    startTime: now - 3600_000,
    endTime: now,
    durationMinutes: 60,
    source: 'startup',
    reason: 'other',
    metrics: {
      userMessages: 10,
      assistantMessages: 12,
      toolCalls: 20,
      uniqueFilesRead: 5,
      uniqueFilesWritten: 3,
      uniqueCommandsRun: 4,
    },
    topCommands: [],
    topFiles: [],
    topTools: [],
    activeSkills: [],
    ...overrides,
  };
}

/**
 * Create a SkillCandidate for testing pre-analyzed candidate enrichment.
 */
function makeCandidate(overrides: Partial<SkillCandidate> = {}): SkillCandidate {
  const now = Date.now();
  const evidence: PatternEvidence = {
    firstSeen: now - 86400_000 * 7,
    lastSeen: now,
    sessionIds: ['s1', 's2', 's3'],
    coOccurringFiles: ['src/index.ts'],
    coOccurringTools: ['Read', 'Write'],
  };
  return {
    id: 'cmd-test-pattern',
    type: 'command',
    pattern: 'npx vitest',
    occurrences: 5,
    confidence: 0.8,
    suggestedName: 'vitest-runner',
    suggestedDescription: 'Runs vitest tests',
    evidence,
    ...overrides,
  };
}

// ============================================================================
// LearningCompiler Tests
// ============================================================================

describe('LearningCompiler', () => {
  // --------------------------------------------------------------------------
  // 1. Empty input
  // --------------------------------------------------------------------------
  it('compile() returns empty result for empty input', () => {
    const compiler = new LearningCompiler();
    const result = compiler.compile({ sessions: [] });

    expect(result.lists.length).toBe(0);
    expect(result.patterns.length).toBe(0);
    expect(result.sessionsAnalyzed).toBe(0);
  });

  // --------------------------------------------------------------------------
  // 2. Filters patterns below minOccurrences
  // --------------------------------------------------------------------------
  it('compile() filters patterns below minOccurrences', () => {
    const compiler = new LearningCompiler();
    // Only 2 sessions with the same pattern -- below default threshold of 3
    const sessions = [
      makeSession({ topTools: ['Glob', 'Read', 'Write'], topCommands: ['npx vitest'] }),
      makeSession({ topTools: ['Glob', 'Read', 'Write'], topCommands: ['npx vitest'] }),
    ];

    const result = compiler.compile({ sessions });

    expect(result.lists.length).toBe(0);
    expect(result.filteredCount).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // 3. Detects recurring tool patterns above threshold
  // --------------------------------------------------------------------------
  it('compile() detects recurring tool patterns above threshold', () => {
    const compiler = new LearningCompiler();
    const sessions = Array.from({ length: 4 }, () =>
      makeSession({
        topTools: ['Glob', 'Read', 'Write'],
        topCommands: ['npx vitest'],
        activeSkills: ['git-commit'],
      }),
    );

    const result = compiler.compile({ sessions });

    expect(result.lists.length).toBeGreaterThanOrEqual(1);
    expect(result.patterns.length).toBeGreaterThanOrEqual(1);
    expect(result.patterns[0].occurrences).toBeGreaterThanOrEqual(3);
  });

  // --------------------------------------------------------------------------
  // 4. Compiled Pipeline contains MOVE instructions for detected skills
  // --------------------------------------------------------------------------
  it('compiled Pipeline contains MOVE instructions for detected skills', () => {
    const compiler = new LearningCompiler();
    const sessions = Array.from({ length: 4 }, () =>
      makeSession({
        topTools: ['Glob', 'Read', 'Write'],
        topCommands: ['npx vitest'],
        activeSkills: ['git-commit', 'lint-fix'],
      }),
    );

    const result = compiler.compile({ sessions });

    expect(result.lists.length).toBeGreaterThanOrEqual(1);
    const list = result.lists[0];
    const moveInstructions = list.instructions.filter(
      (i): i is MoveInstruction => i.type === 'move',
    );

    const moveNames = moveInstructions.map((m) => m.name);
    expect(moveNames).toContain('git-commit');
    expect(moveNames).toContain('lint-fix');
    // MOVE instructions for active skills should target 'skill'
    for (const move of moveInstructions) {
      expect(move.target).toBe('skill');
    }
  });

  // --------------------------------------------------------------------------
  // 5. Compiled Pipeline contains WAIT instructions for inferred lifecycle events
  // --------------------------------------------------------------------------
  it('compiled Pipeline contains WAIT instructions for inferred lifecycle events', () => {
    const compiler = new LearningCompiler();
    const sessions = Array.from({ length: 4 }, () =>
      makeSession({
        topTools: ['Glob', 'Read', 'Write'],
        topCommands: ['npx vitest run'],
        activeSkills: ['git-commit'],
      }),
    );

    const result = compiler.compile({ sessions });

    expect(result.lists.length).toBeGreaterThanOrEqual(1);
    const list = result.lists[0];
    const waitInstructions = list.instructions.filter(
      (i): i is WaitInstruction => i.type === 'wait',
    );

    // Should have at least one WAIT instruction with a lifecycle event
    expect(waitInstructions.length).toBeGreaterThanOrEqual(1);
    const events = waitInstructions.map((w) => w.event);
    // vitest-related commands should infer 'tests-passing'
    expect(events).toContain('tests-passing');
  });

  // --------------------------------------------------------------------------
  // 6. Confidence score reflects frequency and recency
  // --------------------------------------------------------------------------
  it('confidence score reflects frequency and recency', () => {
    const compiler = new LearningCompiler();
    const now = Date.now();

    // Recent sessions (within last 7 days)
    const recentSessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({
        topTools: ['Task', 'Glob'],
        topCommands: ['npx vitest'],
        activeSkills: ['git-commit'],
        startTime: now - (i + 1) * 86400_000, // 1-5 days ago
        endTime: now - i * 86400_000,
      }),
    );

    // Old sessions (30+ days ago) with different tools
    const oldSessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({
        topTools: ['Task', 'Grep'],
        topCommands: ['npx tsc'],
        activeSkills: ['lint-fix'],
        startTime: now - (31 + i) * 86400_000,
        endTime: now - (30 + i) * 86400_000,
      }),
    );

    const result = compiler.compile({ sessions: [...recentSessions, ...oldSessions] });

    // Should find at least two patterns
    expect(result.patterns.length).toBeGreaterThanOrEqual(2);

    // Find the recent and old patterns
    const recentPattern = result.patterns.find((p) => p.tools.includes('Glob'));
    const oldPattern = result.patterns.find((p) => p.tools.includes('Grep'));

    expect(recentPattern).toBeDefined();
    expect(oldPattern).toBeDefined();
    expect(recentPattern!.confidence).toBeGreaterThan(oldPattern!.confidence);
  });

  // --------------------------------------------------------------------------
  // 7. Compiled Pipeline validates against PipelineSchema
  // --------------------------------------------------------------------------
  it('compiled Pipeline validates against PipelineSchema', () => {
    const compiler = new LearningCompiler();
    const sessions = Array.from({ length: 4 }, () =>
      makeSession({
        topTools: ['Glob', 'Read', 'Write'],
        topCommands: ['npx vitest'],
        activeSkills: ['git-commit'],
      }),
    );

    const result = compiler.compile({ sessions });

    expect(result.lists.length).toBeGreaterThanOrEqual(1);
    for (const list of result.lists) {
      const validation = PipelineSchema.safeParse(list);
      expect(validation.success).toBe(true);
    }
  });

  // --------------------------------------------------------------------------
  // 8. compile() respects maxPatterns config
  // --------------------------------------------------------------------------
  it('compile() respects maxPatterns config', () => {
    const compiler = new LearningCompiler({ maxPatterns: 5 });

    // Create 25 distinct tool patterns, each occurring 4+ times
    const sessions: SessionObservation[] = [];
    for (let p = 0; p < 25; p++) {
      const uniqueTool = `CustomTool${p}`;
      for (let i = 0; i < 4; i++) {
        sessions.push(
          makeSession({
            topTools: [uniqueTool],
            topCommands: [`custom-cmd-${p}`],
            activeSkills: ['some-skill'],
          }),
        );
      }
    }

    const result = compiler.compile({ sessions });

    expect(result.lists.length).toBeLessThanOrEqual(5);
  });

  // --------------------------------------------------------------------------
  // 9. compile() respects minConfidence config
  // --------------------------------------------------------------------------
  it('compile() respects minConfidence config', () => {
    const compiler = new LearningCompiler({ minConfidence: 0.9 });
    // 3 occurrences -- moderate frequency, should produce low confidence
    const sessions = Array.from({ length: 3 }, () =>
      makeSession({
        topTools: ['Glob', 'Read', 'Write'],
        topCommands: ['npx vitest'],
        activeSkills: ['git-commit'],
      }),
    );

    const result = compiler.compile({ sessions });

    // With very high minConfidence, most/all patterns should be filtered
    expect(result.lists.length).toBe(0);
    expect(result.filteredCount).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // 10. compile() generates meaningful workflowType from tool/command patterns
  // --------------------------------------------------------------------------
  it('compile() generates meaningful workflowType from tool/command patterns', () => {
    const compiler = new LearningCompiler();
    const sessions = Array.from({ length: 4 }, () =>
      makeSession({
        topCommands: ['npx vitest', 'npx tsc'],
        topTools: ['Read', 'Write'],
        activeSkills: ['git-commit'],
      }),
    );

    const result = compiler.compile({ sessions });

    expect(result.patterns.length).toBeGreaterThanOrEqual(1);
    const pattern = result.patterns[0];
    // workflowType should be a slugified string containing recognizable command names
    expect(pattern.workflowType).toMatch(/vitest|tsc/);
  });

  // --------------------------------------------------------------------------
  // 11. compile() with pre-analyzed candidates uses them for enrichment
  // --------------------------------------------------------------------------
  it('compile() with pre-analyzed candidates uses them for enrichment', () => {
    const compiler = new LearningCompiler();
    const sessions = Array.from({ length: 4 }, () =>
      makeSession({
        topTools: ['Glob', 'Read', 'Write'],
        topCommands: ['npx vitest'],
        activeSkills: ['git-commit'],
      }),
    );

    const candidates = [
      makeCandidate({ suggestedName: 'vitest-runner' }),
    ];

    const result = compiler.compile({ sessions, candidates });

    expect(result.lists.length).toBeGreaterThanOrEqual(1);
    const list = result.lists[0];
    const moveInstructions = list.instructions.filter(
      (i): i is MoveInstruction => i.type === 'move',
    );

    // Candidate skill should appear as a MOVE instruction
    const moveNames = moveInstructions.map((m) => m.name);
    expect(moveNames).toContain('vitest-runner');
  });

  // --------------------------------------------------------------------------
  // 12. Compiled list metadata includes sourcePatterns and confidence
  // --------------------------------------------------------------------------
  it('compiled list metadata includes sourcePatterns and confidence', () => {
    const compiler = new LearningCompiler();
    const sessions = Array.from({ length: 4 }, () =>
      makeSession({
        topTools: ['Glob', 'Read', 'Write'],
        topCommands: ['npx vitest'],
        activeSkills: ['git-commit'],
      }),
    );

    const result = compiler.compile({ sessions });

    expect(result.lists.length).toBeGreaterThanOrEqual(1);
    const list = result.lists[0];

    expect(list.metadata.sourcePatterns).toBeDefined();
    expect(list.metadata.sourcePatterns!.length).toBeGreaterThan(0);
    expect(list.metadata.confidence).toBeDefined();
    expect(typeof list.metadata.confidence).toBe('number');
    expect(list.metadata.version).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 13. compile() handles sessions with empty topCommands/topTools/activeSkills
  // --------------------------------------------------------------------------
  it('compile() handles sessions with empty topCommands/topTools/activeSkills', () => {
    const compiler = new LearningCompiler();
    const sessions = Array.from({ length: 5 }, () =>
      makeSession({
        topCommands: [],
        topTools: [],
        activeSkills: [],
        topFiles: [],
      }),
    );

    const result = compiler.compile({ sessions });

    // Should not crash, should return empty or minimal result
    expect(result.sessionsAnalyzed).toBe(5);
    // Empty sessions produce no meaningful fingerprint, so no patterns
    expect(result.lists.length).toBe(0);
  });
});

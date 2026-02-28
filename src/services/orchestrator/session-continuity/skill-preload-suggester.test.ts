/**
 * Tests for the SkillPreloadSuggester class.
 *
 * Covers:
 * - Baseline: active_skills from snapshot included in suggestions
 * - Extension matching: .ts -> typescript, .test.ts -> testing+typescript
 * - Path pattern matching: .planning/ -> gsd-planning, .claude/ -> claude-code-skills
 * - Deduplication across multiple files
 * - Edge cases: empty files_modified, empty snapshot
 */

import { describe, it, expect } from 'vitest';
import { SkillPreloadSuggester } from './skill-preload-suggester.js';
import type { SessionSnapshot } from './types.js';

// ============================================================================
// Fixtures
// ============================================================================

function makeSnapshot(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
  return {
    session_id: 'test-session',
    timestamp: Date.now(),
    saved_at: new Date().toISOString(),
    summary: 'Test snapshot',
    active_skills: [],
    files_modified: [],
    open_questions: [],
    metrics: {
      duration_minutes: 5,
      tool_calls: 10,
      files_read: 3,
      files_written: 2,
    },
    top_tools: [],
    top_commands: [],
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('SkillPreloadSuggester', () => {
  const suggester = new SkillPreloadSuggester();

  it('returns active_skills from snapshot as baseline', () => {
    const snapshot = makeSnapshot({
      active_skills: ['git-commit', 'beautiful-commits'],
    });
    const result = suggester.suggest(snapshot);
    expect(result).toContain('git-commit');
    expect(result).toContain('beautiful-commits');
  });

  it('suggests typescript for .ts files', () => {
    const snapshot = makeSnapshot({
      files_modified: ['src/auth.ts'],
    });
    const result = suggester.suggest(snapshot);
    expect(result).toContain('typescript');
  });

  it('suggests both testing and typescript for .test.ts files', () => {
    const snapshot = makeSnapshot({
      files_modified: ['src/auth.test.ts'],
    });
    const result = suggester.suggest(snapshot);
    expect(result).toContain('testing');
    expect(result).toContain('typescript');
  });

  it('suggests gsd-planning for .planning/ paths', () => {
    const snapshot = makeSnapshot({
      files_modified: ['.planning/phases/01-init/01-01-PLAN.md'],
    });
    const result = suggester.suggest(snapshot);
    expect(result).toContain('gsd-planning');
    expect(result).toContain('documentation'); // .md extension
  });

  it('suggests claude-code-skills for .claude/ paths', () => {
    const snapshot = makeSnapshot({
      files_modified: ['.claude/hooks/gsd-snapshot-session.js'],
    });
    const result = suggester.suggest(snapshot);
    expect(result).toContain('claude-code-skills');
    expect(result).toContain('javascript'); // .js extension
  });

  it('produces deduplicated union across multiple files', () => {
    const snapshot = makeSnapshot({
      active_skills: ['typescript'],
      files_modified: [
        'src/auth.ts',
        'src/auth.test.ts',
        'src/config.ts',
      ],
    });
    const result = suggester.suggest(snapshot);

    // typescript should appear only once despite multiple sources
    const tsCount = result.filter(s => s === 'typescript').length;
    expect(tsCount).toBe(1);

    // testing from .test.ts
    expect(result).toContain('testing');
  });

  it('returns only active_skills when files_modified is empty', () => {
    const snapshot = makeSnapshot({
      active_skills: ['git-commit'],
      files_modified: [],
    });
    const result = suggester.suggest(snapshot);
    expect(result).toEqual(['git-commit']);
  });

  it('returns empty array for empty snapshot (no active_skills, no files)', () => {
    const snapshot = makeSnapshot({
      active_skills: [],
      files_modified: [],
    });
    const result = suggester.suggest(snapshot);
    expect(result).toEqual([]);
  });
});

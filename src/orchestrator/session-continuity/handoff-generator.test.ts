/**
 * Tests for HandoffGenerator.
 *
 * Covers:
 * - SKILL.md generation with correct path and valid gray-matter frontmatter
 * - Body sections: session state, decisions, blockers, active skills, recent files, open questions
 * - Size caps: files (10), decisions (5), blockers (5), open questions (5)
 * - Body stays under 2000 characters
 * - Sensitive path filtering
 * - Null state handling
 * - Empty section omission
 * - Old handoff cleanup (>7 days)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import matter from 'gray-matter';
import { HandoffGenerator } from './handoff-generator.js';
import type { SessionSnapshot } from './types.js';

// ============================================================================
// Fixtures
// ============================================================================

function makeSnapshot(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
  return {
    session_id: 'sess-test-123',
    timestamp: Date.now(),
    saved_at: new Date().toISOString(),
    summary: 'Working on auth module',
    active_skills: ['typescript', 'git-commit'],
    files_modified: ['src/auth.ts', 'src/config.ts'],
    open_questions: ['How should we handle refresh?'],
    metrics: {
      duration_minutes: 30,
      tool_calls: 50,
      files_read: 10,
      files_written: 5,
    },
    top_tools: ['Write', 'Read'],
    top_commands: ['npm', 'vitest'],
    ...overrides,
  };
}

function makeState(overrides: Partial<{ decisions: string[]; blockers: string[] }> = {}) {
  return {
    decisions: ['Use Zod for validation', 'JWT for auth'],
    blockers: ['API key missing'],
    ...overrides,
  };
}

// ============================================================================
// Test suite
// ============================================================================

describe('HandoffGenerator', () => {
  let outputDir: string;
  let generator: HandoffGenerator;

  beforeEach(async () => {
    outputDir = join(tmpdir(), `handoff-test-${randomUUID()}`);
    await mkdir(outputDir, { recursive: true });
    generator = new HandoffGenerator();
  });

  afterEach(async () => {
    await rm(outputDir, { recursive: true, force: true });
  });

  // (a) generate() creates a SKILL.md file at the correct path
  it('creates a SKILL.md file at the correct path', async () => {
    const snapshot = makeSnapshot();
    const state = makeState();

    const result = await generator.generate(snapshot, state, outputDir);

    const dateStr = new Date().toISOString().split('T')[0];
    const expectedDir = `session-handoff-${dateStr}`;
    const expectedPath = join(outputDir, expectedDir, 'SKILL.md');

    expect(result.path).toBe(expectedPath);

    // Verify file actually exists on disk
    const content = await readFile(expectedPath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  // (b) generate() produces valid gray-matter frontmatter
  it('produces valid gray-matter frontmatter', async () => {
    const snapshot = makeSnapshot();
    const state = makeState();

    const result = await generator.generate(snapshot, state, outputDir);
    const parsed = matter(result.content);

    const dateStr = new Date().toISOString().split('T')[0];
    expect(parsed.data.name).toBe(`session-handoff-${dateStr}`);
    expect(parsed.data.description).toContain(dateStr);
    expect(parsed.data['disable-model-invocation']).toBe(true);
  });

  // (c) generate() includes session summary in body
  it('includes session summary in body', async () => {
    const snapshot = makeSnapshot({ summary: 'Working on auth module' });
    const state = makeState();

    const result = await generator.generate(snapshot, state, outputDir);
    const parsed = matter(result.content);

    expect(parsed.content).toContain('## Session State');
    expect(parsed.content).toContain('Working on auth module');
  });

  // (d) generate() includes decisions from state
  it('includes decisions from state', async () => {
    const snapshot = makeSnapshot();
    const state = makeState({ decisions: ['Use Zod for validation', 'JWT for auth'] });

    const result = await generator.generate(snapshot, state, outputDir);
    const parsed = matter(result.content);

    expect(parsed.content).toContain('## Decisions');
    expect(parsed.content).toContain('Use Zod for validation');
    expect(parsed.content).toContain('JWT for auth');
  });

  // (e) generate() includes blockers from state
  it('includes blockers from state', async () => {
    const snapshot = makeSnapshot();
    const state = makeState({ blockers: ['API key missing'] });

    const result = await generator.generate(snapshot, state, outputDir);
    const parsed = matter(result.content);

    expect(parsed.content).toContain('## Blockers');
    expect(parsed.content).toContain('API key missing');
  });

  // (f) generate() includes active skills
  it('includes active skills', async () => {
    const snapshot = makeSnapshot({ active_skills: ['typescript', 'git-commit'] });
    const state = makeState();

    const result = await generator.generate(snapshot, state, outputDir);
    const parsed = matter(result.content);

    expect(parsed.content).toContain('## Active Skills');
    expect(parsed.content).toContain('typescript');
    expect(parsed.content).toContain('git-commit');
  });

  // (g) generate() includes recent files (filtered for sensitivity)
  it('includes recent files filtered for sensitivity', async () => {
    const snapshot = makeSnapshot({
      files_modified: [
        'src/auth.ts',
        '.env',
        'src/config.ts',
        'src/index.ts',
        'src/utils.ts',
        'src/types.ts',
        'src/router.ts',
        'src/middleware.ts',
        'src/handler.ts',
        'src/service.ts',
      ],
    });
    const state = makeState();

    const result = await generator.generate(snapshot, state, outputDir);
    const parsed = matter(result.content);

    expect(parsed.content).toContain('## Recent Files');
    expect(parsed.content).toContain('src/auth.ts');
    expect(parsed.content).not.toContain('.env');
  });

  // (h) generate() caps file list at 10 entries
  it('caps file list at 10 entries', async () => {
    const files = Array.from({ length: 20 }, (_, i) => `src/file-${i}.ts`);
    const snapshot = makeSnapshot({ files_modified: files });
    const state = makeState();

    const result = await generator.generate(snapshot, state, outputDir);
    const parsed = matter(result.content);

    // Count "src/file-" occurrences in body
    const fileMatches = parsed.content.match(/src\/file-\d+\.ts/g) ?? [];
    expect(fileMatches.length).toBeLessThanOrEqual(10);
  });

  // (i) generate() caps decisions at 5
  it('caps decisions at 5', async () => {
    const decisions = Array.from({ length: 10 }, (_, i) => `Decision ${i + 1}`);
    const state = makeState({ decisions });
    const snapshot = makeSnapshot();

    const result = await generator.generate(snapshot, state, outputDir);
    const parsed = matter(result.content);

    const decisionMatches = parsed.content.match(/Decision \d+/g) ?? [];
    expect(decisionMatches.length).toBeLessThanOrEqual(5);
    expect(parsed.content).toContain('Decision 1');
    expect(parsed.content).not.toContain('Decision 6');
  });

  // (j) generate() caps blockers at 5
  it('caps blockers at 5', async () => {
    const blockers = Array.from({ length: 8 }, (_, i) => `Blocker ${i + 1}`);
    const state = makeState({ blockers });
    const snapshot = makeSnapshot();

    const result = await generator.generate(snapshot, state, outputDir);
    const parsed = matter(result.content);

    const blockerMatches = parsed.content.match(/Blocker \d+/g) ?? [];
    expect(blockerMatches.length).toBeLessThanOrEqual(5);
    expect(parsed.content).toContain('Blocker 1');
    expect(parsed.content).not.toContain('Blocker 6');
  });

  // (k) generate() caps open questions at 5
  it('caps open questions at 5', async () => {
    const questions = Array.from({ length: 10 }, (_, i) => `Question ${i + 1}?`);
    const snapshot = makeSnapshot({ open_questions: questions });
    const state = makeState();

    const result = await generator.generate(snapshot, state, outputDir);
    const parsed = matter(result.content);

    const questionMatches = parsed.content.match(/Question \d+\?/g) ?? [];
    expect(questionMatches.length).toBeLessThanOrEqual(5);
    expect(parsed.content).toContain('Question 1?');
    expect(parsed.content).not.toContain('Question 6?');
  });

  // (l) generate() body stays under 2000 characters
  it('body stays under 2000 characters', async () => {
    const longSummary = 'A'.repeat(300);
    const decisions = Array.from({ length: 10 }, (_, i) => `Very long decision number ${i + 1} with extra details to inflate size`);
    const blockers = Array.from({ length: 8 }, (_, i) => `Blocker ${i + 1} with extra verbose description to inflate size`);
    const questions = Array.from({ length: 10 }, (_, i) => `What about question ${i + 1} which is very verbose?`);
    const files = Array.from({ length: 20 }, (_, i) => `src/some/deeply/nested/directory/file-${i}.ts`);
    const skills = Array.from({ length: 10 }, (_, i) => `skill-${i}-with-long-name`);

    const snapshot = makeSnapshot({
      summary: longSummary,
      open_questions: questions,
      files_modified: files,
      active_skills: skills,
    });
    const state = makeState({ decisions, blockers });

    const result = await generator.generate(snapshot, state, outputDir);
    const parsed = matter(result.content);

    // Body is the content after frontmatter
    expect(parsed.content.length).toBeLessThan(2000);
  });

  // (m) generate() handles null state gracefully
  it('handles null state gracefully', async () => {
    const snapshot = makeSnapshot();

    const result = await generator.generate(snapshot, null, outputDir);
    const parsed = matter(result.content);

    expect(parsed.content).toContain('## Session State');
    expect(parsed.content).not.toContain('## Decisions');
    expect(parsed.content).not.toContain('## Blockers');
  });

  // (n) generate() omits sections with no data
  it('omits sections with no data', async () => {
    const snapshot = makeSnapshot({
      active_skills: [],
      files_modified: [],
      open_questions: [],
    });
    const state = makeState({ decisions: [], blockers: [] });

    const result = await generator.generate(snapshot, state, outputDir);
    const parsed = matter(result.content);

    expect(parsed.content).not.toContain('## Active Skills');
    expect(parsed.content).not.toContain('## Recent Files');
    expect(parsed.content).not.toContain('## Decisions');
    expect(parsed.content).not.toContain('## Blockers');
    expect(parsed.content).not.toContain('## Open Questions');
    // Session State should always be present
    expect(parsed.content).toContain('## Session State');
  });

  // (o) cleanupOldHandoffs() removes handoff skill directories older than 7 days
  it('cleanupOldHandoffs removes dirs older than 7 days', async () => {
    const now = new Date();

    // Create a 10-day-old handoff dir
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const oldDateStr = tenDaysAgo.toISOString().split('T')[0];
    const oldDir = join(outputDir, `session-handoff-${oldDateStr}`);
    await mkdir(oldDir, { recursive: true });
    await writeFile(join(oldDir, 'SKILL.md'), 'old', 'utf-8');

    // Create a 3-day-old handoff dir
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const recentDateStr = threeDaysAgo.toISOString().split('T')[0];
    const recentDir = join(outputDir, `session-handoff-${recentDateStr}`);
    await mkdir(recentDir, { recursive: true });
    await writeFile(join(recentDir, 'SKILL.md'), 'recent', 'utf-8');

    // Run cleanup
    await generator.cleanupOldHandoffs(outputDir);

    const entries = await readdir(outputDir);
    expect(entries).not.toContain(`session-handoff-${oldDateStr}`);
    expect(entries).toContain(`session-handoff-${recentDateStr}`);
  });
});

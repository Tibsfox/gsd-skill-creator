/**
 * Tests for session enumerator -- discovers sessions across Claude Code projects.
 *
 * Tests create temporary directory structures mimicking ~/.claude/projects/
 * with sessions-index.json files to verify enumeration, error handling,
 * and version checking behavior.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import os from 'os';
import { enumerateSessions } from './session-enumerator.js';

/**
 * Helper to create a test project directory with a sessions-index.json file.
 */
function createTestProject(
  baseDir: string,
  projectSlug: string,
  indexContent: object,
): void {
  const projectDir = join(baseDir, 'projects', projectSlug);
  mkdirSync(projectDir, { recursive: true });
  writeFileSync(
    join(projectDir, 'sessions-index.json'),
    JSON.stringify(indexContent),
  );
}

/**
 * Helper to create a project directory without sessions-index.json.
 */
function createEmptyProject(baseDir: string, projectSlug: string): void {
  const projectDir = join(baseDir, 'projects', projectSlug);
  mkdirSync(projectDir, { recursive: true });
}

/** Standard valid sessions-index fixture with one session */
function makeValidIndex(sessions: object[] = [defaultSession()]): object {
  return {
    version: 1,
    entries: sessions,
  };
}

/** Default session entry fixture */
function defaultSession(overrides: Record<string, unknown> = {}): object {
  return {
    sessionId: 'sess-001',
    fullPath: '/home/user/.claude/projects/test/sessions/sess-001.jsonl',
    fileMtime: 1706000000000,
    messageCount: 42,
    created: '2026-01-15T10:00:00.000Z',
    modified: '2026-01-15T11:00:00.000Z',
    firstPrompt: 'Build the auth module',
    summary: 'Implemented JWT authentication',
    gitBranch: 'feature/auth',
    ...overrides,
  };
}

describe('enumerateSessions', () => {
  const tempDirs: string[] = [];

  function makeTempBase(): string {
    const dir = mkdtempSync(join(os.tmpdir(), 'enum-test-'));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('enumerates sessions from a single project', async () => {
    const base = makeTempBase();
    const sessions = [
      defaultSession({ sessionId: 'sess-001' }),
      defaultSession({
        sessionId: 'sess-002',
        fullPath: '/home/user/.claude/projects/test/sessions/sess-002.jsonl',
        firstPrompt: 'Add tests',
      }),
    ];
    createTestProject(base, 'my-project', makeValidIndex(sessions));

    const result = await enumerateSessions(base);

    expect(result).toHaveLength(2);
    expect(result[0].sessionId).toBe('sess-001');
    expect(result[1].sessionId).toBe('sess-002');
    expect(result[0].projectSlug).toBe('my-project');
    expect(result[1].projectSlug).toBe('my-project');
  });

  it('enumerates sessions across multiple projects', async () => {
    const base = makeTempBase();
    createTestProject(base, 'project-a', makeValidIndex([
      defaultSession({ sessionId: 'a-001' }),
    ]));
    createTestProject(base, 'project-b', makeValidIndex([
      defaultSession({ sessionId: 'b-001' }),
      defaultSession({ sessionId: 'b-002' }),
    ]));
    createTestProject(base, 'project-c', makeValidIndex([
      defaultSession({ sessionId: 'c-001' }),
      defaultSession({ sessionId: 'c-002' }),
      defaultSession({ sessionId: 'c-003' }),
    ]));

    const result = await enumerateSessions(base);

    expect(result).toHaveLength(6);
    // Verify projectSlug assignment
    const slugs = result.map(r => r.projectSlug);
    expect(slugs.filter(s => s === 'project-a')).toHaveLength(1);
    expect(slugs.filter(s => s === 'project-b')).toHaveLength(2);
    expect(slugs.filter(s => s === 'project-c')).toHaveLength(3);
  });

  it('skips project with missing sessions-index.json', async () => {
    const base = makeTempBase();
    createEmptyProject(base, 'no-index-project');
    createTestProject(base, 'valid-project', makeValidIndex([
      defaultSession({ sessionId: 'valid-001' }),
    ]));

    const result = await enumerateSessions(base);

    expect(result).toHaveLength(1);
    expect(result[0].sessionId).toBe('valid-001');
    expect(result[0].projectSlug).toBe('valid-project');
  });

  it('skips project with corrupt sessions-index.json', async () => {
    const base = makeTempBase();
    // Write invalid JSON
    const corruptDir = join(base, 'projects', 'corrupt-project');
    mkdirSync(corruptDir, { recursive: true });
    writeFileSync(join(corruptDir, 'sessions-index.json'), '{not valid json!!!');

    createTestProject(base, 'valid-project', makeValidIndex([
      defaultSession({ sessionId: 'valid-001' }),
    ]));

    const result = await enumerateSessions(base);

    expect(result).toHaveLength(1);
    expect(result[0].sessionId).toBe('valid-001');
  });

  it('skips project with invalid schema', async () => {
    const base = makeTempBase();
    // Valid JSON but wrong shape
    createTestProject(base, 'bad-schema', { foo: 'bar' });
    createTestProject(base, 'valid-project', makeValidIndex([
      defaultSession({ sessionId: 'valid-001' }),
    ]));

    const result = await enumerateSessions(base);

    expect(result).toHaveLength(1);
    expect(result[0].sessionId).toBe('valid-001');
  });

  it('returns empty array for non-existent base directory', async () => {
    const result = await enumerateSessions(`/tmp/nonexistent-path-${Date.now()}`);

    expect(result).toEqual([]);
  });

  it('returns empty array for empty projects directory', async () => {
    const base = makeTempBase();
    mkdirSync(join(base, 'projects'), { recursive: true });

    const result = await enumerateSessions(base);

    expect(result).toEqual([]);
  });

  it('includes projectSlug from directory name', async () => {
    const base = makeTempBase();
    const slug = '-media-foxy-ai-project';
    createTestProject(base, slug, makeValidIndex([
      defaultSession({ sessionId: 'slug-001' }),
    ]));

    const result = await enumerateSessions(base);

    expect(result).toHaveLength(1);
    expect(result[0].projectSlug).toBe('-media-foxy-ai-project');
  });

  it('handles sessions-index with version 1', async () => {
    const base = makeTempBase();
    createTestProject(base, 'versioned', {
      version: 1,
      entries: [defaultSession({ sessionId: 'v1-001' })],
    });

    const result = await enumerateSessions(base);

    expect(result).toHaveLength(1);
    expect(result[0].sessionId).toBe('v1-001');
  });

  it('handles sessions-index with unknown version (graceful degradation)', async () => {
    const base = makeTempBase();
    createTestProject(base, 'future-version', {
      version: 99,
      entries: [defaultSession({ sessionId: 'v99-001' })],
    });

    const result = await enumerateSessions(base);

    // Should still return sessions despite unknown version
    expect(result).toHaveLength(1);
    expect(result[0].sessionId).toBe('v99-001');
    expect(result[0].projectSlug).toBe('future-version');
  });

  it('preserves all session fields from index', async () => {
    const base = makeTempBase();
    const fullSession = {
      sessionId: 'full-001',
      fullPath: '/home/user/.claude/projects/test/sessions/full-001.jsonl',
      fileMtime: 1706000000000,
      messageCount: 42,
      created: '2026-01-15T10:00:00.000Z',
      modified: '2026-01-15T11:00:00.000Z',
      firstPrompt: 'Build the auth module',
      summary: 'Implemented JWT authentication',
      gitBranch: 'feature/auth',
      projectPath: '/media/foxy/ai/project',
      isSidechain: false,
    };
    createTestProject(base, 'full-fields', makeValidIndex([fullSession]));

    const result = await enumerateSessions(base);

    expect(result).toHaveLength(1);
    const session = result[0];
    expect(session.sessionId).toBe('full-001');
    expect(session.fullPath).toBe(fullSession.fullPath);
    expect(session.fileMtime).toBe(1706000000000);
    expect(session.messageCount).toBe(42);
    expect(session.created).toBe('2026-01-15T10:00:00.000Z');
    expect(session.modified).toBe('2026-01-15T11:00:00.000Z');
    expect(session.firstPrompt).toBe('Build the auth module');
    expect(session.summary).toBe('Implemented JWT authentication');
    expect(session.gitBranch).toBe('feature/auth');
    expect(session.projectPath).toBe('/media/foxy/ai/project');
    expect(session.isSidechain).toBe(false);
    expect(session.projectSlug).toBe('full-fields');
  });
});

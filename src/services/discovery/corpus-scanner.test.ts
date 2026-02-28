import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import os from 'os';
import { CorpusScanner } from './corpus-scanner.js';
import type { SessionInfo, ParsedEntry } from './types.js';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a test project with sessions-index.json and dummy .jsonl files.
 *
 * The sessions-index.json entries have fullPath pointing to .jsonl files
 * inside the project directory. Each .jsonl file contains a single
 * user entry (or custom content) so that parseSessionFile yields data.
 */
function createTestProject(
  baseDir: string,
  slug: string,
  sessions: Array<{ sessionId: string; fileMtime: number; jsonlContent?: string }>,
): void {
  const projectDir = join(baseDir, 'projects', slug);
  mkdirSync(projectDir, { recursive: true });

  const entries = sessions.map((s) => ({
    sessionId: s.sessionId,
    fullPath: join(projectDir, `${s.sessionId}.jsonl`),
    fileMtime: s.fileMtime,
    messageCount: 1,
    created: '2026-01-15T10:00:00.000Z',
    modified: '2026-01-15T11:00:00.000Z',
  }));

  writeFileSync(
    join(projectDir, 'sessions-index.json'),
    JSON.stringify({ version: 1, entries }),
  );

  // Create dummy .jsonl files
  for (const s of sessions) {
    const content =
      s.jsonlContent ??
      JSON.stringify({
        type: 'user',
        uuid: 'u1',
        sessionId: s.sessionId,
        timestamp: '2026-01-15T10:00:00.000Z',
        message: { role: 'user', content: 'test prompt' },
      });
    writeFileSync(join(projectDir, `${s.sessionId}.jsonl`), content);
  }
}

/**
 * Rewrite a project's sessions-index.json with updated entries.
 * Preserves existing .jsonl files unless new ones are added.
 */
function rewriteSessionsIndex(
  baseDir: string,
  slug: string,
  sessions: Array<{ sessionId: string; fileMtime: number }>,
): void {
  const projectDir = join(baseDir, 'projects', slug);
  const entries = sessions.map((s) => ({
    sessionId: s.sessionId,
    fullPath: join(projectDir, `${s.sessionId}.jsonl`),
    fileMtime: s.fileMtime,
    messageCount: 1,
    created: '2026-01-15T10:00:00.000Z',
    modified: '2026-01-15T11:00:00.000Z',
  }));

  writeFileSync(
    join(projectDir, 'sessions-index.json'),
    JSON.stringify({ version: 1, entries }),
  );
}

/** No-op processor that does nothing with entries */
const noopProcessor = async (): Promise<void> => {};

describe('CorpusScanner', () => {
  let claudeDir: string;
  let stateDir: string;

  function setup(): { claudeBaseDir: string; statePath: string } {
    claudeDir = mkdtempSync(join(os.tmpdir(), 'corpus-scanner-claude-'));
    stateDir = mkdtempSync(join(os.tmpdir(), 'corpus-scanner-state-'));
    return {
      claudeBaseDir: claudeDir,
      statePath: join(stateDir, 'scan-state.json'),
    };
  }

  afterEach(() => {
    if (claudeDir && existsSync(claudeDir)) {
      rmSync(claudeDir, { recursive: true });
    }
    if (stateDir && existsSync(stateDir)) {
      rmSync(stateDir, { recursive: true });
    }
  });

  // Test 1: First scan processes all sessions
  it('first scan processes all sessions', async () => {
    const { claudeBaseDir, statePath } = setup();

    createTestProject(claudeBaseDir, 'project-a', [
      { sessionId: 'sess-001', fileMtime: 1000 },
    ]);
    createTestProject(claudeBaseDir, 'project-b', [
      { sessionId: 'sess-002', fileMtime: 2000 },
      { sessionId: 'sess-003', fileMtime: 3000 },
    ]);

    const processedIds: string[] = [];
    const processor = async (session: SessionInfo): Promise<void> => {
      processedIds.push(session.sessionId);
    };

    const scanner = new CorpusScanner({ claudeBaseDir, statePath });
    const stats = await scanner.scan(processor);

    expect(processedIds).toHaveLength(3);
    expect(processedIds).toContain('sess-001');
    expect(processedIds).toContain('sess-002');
    expect(processedIds).toContain('sess-003');
    expect(stats.newSessions).toBe(3);
    expect(stats.modifiedSessions).toBe(0);
    expect(stats.skippedSessions).toBe(0);
  });

  // Test 2: Second scan immediately after first processes zero sessions
  it('second scan immediately after first processes zero sessions', async () => {
    const { claudeBaseDir, statePath } = setup();

    createTestProject(claudeBaseDir, 'project-a', [
      { sessionId: 'sess-001', fileMtime: 1000 },
    ]);
    createTestProject(claudeBaseDir, 'project-b', [
      { sessionId: 'sess-002', fileMtime: 2000 },
      { sessionId: 'sess-003', fileMtime: 3000 },
    ]);

    const scanner = new CorpusScanner({ claudeBaseDir, statePath });

    // First scan
    await scanner.scan(noopProcessor);

    // Second scan with same state path
    const secondProcessedIds: string[] = [];
    const secondScanner = new CorpusScanner({ claudeBaseDir, statePath });
    const stats = await secondScanner.scan(async (session: SessionInfo) => {
      secondProcessedIds.push(session.sessionId);
    });

    expect(secondProcessedIds).toHaveLength(0);
    expect(stats.newSessions).toBe(0);
    expect(stats.modifiedSessions).toBe(0);
    expect(stats.skippedSessions).toBe(3);
  });

  // Test 3: Modified session is re-processed
  it('modified session is re-processed', async () => {
    const { claudeBaseDir, statePath } = setup();

    createTestProject(claudeBaseDir, 'project-a', [
      { sessionId: 'sess-001', fileMtime: 1000 },
      { sessionId: 'sess-002', fileMtime: 2000 },
    ]);

    const scanner = new CorpusScanner({ claudeBaseDir, statePath });
    await scanner.scan(noopProcessor);

    // Modify fileMtime of sess-001
    rewriteSessionsIndex(claudeBaseDir, 'project-a', [
      { sessionId: 'sess-001', fileMtime: 9999 }, // changed
      { sessionId: 'sess-002', fileMtime: 2000 }, // unchanged
    ]);

    const processedIds: string[] = [];
    const secondScanner = new CorpusScanner({ claudeBaseDir, statePath });
    const stats = await secondScanner.scan(async (session: SessionInfo) => {
      processedIds.push(session.sessionId);
    });

    expect(processedIds).toHaveLength(1);
    expect(processedIds[0]).toBe('sess-001');
    expect(stats.newSessions).toBe(0);
    expect(stats.modifiedSessions).toBe(1);
    expect(stats.skippedSessions).toBe(1);
  });

  // Test 4: Excluded projects are skipped
  it('excluded projects are skipped via options', async () => {
    const { claudeBaseDir, statePath } = setup();

    createTestProject(claudeBaseDir, 'include-me', [
      { sessionId: 'sess-001', fileMtime: 1000 },
    ]);
    createTestProject(claudeBaseDir, 'exclude-me', [
      { sessionId: 'sess-002', fileMtime: 2000 },
      { sessionId: 'sess-003', fileMtime: 3000 },
    ]);

    const processedIds: string[] = [];
    const scanner = new CorpusScanner({
      claudeBaseDir,
      statePath,
      excludeProjects: ['exclude-me'],
    });
    const stats = await scanner.scan(async (session: SessionInfo) => {
      processedIds.push(session.sessionId);
    });

    expect(processedIds).toHaveLength(1);
    expect(processedIds[0]).toBe('sess-001');
    expect(stats.excludedSessions).toBe(2);
  });

  // Test 5: Exclude list from state file is honored
  it('exclude list from state file is honored', async () => {
    const { claudeBaseDir, statePath } = setup();

    // Pre-write state file with exclude list
    const preState = {
      version: 1,
      sessions: {},
      excludeProjects: ['state-excluded'],
    };
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(statePath, JSON.stringify(preState));

    createTestProject(claudeBaseDir, 'state-excluded', [
      { sessionId: 'sess-001', fileMtime: 1000 },
    ]);
    createTestProject(claudeBaseDir, 'other', [
      { sessionId: 'sess-002', fileMtime: 2000 },
    ]);

    const processedIds: string[] = [];
    const scanner = new CorpusScanner({ claudeBaseDir, statePath });
    const stats = await scanner.scan(async (session: SessionInfo) => {
      processedIds.push(session.sessionId);
    });

    expect(processedIds).toHaveLength(1);
    expect(processedIds[0]).toBe('sess-002');
    expect(stats.excludedSessions).toBe(1);
  });

  // Test 6: Option excludeProjects merges with state excludes
  it('option excludeProjects merges with state excludes', async () => {
    const { claudeBaseDir, statePath } = setup();

    // Pre-write state with one exclude
    const preState = {
      version: 1,
      sessions: {},
      excludeProjects: ['state-excluded'],
    };
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(statePath, JSON.stringify(preState));

    createTestProject(claudeBaseDir, 'state-excluded', [
      { sessionId: 'sess-001', fileMtime: 1000 },
    ]);
    createTestProject(claudeBaseDir, 'option-excluded', [
      { sessionId: 'sess-002', fileMtime: 2000 },
    ]);
    createTestProject(claudeBaseDir, 'included', [
      { sessionId: 'sess-003', fileMtime: 3000 },
    ]);

    const processedIds: string[] = [];
    const scanner = new CorpusScanner({
      claudeBaseDir,
      statePath,
      excludeProjects: ['option-excluded'],
    });
    const stats = await scanner.scan(async (session: SessionInfo) => {
      processedIds.push(session.sessionId);
    });

    expect(processedIds).toHaveLength(1);
    expect(processedIds[0]).toBe('sess-003');
    expect(stats.excludedSessions).toBe(2);
  });

  // Test 7: Force rescan processes all sessions regardless of watermarks
  it('force rescan processes all sessions regardless of watermarks', async () => {
    const { claudeBaseDir, statePath } = setup();

    createTestProject(claudeBaseDir, 'project-a', [
      { sessionId: 'sess-001', fileMtime: 1000 },
      { sessionId: 'sess-002', fileMtime: 2000 },
    ]);

    // First scan to set watermarks
    const scanner1 = new CorpusScanner({ claudeBaseDir, statePath });
    await scanner1.scan(noopProcessor);

    // Force rescan
    const processedIds: string[] = [];
    const scanner2 = new CorpusScanner({
      claudeBaseDir,
      statePath,
      forceRescan: true,
    });
    const stats = await scanner2.scan(async (session: SessionInfo) => {
      processedIds.push(session.sessionId);
    });

    expect(processedIds).toHaveLength(2);
    expect(stats.newSessions).toBe(2);
    expect(stats.modifiedSessions).toBe(0);
    expect(stats.skippedSessions).toBe(0);
  });

  // Test 8: Scan stats include totalProjects count
  it('scan stats include totalProjects count', async () => {
    const { claudeBaseDir, statePath } = setup();

    createTestProject(claudeBaseDir, 'project-a', [
      { sessionId: 'sess-001', fileMtime: 1000 },
    ]);
    createTestProject(claudeBaseDir, 'project-b', [
      { sessionId: 'sess-002', fileMtime: 2000 },
    ]);
    createTestProject(claudeBaseDir, 'project-c', [
      { sessionId: 'sess-003', fileMtime: 3000 },
    ]);

    const scanner = new CorpusScanner({ claudeBaseDir, statePath });
    const stats = await scanner.scan(noopProcessor);

    expect(stats.totalProjects).toBe(3);
  });

  // Test 9: Scan stats include totalSessions count
  it('scan stats include totalSessions count', async () => {
    const { claudeBaseDir, statePath } = setup();

    createTestProject(claudeBaseDir, 'project-a', [
      { sessionId: 'sess-001', fileMtime: 1000 },
      { sessionId: 'sess-002', fileMtime: 2000 },
    ]);
    createTestProject(claudeBaseDir, 'project-b', [
      { sessionId: 'sess-003', fileMtime: 3000 },
      { sessionId: 'sess-004', fileMtime: 4000 },
      { sessionId: 'sess-005', fileMtime: 5000 },
    ]);

    const scanner = new CorpusScanner({ claudeBaseDir, statePath });
    const stats = await scanner.scan(noopProcessor);

    expect(stats.totalSessions).toBe(5);
  });

  // Test 10: Processor receives SessionInfo and async generator of ParsedEntry
  it('processor receives SessionInfo and async generator of ParsedEntry', async () => {
    const { claudeBaseDir, statePath } = setup();

    const jsonlContent = JSON.stringify({
      type: 'user',
      uuid: 'u1',
      sessionId: 'sess-001',
      timestamp: '2026-01-15T10:00:00.000Z',
      message: { role: 'user', content: 'hello world' },
    });

    createTestProject(claudeBaseDir, 'project-a', [
      { sessionId: 'sess-001', fileMtime: 1000, jsonlContent },
    ]);

    let receivedSession: SessionInfo | null = null;
    const receivedEntries: ParsedEntry[] = [];

    const scanner = new CorpusScanner({ claudeBaseDir, statePath });
    await scanner.scan(async (session, entries) => {
      receivedSession = session;
      for await (const entry of entries) {
        receivedEntries.push(entry);
      }
    });

    // Verify session has expected fields
    expect(receivedSession).not.toBeNull();
    expect(receivedSession!.sessionId).toBe('sess-001');
    expect(receivedSession!.projectSlug).toBe('project-a');
    expect(receivedSession!.fullPath).toBeDefined();

    // Verify entries are iterable and contain parsed data
    expect(receivedEntries.length).toBeGreaterThanOrEqual(1);
    expect(receivedEntries[0].kind).toBe('user-prompt');
  });

  // Test 11: State is persisted after scan completes
  it('state is persisted after scan completes', async () => {
    const { claudeBaseDir, statePath } = setup();

    createTestProject(claudeBaseDir, 'project-a', [
      { sessionId: 'sess-001', fileMtime: 1000 },
      { sessionId: 'sess-002', fileMtime: 2000 },
    ]);

    const scanner = new CorpusScanner({ claudeBaseDir, statePath });
    await scanner.scan(noopProcessor);

    // Read state file directly
    const raw = JSON.parse(readFileSync(statePath, 'utf-8'));
    expect(raw.sessions).toBeDefined();

    // Check watermarks for both sessions
    const key1 = 'project-a:sess-001';
    const key2 = 'project-a:sess-002';
    expect(raw.sessions[key1]).toBeDefined();
    expect(raw.sessions[key1].fileMtime).toBe(1000);
    expect(raw.sessions[key1].projectSlug).toBe('project-a');
    expect(raw.sessions[key2]).toBeDefined();
    expect(raw.sessions[key2].fileMtime).toBe(2000);
    expect(raw.sessions[key2].projectSlug).toBe('project-a');
  });

  // Test 12: New session added between scans is detected
  it('new session added between scans is detected', async () => {
    const { claudeBaseDir, statePath } = setup();

    createTestProject(claudeBaseDir, 'project-a', [
      { sessionId: 'sess-001', fileMtime: 1000 },
    ]);

    // First scan
    const scanner1 = new CorpusScanner({ claudeBaseDir, statePath });
    await scanner1.scan(noopProcessor);

    // Add a second session
    const projectDir = join(claudeBaseDir, 'projects', 'project-a');
    writeFileSync(
      join(projectDir, 'sess-002.jsonl'),
      JSON.stringify({
        type: 'user',
        uuid: 'u2',
        sessionId: 'sess-002',
        timestamp: '2026-01-15T12:00:00.000Z',
        message: { role: 'user', content: 'new session' },
      }),
    );
    rewriteSessionsIndex(claudeBaseDir, 'project-a', [
      { sessionId: 'sess-001', fileMtime: 1000 },
      { sessionId: 'sess-002', fileMtime: 5000 },
    ]);

    // Second scan
    const processedIds: string[] = [];
    const scanner2 = new CorpusScanner({ claudeBaseDir, statePath });
    const stats = await scanner2.scan(async (session: SessionInfo) => {
      processedIds.push(session.sessionId);
    });

    expect(processedIds).toHaveLength(1);
    expect(processedIds[0]).toBe('sess-002');
    expect(stats.newSessions).toBe(1);
    expect(stats.skippedSessions).toBe(1);
  });

  // Test 13: Scanner passes claudeBaseDir through to enumerator
  it('scanner passes claudeBaseDir through to enumerator', async () => {
    const { claudeBaseDir, statePath } = setup();

    createTestProject(claudeBaseDir, 'custom-project', [
      { sessionId: 'sess-custom', fileMtime: 7777 },
    ]);

    const processedIds: string[] = [];
    const scanner = new CorpusScanner({ claudeBaseDir, statePath });
    const stats = await scanner.scan(async (session: SessionInfo) => {
      processedIds.push(session.sessionId);
    });

    // Should find sessions from custom dir, not from real ~/.claude
    expect(processedIds).toContain('sess-custom');
    expect(stats.totalSessions).toBe(1);
  });

  // Test 14: Empty projects directory results in zero processing
  it('empty projects directory results in zero processing', async () => {
    const { claudeBaseDir, statePath } = setup();

    // Create empty projects directory
    mkdirSync(join(claudeBaseDir, 'projects'), { recursive: true });

    let processorCalled = false;
    const scanner = new CorpusScanner({ claudeBaseDir, statePath });
    const stats = await scanner.scan(async () => {
      processorCalled = true;
    });

    expect(processorCalled).toBe(false);
    expect(stats.totalProjects).toBe(0);
    expect(stats.totalSessions).toBe(0);
    expect(stats.newSessions).toBe(0);
    expect(stats.modifiedSessions).toBe(0);
    expect(stats.skippedSessions).toBe(0);
    expect(stats.excludedSessions).toBe(0);
  });

  // Test 15: Integration: scan, modify, rescan end-to-end
  it('integration: scan, modify, rescan end-to-end', async () => {
    const { claudeBaseDir, statePath } = setup();

    // Setup: 2 projects with 2 sessions each (4 total)
    createTestProject(claudeBaseDir, 'proj-x', [
      { sessionId: 'sx-001', fileMtime: 100 },
      { sessionId: 'sx-002', fileMtime: 200 },
    ]);
    createTestProject(claudeBaseDir, 'proj-y', [
      { sessionId: 'sy-001', fileMtime: 300 },
      { sessionId: 'sy-002', fileMtime: 400 },
    ]);

    // === First scan: all 4 are new ===
    let callCount1 = 0;
    const scanner1 = new CorpusScanner({ claudeBaseDir, statePath });
    const stats1 = await scanner1.scan(async () => {
      callCount1++;
    });

    expect(callCount1).toBe(4);
    expect(stats1.newSessions).toBe(4);
    expect(stats1.modifiedSessions).toBe(0);
    expect(stats1.skippedSessions).toBe(0);

    // === Modify one session's fileMtime ===
    rewriteSessionsIndex(claudeBaseDir, 'proj-x', [
      { sessionId: 'sx-001', fileMtime: 999 }, // changed
      { sessionId: 'sx-002', fileMtime: 200 }, // unchanged
    ]);

    // === Second scan: 1 modified, 3 skipped ===
    let callCount2 = 0;
    const scanner2 = new CorpusScanner({ claudeBaseDir, statePath });
    const stats2 = await scanner2.scan(async () => {
      callCount2++;
    });

    expect(callCount2).toBe(1);
    expect(stats2.newSessions).toBe(0);
    expect(stats2.modifiedSessions).toBe(1);
    expect(stats2.skippedSessions).toBe(3);

    // === Add 1 new session to proj-y ===
    const projYDir = join(claudeBaseDir, 'projects', 'proj-y');
    writeFileSync(
      join(projYDir, 'sy-003.jsonl'),
      JSON.stringify({
        type: 'user',
        uuid: 'u3',
        sessionId: 'sy-003',
        timestamp: '2026-01-15T14:00:00.000Z',
        message: { role: 'user', content: 'third session' },
      }),
    );
    rewriteSessionsIndex(claudeBaseDir, 'proj-y', [
      { sessionId: 'sy-001', fileMtime: 300 },
      { sessionId: 'sy-002', fileMtime: 400 },
      { sessionId: 'sy-003', fileMtime: 500 },
    ]);

    // === Third scan: 1 new, 4 skipped (sx-001 was updated in scan 2, now unchanged) ===
    let callCount3 = 0;
    const scanner3 = new CorpusScanner({ claudeBaseDir, statePath });
    const stats3 = await scanner3.scan(async () => {
      callCount3++;
    });

    expect(callCount3).toBe(1);
    expect(stats3.newSessions).toBe(1);
    expect(stats3.modifiedSessions).toBe(0);
    expect(stats3.skippedSessions).toBe(4);
  });
});

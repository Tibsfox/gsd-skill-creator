/**
 * C01 T7 — AnalyzerCore.scan() dispatch loop tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'node:path';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import type { AnalyzerKB, AnalyzerOutput, LanguageAnalyzer, ScanOptions } from '../types.js';

// ─── Mock KB ─────────────────────────────────────────────

function makeMockKB(): AnalyzerKB & {
  calls: string[];
  beginSnapshotArgs: string[][];
  writeFindingsArgs: { snapshotId: string; projectId: string; output: AnalyzerOutput }[];
  commitSnapshotArgs: string[];
  rollbackSnapshotArgs: string[];
  shouldFailOnCommit: boolean;
} {
  const calls: string[] = [];
  const beginSnapshotArgs: string[][] = [];
  const writeFindingsArgs: { snapshotId: string; projectId: string; output: AnalyzerOutput }[] = [];
  const commitSnapshotArgs: string[] = [];
  const rollbackSnapshotArgs: string[] = [];
  let shouldFailOnCommit = false;

  const kb: ReturnType<typeof makeMockKB> = {
    calls,
    beginSnapshotArgs,
    writeFindingsArgs,
    commitSnapshotArgs,
    rollbackSnapshotArgs,
    get shouldFailOnCommit() { return shouldFailOnCommit; },
    set shouldFailOnCommit(v) { shouldFailOnCommit = v; },

    async beginSnapshot(snapshotId, projectId) {
      calls.push('beginSnapshot');
      beginSnapshotArgs.push([snapshotId, projectId]);
    },
    async writeFindings(snapshotId, projectId, output) {
      calls.push('writeFindings');
      writeFindingsArgs.push({ snapshotId, projectId, output });
    },
    async commitSnapshot(snapshotId) {
      calls.push('commitSnapshot');
      if (shouldFailOnCommit) throw new Error('commitSnapshot failed');
      commitSnapshotArgs.push(snapshotId);
    },
    async rollbackSnapshot(snapshotId) {
      calls.push('rollbackSnapshot');
      rollbackSnapshotArgs.push(snapshotId);
    },
    // Stub IntelligenceKB methods (not used in scan)
    listProjects: () => Promise.reject(new Error('stub')),
    getProject: () => Promise.reject(new Error('stub')),
    getCurrentBriefing: () => Promise.reject(new Error('stub')),
    listOpenFindings: () => Promise.reject(new Error('stub')),
    listInFlightWork: () => Promise.reject(new Error('stub')),
    listMeetings: () => Promise.reject(new Error('stub')),
    startMeeting: () => Promise.reject(new Error('stub')),
    addDecision: () => Promise.reject(new Error('stub')),
    promoteToSendNow: () => Promise.reject(new Error('stub')),
    commitBundle: () => Promise.reject(new Error('stub')),
    parkMeeting: () => Promise.reject(new Error('stub')),
    dismissFinding: () => Promise.reject(new Error('stub')),
  };

  return kb;
}

// ─── Mock language analyzer ───────────────────────────────

function makeTSAnalyzer(opts?: { shouldThrow?: boolean }): LanguageAnalyzer {
  return {
    language: 'typescript',
    async analyze(input) {
      if (opts?.shouldThrow) throw new Error('analyzer crashed');
      return {
        filePath: input.filePath,
        parseStatus: 'ok',
        findings: [],
        metrics: {
          loc: 10,
          functions: 1,
          exports: 1,
          cyclomatic_complexity_mean: 1,
          cyclomatic_complexity_max: 1,
        },
      };
    },
  };
}

function makeThrowingAnalyzer(throwOnSecondFile: boolean): LanguageAnalyzer {
  let callCount = 0;
  return {
    language: 'typescript',
    async analyze(input) {
      callCount++;
      if (throwOnSecondFile && callCount === 2) {
        throw new Error('analyzer crashed on file 2');
      }
      return {
        filePath: input.filePath,
        parseStatus: 'ok',
        findings: [],
        metrics: {
          loc: 5,
          functions: 0,
          exports: 0,
          cyclomatic_complexity_mean: 1,
          cyclomatic_complexity_max: 1,
        },
      };
    },
  };
}

// ─── Tests ────────────────────────────────────────────────

describe('AnalyzerCore.scan()', () => {
  it('empty repo → filesScanned: 0, snapshot committed, no findings', async () => {
    const tmp = join(tmpdir(), `core-empty-${Date.now()}`);
    await mkdir(tmp, { recursive: true });

    const kb = makeMockKB();
    const { AnalyzerCore } = await import('../core.js');
    const core = new AnalyzerCore({ kb, languageAnalyzers: [makeTSAnalyzer()] });

    const result = await core.scan({ projectPath: tmp, projectId: 'proj-1' });

    expect(result.filesScanned).toBe(0);
    expect(result.filesFailed).toBe(0);
    expect(kb.calls).toContain('beginSnapshot');
    expect(kb.calls).toContain('commitSnapshot');
    expect(kb.calls).not.toContain('rollbackSnapshot');

    await rm(tmp, { recursive: true, force: true });
  });

  it('3 TS files + 1 binary + 1 unknown extension → 3 scanned, 2 skipped', async () => {
    const tmp = join(tmpdir(), `core-mixed-${Date.now()}`);
    await mkdir(tmp, { recursive: true });

    await writeFile(join(tmp, 'a.ts'), 'export const a = 1;');
    await writeFile(join(tmp, 'b.ts'), 'export const b = 2;');
    await writeFile(join(tmp, 'c.ts'), 'export const c = 3;');
    // binary: lots of null bytes
    const binBuf = Buffer.alloc(512, 0);
    await writeFile(join(tmp, 'data.bin'), binBuf);
    await writeFile(join(tmp, 'Makefile'), 'all:\n\techo done');

    const kb = makeMockKB();
    const { AnalyzerCore } = await import('../core.js');
    const core = new AnalyzerCore({ kb, languageAnalyzers: [makeTSAnalyzer()] });

    const result = await core.scan({ projectPath: tmp, projectId: 'proj-2' });

    // 3 TS files scanned (binary skipped, Makefile unknown extension skipped)
    expect(result.filesScanned).toBe(3);
    expect(result.filesSkipped).toBeGreaterThanOrEqual(2);
    expect(result.filesFailed).toBe(0);

    await rm(tmp, { recursive: true, force: true });
  });

  it('analyzer throws on file 2 of 3 → filesFailed: 1, scan completes, parse_failed finding written', async () => {
    const tmp = join(tmpdir(), `core-throw-${Date.now()}`);
    await mkdir(tmp, { recursive: true });

    await writeFile(join(tmp, 'a.ts'), 'export const a = 1;');
    await writeFile(join(tmp, 'b.ts'), 'export const b = 2;');
    await writeFile(join(tmp, 'c.ts'), 'export const c = 3;');

    const kb = makeMockKB();
    const { AnalyzerCore } = await import('../core.js');
    const core = new AnalyzerCore({
      kb,
      languageAnalyzers: [makeThrowingAnalyzer(true)],
    });

    const result = await core.scan({ projectPath: tmp, projectId: 'proj-3' });

    expect(result.filesFailed).toBe(1);
    expect(result.filesScanned).toBe(3);
    // A parse_failed finding should have been written for the crashed file
    const parseFailed = kb.writeFindingsArgs.some(
      a => a.output.findings.some(f => f.kind === 'parse_failed'),
    );
    expect(parseFailed).toBe(true);
    // Scan completed (committed, not rolled back)
    expect(kb.calls).toContain('commitSnapshot');

    await rm(tmp, { recursive: true, force: true });
  });

  it('commitSnapshot failure → snapshot rolled back, error surfaced', async () => {
    const tmp = join(tmpdir(), `core-rollback-${Date.now()}`);
    await mkdir(tmp, { recursive: true });
    await writeFile(join(tmp, 'a.ts'), 'export const a = 1;');

    const kb = makeMockKB();
    kb.shouldFailOnCommit = true;

    const { AnalyzerCore } = await import('../core.js');
    const core = new AnalyzerCore({ kb, languageAnalyzers: [makeTSAnalyzer()] });

    await expect(core.scan({ projectPath: tmp, projectId: 'proj-4' })).rejects.toThrow();
    expect(kb.calls).toContain('rollbackSnapshot');
    expect(kb.rollbackSnapshotArgs.length).toBeGreaterThan(0);

    await rm(tmp, { recursive: true, force: true });
  });

  it('progress callback invoked every 100 files', async () => {
    const tmp = join(tmpdir(), `core-progress-${Date.now()}`);
    await mkdir(tmp, { recursive: true });

    // Create 250 TS files
    for (let i = 0; i < 250; i++) {
      await writeFile(join(tmp, `f${i}.ts`), `export const x${i} = ${i};`);
    }

    const progressReports: [number, number][] = [];
    const kb = makeMockKB();
    const { AnalyzerCore } = await import('../core.js');
    const core = new AnalyzerCore({ kb, languageAnalyzers: [makeTSAnalyzer()] });

    await core.scan({
      projectPath: tmp,
      projectId: 'proj-5',
      reportProgress: (done, total) => progressReports.push([done, total]),
    });

    // Should have reported at 100 and 200 (and possibly at 250 if done)
    expect(progressReports.some(([d]) => d >= 100)).toBe(true);
    expect(progressReports.some(([d]) => d >= 200)).toBe(true);

    await rm(tmp, { recursive: true, force: true });
  }, 30000);
});

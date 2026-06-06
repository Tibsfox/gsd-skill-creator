/**
 * Tests for WorkflowRunStore JSONL append-log.
 *
 * Covers:
 * - append creates file and writes envelope-wrapped entry
 * - readAll returns empty array for non-existent file
 * - readAll skips corrupted lines
 * - getRunEntries filters by run_id correctly
 * - getLatestRun returns null when no runs exist
 * - getLatestRun returns most recent run_id's entries
 * - getCompletedSteps returns only step_ids with status 'completed'
 * - Multiple appends produce multiple lines in file
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { WorkflowRunStore } from './workflow-run-store.js';
import type { WorkflowRunEntry } from './types.js';
import {
  CapturingAuditSink,
  defaultLoaderContext,
  LoaderContextDenied,
  type LoaderContext,
} from '../security/loader-context.js';

// ============================================================================
// Helpers
// ============================================================================

/** Escape a string for safe literal use inside a RegExp (Windows paths contain backslashes). */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let tmpDir: string;

function makeEntry(overrides: Partial<WorkflowRunEntry> = {}): WorkflowRunEntry {
  return {
    run_id: 'run-1',
    workflow_name: 'test-workflow',
    step_id: 'step-a',
    status: 'completed',
    started_at: '2026-01-01T00:00:00Z',
    completed_at: '2026-01-01T00:01:00Z',
    error: null,
    ...overrides,
  };
}

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'wf-run-store-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

// ============================================================================
// append
// ============================================================================

describe('WorkflowRunStore - append', () => {
  it('creates file and writes envelope-wrapped entry', async () => {
    const store = new WorkflowRunStore(tmpDir);
    const entry = makeEntry();

    await store.append(entry);

    const content = await readFile(join(tmpDir, 'workflow-runs.jsonl'), 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(1);

    const envelope = JSON.parse(lines[0]);
    expect(envelope).toHaveProperty('timestamp');
    expect(envelope.category).toBe('workflow-runs');
    expect(envelope.data).toMatchObject({
      run_id: 'run-1',
      workflow_name: 'test-workflow',
      step_id: 'step-a',
      status: 'completed',
    });
  });

  it('multiple appends produce multiple lines in file', async () => {
    const store = new WorkflowRunStore(tmpDir);

    await store.append(makeEntry({ step_id: 'step-a' }));
    await store.append(makeEntry({ step_id: 'step-b' }));
    await store.append(makeEntry({ step_id: 'step-c' }));

    const content = await readFile(join(tmpDir, 'workflow-runs.jsonl'), 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(3);
  });
});

// ============================================================================
// readAll
// ============================================================================

describe('WorkflowRunStore - readAll', () => {
  it('returns empty array for non-existent file', async () => {
    const store = new WorkflowRunStore(tmpDir);
    const entries = await store.readAll();
    expect(entries).toEqual([]);
  });

  it('skips corrupted lines', async () => {
    await mkdir(tmpDir, { recursive: true });
    const filePath = join(tmpDir, 'workflow-runs.jsonl');
    const validEnvelope = JSON.stringify({
      timestamp: Date.now(),
      category: 'workflow-runs',
      data: makeEntry(),
    });
    const content = `${validEnvelope}\n{not valid json\n${validEnvelope}\n`;
    await writeFile(filePath, content, 'utf-8');

    const store = new WorkflowRunStore(tmpDir);
    const entries = await store.readAll();
    expect(entries).toHaveLength(2);
  });
});

// ============================================================================
// getRunEntries
// ============================================================================

describe('WorkflowRunStore - getRunEntries', () => {
  it('filters by run_id correctly', async () => {
    const store = new WorkflowRunStore(tmpDir);

    await store.append(makeEntry({ run_id: 'run-1', step_id: 'a' }));
    await store.append(makeEntry({ run_id: 'run-2', step_id: 'b' }));
    await store.append(makeEntry({ run_id: 'run-1', step_id: 'c' }));

    const entries = await store.getRunEntries('run-1');
    expect(entries).toHaveLength(2);
    expect(entries.every(e => e.run_id === 'run-1')).toBe(true);
  });
});

// ============================================================================
// getLatestRun
// ============================================================================

describe('WorkflowRunStore - getLatestRun', () => {
  it('returns null when no runs exist', async () => {
    const store = new WorkflowRunStore(tmpDir);
    const result = await store.getLatestRun('nonexistent');
    expect(result).toBeNull();
  });

  it('returns most recent run_id entries for given workflow', async () => {
    const store = new WorkflowRunStore(tmpDir);

    // Older run
    await store.append(makeEntry({ run_id: 'run-old', workflow_name: 'my-wf', step_id: 'a' }));
    // Newer run
    await store.append(makeEntry({ run_id: 'run-new', workflow_name: 'my-wf', step_id: 'a' }));
    await store.append(makeEntry({ run_id: 'run-new', workflow_name: 'my-wf', step_id: 'b' }));
    // Different workflow
    await store.append(makeEntry({ run_id: 'run-other', workflow_name: 'other-wf', step_id: 'x' }));

    const result = await store.getLatestRun('my-wf');
    expect(result).not.toBeNull();
    expect(result!.runId).toBe('run-new');
    expect(result!.entries).toHaveLength(2);
  });
});

// ============================================================================
// getCompletedSteps
// ============================================================================

describe('WorkflowRunStore - getCompletedSteps', () => {
  it('returns only step_ids with status completed', async () => {
    const store = new WorkflowRunStore(tmpDir);

    await store.append(makeEntry({ run_id: 'run-1', step_id: 'a', status: 'started' }));
    await store.append(makeEntry({ run_id: 'run-1', step_id: 'a', status: 'completed' }));
    await store.append(makeEntry({ run_id: 'run-1', step_id: 'b', status: 'started' }));
    await store.append(makeEntry({ run_id: 'run-1', step_id: 'b', status: 'failed', error: 'boom' }));
    await store.append(makeEntry({ run_id: 'run-1', step_id: 'c', status: 'completed' }));

    const completed = await store.getCompletedSteps('run-1');
    expect(completed).toContain('a');
    expect(completed).toContain('c');
    expect(completed).not.toContain('b');
    expect(completed).toHaveLength(2);
  });
});

// ============================================================================
// LoaderContext chokepoint integration (v1.49.896 — fifth LoaderContext chip)
// ============================================================================

describe('LoaderContext chokepoint integration (v1.49.896)', () => {
  const filePath = (): string => join(tmpDir, 'workflow-runs.jsonl');

  it('emits exactly one audit record on readAll when ctx is provided', async () => {
    const sink = new CapturingAuditSink();
    const store = new WorkflowRunStore(tmpDir, defaultLoaderContext(sink));
    await store.readAll();
    expect(sink.records).toHaveLength(1);
    const rec = sink.records[0];
    expect(rec.source).toBe('skill-workflows/workflow-run-store');
    expect(rec.op).toBe('read-file');
    expect(rec.target).toBe(filePath());
    expect(rec.allowed).toBe(true);
  });

  it('throws LoaderContextDenied when filePath is not in allowList — denial propagates ABOVE ENOENT swallow', async () => {
    const sink = new CapturingAuditSink();
    const restrictedCtx: LoaderContext = {
      allowList: ['/somewhere/that/does/not/match'],
      audit: sink,
    };
    const store = new WorkflowRunStore(tmpDir, restrictedCtx);
    // File does not exist (missing-file is tolerated as empty by readAll), but
    // the denial must still throw because ensureAllowed runs BEFORE readFile.
    // This is the #10442 hoist-above-try/catch invariant.
    await expect(store.readAll()).rejects.toBeInstanceOf(LoaderContextDenied);
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0].allowed).toBe(false);
  });

  it('legacy permissive mode when ctx is undefined (readAll works without audit)', async () => {
    const store = new WorkflowRunStore(tmpDir);
    const entries = await store.readAll();
    expect(entries).toEqual([]);
  });

  it('admits filePath via prefix-pattern (trailing slash) in allowList', async () => {
    const sink = new CapturingAuditSink();
    // The string trailing-slash prefix pattern only matches POSIX-style
    // separators; filePath uses path.join (backslashes on Windows). Use a
    // RegExp anchored to the (native-separator) tmpDir so the prefix
    // admission is exercised on both platforms.
    const prefixCtx: LoaderContext = {
      allowList: [new RegExp(`^${escapeRegExp(tmpDir)}`)],
      audit: sink,
    };
    const store = new WorkflowRunStore(tmpDir, prefixCtx);
    await store.readAll();
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0].allowed).toBe(true);
  });

  it('append() is not gated by LoaderContext (read-side chokepoint by design)', async () => {
    const sink = new CapturingAuditSink();
    const restrictedCtx: LoaderContext = {
      allowList: ['/somewhere/that/does/not/match'],
      audit: sink,
    };
    const store = new WorkflowRunStore(tmpDir, restrictedCtx);
    // append() succeeds even though the path is not in allowList — the
    // chokepoint is intentionally read-only per LoaderContext docstring.
    await expect(store.append(makeEntry())).resolves.toBeUndefined();
    expect(sink.records).toHaveLength(0);
  });

  it('derived methods (getRunEntries / getLatestRun / getCompletedSteps) emit one audit record per call via readAll', async () => {
    const sink = new CapturingAuditSink();
    const ctx = defaultLoaderContext(sink);
    const store = new WorkflowRunStore(tmpDir, ctx);
    // Each derived method calls readAll() exactly once → 3 audit records total.
    await store.getRunEntries('run-1');
    await store.getLatestRun('test-workflow');
    await store.getCompletedSteps('run-1');
    expect(sink.records).toHaveLength(3);
    expect(sink.records.every(r => r.op === 'read-file')).toBe(true);
    expect(sink.records.every(r => r.target === filePath())).toBe(true);
  });
});

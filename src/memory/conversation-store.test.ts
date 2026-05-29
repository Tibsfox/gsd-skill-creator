/**
 * LoaderContext chokepoint integration tests for ConversationStore (v1.49.908).
 *
 * Tests the 3rd-instance promotion of v902's class-multi-method
 * consolidated-gate sub-variant. Verifies:
 * - search/listSessions/getStats emit 1 audit each on this.storePath
 * - ingestSessionLog gates on logPath param BEFORE readFile
 * - Write-side methods (ingestTurn, endSession) emit 0 audits per #10457
 * - LoaderContextDenied propagates from public read methods
 * - Legacy permissive mode preserves prior behavior
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ConversationStore } from './conversation-store.js';
import type { ConversationTurn } from './conversation-store.js';

function makeTurn(overrides: Partial<ConversationTurn> = {}): ConversationTurn {
  return {
    id: 'turn-1',
    sessionId: 'session-1',
    role: 'human',
    content: 'hello world',
    timestamp: new Date(),
    toolCalls: undefined,
    filesAccessed: undefined,
    tags: [],
    ...overrides,
  };
}

describe('ConversationStore LoaderContext chokepoint integration (v1.49.908)', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'conv-store-loader-ctx-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('search emits exactly one audit record per call (scope-gated on storePath)', async () => {
    const { CapturingAuditSink, defaultLoaderContext } = await import(
      '../security/loader-context.js'
    );
    const sink = new CapturingAuditSink();
    const ctx = defaultLoaderContext(sink);
    const store = new ConversationStore({ storePath: dir }, ctx);
    await store.search('test');
    expect(sink.records.length).toBe(1);
    expect(sink.records[0]?.op).toBe('read-dir');
    expect(sink.records[0]?.target).toBe(dir);
  });

  it('listSessions emits exactly one audit per call', async () => {
    const { CapturingAuditSink, defaultLoaderContext } = await import(
      '../security/loader-context.js'
    );
    const sink = new CapturingAuditSink();
    const ctx = defaultLoaderContext(sink);
    const store = new ConversationStore({ storePath: dir }, ctx);
    await store.listSessions();
    expect(sink.records.length).toBe(1);
  });

  it('getStats emits exactly one audit per call', async () => {
    const { CapturingAuditSink, defaultLoaderContext } = await import(
      '../security/loader-context.js'
    );
    const sink = new CapturingAuditSink();
    const ctx = defaultLoaderContext(sink);
    const store = new ConversationStore({ storePath: dir }, ctx);
    await store.getStats();
    expect(sink.records.length).toBe(1);
  });

  it('ingestSessionLog gates on logPath param BEFORE readFile', async () => {
    const { CapturingAuditSink, defaultLoaderContext } = await import(
      '../security/loader-context.js'
    );
    const sink = new CapturingAuditSink();
    const ctx = defaultLoaderContext(sink);
    const store = new ConversationStore({ storePath: dir }, ctx);
    const logPath = join(dir, 'session.jsonl');
    await writeFile(logPath, JSON.stringify({ type: 'human', message: 'hi' }) + '\n');
    await store.ingestSessionLog(logPath);
    // 1 audit: ingestSessionLog gates on logPath (read-file). The
    // subsequent ingestTurn writes are out-of-scope per #10457.
    expect(sink.records.length).toBe(1);
    expect(sink.records[0]?.op).toBe('read-file');
    expect(sink.records[0]?.target).toBe(logPath);
  });

  it('throws LoaderContextDenied when ctx rejects storePath on search', async () => {
    const { LoaderContextDenied, CapturingAuditSink } = await import(
      '../security/loader-context.js'
    );
    const sink = new CapturingAuditSink();
    const restrictiveCtx = { allowList: [], audit: sink };
    const store = new ConversationStore({ storePath: dir }, restrictiveCtx);
    await expect(store.search('test')).rejects.toThrow(LoaderContextDenied);
    expect(sink.records.length).toBe(1);
    expect(sink.records[0]?.allowed).toBe(false);
  });

  it('ingestTurn does NOT gate (write-side out-of-scope per #10457)', async () => {
    const { CapturingAuditSink, defaultLoaderContext } = await import(
      '../security/loader-context.js'
    );
    const sink = new CapturingAuditSink();
    const ctx = defaultLoaderContext(sink);
    const store = new ConversationStore({ storePath: dir }, ctx);
    await store.ingestTurn(makeTurn());
    // ingestTurn is write-side: 0 audit records.
    expect(sink.records.length).toBe(0);
  });

  it('endSession does NOT gate (write-side out-of-scope per #10457)', async () => {
    const { CapturingAuditSink, defaultLoaderContext } = await import(
      '../security/loader-context.js'
    );
    const sink = new CapturingAuditSink();
    const ctx = defaultLoaderContext(sink);
    const store = new ConversationStore({ storePath: dir }, ctx);
    await store.ingestTurn(makeTurn());
    sink.clear();
    await store.endSession('session-1');
    // endSession is write-side: 0 audit records.
    expect(sink.records.length).toBe(0);
  });

  it('emits N=3 audit records under K=3 read-method calls (#10456 9th variant)', async () => {
    const { CapturingAuditSink, defaultLoaderContext } = await import(
      '../security/loader-context.js'
    );
    const sink = new CapturingAuditSink();
    const ctx = defaultLoaderContext(sink);
    const store = new ConversationStore({ storePath: dir }, ctx);
    await store.search('test');
    await store.listSessions();
    await store.getStats();
    expect(sink.records.length).toBe(3);
  });

  it('legacy permissive mode (no ctx) preserves prior behavior', async () => {
    const store = new ConversationStore({ storePath: dir });
    await store.ingestTurn(makeTurn());
    const sessions = await store.listSessions();
    expect(sessions.length).toBe(1);
  });
});

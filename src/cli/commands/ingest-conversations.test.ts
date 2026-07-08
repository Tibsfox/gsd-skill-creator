/**
 * ingest-conversations command — the MEM-7 ingestion keystone (JSONL side).
 *
 * Exercises the always-on path (no --pg): parse a Claude Code transcript into
 * the private ConversationStore so memory.search_conversations has real data.
 * The PG dual-write path is covered by the live pg-store integration suite.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ingestConversationsCommand } from './ingest-conversations.js';
import { ConversationStore } from '../../memory/conversation-store.js';

const dirs: string[] = [];
function tmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  dirs.push(d);
  return d;
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

const FIXTURE =
  [
    JSON.stringify({ type: 'human', message: 'How do I wire the gateway?', timestamp: '2026-07-08T00:00:00Z' }),
    JSON.stringify({ type: 'assistant', message: { content: 'Construct a ConversationStore and pass it to the factory.' }, timestamp: '2026-07-08T00:00:01Z' }),
    JSON.stringify({ type: 'human', message: 'And how does semantic search work?', timestamp: '2026-07-08T00:00:02Z' }),
  ].join('\n') + '\n';

describe('ingest-conversations command (keyword / no --pg)', () => {
  it('ingests a transcript file into the ConversationStore', async () => {
    const workdir = tmp('sc-ingest-');
    const convDir = join(workdir, 'conversations');
    const logPath = join(workdir, 'session.jsonl');
    writeFileSync(logPath, FIXTURE);

    const code = await ingestConversationsCommand([logPath, '--conversations-dir', convDir]);
    expect(code).toBe(0);

    const store = new ConversationStore({ storePath: convDir });
    const sessions = await store.listSessions();
    expect(sessions.length).toBe(1);

    const turns = await store.getSessionTurns(sessions[0].id);
    expect(turns.length).toBe(3);
    expect(turns.map((t) => t.role)).toEqual(['human', 'assistant', 'human']);

    // The ingested data is searchable (proves the keystone unblocks search).
    const results = await store.search('semantic', 20);
    expect(results.length).toBeGreaterThan(0);
  });

  it('ingests every .jsonl in a directory and ignores non-transcripts', async () => {
    const workdir = tmp('sc-ingest-');
    const convDir = join(workdir, 'conversations');
    const logsDir = join(workdir, 'logs');
    mkdirSync(logsDir, { recursive: true });
    writeFileSync(join(logsDir, 'a.jsonl'), FIXTURE);
    writeFileSync(join(logsDir, 'b.jsonl'), FIXTURE);
    writeFileSync(join(logsDir, 'ignore.txt'), 'not a transcript');

    const code = await ingestConversationsCommand([logsDir, '--conversations-dir', convDir]);
    expect(code).toBe(0);

    const store = new ConversationStore({ storePath: convDir });
    expect((await store.listSessions()).length).toBe(2);
  });

  it('parses real Claude Code transcript format (type:user, array content, tool_use)', async () => {
    const workdir = tmp('sc-ingest-');
    const convDir = join(workdir, 'conversations');
    const logPath = join(workdir, 'real.jsonl');
    writeFileSync(
      logPath,
      [
        JSON.stringify({ type: 'user', message: { role: 'user', content: 'What is the quokka protocol?' }, timestamp: '2026-07-08T00:00:00Z' }),
        JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'The quokka protocol handles vectors.' }, { type: 'tool_use', name: 'Read', input: {} }] }, timestamp: '2026-07-08T00:00:01Z' }),
      ].join('\n') + '\n',
    );

    const code = await ingestConversationsCommand([logPath, '--conversations-dir', convDir]);
    expect(code).toBe(0);

    const store = new ConversationStore({ storePath: convDir });
    const turns = await store.getSessionTurns((await store.listSessions())[0]!.id);
    expect(turns.length).toBe(2);
    // type:"user" maps to 'human'; string content preserved.
    expect(turns[0]!.role).toBe('human');
    expect(turns[0]!.content).toContain('quokka protocol');
    // array content flattened to its text block; tool_use name extracted.
    expect(turns[1]!.role).toBe('assistant');
    expect(turns[1]!.content).toBe('The quokka protocol handles vectors.');
    expect(turns[1]!.toolCalls).toContain('Read');
  });

  it('handles an empty transcript without throwing (records a 0-turn session)', async () => {
    const workdir = tmp('sc-ingest-');
    const convDir = join(workdir, 'conversations');
    const logPath = join(workdir, 'empty.jsonl');
    writeFileSync(logPath, '\n');

    const code = await ingestConversationsCommand([logPath, '--conversations-dir', convDir]);
    expect(code).toBe(0);

    const store = new ConversationStore({ storePath: convDir });
    const sessions = await store.listSessions();
    expect(sessions.length).toBe(1);
    expect((await store.getSessionTurns(sessions[0]!.id)).length).toBe(0);
  });

  it('is idempotent: a second run over the same transcript adds no duplicate session', async () => {
    const workdir = tmp('sc-ingest-');
    const convDir = join(workdir, 'conversations');
    const logPath = join(workdir, 'session.jsonl');
    writeFileSync(logPath, FIXTURE);

    expect(await ingestConversationsCommand([logPath, '--conversations-dir', convDir])).toBe(0);

    // Re-run: still exit 0, and the report proves it took the no-op skip path.
    const errs: string[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...a) => { errs.push(a.join(' ')); });
    try {
      expect(await ingestConversationsCommand([logPath, '--conversations-dir', convDir])).toBe(0);
    } finally {
      spy.mockRestore();
    }
    expect(errs.find((l) => l.includes('[ingest-conversations]'))!).toContain('1 skipped');

    const store = new ConversationStore({ storePath: convDir });
    expect((await store.listSessions()).length).toBe(1);
    expect((await store.getSessionTurns((await store.listSessions())[0]!.id)).length).toBe(3);
  });

  it('--reingest replaces the session (re-ingested, not skipped) without duplicating turns', async () => {
    const workdir = tmp('sc-ingest-');
    const convDir = join(workdir, 'conversations');
    const logPath = join(workdir, 'session.jsonl');
    writeFileSync(logPath, FIXTURE);

    await ingestConversationsCommand([logPath, '--conversations-dir', convDir]);

    // Spy on the second run's report so a broken --reingest flag (which would
    // SKIP identical content) fails this test rather than passing on end-state.
    const errs: string[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...a) => { errs.push(a.join(' ')); });
    try {
      expect(await ingestConversationsCommand([logPath, '--conversations-dir', convDir, '--reingest'])).toBe(0);
    } finally {
      spy.mockRestore();
    }
    const summary = errs.find((l) => l.includes('[ingest-conversations]'))!;
    expect(summary).toContain('1 re-ingested');
    expect(summary).toContain('0 skipped');

    const store = new ConversationStore({ storePath: convDir });
    expect((await store.listSessions()).length).toBe(1);
    expect((await store.getSessionTurns((await store.listSessions())[0]!.id)).length).toBe(3);
  });

  it('returns 1 when the path names no transcripts', async () => {
    const workdir = tmp('sc-ingest-');
    const code = await ingestConversationsCommand([join(workdir, 'nope.jsonl'), '--conversations-dir', join(workdir, 'c')]);
    expect(code).toBe(1);
  });

  it('returns 1 with no path argument', async () => {
    const code = await ingestConversationsCommand(['--conversations-dir', tmp('sc-ingest-')]);
    expect(code).toBe(1);
  });
});

/**
 * ingest-conversations command — the MEM-7 ingestion keystone (JSONL side).
 *
 * Exercises the always-on path (no --pg): parse a Claude Code transcript into
 * the private ConversationStore so memory.search_conversations has real data.
 * The PG dual-write path is covered by the live pg-store integration suite.
 */
import { describe, it, expect, afterEach } from 'vitest';
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

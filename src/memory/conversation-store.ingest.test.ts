/**
 * ConversationStore.ingestSessionLog — MEM-7 follow-ups (JSONL side, no DB):
 *   - idempotent re-ingest (deterministic identity, skip vs replace);
 *   - richer transcript coverage (tool_result blocks, system/summary entries).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ConversationStore } from './conversation-store.js';

function jsonl(lines: object[]): string {
  return lines.map((l) => JSON.stringify(l)).join('\n') + '\n';
}

describe('ConversationStore.ingestSessionLog — idempotency (MEM-7)', () => {
  let dir: string;
  let convDir: string;
  let logPath: string;

  const TWO_TURNS = jsonl([
    { type: 'human', message: 'first question', timestamp: '2026-07-08T00:00:00Z' },
    { type: 'assistant', message: { content: 'first answer' }, timestamp: '2026-07-08T00:00:01Z' },
  ]);

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'conv-ingest-'));
    convDir = join(dir, 'conversations');
    logPath = join(dir, 'session.jsonl');
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('re-ingesting an identical transcript is a no-op (status skipped, no duplicate turns)', async () => {
    await writeFile(logPath, TWO_TURNS);
    const store = new ConversationStore({ storePath: convDir });

    const first = await store.ingestSessionLog(logPath);
    expect(first.status).toBe('ingested');
    expect(first.turnsWritten).toBe(2);

    const second = await store.ingestSessionLog(logPath);
    expect(second.status).toBe('skipped');
    expect(second.turnsWritten).toBe(0);
    expect(second.session.id).toBe(first.session.id); // stable identity

    // Exactly one session, exactly two turns — no duplication.
    expect((await store.listSessions()).length).toBe(1);
    expect((await store.getSessionTurns(first.session.id)).length).toBe(2);
  });

  it('skips across store instances (idempotency key persists in the index)', async () => {
    await writeFile(logPath, TWO_TURNS);
    const first = await new ConversationStore({ storePath: convDir }).ingestSessionLog(logPath);
    expect(first.status).toBe('ingested');

    // Fresh instance reads sessions.json (with sourceHash) and still skips.
    const second = await new ConversationStore({ storePath: convDir }).ingestSessionLog(logPath);
    expect(second.status).toBe('skipped');
    expect(second.session.id).toBe(first.session.id);
  });

  it('re-ingests cleanly when the transcript content changes (grown session)', async () => {
    await writeFile(logPath, TWO_TURNS);
    const store = new ConversationStore({ storePath: convDir });
    const first = await store.ingestSessionLog(logPath);

    // Same path, more turns — a grown session.
    await writeFile(
      logPath,
      TWO_TURNS +
        jsonl([{ type: 'human', message: 'a third turn', timestamp: '2026-07-08T00:00:02Z' }]),
    );
    const second = await store.ingestSessionLog(logPath);

    expect(second.status).toBe('reingested');
    expect(second.session.id).toBe(first.session.id);
    // Turns reflect the new content with NO duplication of the original two.
    expect((await store.getSessionTurns(first.session.id)).length).toBe(3);
    expect((await store.listSessions()).length).toBe(1);
  });

  it('--reingest forces a replace even when the content is unchanged', async () => {
    await writeFile(logPath, TWO_TURNS);
    const store = new ConversationStore({ storePath: convDir });
    const first = await store.ingestSessionLog(logPath);

    const forced = await store.ingestSessionLog(logPath, { reingest: true });
    expect(forced.status).toBe('reingested');
    expect(forced.session.id).toBe(first.session.id);
    // Still exactly two turns — the replace purged before rebuilding.
    expect((await store.getSessionTurns(first.session.id)).length).toBe(2);
  });

  it('identical content at distinct paths yields distinct sessions', async () => {
    const a = join(dir, 'a.jsonl');
    const b = join(dir, 'b.jsonl');
    await writeFile(a, TWO_TURNS);
    await writeFile(b, TWO_TURNS);
    const store = new ConversationStore({ storePath: convDir });

    const ra = await store.ingestSessionLog(a);
    const rb = await store.ingestSessionLog(b);
    expect(ra.status).toBe('ingested');
    expect(rb.status).toBe('ingested'); // different path -> different identity
    expect(rb.session.id).not.toBe(ra.session.id);
    expect((await store.listSessions()).length).toBe(2);
  });

  it('reconciles a source path re-ingested under a different derived id (no duplicate session)', async () => {
    const store = new ConversationStore({ storePath: convDir });
    // First ingest: no embedded sessionId, so identity is the path hash.
    await writeFile(logPath, jsonl([
      { type: 'human', message: 'before it had a sessionId', timestamp: '2026-07-08T00:00:00Z' },
    ]));
    const first = await store.ingestSessionLog(logPath);
    expect(first.status).toBe('ingested');

    // Same path, now the transcript carries its own sessionId -> a DIFFERENT id.
    const sid = '99999999-8888-4777-8666-555555555555';
    await writeFile(logPath, jsonl([
      { type: 'user', sessionId: sid, message: { role: 'user', content: 'now it has a sessionId' }, timestamp: '2026-07-08T00:00:01Z' },
    ]));
    const second = await store.ingestSessionLog(logPath);

    expect(second.status).toBe('reingested');
    expect(second.session.id).toBe(sid);
    expect(second.replacedId).toBe(first.session.id); // prior session superseded
    // Exactly one session survives, keyed by the new identity.
    const sessions = await store.listSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0]!.id).toBe(sid);
  });

  it("uses the transcript's own sessionId as identity when present", async () => {
    const sid = '11111111-2222-4333-8444-555555555555';
    await writeFile(
      logPath,
      jsonl([
        { type: 'user', sessionId: sid, message: { role: 'user', content: 'hello there' }, timestamp: '2026-07-08T00:00:00Z' },
      ]),
    );
    const store = new ConversationStore({ storePath: convDir });
    const res = await store.ingestSessionLog(logPath);
    expect(res.session.id).toBe(sid);
  });
});

describe('ConversationStore.ingestSessionLog — richer transcript coverage (MEM-7)', () => {
  let dir: string;
  let convDir: string;
  let logPath: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'conv-cover-'));
    convDir = join(dir, 'conversations');
    logPath = join(dir, 'session.jsonl');
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('captures tool_result block content (string and nested-array forms)', async () => {
    await writeFile(
      logPath,
      jsonl([
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: 'x', content: 'quokkaResultString value' }],
          },
          timestamp: '2026-07-08T00:00:00Z',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              { type: 'tool_result', tool_use_id: 'y', content: [{ type: 'text', text: 'quokkaResultNested value' }] },
            ],
          },
          timestamp: '2026-07-08T00:00:01Z',
        },
      ]),
    );
    const store = new ConversationStore({ storePath: convDir });
    await store.ingestSessionLog(logPath);

    // Both tool_result payloads became searchable turns.
    expect((await store.search('quokkaResultString')).length).toBeGreaterThan(0);
    expect((await store.search('quokkaResultNested')).length).toBeGreaterThan(0);
  });

  it('captures system entries (top-level content) and summary entries', async () => {
    await writeFile(
      logPath,
      jsonl([
        { type: 'system', subtype: 'hook', content: 'quokkaSystemMarker note', timestamp: '2026-07-08T00:00:00Z' },
        { type: 'summary', summary: 'quokkaSummaryMarker of the session', timestamp: '2026-07-08T00:00:01Z' },
      ]),
    );
    const store = new ConversationStore({ storePath: convDir });
    const res = await store.ingestSessionLog(logPath);

    expect(res.turnsWritten).toBe(2);
    const turns = await store.getSessionTurns(res.session.id);
    expect(turns.every((t) => t.role === 'system')).toBe(true);
    expect((await store.search('quokkaSystemMarker')).length).toBeGreaterThan(0);
    expect((await store.search('quokkaSummaryMarker')).length).toBeGreaterThan(0);
  });
});

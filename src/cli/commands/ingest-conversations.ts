/**
 * CLI command: ingest Claude Code conversation transcripts.
 *
 * This is the ingestion keystone for MEM-7: the memory gateway can *search*
 * conversation history (keyword via ConversationStore, semantic via the PG tier),
 * but nothing wrote conversation turns until this command. It parses one or more
 * Claude Code JSONL transcripts into the private ConversationStore (always-on,
 * gitignored JSONL) and — under `--pg` — mirrors them into the LOD-400 PgStore
 * with turn embeddings, so `memory.search_conversations` has real data and the
 * semantic path returns results.
 *
 * Conversation data is ALWAYS PRIVATE: gitignored local JSONL and a private
 * `gsd_memory` schema. It never leaves the local machine.
 */

import { resolve, join } from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { ConversationStore } from '../../memory/conversation-store.js';
import { PgStore } from '../../memory/pg-store.js';
import { getEmbeddingService } from '../../embeddings/index.js';
import { loadPgEnv } from '../../scribe/pg-runtime/env-loader.js';

/** Read a `--flag value` or `--flag=value` option; undefined if absent. */
function readFlag(args: string[], name: string): string | undefined {
  const eq = args.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const idx = args.indexOf(name);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

/** Resolve a target to the list of .jsonl transcripts it names. */
async function collectLogs(target: string): Promise<string[]> {
  const st = await stat(target);
  if (st.isFile()) return [target];
  if (st.isDirectory()) {
    const entries = await readdir(target);
    return entries
      .filter((e) => e.endsWith('.jsonl'))
      .map((e) => join(target, e))
      .sort();
  }
  return [];
}

/**
 * Ingest conversation transcripts into the private stores.
 *
 * @param args - Command-line arguments (after 'ingest-conversations').
 * @returns Exit code (0 if at least one transcript ingested, 1 otherwise).
 */
export async function ingestConversationsCommand(args: string[]): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return 0;
  }

  const target = args.find((a) => !a.startsWith('-'));
  if (!target) {
    console.error(
      'ingest-conversations: missing <path> (a .jsonl transcript or a directory of them)',
    );
    return 1;
  }

  const conversationsDir = resolve(
    readFlag(args, '--conversations-dir') ?? join(process.cwd(), '.claude', 'conversations'),
  );

  let logs: string[];
  try {
    logs = await collectLogs(resolve(target));
  } catch (err) {
    console.error(
      `ingest-conversations: cannot read ${target} -- ${err instanceof Error ? err.message : String(err)}`,
    );
    return 1;
  }
  if (logs.length === 0) {
    console.error(`ingest-conversations: no .jsonl transcripts found at ${target}`);
    return 1;
  }

  const conversationStore = new ConversationStore({ storePath: conversationsDir });

  // --pg: mirror into the LOD-400 PgStore with embedded turns so semantic search
  // works. Uses the process-local EmbeddingService; the gateway must run in the
  // SAME embedder MODE (model vs heuristic) at query time for the vectors to be
  // comparable — which holds when the model is consistently available (or absent)
  // across runs. Absent RH_POSTGRES_URL or an unreachable DB, degrade to
  // JSONL-only rather than failing.
  let pg: PgStore | undefined;
  if (args.includes('--pg')) {
    const env = loadPgEnv();
    if (!env.ok) {
      console.error('ingest-conversations: --pg given but no RH_POSTGRES_URL found; ingesting JSONL only');
    } else {
      const embedder = await getEmbeddingService();
      const candidate = new PgStore({ connectionString: env.url }, embedder);
      // Pre-flight the connection ONCE. Without this, an unreachable DB would
      // both (a) report false "embedded into PostgreSQL" success and (b) re-init
      // on every storeTurn (~10s each), so an N-turn transcript could hang ~N*10s.
      if (await candidate.isReady()) {
        pg = candidate;
      } else {
        console.error('ingest-conversations: --pg given but the database is unreachable; ingesting JSONL only');
        await candidate.close();
      }
    }
  }

  let ok = 0;
  let failed = 0;
  let turnTotal = 0;
  try {
    for (const logPath of logs) {
      try {
        const session = await conversationStore.ingestSessionLog(logPath);
        const turns = await conversationStore.getSessionTurns(session.id);

        if (pg) {
          // Session row FIRST — conversation_turns.session_id is a UUID FK to
          // conversation_sessions.id. ingestSessionLog mints a randomUUID id.
          await pg.storeSession({
            id: session.id,
            startedAt: session.startedAt,
            endedAt: session.endedAt ?? undefined,
            project: session.project,
            branch: session.branch,
            summary: session.summary,
            topics: session.topics,
          });
          for (const t of turns) {
            await pg.storeTurn({
              id: t.id,
              sessionId: session.id,
              role: t.role,
              content: t.content,
              timestamp: t.timestamp,
              toolCalls: t.toolCalls,
              filesAccessed: t.filesAccessed,
              tags: t.tags,
            });
          }
        }

        ok++;
        turnTotal += turns.length;
        console.error(`  + ${logPath} -> ${session.id} (${turns.length} turns)`);
      } catch (err) {
        failed++;
        console.error(
          `  ! ${logPath} -> skipped (${err instanceof Error ? err.message : String(err)})`,
        );
      }
    }
  } finally {
    if (pg) await pg.close();
  }

  console.error(
    `[ingest-conversations] ${ok} ingested, ${failed} failed, ${turnTotal} turns into ${conversationsDir}${
      pg ? ' + PostgreSQL LOD-400 (embedded)' : ''
    }`,
  );
  return ok > 0 ? 0 : 1;
}

function showHelp(): void {
  console.log(`
skill-creator ingest-conversations - Ingest Claude Code conversation transcripts

Usage:
  skill-creator ingest-conversations <path> [options]

Parses one or more Claude Code JSONL transcripts into the private, always-on
ConversationStore (gitignored JSONL) so memory.search_conversations has data to
search. With --pg, also mirrors them into the LOD-400 PgStore with per-turn
embeddings, enabling semantic conversation search on the gateway.

Conversation data is ALWAYS PRIVATE and never leaves the local machine.

Re-ingesting the same transcript creates a NEW session each run (a fresh UUID);
there is no content-based dedup yet, so avoid ingesting the same file twice.

Arguments:
  <path>              A .jsonl transcript file, or a directory of them.

Options:
  --pg                Also mirror into the PostgreSQL LOD-400 tier with embeddings
                      (uses RH_POSTGRES_URL; degrades to JSONL-only if absent).
  --conversations-dir <dir>  ConversationStore directory (default <cwd>/.claude/conversations)
  --help, -h          Show this help message.
`);
}

/**
 * CLI command for starting the GSD-OS MCP HTTP gateway.
 *
 * Unlike `mcp-server` (stdio transport, skill tools only), the gateway serves
 * the full GSD-OS tool suite over authenticated Streamable HTTP and -- by
 * default -- the LOD-tiered memory.* tools backed by a local FileStore. This
 * is the reachable entry point for the memory subsystem (MEM-1): before it,
 * `MemoryService` and the eight memory tools were shipped but never launched.
 *
 * stdout is safe to write here -- this is HTTP, not a stdio MCP channel --
 * but server-lifecycle logs go to stderr for consistency with the gateway
 * server itself.
 */

import { resolve, join } from 'node:path';
import { startGateway, type GatewayHandle } from '../../mcp/gateway/server.js';
import { createGsdGatewayFactory } from '../../mcp/gateway/create-gateway-server.js';
import { MemoryService } from '../../memory/service.js';
import { ConversationStore } from '../../memory/conversation-store.js';
import { getEmbeddingService } from '../../embeddings/index.js';
import { loadPgEnv } from '../../scribe/pg-runtime/env-loader.js';
import {
  DEFAULT_GATEWAY_PORT,
  DEFAULT_GATEWAY_HOST,
  DEFAULT_TOKEN_PATH,
} from '../../mcp/gateway/types.js';

/** Read a `--flag value` or `--flag=value` option; undefined if absent. */
function readFlag(args: string[], name: string): string | undefined {
  const eq = args.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const idx = args.indexOf(name);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

/**
 * Start the MCP HTTP gateway.
 *
 * @param args - Command-line arguments (after 'gateway').
 * @returns Exit code (0 on clean shutdown, 1 on error).
 */
export async function gatewayCommand(args: string[]): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    showGatewayHelp();
    return 0;
  }

  const portRaw = readFlag(args, '--port');
  const port = portRaw !== undefined ? Number(portRaw) : DEFAULT_GATEWAY_PORT;
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    console.error(`gateway: invalid --port "${portRaw}" (expected an integer 0-65535)`);
    return 1;
  }

  const host = readFlag(args, '--host') ?? DEFAULT_GATEWAY_HOST;
  const tokenPath = readFlag(args, '--token') ?? DEFAULT_TOKEN_PATH;
  const enableJsonResponse = args.includes('--json');
  const memoryEnabled = !args.includes('--no-memory');
  const memoryDir = resolve(
    readFlag(args, '--memory-dir') ?? join(process.cwd(), '.claude', 'memory'),
  );
  // Conversation history lives outside the (committed) memory FileStore dir: it
  // is always-private and must stay gitignored. Defaults to .claude/conversations.
  const conversationsDir = resolve(
    readFlag(args, '--conversations-dir') ?? join(process.cwd(), '.claude', 'conversations'),
  );

  // --pg enables the LOD-400 PostgreSQL tier, resolving RH_POSTGRES_URL from
  // process.env or the repo .env. Absent a URL, warn and continue without it.
  let pgConnectionString: string | undefined;
  if (args.includes('--pg')) {
    const env = loadPgEnv();
    if (env.ok) {
      pgConnectionString = env.url;
    } else {
      console.error('gateway: --pg given but no RH_POSTGRES_URL found; continuing without LOD-400');
    }
  }

  // indexPath is a filename resolved under memoryDir by IndexManager
  // (join(memoryDir, indexFile)); pass the bare filename, not an absolute path.
  // MEM-7 step 2: under --pg, build an embedder for QUERY embedding (the semantic
  // adapter below). Conversation turns are written + embedded by the separate
  // `ingest-conversations` CLI, so both processes must run in the SAME embedder
  // MODE (model vs heuristic) for query and turn vectors to be comparable — which
  // holds when the model is consistently available (or absent) across runs. Also
  // handed to PgStore so any future gateway-side write embeds consistently.
  const conversationEmbedder = pgConnectionString ? await getEmbeddingService() : undefined;

  const memoryService = memoryEnabled
    ? new MemoryService({ memoryDir, indexPath: 'MEMORY.md', pgConnectionString, conversationEmbedder })
    : undefined;

  // Wire the always-on, no-DB conversation store so memory.search_conversations
  // performs real keyword search over JSONL instead of returning "not configured".
  // Mirrors the FileStore pattern: no LoaderContext in the default runtime
  // (ensureAllowed is a no-op without one). Only meaningful alongside the memory
  // tools, which are registered only when memoryService is present.
  const conversationStore = memoryEnabled
    ? new ConversationStore({ storePath: conversationsDir })
    : undefined;

  // Semantic conversation search (MEM-7 step 2): embed the query, then pgvector
  // cosine over the PgStore conversation tables. Present only under --pg with an
  // embedder; the search tool prefers it and falls back to keyword when empty.
  const pgConversationStore = pgConnectionString ? memoryService?.getPgConversationStore() : undefined;
  const pgConversationSearch = pgConversationStore && conversationEmbedder
    ? {
        async search(query: string, limit: number, sessionFilter?: string[]) {
          // Pass the query's embedder method so semantic search only compares
          // vectors from the same mode (guards a cross-process model/heuristic
          // mismatch, MEM-7). Turns embedded in a different mode are excluded.
          const { embedding, method } = await conversationEmbedder.embed(query);
          return pgConversationStore.searchConversationsByEmbedding(embedding, limit, sessionFilter, method);
        },
      }
    : undefined;

  const factory = createGsdGatewayFactory({ memoryService, conversationStore, pgConversationSearch });

  let handle: GatewayHandle;
  try {
    handle = await startGateway({ port, host, tokenPath, enableJsonResponse }, factory);
  } catch (err) {
    console.error(
      `gateway: failed to start -- ${err instanceof Error ? err.message : String(err)}`,
    );
    return 1;
  }

  const address = handle.httpServer.address();
  const boundPort = typeof address === 'object' && address !== null ? address.port : port;
  console.error(`[gateway] listening on http://${host}:${boundPort}${handle.config.mcpEndpoint}`);
  console.error(`[gateway] bearer token: ${tokenPath} (scopes: ${handle.tokenInfo.scopes.join(', ')})`);
  console.error(
    `[gateway] memory tools: ${
      memoryService
        ? `on (FileStore at ${memoryDir}${pgConnectionString ? ' + PostgreSQL LOD-400' : ''})`
        : 'off'
    }`,
  );
  if (conversationStore) {
    console.error(
      `[gateway] conversation search: on (${pgConversationSearch ? 'PG semantic + ' : ''}keyword at ${conversationsDir})`,
    );
  }
  console.error('[gateway] press Ctrl+C to stop');

  // Keep the process alive until an interrupt/terminate signal, then shut the
  // gateway down gracefully. The HTTP server itself holds the event loop open.
  await new Promise<void>((resolvePromise) => {
    const shutdown = async () => {
      console.error('\n[gateway] shutting down...');
      try {
        await handle.stop();
      } catch {
        // Ignore shutdown errors -- we are exiting anyway.
      }
      resolvePromise();
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  });

  return 0;
}

function showGatewayHelp(): void {
  console.log(`
skill-creator gateway - Start the GSD-OS MCP HTTP gateway

Usage:
  skill-creator gateway [options]

Serves the full GSD-OS tool suite (chipset, agent, workflow, session) plus the
LOD-tiered memory.* tools over authenticated Streamable HTTP. Memory tools are
backed by a local FileStore under <cwd>/.claude/memory and are ON by default;
pass --no-memory for a memory-free gateway.

Options:
  --port <n>          Port to listen on (default ${DEFAULT_GATEWAY_PORT}; 0 = OS-assigned ephemeral)
  --host <addr>       Host to bind (default ${DEFAULT_GATEWAY_HOST})
  --token <path>      Bearer token file (default ${DEFAULT_TOKEN_PATH})
  --memory-dir <dir>  Memory FileStore directory (default <cwd>/.claude/memory)
  --conversations-dir <dir>  Conversation history directory (default <cwd>/.claude/conversations)
  --no-memory         Disable the memory.* tools
  --pg                Enable the LOD-400 PostgreSQL tier (uses RH_POSTGRES_URL)
  --json              Return JSON responses instead of SSE streams
  --help, -h          Show this help message

The bearer token is auto-created on first run. Point your MCP client at
http://<host>:<port>/mcp with an "Authorization: Bearer <token>" header.
`);
}

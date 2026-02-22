/**
 * GSD-OS MCP Gateway Server -- Streamable HTTP transport with authentication.
 *
 * Exposes GSD-OS functionality to external MCP clients over HTTP. Uses the
 * MCP SDK's StreamableHTTPServerTransport for protocol compliance and adds
 * bearer token authentication with role-based scope enforcement.
 *
 * Handles concurrent sessions safely via per-session transport isolation.
 * All failures produce structured JSON-RPC error responses -- the server
 * never crashes on malformed input.
 *
 * CRITICAL: Never use console.log in this file -- use console.error for
 * server-side logging to avoid polluting potential stdio channels.
 */

import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { authenticateRequest, canInvokeTool, getToolScope } from './auth.js';
import { readOrCreateToken } from './token-manager.js';
import {
  formatJsonRpcError,
  INTERNAL_ERROR,
  PARSE_ERROR,
  PERMISSION_DENIED,
} from './errors.js';
import {
  GatewayConfigSchema,
  type GatewayConfig,
  type TokenInfo,
} from './types.js';

// ── Session Management ─────────────────────────────────────────────────────

/** Active transport sessions tracked by session ID. */
interface SessionEntry {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
  createdAt: number;
}

// ── Gateway Server ─────────────────────────────────────────────────────────

/** Running gateway server state. */
export interface GatewayHandle {
  /** The underlying Node.js HTTP server. */
  httpServer: Server;
  /** The resolved configuration. */
  config: GatewayConfig;
  /** The loaded token info. */
  tokenInfo: TokenInfo;
  /** Number of active sessions. */
  activeSessions: () => number;
  /** Stop the gateway server gracefully. */
  stop: () => Promise<void>;
}

/**
 * Factory function type for creating MCP server instances.
 * Allows gateway consumers to configure tools, resources, and prompts
 * on each new session's MCP server.
 */
export type McpServerFactory = () => McpServer;

/**
 * Default MCP server factory -- creates a minimal server with server info.
 */
function defaultServerFactory(): McpServer {
  return new McpServer({
    name: 'gsd-os-gateway',
    version: '1.0.0',
  });
}

/**
 * Create and start the GSD-OS MCP gateway server.
 *
 * The server:
 * 1. Listens on a configurable host:port (default 127.0.0.1:3100)
 * 2. Authenticates all requests via bearer token from ~/.gsd/gateway-token
 * 3. Creates per-session StreamableHTTPServerTransport instances
 * 4. Dispatches authenticated requests to the correct session transport
 * 5. Handles errors gracefully with structured JSON-RPC responses
 *
 * @param config - Partial gateway configuration (defaults applied via schema)
 * @param serverFactory - Optional factory for creating MCP server instances per session
 * @returns A handle to the running gateway server
 */
export async function startGateway(
  config?: Partial<GatewayConfig>,
  serverFactory?: McpServerFactory,
): Promise<GatewayHandle> {
  const resolvedConfig = GatewayConfigSchema.parse(config ?? {});
  const factory = serverFactory ?? defaultServerFactory;

  // Load or create the authentication token
  const { tokenInfo } = await readOrCreateToken(resolvedConfig.tokenPath);

  // Active sessions keyed by session ID -- concurrent access is safe because
  // Node.js is single-threaded; Map operations are atomic within a tick.
  const sessions = new Map<string, SessionEntry>();

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      await handleRequest(req, res, resolvedConfig, tokenInfo, sessions, factory);
    } catch (err) {
      // Last-resort error handler -- must never crash the server (GATE-25)
      console.error('[gateway] Unhandled error in request handler:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(
          formatJsonRpcError(null, INTERNAL_ERROR, 'Internal server error'),
        ));
      }
    }
  });

  // Start listening
  await new Promise<void>((resolve, reject) => {
    httpServer.on('error', reject);
    httpServer.listen(resolvedConfig.port, resolvedConfig.host, () => {
      httpServer.removeListener('error', reject);
      resolve();
    });
  });

  console.error(
    `[gateway] MCP gateway server listening on ${resolvedConfig.host}:${resolvedConfig.port}`,
  );

  const stop = async () => {
    // Close all active sessions
    const closePromises: Promise<void>[] = [];
    for (const [, entry] of sessions) {
      closePromises.push(
        (async () => {
          try {
            await entry.transport.close();
            await entry.server.close();
          } catch {
            // Ignore cleanup errors during shutdown
          }
        })(),
      );
    }
    await Promise.all(closePromises);
    sessions.clear();

    // Close the HTTP server
    await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };

  return {
    httpServer,
    config: resolvedConfig,
    tokenInfo,
    activeSessions: () => sessions.size,
    stop,
  };
}

// ── Scope Enforcement Helpers ─────────────────────────────────────────────

/**
 * Extended IncomingMessage with rawBody property.
 * The Hono/node-server adapter recognizes rawBody and uses it directly
 * instead of re-reading the stream, enabling body pre-processing.
 */
interface IncomingMessageWithRawBody extends IncomingMessage {
  rawBody?: Buffer;
}

/**
 * Buffer the entire request body into a single Buffer.
 */
function bufferBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Extract the tool name from a JSON-RPC request body if it is a tools/call.
 * Returns null if the body is not a tools/call or cannot be parsed.
 * For batch requests, returns the first tools/call tool name found.
 */
function extractToolCallName(body: Buffer): { id: string | number | null; toolName: string } | null {
  try {
    const parsed = JSON.parse(body.toString('utf-8'));

    // Single request
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (parsed.method === 'tools/call' && parsed.params?.name) {
        return { id: parsed.id ?? null, toolName: parsed.params.name };
      }
      return null;
    }

    // Batch request -- check each item
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item && typeof item === 'object' && item.method === 'tools/call' && item.params?.name) {
          return { id: item.id ?? null, toolName: item.params.name };
        }
      }
    }

    return null;
  } catch {
    // If JSON parsing fails, let it pass through -- MCP server handles protocol errors
    return null;
  }
}

// ── Request Handling ───────────────────────────────────────────────────────

/**
 * Handle an incoming HTTP request to the gateway.
 *
 * Request pipeline:
 * 1. Route check (only /mcp endpoint)
 * 2. Authentication (bearer token validation)
 * 3. Per-tool scope enforcement for tools/call requests via canInvokeTool
 * 4. Session routing (existing session or new session creation)
 * 5. Transport dispatch (StreamableHTTPServerTransport handles MCP protocol)
 *
 * All errors at every stage produce structured responses -- HTTP errors for
 * pre-protocol failures, JSON-RPC errors for protocol-level failures.
 */
async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  config: GatewayConfig,
  tokenInfo: TokenInfo,
  sessions: Map<string, SessionEntry>,
  serverFactory: McpServerFactory,
): Promise<void> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  // Only handle requests to the MCP endpoint
  if (url.pathname !== config.mcpEndpoint) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // Reject unsupported HTTP methods early
  if (req.method && !['GET', 'POST', 'DELETE'].includes(req.method)) {
    res.writeHead(405, {
      'Content-Type': 'application/json',
      'Allow': 'GET, POST, DELETE',
    });
    res.end(JSON.stringify({ error: `Method ${req.method} not allowed` }));
    return;
  }

  // Authenticate the request
  const authResult = authenticateRequest(req, tokenInfo);
  if (!authResult.authenticated) {
    res.writeHead(authResult.statusCode ?? 401, {
      'Content-Type': 'application/json',
      'WWW-Authenticate': 'Bearer',
    });
    res.end(JSON.stringify({ error: authResult.errorMessage }));
    return;
  }

  // For POST requests, buffer the body for scope enforcement.
  // After buffering, set rawBody on the request so the Hono adapter
  // (used internally by StreamableHTTPServerTransport) can re-read
  // the body without consuming the stream again.
  if (req.method === 'POST') {
    const body = await bufferBody(req);
    (req as IncomingMessageWithRawBody).rawBody = body;

    // Per-tool scope enforcement: check canInvokeTool for tools/call requests
    const toolCall = extractToolCallName(body);
    if (toolCall && authResult.authInfo) {
      if (!canInvokeTool(authResult.authInfo, toolCall.toolName)) {
        const requiredScope = getToolScope(toolCall.toolName);
        const grantedScopes = authResult.authInfo.scopes.join(', ');
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(
          formatJsonRpcError(
            toolCall.id,
            PERMISSION_DENIED,
            `Insufficient scope for tool "${toolCall.toolName}". Required: ${requiredScope}, granted: ${grantedScopes}`,
          ),
        ));
        return;
      }
    }
  }

  // Check for existing session
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId && sessions.has(sessionId)) {
    // Route to existing session's transport
    const entry = sessions.get(sessionId)!;
    // Attach auth info to the request for the transport
    (req as IncomingMessage & { auth?: typeof authResult.authInfo }).auth = authResult.authInfo;
    await entry.transport.handleRequest(req, res);
    return;
  }

  // Handle DELETE for non-existent session
  if (req.method === 'DELETE') {
    if (sessionId) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Session not found' }));
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing session ID' }));
    }
    return;
  }

  // Handle GET for non-existent session
  if (req.method === 'GET' && sessionId) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Session not found' }));
    return;
  }

  // New session -- create transport and MCP server
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: config.enableJsonResponse,
    onsessioninitialized: (newSessionId: string) => {
      // Register the session in the concurrent-safe sessions map
      sessions.set(newSessionId, { transport, server, createdAt: Date.now() });
    },
  });

  const server = serverFactory();

  // Clean up session when transport closes (handles disconnect/cleanup)
  transport.onclose = () => {
    const sid = transport.sessionId;
    if (sid) {
      sessions.delete(sid);
    }
  };

  // Log transport errors without crashing (GATE-25)
  transport.onerror = (err: Error) => {
    console.error(`[gateway] Transport error for session ${transport.sessionId}:`, err.message);
  };

  // Connect MCP server to transport
  await server.connect(transport);

  // Attach auth info and handle the initialization request
  (req as IncomingMessage & { auth?: typeof authResult.authInfo }).auth = authResult.authInfo;
  await transport.handleRequest(req, res);
}

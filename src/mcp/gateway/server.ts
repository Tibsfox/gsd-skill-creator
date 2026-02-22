/**
 * GSD-OS MCP Gateway Server -- Streamable HTTP transport with authentication.
 *
 * Exposes GSD-OS functionality to external MCP clients over HTTP. Uses the
 * MCP SDK's StreamableHTTPServerTransport for protocol compliance and adds
 * bearer token authentication with role-based scope enforcement.
 *
 * CRITICAL: Never use console.log in this file -- use console.error for
 * server-side logging to avoid polluting potential stdio channels.
 */

import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { authenticateRequest } from './auth.js';
import { readOrCreateToken } from './token-manager.js';
import {
  GatewayConfigSchema,
  DEFAULT_GATEWAY_PORT,
  DEFAULT_GATEWAY_HOST,
  DEFAULT_TOKEN_PATH,
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
  /** Stop the gateway server. */
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

  // Active sessions keyed by session ID
  const sessions = new Map<string, SessionEntry>();

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      await handleRequest(req, res, resolvedConfig, tokenInfo, sessions, factory);
    } catch (err) {
      // Last-resort error handler -- must never crash the server
      console.error('[gateway] Unhandled error in request handler:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        }));
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
    for (const [, entry] of sessions) {
      try {
        await entry.transport.close();
        await entry.server.close();
      } catch {
        // Ignore cleanup errors
      }
    }
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
    stop,
  };
}

// ── Request Handling ───────────────────────────────────────────────────────

/**
 * Handle an incoming HTTP request to the gateway.
 *
 * Routes through authentication, then dispatches to the appropriate
 * StreamableHTTPServerTransport based on session ID.
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

  // Authenticate the request
  const authResult = authenticateRequest(req, tokenInfo);
  if (!authResult.authenticated) {
    res.writeHead(authResult.statusCode ?? 401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: authResult.errorMessage }));
    return;
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

  // Handle GET for non-existent session (SSE standalone stream not valid without session)
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
      // Register the session
      sessions.set(newSessionId, { transport, server, createdAt: Date.now() });
    },
  });

  const server = serverFactory();

  // Clean up session when transport closes
  transport.onclose = () => {
    const sid = transport.sessionId;
    if (sid) {
      sessions.delete(sid);
    }
  };

  // Connect MCP server to transport
  await server.connect(transport);

  // Attach auth info and handle the initialization request
  (req as IncomingMessage & { auth?: typeof authResult.authInfo }).auth = authResult.authInfo;
  await transport.handleRequest(req, res);
}

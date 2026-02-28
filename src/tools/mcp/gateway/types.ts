/**
 * Gateway configuration types for the GSD-OS MCP HTTP gateway.
 *
 * Defines the configuration schema, token info, and role-based scope system
 * used by the gateway server for authentication and authorization.
 */

import { z } from 'zod';

// ── Gateway Scopes ─────────────────────────────────────────────────────────

/** Role-based scopes controlling gateway tool access. */
export const GatewayScopeSchema = z.enum(['read', 'write', 'admin']);

/** A gateway access scope. */
export type GatewayScope = z.infer<typeof GatewayScopeSchema>;

/**
 * Scope hierarchy: admin > write > read.
 * Each scope includes all permissions of lower scopes.
 */
export const SCOPE_HIERARCHY: Record<GatewayScope, GatewayScope[]> = {
  read: ['read'],
  write: ['read', 'write'],
  admin: ['read', 'write', 'admin'],
};

// ── Token Info ─────────────────────────────────────────────────────────────

/** Information about a gateway authentication token. */
export const TokenInfoSchema = z.object({
  /** The bearer token string (64 hex chars = 32 bytes). */
  token: z.string().regex(/^[0-9a-f]{64}$/, 'Token must be 64 hex characters'),
  /** Scopes granted to this token. */
  scopes: z.array(GatewayScopeSchema).min(1),
  /** When the token was created (epoch ms). */
  createdAt: z.number(),
});

/** Token metadata for authentication. */
export type TokenInfo = z.infer<typeof TokenInfoSchema>;

// ── Gateway Config ─────────────────────────────────────────────────────────

/** Default gateway port. */
export const DEFAULT_GATEWAY_PORT = 3100;

/** Default gateway host. */
export const DEFAULT_GATEWAY_HOST = '127.0.0.1';

/** Default token file path. */
export const DEFAULT_TOKEN_PATH = '~/.gsd/gateway-token';

/** Gateway server configuration schema. */
export const GatewayConfigSchema = z.object({
  /** Port to listen on. */
  port: z.number().int().min(1).max(65535).default(DEFAULT_GATEWAY_PORT),
  /** Host to bind to. */
  host: z.string().default(DEFAULT_GATEWAY_HOST),
  /** Path to the bearer token file. */
  tokenPath: z.string().default(DEFAULT_TOKEN_PATH),
  /** MCP endpoint path. */
  mcpEndpoint: z.string().default('/mcp'),
  /** Enable JSON responses instead of SSE streams. */
  enableJsonResponse: z.boolean().default(false),
});

/** Gateway server configuration. */
export type GatewayConfig = z.infer<typeof GatewayConfigSchema>;

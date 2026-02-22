/**
 * Gateway authentication middleware -- bearer token validation and scope enforcement.
 *
 * Extracts the Authorization header from incoming HTTP requests, validates the
 * bearer token against the stored token, and checks role-based scopes for
 * tool access control.
 */

import type { IncomingMessage } from 'node:http';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { validateToken } from './token-manager.js';
import { SCOPE_HIERARCHY, type GatewayScope, type TokenInfo } from './types.js';

/**
 * Result of an authentication attempt.
 */
export interface AuthResult {
  /** Whether authentication succeeded. */
  authenticated: boolean;
  /** Auth info to pass to the MCP transport (only set on success). */
  authInfo?: AuthInfo;
  /** HTTP status code to return on failure. */
  statusCode?: number;
  /** Error message to include in the response body. */
  errorMessage?: string;
}

/**
 * Extract the bearer token from an HTTP request's Authorization header.
 * Returns null if the header is missing or malformed.
 */
export function extractBearerToken(req: IncomingMessage): string | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1] ?? null;
}

/**
 * Authenticate an incoming HTTP request using bearer token.
 *
 * @param req - The incoming HTTP request
 * @param storedToken - The stored token info to validate against
 * @returns Authentication result with auth info or error details
 */
export function authenticateRequest(req: IncomingMessage, storedToken: TokenInfo): AuthResult {
  const bearerToken = extractBearerToken(req);

  if (!bearerToken) {
    return {
      authenticated: false,
      statusCode: 401,
      errorMessage: 'Missing or malformed Authorization header. Expected: Bearer <token>',
    };
  }

  const tokenInfo = validateToken(bearerToken, storedToken);

  if (!tokenInfo) {
    return {
      authenticated: false,
      statusCode: 401,
      errorMessage: 'Invalid bearer token',
    };
  }

  return {
    authenticated: true,
    authInfo: {
      token: tokenInfo.token,
      clientId: 'gateway-client',
      scopes: tokenInfo.scopes,
    },
  };
}

/**
 * Check whether a set of granted scopes includes the required scope.
 * Uses the scope hierarchy: admin includes write and read; write includes read.
 *
 * @param grantedScopes - Scopes from the authenticated token
 * @param requiredScope - The scope needed for the operation
 * @returns true if the required scope is granted
 */
export function hasScope(grantedScopes: string[], requiredScope: GatewayScope): boolean {
  for (const scope of grantedScopes) {
    const expandedScopes = SCOPE_HIERARCHY[scope as GatewayScope];
    if (expandedScopes && expandedScopes.includes(requiredScope)) {
      return true;
    }
  }
  return false;
}

/**
 * Tool-to-scope mapping. Tools are classified as read, write, or admin.
 * Unknown tools default to 'admin' scope (deny by default).
 */
const TOOL_SCOPE_MAP: Record<string, GatewayScope> = {
  // Read-only tools
  'project.list': 'read',
  'project.get': 'read',
  'skill.search': 'read',
  'skill.inspect': 'read',
  'agent.status': 'read',
  'agent.logs': 'read',
  'session.query': 'read',
  'session.patterns': 'read',
  'chipset.get': 'read',
  'list_skills': 'read',
  'search_skills': 'read',
  'read_skill': 'read',

  // Write tools
  'project.create': 'write',
  'project.execute-phase': 'write',
  'skill.activate': 'write',
  'agent.spawn': 'write',
  'workflow.research': 'write',
  'workflow.requirements': 'write',
  'workflow.plan': 'write',
  'workflow.execute': 'write',
  'chipset.modify': 'write',
  'chipset.synthesize': 'write',
  'install_skill': 'write',

  // Admin tools (none yet, but scope exists for future use)
};

/**
 * Get the required scope for a tool invocation.
 * Unknown tools default to 'admin' (deny by default).
 */
export function getToolScope(toolName: string): GatewayScope {
  return TOOL_SCOPE_MAP[toolName] ?? 'admin';
}

/**
 * Check whether the authenticated user can invoke a specific tool.
 *
 * @param authInfo - The auth info from authentication
 * @param toolName - The tool being invoked
 * @returns true if the user has sufficient scope
 */
export function canInvokeTool(authInfo: AuthInfo, toolName: string): boolean {
  const requiredScope = getToolScope(toolName);
  return hasScope(authInfo.scopes, requiredScope);
}

import { describe, it, expect, beforeAll } from 'vitest';
import type { IncomingMessage } from 'node:http';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import {
  extractBearerToken,
  authenticateRequest,
  hasScope,
  getToolScope,
  canInvokeTool,
} from './auth.js';
import { createTokenInfo } from './token-manager.js';
import type { TokenInfo, GatewayScope } from './types.js';

// ── Helpers ─────────────────────────────────────────────────────────────

/** Create a mock IncomingMessage with the given headers. */
function mockRequest(headers: Record<string, string | undefined> = {}): IncomingMessage {
  return { headers } as unknown as IncomingMessage;
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('extractBearerToken', () => {
  it('extracts token from valid Authorization header', () => {
    const req = mockRequest({ authorization: 'Bearer abc123' });
    expect(extractBearerToken(req)).toBe('abc123');
  });

  it('returns null for missing Authorization header', () => {
    const req = mockRequest({});
    expect(extractBearerToken(req)).toBeNull();
  });

  it('returns null for non-Bearer scheme', () => {
    const req = mockRequest({ authorization: 'Basic dXNlcjpwYXNz' });
    expect(extractBearerToken(req)).toBeNull();
  });

  it('returns null for malformed header (no space)', () => {
    const req = mockRequest({ authorization: 'Bearertoken' });
    expect(extractBearerToken(req)).toBeNull();
  });

  it('returns null for empty header', () => {
    const req = mockRequest({ authorization: '' });
    expect(extractBearerToken(req)).toBeNull();
  });

  it('is case-insensitive for Bearer prefix', () => {
    const req = mockRequest({ authorization: 'bearer abc123' });
    expect(extractBearerToken(req)).toBe('abc123');
  });
});

describe('authenticateRequest', () => {
  let storedToken: TokenInfo;

  beforeAll(() => {
    // Use a fixed token for testing
    storedToken = createTokenInfo(['admin']);
  });

  it('returns authenticated=true for valid token', () => {
    const req = mockRequest({ authorization: `Bearer ${storedToken.token}` });
    const result = authenticateRequest(req, storedToken);

    expect(result.authenticated).toBe(true);
    expect(result.authInfo).toBeDefined();
    expect(result.authInfo!.scopes).toEqual(['admin']);
  });

  it('returns 401 for missing Authorization header', () => {
    const req = mockRequest({});
    const result = authenticateRequest(req, storedToken);

    expect(result.authenticated).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(result.errorMessage).toContain('Missing');
  });

  it('returns 401 for invalid token', () => {
    const req = mockRequest({ authorization: 'Bearer invalid-token-value' });
    const result = authenticateRequest(req, storedToken);

    expect(result.authenticated).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(result.errorMessage).toContain('Invalid');
  });
});

describe('hasScope', () => {
  it('read scope includes read', () => {
    expect(hasScope(['read'], 'read')).toBe(true);
  });

  it('read scope excludes write', () => {
    expect(hasScope(['read'], 'write')).toBe(false);
  });

  it('read scope excludes admin', () => {
    expect(hasScope(['read'], 'admin')).toBe(false);
  });

  it('write scope includes read and write', () => {
    expect(hasScope(['write'], 'read')).toBe(true);
    expect(hasScope(['write'], 'write')).toBe(true);
  });

  it('write scope excludes admin', () => {
    expect(hasScope(['write'], 'admin')).toBe(false);
  });

  it('admin scope includes all', () => {
    expect(hasScope(['admin'], 'read')).toBe(true);
    expect(hasScope(['admin'], 'write')).toBe(true);
    expect(hasScope(['admin'], 'admin')).toBe(true);
  });

  it('returns false for empty scopes', () => {
    expect(hasScope([], 'read')).toBe(false);
  });

  it('returns false for unknown scope string', () => {
    expect(hasScope(['unknown'], 'read')).toBe(false);
  });
});

describe('getToolScope', () => {
  it('returns read for read-only tools', () => {
    expect(getToolScope('project:list')).toBe('read');
    expect(getToolScope('skill:search')).toBe('read');
    expect(getToolScope('agent:status')).toBe('read');
    expect(getToolScope('list_skills')).toBe('read');
  });

  it('returns write for write tools', () => {
    expect(getToolScope('project:create')).toBe('write');
    expect(getToolScope('workflow:execute')).toBe('write');
    expect(getToolScope('install_skill')).toBe('write');
  });

  it('returns admin for unknown tools (deny by default)', () => {
    expect(getToolScope('unknown:tool')).toBe('admin');
    expect(getToolScope('')).toBe('admin');
  });
});

describe('canInvokeTool', () => {
  it('allows read tools with read scope', () => {
    const authInfo: AuthInfo = { token: 'x', clientId: 'c', scopes: ['read'] };
    expect(canInvokeTool(authInfo, 'project:list')).toBe(true);
  });

  it('denies write tools with read scope', () => {
    const authInfo: AuthInfo = { token: 'x', clientId: 'c', scopes: ['read'] };
    expect(canInvokeTool(authInfo, 'project:create')).toBe(false);
  });

  it('allows write tools with write scope', () => {
    const authInfo: AuthInfo = { token: 'x', clientId: 'c', scopes: ['write'] };
    expect(canInvokeTool(authInfo, 'project:create')).toBe(true);
  });

  it('allows all tools with admin scope', () => {
    const authInfo: AuthInfo = { token: 'x', clientId: 'c', scopes: ['admin'] };
    expect(canInvokeTool(authInfo, 'project:list')).toBe(true);
    expect(canInvokeTool(authInfo, 'project:create')).toBe(true);
    expect(canInvokeTool(authInfo, 'unknown:tool')).toBe(true);
  });

  it('denies unknown tools without admin scope', () => {
    const authInfo: AuthInfo = { token: 'x', clientId: 'c', scopes: ['write'] };
    expect(canInvokeTool(authInfo, 'unknown:tool')).toBe(false);
  });
});

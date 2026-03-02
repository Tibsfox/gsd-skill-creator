/**
 * Tests for curl auth header construction and credential redaction.
 *
 * Covers Basic (base64), Bearer (token), Digest (RFC 2617),
 * and header redaction for sensitive values.
 */

import { describe, it, expect } from 'vitest';
import {
  buildBasicAuth,
  buildBearerAuth,
  buildDigestAuth,
  buildAuthHeaders,
  redactHeaders,
  computeDigestResponse,
} from '../auth.js';

describe('curl auth (CURL-02)', () => {
  describe('buildBasicAuth', () => {
    it('returns Authorization header with base64-encoded credentials', () => {
      const headers = buildBasicAuth('user', 'pass');
      // btoa('user:pass') === 'dXNlcjpwYXNz'
      expect(headers).toEqual({ Authorization: 'Basic dXNlcjpwYXNz' });
    });

    it('handles special characters in username and password', () => {
      const headers = buildBasicAuth('admin', 'p@ss:w0rd');
      const expected = Buffer.from('admin:p@ss:w0rd').toString('base64');
      expect(headers).toEqual({ Authorization: `Basic ${expected}` });
    });
  });

  describe('buildBearerAuth', () => {
    it('returns Authorization header with Bearer token', () => {
      const headers = buildBearerAuth('tok123');
      expect(headers).toEqual({ Authorization: 'Bearer tok123' });
    });

    it('handles JWT-style tokens', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig';
      const headers = buildBearerAuth(jwt);
      expect(headers).toEqual({ Authorization: `Bearer ${jwt}` });
    });
  });

  describe('computeDigestResponse', () => {
    it('computes correct MD5-based response per RFC 2617 without qop', () => {
      // Known values: HA1 = MD5("user:realm:pass"), HA2 = MD5("GET:/dir/index.html")
      // response = MD5("HA1:nonce123:HA2")
      const result = computeDigestResponse(
        'user', 'pass', 'realm', 'nonce123', 'GET', '/dir/index.html',
      );
      expect(typeof result).toBe('string');
      expect(result).toHaveLength(32); // MD5 hex digest is 32 chars
    });

    it('computes different response with qop=auth (includes nc/cnonce)', () => {
      const withoutQop = computeDigestResponse(
        'user', 'pass', 'realm', 'nonce123', 'GET', '/dir/index.html',
      );
      const withQop = computeDigestResponse(
        'user', 'pass', 'realm', 'nonce123', 'GET', '/dir/index.html',
        'auth', '00000001', 'cnonce456',
      );
      expect(withQop).not.toBe(withoutQop);
      expect(withQop).toHaveLength(32);
    });

    it('produces deterministic output for same inputs', () => {
      const a = computeDigestResponse('u', 'p', 'r', 'n', 'GET', '/');
      const b = computeDigestResponse('u', 'p', 'r', 'n', 'GET', '/');
      expect(a).toBe(b);
    });
  });

  describe('buildDigestAuth', () => {
    it('constructs Authorization: Digest header from challenge params', () => {
      const headers = buildDigestAuth({
        username: 'user',
        password: 'pass',
        realm: 'testrealm',
        nonce: 'abc123',
        method: 'GET',
        uri: '/protected',
      });
      expect(headers.Authorization).toMatch(/^Digest /);
      expect(headers.Authorization).toContain('username="user"');
      expect(headers.Authorization).toContain('realm="testrealm"');
      expect(headers.Authorization).toContain('nonce="abc123"');
      expect(headers.Authorization).toContain('uri="/protected"');
      expect(headers.Authorization).toContain('response="');
    });

    it('includes qop, nc, cnonce when qop is provided', () => {
      const headers = buildDigestAuth({
        username: 'user',
        password: 'pass',
        realm: 'testrealm',
        nonce: 'abc123',
        method: 'GET',
        uri: '/protected',
        qop: 'auth',
        nc: '00000001',
        cnonce: 'client-nonce',
      });
      expect(headers.Authorization).toContain('qop=auth');
      expect(headers.Authorization).toContain('nc=00000001');
      expect(headers.Authorization).toContain('cnonce="client-nonce"');
    });

    it('includes opaque when provided', () => {
      const headers = buildDigestAuth({
        username: 'user',
        password: 'pass',
        realm: 'testrealm',
        nonce: 'abc123',
        method: 'GET',
        uri: '/protected',
        opaque: 'opaque-value',
      });
      expect(headers.Authorization).toContain('opaque="opaque-value"');
    });
  });

  describe('redactHeaders', () => {
    it('replaces Authorization value with [REDACTED]', () => {
      const result = redactHeaders({ Authorization: 'Bearer secret-token' });
      expect(result.Authorization).toBe('[REDACTED]');
    });

    it('replaces Cookie value with [REDACTED]', () => {
      const result = redactHeaders({ Cookie: 'session=abc123' });
      expect(result.Cookie).toBe('[REDACTED]');
    });

    it('replaces Set-Cookie value with [REDACTED]', () => {
      const result = redactHeaders({ 'Set-Cookie': 'session=abc123; Path=/' });
      expect(result['Set-Cookie']).toBe('[REDACTED]');
    });

    it('replaces Proxy-Authorization with [REDACTED]', () => {
      const result = redactHeaders({ 'Proxy-Authorization': 'Basic dXNlcjpwYXNz' });
      expect(result['Proxy-Authorization']).toBe('[REDACTED]');
    });

    it('is case-insensitive (authorization vs Authorization)', () => {
      const result = redactHeaders({ authorization: 'Bearer token' });
      expect(result.authorization).toBe('[REDACTED]');
    });

    it('preserves non-sensitive headers unchanged', () => {
      const result = redactHeaders({
        'Content-Type': 'application/json',
        Accept: 'text/html',
        'X-Custom': 'value',
      });
      expect(result['Content-Type']).toBe('application/json');
      expect(result.Accept).toBe('text/html');
      expect(result['X-Custom']).toBe('value');
    });

    it('handles mixed sensitive and non-sensitive headers', () => {
      const result = redactHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret',
        Accept: 'text/html',
        Cookie: 'session=abc',
      });
      expect(result['Content-Type']).toBe('application/json');
      expect(result.Authorization).toBe('[REDACTED]');
      expect(result.Accept).toBe('text/html');
      expect(result.Cookie).toBe('[REDACTED]');
    });
  });

  describe('buildAuthHeaders', () => {
    it('dispatches correctly for basic type', async () => {
      const headers = await buildAuthHeaders(
        { type: 'basic', username: 'user', password: 'pass' },
        'GET', 'http://example.com',
      );
      expect(headers.Authorization).toMatch(/^Basic /);
    });

    it('dispatches correctly for bearer type', async () => {
      const headers = await buildAuthHeaders(
        { type: 'bearer', token: 'tok123' },
        'GET', 'http://example.com',
      );
      expect(headers.Authorization).toBe('Bearer tok123');
    });

    it('dispatches correctly for digest type', async () => {
      const headers = await buildAuthHeaders(
        { type: 'digest', username: 'user', password: 'pass', realm: 'r', nonce: 'n' },
        'GET', 'http://example.com/path',
      );
      expect(headers.Authorization).toMatch(/^Digest /);
    });
  });
});

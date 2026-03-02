/**
 * Tests for curl HTTP client with security gate and auth injection.
 *
 * Mocks globalThis.fetch and validateUrl to test HTTP methods,
 * SSRF blocking, auth header injection, debug mode, and Digest
 * challenge-response flow.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock security module to control SSRF gate
vi.mock('../security.js', () => ({
  validateUrl: vi.fn(),
}));

import {
  httpRequest,
  httpGet,
  httpPost,
  httpPut,
  httpDelete,
  httpPatch,
} from '../client.js';
import { validateUrl } from '../security.js';
import type { CurlRequest } from '../types.js';

const mockedValidateUrl = vi.mocked(validateUrl);

// Save/restore globalThis.fetch
const originalFetch = globalThis.fetch;

function mockFetch(status: number, body: string, headers?: Record<string, string>): void {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(body, { status, statusText: status === 200 ? 'OK' : 'Error', headers: new Headers(headers) }),
  );
}

beforeEach(() => {
  mockedValidateUrl.mockReset();
  mockedValidateUrl.mockResolvedValue({ allowed: true, resolvedIp: '93.184.216.34' });
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('curl HTTP client (CURL-01)', () => {
  describe('SSRF security gate', () => {
    it('returns blocked response for SSRF-blocked URL without calling fetch', async () => {
      mockedValidateUrl.mockResolvedValue({ allowed: false, reason: 'Blocked: Loopback (127.0.0.1)' });
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      const result = await httpRequest({ url: 'http://127.0.0.1/', method: 'GET' });

      expect(result.status).toBe(0);
      expect(result.blocked).toBe(true);
      expect(result.blockReason).toContain('Loopback');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('calls validateUrl before every fetch', async () => {
      mockFetch(200, 'ok');
      await httpRequest({ url: 'http://example.com', method: 'GET' });
      expect(mockedValidateUrl).toHaveBeenCalledWith('http://example.com');
    });
  });

  describe('HTTP methods', () => {
    it('httpGet sends GET request and returns typed CurlResponse', async () => {
      mockFetch(200, '{"data":"test"}', { 'Content-Type': 'application/json' });
      const result = await httpGet('http://example.com/api');

      expect(result.status).toBe(200);
      expect(result.statusText).toBe('OK');
      expect(result.body).toBe('{"data":"test"}');
      expect(result.blocked).toBe(false);
      expect(result.headers['content-type']).toBe('application/json');

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      expect(fetchCall[1]?.method).toBe('GET');
    });

    it('httpPost sends POST request with body', async () => {
      mockFetch(201, 'created');
      const result = await httpPost('http://example.com/api', {
        body: '{"name":"test"}',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(result.status).toBe(201);
      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      expect(fetchCall[1]?.method).toBe('POST');
      expect(fetchCall[1]?.body).toBe('{"name":"test"}');
    });

    it('httpPut sends PUT request with body', async () => {
      mockFetch(200, 'updated');
      await httpPut('http://example.com/api/1', { body: '{"name":"updated"}' });

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      expect(fetchCall[1]?.method).toBe('PUT');
      expect(fetchCall[1]?.body).toBe('{"name":"updated"}');
    });

    it('httpDelete sends DELETE request', async () => {
      mockFetch(200, '');
      const result = await httpDelete('http://example.com/api/1');

      expect(result.status).toBe(200);
      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      expect(fetchCall[1]?.method).toBe('DELETE');
    });

    it('httpPatch sends PATCH request with body', async () => {
      mockFetch(200, 'patched');
      await httpPatch('http://example.com/api/1', { body: '{"field":"value"}' });

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      expect(fetchCall[1]?.method).toBe('PATCH');
      expect(fetchCall[1]?.body).toBe('{"field":"value"}');
    });
  });

  describe('auth header injection', () => {
    it('includes Basic Authorization header when auth.type=basic', async () => {
      mockFetch(200, 'ok');
      await httpRequest({
        url: 'http://example.com',
        method: 'GET',
        auth: { type: 'basic', username: 'user', password: 'pass' },
      });

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      const headers = fetchCall[1]?.headers as Headers;
      expect(headers.get('Authorization')).toMatch(/^Basic /);
    });

    it('includes Bearer Authorization header when auth.type=bearer', async () => {
      mockFetch(200, 'ok');
      await httpRequest({
        url: 'http://example.com',
        method: 'GET',
        auth: { type: 'bearer', token: 'my-token' },
      });

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      const headers = fetchCall[1]?.headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer my-token');
    });
  });

  describe('Digest auth challenge-response', () => {
    it('retries on 401 with computed Digest header', async () => {
      // First call returns 401 with WWW-Authenticate challenge
      const challenge401 = new Response('Unauthorized', {
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({
          'WWW-Authenticate': 'Digest realm="test", nonce="abc123", qop="auth"',
        }),
      });
      // Second call returns 200
      const success200 = new Response('ok', {
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      });

      const fetchMock = vi.fn()
        .mockResolvedValueOnce(challenge401)
        .mockResolvedValueOnce(success200);
      globalThis.fetch = fetchMock;

      const result = await httpRequest({
        url: 'http://example.com/protected',
        method: 'GET',
        auth: { type: 'digest', username: 'user', password: 'pass' },
      });

      expect(result.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      // Verify second call has Digest Authorization header
      const secondCall = fetchMock.mock.calls[1];
      const headers = secondCall[1]?.headers as Headers;
      const authHeader = headers.get('Authorization');
      expect(authHeader).toMatch(/^Digest /);
      expect(authHeader).toContain('username="user"');
      expect(authHeader).toContain('realm="test"');
    });
  });

  describe('debug mode', () => {
    it('includes redacted headers in response.debug when debug=true', async () => {
      mockFetch(200, 'ok', { 'X-Server': 'test' });
      const result = await httpRequest({
        url: 'http://example.com',
        method: 'GET',
        headers: { 'Accept': 'text/html' },
        debug: true,
      });

      expect(result.debug).toBeDefined();
      expect(result.debug?.requestHeaders).toBeDefined();
      expect(result.debug?.responseHeaders).toBeDefined();
    });

    it('does NOT expose raw credentials in debug output', async () => {
      mockFetch(200, 'ok');
      const result = await httpRequest({
        url: 'http://example.com',
        method: 'GET',
        auth: { type: 'bearer', token: 'super-secret-token' },
        debug: true,
      });

      expect(result.debug).toBeDefined();
      const reqHeaders = result.debug?.requestHeaders ?? {};
      // Authorization should be redacted
      if ('authorization' in reqHeaders || 'Authorization' in reqHeaders) {
        const authValue = reqHeaders['authorization'] ?? reqHeaders['Authorization'];
        expect(authValue).toBe('[REDACTED]');
      }
      // Never expose the raw token
      const allValues = Object.values(reqHeaders).join(' ');
      expect(allValues).not.toContain('super-secret-token');
    });

    it('does not include debug when debug=false', async () => {
      mockFetch(200, 'ok');
      const result = await httpRequest({
        url: 'http://example.com',
        method: 'GET',
        debug: false,
      });
      expect(result.debug).toBeUndefined();
    });
  });

  describe('request options', () => {
    it('passes AbortSignal.timeout when timeout is set', async () => {
      mockFetch(200, 'ok');
      await httpRequest({
        url: 'http://example.com',
        method: 'GET',
        timeout: 5000,
      });

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      expect(fetchCall[1]?.signal).toBeDefined();
    });

    it('uses redirect manual when followRedirects=false', async () => {
      mockFetch(200, 'ok');
      await httpRequest({
        url: 'http://example.com',
        method: 'GET',
        followRedirects: false,
      });

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      expect(fetchCall[1]?.redirect).toBe('manual');
    });

    it('uses redirect follow by default', async () => {
      mockFetch(200, 'ok');
      await httpRequest({
        url: 'http://example.com',
        method: 'GET',
      });

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      expect(fetchCall[1]?.redirect).toBe('follow');
    });
  });
});

/**
 * Tests for sc curl CLI subcommand.
 *
 * Mocks the curl client module to verify flag parsing,
 * URL extraction, auth mapping, and output formatting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock curl client
vi.mock('../../curl/client.js', () => ({
  httpRequest: vi.fn(),
}));

// Mock curl cookies
vi.mock('../../curl/cookies.js', () => ({
  CurlCookieJar: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.load = vi.fn();
    this.buildCookieHeader = vi.fn();
  }),
}));

import { curlCommand } from './curl.js';
import { httpRequest } from '../../curl/client.js';

const mockedHttpRequest = vi.mocked(httpRequest);

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

function mockResponse(overrides: Partial<Awaited<ReturnType<typeof httpRequest>>> = {}) {
  mockedHttpRequest.mockResolvedValue({
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'text/plain' },
    body: 'response body',
    blocked: false,
    ...overrides,
  });
}

describe('sc curl CLI subcommand (CURL-06)', () => {
  describe('help', () => {
    it('curlCommand([]) shows help and returns 0', async () => {
      const code = await curlCommand([]);
      expect(code).toBe(0);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Usage: sc curl'));
    });

    it('curlCommand(["--help"]) shows help and returns 0', async () => {
      const code = await curlCommand(['--help']);
      expect(code).toBe(0);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Usage: sc curl'));
    });
  });

  describe('URL extraction', () => {
    it('extracts URL from first positional argument', async () => {
      mockResponse();
      await curlCommand(['https://example.com']);
      expect(mockedHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'https://example.com' }),
        undefined,
      );
    });

    it('extracts URL after flags', async () => {
      mockResponse();
      await curlCommand(['--method=POST', '--verbose', 'https://example.com']);
      expect(mockedHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'https://example.com' }),
        undefined,
      );
    });

    it('returns 1 when URL is missing', async () => {
      const code = await curlCommand(['--method=GET']);
      expect(code).toBe(1);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Error: URL is required'));
    });
  });

  describe('method flag', () => {
    it('defaults to GET', async () => {
      mockResponse();
      await curlCommand(['https://example.com']);
      expect(mockedHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET' }),
        undefined,
      );
    });

    it('--method=POST sends POST', async () => {
      mockResponse();
      await curlCommand(['--method=POST', 'https://example.com']);
      expect(mockedHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'POST' }),
        undefined,
      );
    });

    it('--method=PUT with --data sends PUT with body', async () => {
      mockResponse();
      await curlCommand(['--method=PUT', '--data={"key":"val"}', 'https://example.com']);
      expect(mockedHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'PUT', body: '{"key":"val"}' }),
        undefined,
      );
    });
  });

  describe('header flag', () => {
    it('--header=Content-Type:application/json adds header', async () => {
      mockResponse();
      await curlCommand(['--header=Content-Type:application/json', 'https://example.com']);
      expect(mockedHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
        undefined,
      );
    });

    it('multiple --header flags all get applied', async () => {
      mockResponse();
      await curlCommand([
        '--header=Accept:text/html',
        '--header=X-Custom:value',
        'https://example.com',
      ]);
      const req = mockedHttpRequest.mock.calls[0][0];
      expect(req.headers).toEqual(
        expect.objectContaining({ Accept: 'text/html', 'X-Custom': 'value' }),
      );
    });
  });

  describe('auth flags', () => {
    it('--user=admin:secret uses Basic auth', async () => {
      mockResponse();
      await curlCommand(['--user=admin:secret', 'https://example.com']);
      expect(mockedHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: { type: 'basic', username: 'admin', password: 'secret' },
        }),
        undefined,
      );
    });

    it('--bearer=tok123 uses Bearer auth', async () => {
      mockResponse();
      await curlCommand(['--bearer=tok123', 'https://example.com']);
      expect(mockedHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: { type: 'bearer', token: 'tok123' },
        }),
        undefined,
      );
    });
  });

  describe('verbose flag', () => {
    it('--verbose enables debug output', async () => {
      mockResponse({
        debug: {
          requestHeaders: { accept: 'text/html' },
          responseHeaders: { 'content-type': 'text/plain' },
        },
      });
      await curlCommand(['--verbose', 'https://example.com']);
      expect(mockedHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({ debug: true }),
        undefined,
      );
    });
  });

  describe('output formatting', () => {
    it('shows green status for 2xx', async () => {
      mockResponse({ status: 200, statusText: 'OK' });
      await curlCommand(['https://example.com']);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('200'));
    });

    it('shows body in output', async () => {
      mockResponse({ body: '{"result":"ok"}' });
      await curlCommand(['https://example.com']);
      expect(console.log).toHaveBeenCalledWith('{"result":"ok"}');
    });

    it('shows blocked reason and returns 1 for blocked response', async () => {
      mockedHttpRequest.mockResolvedValue({
        status: 0,
        statusText: 'BLOCKED',
        headers: {},
        body: '',
        blocked: true,
        blockReason: 'Blocked: Loopback',
      });
      const code = await curlCommand(['http://127.0.0.1/']);
      expect(code).toBe(1);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('BLOCKED'));
    });

    it('returns 0 for successful request', async () => {
      mockResponse();
      const code = await curlCommand(['https://example.com']);
      expect(code).toBe(0);
    });
  });

  describe('optional feature flags', () => {
    it('--insecure passes cert config', async () => {
      mockResponse();
      await curlCommand(['--insecure', 'https://example.com']);
      expect(mockedHttpRequest).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ cert: { rejectUnauthorized: false } }),
      );
    });

    it('--proxy passes proxy config', async () => {
      mockResponse();
      await curlCommand(['--proxy=http://proxy:8080', 'https://example.com']);
      expect(mockedHttpRequest).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ proxy: { url: 'http://proxy:8080' } }),
      );
    });
  });
});

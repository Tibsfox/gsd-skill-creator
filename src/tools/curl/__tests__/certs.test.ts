/**
 * Tests for curl certificate agent creation and SHA-256 pin verification.
 *
 * Mocks node:fs and undici to verify correct TLS configuration,
 * pin normalization, and mismatch detection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock node:fs
vi.mock('node:fs', () => ({
  readFileSync: vi.fn().mockReturnValue('mock-pem-content'),
}));

// Track Agent constructor calls
const agentCalls: unknown[] = [];

// Mock undici with class-based mock
vi.mock('undici', () => {
  class MockAgent {
    type = 'agent';
    opts: unknown;
    constructor(opts: unknown) {
      this.opts = opts;
      agentCalls.push(opts);
    }
  }
  return { Agent: MockAgent };
});

import { readFileSync } from 'node:fs';
import { createCertAgent } from '../certs.js';

const mockedReadFile = vi.mocked(readFileSync);

beforeEach(() => {
  agentCalls.length = 0;
  vi.clearAllMocks();
  mockedReadFile.mockReturnValue('mock-pem-content');
});

describe('curl certificate agent (CURL-03)', () => {
  describe('createCertAgent', () => {
    it('reads CA bundle from file path', () => {
      createCertAgent({ caBundle: '/path/to/ca-bundle.pem' });

      expect(mockedReadFile).toHaveBeenCalledWith('/path/to/ca-bundle.pem', 'utf-8');
      expect(agentCalls).toHaveLength(1);
      const opts = agentCalls[0] as Record<string, unknown>;
      const connect = opts.connect as Record<string, unknown>;
      expect(connect.ca).toBe('mock-pem-content');
    });

    it('reads client cert and key from file paths', () => {
      createCertAgent({
        clientCert: '/path/to/client.pem',
        clientKey: '/path/to/client-key.pem',
      });

      expect(mockedReadFile).toHaveBeenCalledWith('/path/to/client.pem', 'utf-8');
      expect(mockedReadFile).toHaveBeenCalledWith('/path/to/client-key.pem', 'utf-8');
      const opts = agentCalls[0] as Record<string, unknown>;
      const connect = opts.connect as Record<string, unknown>;
      expect(connect.cert).toBe('mock-pem-content');
      expect(connect.key).toBe('mock-pem-content');
    });

    it('sets rejectUnauthorized=false for insecure mode', () => {
      createCertAgent({ rejectUnauthorized: false });

      const opts = agentCalls[0] as Record<string, unknown>;
      const connect = opts.connect as Record<string, unknown>;
      expect(connect.rejectUnauthorized).toBe(false);
    });

    it('does not set rejectUnauthorized when not specified', () => {
      createCertAgent({ caBundle: '/path/to/ca.pem' });

      const opts = agentCalls[0] as Record<string, unknown>;
      const connect = opts.connect as Record<string, unknown>;
      expect(connect.rejectUnauthorized).toBeUndefined();
    });
  });

  describe('SHA-256 pin verification', () => {
    it('installs checkServerIdentity callback when pinSha256 set', () => {
      createCertAgent({ pinSha256: 'AA:BB:CC' });

      const opts = agentCalls[0] as Record<string, unknown>;
      const connect = opts.connect as Record<string, unknown>;
      expect(typeof connect.checkServerIdentity).toBe('function');
    });

    it('passes when fingerprint matches (with colon normalization)', () => {
      createCertAgent({ pinSha256: 'AA:BB:CC:DD' });

      const opts = agentCalls[0] as Record<string, unknown>;
      const connect = opts.connect as Record<string, unknown>;
      const check = connect.checkServerIdentity as (hostname: string, cert: { fingerprint256?: string }) => Error | undefined;

      const result = check('example.com', { fingerprint256: 'aa:bb:cc:dd' });
      expect(result).toBeUndefined();
    });

    it('passes with case-insensitive comparison', () => {
      createCertAgent({ pinSha256: 'aabbccdd' });

      const opts = agentCalls[0] as Record<string, unknown>;
      const connect = opts.connect as Record<string, unknown>;
      const check = connect.checkServerIdentity as (hostname: string, cert: { fingerprint256?: string }) => Error | undefined;

      const result = check('example.com', { fingerprint256: 'AA:BB:CC:DD' });
      expect(result).toBeUndefined();
    });

    it('returns Error on pin mismatch', () => {
      createCertAgent({ pinSha256: 'AA:BB:CC:DD' });

      const opts = agentCalls[0] as Record<string, unknown>;
      const connect = opts.connect as Record<string, unknown>;
      const check = connect.checkServerIdentity as (hostname: string, cert: { fingerprint256?: string }) => Error | undefined;

      const result = check('example.com', { fingerprint256: 'EE:FF:00:11' });
      expect(result).toBeInstanceOf(Error);
      expect(result?.message).toContain('Certificate pinning failed');
      expect(result?.message).toContain('aabbccdd');
      expect(result?.message).toContain('eeff0011');
    });

    it('returns Error when no fingerprint available', () => {
      createCertAgent({ pinSha256: 'AA:BB:CC:DD' });

      const opts = agentCalls[0] as Record<string, unknown>;
      const connect = opts.connect as Record<string, unknown>;
      const check = connect.checkServerIdentity as (hostname: string, cert: { fingerprint256?: string }) => Error | undefined;

      const result = check('example.com', {});
      expect(result).toBeInstanceOf(Error);
      expect(result?.message).toContain('no fingerprint available');
    });
  });
});

/**
 * Tests for curl proxy dispatcher creation.
 *
 * Mocks undici and socks to verify correct dispatcher configuration
 * for HTTP and SOCKS proxies.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Track constructor calls manually
const proxyAgentCalls: unknown[] = [];
const agentCalls: unknown[] = [];

// Mock undici with class-based mocks (arrow fns can't be used with `new`)
vi.mock('undici', () => {
  class MockProxyAgent {
    type = 'proxy-agent';
    opts: unknown;
    constructor(opts: unknown) {
      this.opts = opts;
      proxyAgentCalls.push(opts);
    }
  }
  class MockAgent {
    type = 'agent';
    opts: unknown;
    constructor(opts: unknown) {
      this.opts = opts;
      agentCalls.push(opts);
    }
  }
  return {
    ProxyAgent: MockProxyAgent,
    Agent: MockAgent,
  };
});

// Mock socks
vi.mock('socks', () => ({
  SocksClient: {
    createConnection: vi.fn().mockResolvedValue({
      socket: { type: 'mock-socket' },
    }),
  },
}));

import { SocksClient } from 'socks';
import {
  createHttpProxyDispatcher,
  createSocksProxyDispatcher,
  createProxyDispatcher,
} from '../proxy.js';

beforeEach(() => {
  proxyAgentCalls.length = 0;
  agentCalls.length = 0;
  vi.clearAllMocks();
});

describe('curl proxy dispatchers (CURL-03)', () => {
  describe('createHttpProxyDispatcher', () => {
    it('creates ProxyAgent with correct uri', () => {
      const dispatcher = createHttpProxyDispatcher('http://proxy.example.com:8080');

      expect(proxyAgentCalls).toHaveLength(1);
      const opts = proxyAgentCalls[0] as Record<string, unknown>;
      expect(opts.uri).toBe('http://proxy.example.com:8080');
      expect((dispatcher as unknown as { type: string }).type).toBe('proxy-agent');
    });

    it('includes Basic auth token when proxyAuth provided', () => {
      createHttpProxyDispatcher('http://proxy.example.com:8080', 'user:pass');

      const opts = proxyAgentCalls[0] as Record<string, unknown>;
      expect(opts.token).toBe(`Basic ${Buffer.from('user:pass').toString('base64')}`);
    });

    it('omits token when no proxyAuth provided', () => {
      createHttpProxyDispatcher('http://proxy.example.com:8080');

      const opts = proxyAgentCalls[0] as Record<string, unknown>;
      expect(opts.token).toBeUndefined();
    });
  });

  describe('createSocksProxyDispatcher', () => {
    it('creates Agent with custom connect for SOCKS5', () => {
      const dispatcher = createSocksProxyDispatcher({
        url: 'socks5://proxy.example.com:1080',
      });

      expect(agentCalls).toHaveLength(1);
      const opts = agentCalls[0] as Record<string, unknown>;
      expect(opts.connect).toBeDefined();
      expect(typeof opts.connect).toBe('function');
      expect((dispatcher as unknown as { type: string }).type).toBe('agent');
    });

    it('creates Agent with custom connect for SOCKS4', () => {
      createSocksProxyDispatcher({
        url: 'socks4://proxy.example.com:1080',
      });

      expect(agentCalls).toHaveLength(1);
    });

    it('SOCKS connector calls SocksClient.createConnection and passes socket', async () => {
      createSocksProxyDispatcher({
        url: 'socks5://proxy.example.com:1080',
        username: 'user',
        password: 'pass',
      });

      const opts = agentCalls[0] as Record<string, unknown>;
      const connect = opts.connect as (opts: Record<string, unknown>, cb: (err: Error | null, socket?: unknown) => void) => void;

      const callback = vi.fn();
      await connect({ hostname: 'target.com', port: '443' }, callback);

      expect(SocksClient.createConnection).toHaveBeenCalledTimes(1);
      const createOpts = vi.mocked(SocksClient.createConnection).mock.calls[0][0];
      expect(createOpts.proxy.host).toBe('proxy.example.com');
      expect(createOpts.proxy.port).toBe(1080);
      expect(createOpts.proxy.type).toBe(5);
      expect(createOpts.destination.host).toBe('target.com');
      expect(createOpts.destination.port).toBe(443);
      expect(callback).toHaveBeenCalledWith(null, { type: 'mock-socket' });
    });
  });

  describe('createProxyDispatcher', () => {
    it('routes socks5:// to SOCKS dispatcher', () => {
      createProxyDispatcher({ url: 'socks5://proxy:1080' });
      expect(agentCalls).toHaveLength(1);
      expect(proxyAgentCalls).toHaveLength(0);
    });

    it('routes socks4:// to SOCKS dispatcher', () => {
      createProxyDispatcher({ url: 'socks4://proxy:1080' });
      expect(agentCalls).toHaveLength(1);
      expect(proxyAgentCalls).toHaveLength(0);
    });

    it('routes socks:// to SOCKS dispatcher', () => {
      createProxyDispatcher({ url: 'socks://proxy:1080' });
      expect(agentCalls).toHaveLength(1);
      expect(proxyAgentCalls).toHaveLength(0);
    });

    it('routes http:// to HTTP proxy dispatcher', () => {
      createProxyDispatcher({ url: 'http://proxy:8080' });
      expect(proxyAgentCalls).toHaveLength(1);
      expect(agentCalls).toHaveLength(0);
    });

    it('routes https:// to HTTP proxy dispatcher', () => {
      createProxyDispatcher({ url: 'https://proxy:8443' });
      expect(proxyAgentCalls).toHaveLength(1);
      expect(agentCalls).toHaveLength(0);
    });

    it('passes credentials to HTTP proxy as Basic auth', () => {
      createProxyDispatcher({
        url: 'http://proxy:8080',
        username: 'admin',
        password: 'secret',
      });

      const opts = proxyAgentCalls[0] as Record<string, unknown>;
      expect(opts.token).toBe(`Basic ${Buffer.from('admin:secret').toString('base64')}`);
    });
  });
});

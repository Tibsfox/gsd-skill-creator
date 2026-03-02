/**
 * Proxy dispatcher creation for HTTP and SOCKS protocols.
 *
 * Creates undici Dispatcher instances for routing HTTP requests through
 * HTTP/HTTPS proxy servers (via ProxyAgent) or SOCKS4/SOCKS5 proxies
 * (via socks package bridged to undici Agent).
 */

import { ProxyAgent, Agent } from 'undici';
import type { Dispatcher } from 'undici';
import { SocksClient } from 'socks';
import type { CurlProxyConfig } from './types.js';

/**
 * Create an undici ProxyAgent for HTTP/HTTPS proxy.
 */
export function createHttpProxyDispatcher(proxyUrl: string, proxyAuth?: string): Dispatcher {
  const opts: ConstructorParameters<typeof ProxyAgent>[0] = {
    uri: proxyUrl,
  };
  if (proxyAuth) {
    opts.token = `Basic ${Buffer.from(proxyAuth).toString('base64')}`;
  }
  return new ProxyAgent(opts);
}

/**
 * Create an undici Agent with custom SOCKS connect for SOCKS4/SOCKS5 proxy.
 */
export function createSocksProxyDispatcher(config: CurlProxyConfig): Dispatcher {
  const parsed = new URL(config.url);
  const protocol = parsed.protocol.replace(':', '');
  const socksType = protocol === 'socks4' ? 4 : 5;

  return new Agent({
    connect: async (opts: Record<string, unknown>, callback: (err: Error | null, socket?: unknown) => void) => {
      try {
        const { socket } = await SocksClient.createConnection({
          proxy: {
            host: parsed.hostname,
            port: parseInt(parsed.port || (socksType === 4 ? '1080' : '1080'), 10),
            type: socksType,
            userId: config.username,
            password: config.password,
          },
          command: 'connect' as const,
          destination: {
            host: opts.hostname as string || opts.host as string || 'localhost',
            port: parseInt(String(opts.port || '443'), 10),
          },
        });
        callback(null, socket);
      } catch (err) {
        callback(err instanceof Error ? err : new Error(String(err)));
      }
    },
  } as ConstructorParameters<typeof Agent>[0]);
}

/**
 * Route to HTTP or SOCKS proxy dispatcher based on URL protocol.
 */
export function createProxyDispatcher(config: CurlProxyConfig): Dispatcher {
  const parsed = new URL(config.url);
  const protocol = parsed.protocol.replace(':', '');

  if (protocol.startsWith('socks')) {
    return createSocksProxyDispatcher(config);
  }

  const proxyAuth = config.username && config.password
    ? `${config.username}:${config.password}`
    : undefined;

  return createHttpProxyDispatcher(config.url, proxyAuth);
}

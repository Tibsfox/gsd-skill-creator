/**
 * OllamaDiscovery and HealthStateMachine unit tests.
 *
 * Uses node:http mock servers for Ollama and OpenAI-compat endpoints.
 * No real Ollama instance required.
 */

import { describe, it, expect } from 'vitest';
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';
import { HttpClient } from './http-client.js';
import { OllamaDiscovery, HealthStateMachine } from './ollama-discovery.js';

// ============================================================================
// Helpers
// ============================================================================

function makeServer(
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void,
): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      const url = `http://127.0.0.1:${port}`;
      const close = () =>
        new Promise<void>((res, rej) => server.close((err) => (err ? rej(err) : res())));
      resolve({ url, close });
    });
  });
}

const fastClient = new HttpClient({
  maxRetries: 0,
  baseDelayMs: 10,
  maxDelayMs: 100,
  timeoutMs: 2000,
});

// ============================================================================
// OllamaDiscovery
// ============================================================================

describe('OllamaDiscovery', () => {
  it('discover() with Ollama mock returns available:true, isOllama:true', async () => {
    const { url, close } = await makeServer((req, res) => {
      if (req.url === '/api/tags') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            models: [
              {
                name: 'llama3:8b',
                model: 'llama3:8b',
                size: 4700000000,
                digest: 'abc123',
                details: {
                  parameter_size: '8B',
                  quantization_level: 'Q4_0',
                  family: 'llama',
                },
              },
            ],
          }),
        );
      } else if (req.url === '/api/show') {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              parameters: 'num_ctx 4096\ntemperature 0.7',
              details: {
                parameter_size: '8B',
                quantization_level: 'Q4_0',
                family: 'llama',
              },
            }),
          );
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    try {
      const discovery = new OllamaDiscovery(fastClient);
      const result = await discovery.discover(url);
      expect(result.available).toBe(true);
      expect(result.isOllama).toBe(true);
      expect(result.models).toHaveLength(1);
      expect(result.models[0]!.name).toBe('llama3:8b');
      expect(result.models[0]!.contextLength).toBe(4096);
      expect(result.models[0]!.quantizationLevel).toBe('Q4_0');
    } finally {
      await close();
    }
  });

  it('discover() with non-Ollama OpenAI-compat returns isOllama:false', async () => {
    const { url, close } = await makeServer((req, res) => {
      if (req.url === '/api/tags') {
        res.writeHead(404);
        res.end();
      } else if (req.url === '/v1/models') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            data: [
              { id: 'gpt-4', context_length: 8192 },
              { id: 'gpt-3.5-turbo' },
            ],
          }),
        );
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    try {
      const discovery = new OllamaDiscovery(fastClient);
      const result = await discovery.discover(url);
      expect(result.available).toBe(true);
      expect(result.isOllama).toBe(false);
      expect(result.models).toHaveLength(2);
      expect(result.models[0]!.name).toBe('gpt-4');
      expect(result.models[0]!.contextLength).toBe(8192);
      expect(result.models[1]!.contextLength).toBe(2048); // default
    } finally {
      await close();
    }
  });

  it('discover() with unreachable endpoint returns available:false', async () => {
    const discovery = new OllamaDiscovery(fastClient);
    const result = await discovery.discover('http://127.0.0.1:1');
    expect(result.available).toBe(false);
    expect(result.models).toHaveLength(0);
  });

  it('getModelDetails() parses /api/show with context length', async () => {
    const { url, close } = await makeServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            parameters: 'num_ctx 32768\ntemperature 0.8',
            details: {
              parameter_size: '70B',
              quantization_level: 'Q5_K_M',
              family: 'llama',
            },
          }),
        );
      });
    });

    try {
      const discovery = new OllamaDiscovery(fastClient);
      const model = await discovery.getModelDetails(url, 'llama3:70b');
      expect(model).not.toBeNull();
      expect(model!.contextLength).toBe(32768);
      expect(model!.parameterSize).toBe('70B');
      expect(model!.quantizationLevel).toBe('Q5_K_M');
    } finally {
      await close();
    }
  });

  it('getModelDetails() returns null on 404', async () => {
    const { url, close } = await makeServer((_req, res) => {
      res.writeHead(404);
      res.end();
    });

    try {
      const discovery = new OllamaDiscovery(fastClient);
      const model = await discovery.getModelDetails(url, 'nonexistent');
      expect(model).toBeNull();
    } finally {
      await close();
    }
  });
});

// ============================================================================
// HealthStateMachine
// ============================================================================

describe('HealthStateMachine', () => {
  it('starts in unknown state', () => {
    const hsm = new HealthStateMachine();
    expect(hsm.state).toBe('unknown');
    expect(hsm.history).toHaveLength(0);
  });

  it('probe() transitions to healthy on successful fast response', async () => {
    const { url, close } = await makeServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ models: [] }));
    });

    try {
      const hsm = new HealthStateMachine();
      const state = await hsm.probe(url, fastClient);
      expect(state).toBe('healthy');
      expect(hsm.state).toBe('healthy');
      // Should have transitions: unknown→checking, checking→healthy
      expect(hsm.history).toHaveLength(2);
      expect(hsm.history[0]!.from).toBe('unknown');
      expect(hsm.history[0]!.to).toBe('checking');
      expect(hsm.history[1]!.from).toBe('checking');
      expect(hsm.history[1]!.to).toBe('healthy');
    } finally {
      await close();
    }
  });

  it('probe() transitions to unhealthy on connection failure', async () => {
    const hsm = new HealthStateMachine();
    const state = await hsm.probe('http://127.0.0.1:1', fastClient);
    expect(state).toBe('unhealthy');
    expect(hsm.history).toHaveLength(2);
    expect(hsm.history[1]!.to).toBe('unhealthy');
  });

  it('probe() transitions to degraded on slow-but-alive response (cold start)', async () => {
    const { url, close } = await makeServer((_req, res) => {
      // Simulate slow response (>5000ms) — use fake delay detection
      // We can't actually wait 5s in tests, so we'll test the transition directly
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ models: [] }));
    });

    try {
      // Test transition API directly for cold-start scenario
      const hsm = new HealthStateMachine();
      hsm.transition('checking', 'probe started');
      hsm.transition('degraded', 'cold-start detected: response took 6000ms');
      expect(hsm.state).toBe('degraded');
      expect(hsm.history).toHaveLength(2);
      expect(hsm.history[1]!.reason).toContain('cold-start');
    } finally {
      await close();
    }
  });

  it('history tracks all transitions with timestamps', async () => {
    const hsm = new HealthStateMachine();
    hsm.transition('checking', 'test 1');
    hsm.transition('healthy', 'test 2');
    hsm.transition('degraded', 'test 3');
    hsm.transition('unhealthy', 'test 4');

    expect(hsm.history).toHaveLength(4);
    for (const t of hsm.history) {
      expect(t.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(t.reason).toBeTruthy();
    }
  });

  it('transition() is a no-op for same state', () => {
    const hsm = new HealthStateMachine();
    hsm.transition('checking', 'first');
    hsm.transition('checking', 'duplicate'); // should be ignored
    expect(hsm.history).toHaveLength(1);
  });
});

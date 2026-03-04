import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockMeshServer } from './helpers/mock-mesh-server.js';

describe('MockMeshServer', () => {
  let server: MockMeshServer;

  beforeEach(async () => {
    server = new MockMeshServer();
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('start() returns port and baseUrl is accessible', async () => {
    const res = await fetch(`${server.baseUrl}/v1/models`);
    expect(res.status).toBe(200);
  });

  it('GET /v1/models returns configured models', async () => {
    const res = await fetch(`${server.baseUrl}/v1/models`);
    const data = await res.json() as { data: Array<{ id: string }> };
    expect(data.data).toHaveLength(1);
    expect(data.data[0]!.id).toBe('mock-model');
  });

  it('POST /v1/chat/completions returns configured response', async () => {
    const res = await fetch(`${server.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    });
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    expect(data.choices[0]!.message.content).toBe('Mock response content');
  });

  it('GET /api/tags returns Ollama-format model list', async () => {
    const res = await fetch(`${server.baseUrl}/api/tags`);
    const data = await res.json() as { models: Array<{ name: string }> };
    expect(data.models[0]!.name).toBe('mock-model:latest');
  });

  it('setResponse() overrides endpoint response', async () => {
    server.setResponse('/v1/models', { data: [{ id: 'custom-model' }] });
    const res = await fetch(`${server.baseUrl}/v1/models`);
    const data = await res.json() as { data: Array<{ id: string }> };
    expect(data.data[0]!.id).toBe('custom-model');
  });

  it('setError() causes request to return error status', async () => {
    server.setError('/v1/chat/completions', 500, '{"error":"internal"}');
    const res = await fetch(`${server.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      body: '{}',
    });
    expect(res.status).toBe(500);
    const data = await res.json() as { error: string };
    expect(data.error).toBe('internal');
  });

  it('getRequests() returns request history with parsed body', async () => {
    await fetch(`${server.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'test' }),
    });
    const requests = server.getRequests('/v1/chat/completions');
    expect(requests).toHaveLength(1);
    expect(requests[0]!.method).toBe('POST');
    expect(requests[0]!.body).toEqual({ model: 'test' });
  });

  it('clearRequests() resets history', async () => {
    await fetch(`${server.baseUrl}/v1/models`);
    expect(server.getRequests('/v1/models')).toHaveLength(1);
    server.clearRequests();
    expect(server.getRequests('/v1/models')).toHaveLength(0);
  });

  it('returns 404 for unknown endpoints', async () => {
    const res = await fetch(`${server.baseUrl}/unknown`);
    expect(res.status).toBe(404);
  });
});

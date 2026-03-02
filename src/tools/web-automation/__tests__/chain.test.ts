import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../curl/client.js', () => ({
  httpGet: vi.fn(),
  httpRequest: vi.fn(),
}));

import { httpRequest } from '../../curl/client.js';
import { loadChainConfig, WebChainRunner } from '../chain.js';
import { WebRateLimiter } from '../rate-limiter.js';

const mockedHttpRequest = vi.mocked(httpRequest);

describe('loadChainConfig', () => {
  it('parses valid YAML into WebChainConfig', () => {
    const yaml = `
name: test-chain
steps:
  - name: step1
    url: http://example.com
    method: GET
`;
    const config = loadChainConfig(yaml);
    expect(config.name).toBe('test-chain');
    expect(config.steps).toHaveLength(1);
    expect(config.steps[0].name).toBe('step1');
    expect(config.steps[0].url).toBe('http://example.com');
  });

  it('throws on missing name field', () => {
    const yaml = `
steps:
  - name: step1
    url: http://example.com
`;
    expect(() => loadChainConfig(yaml)).toThrow(/name/i);
  });

  it('throws on empty steps array', () => {
    const yaml = `
name: empty
steps: []
`;
    expect(() => loadChainConfig(yaml)).toThrow(/step/i);
  });
});

describe('WebChainRunner', () => {
  const limiter = new WebRateLimiter({ requestsPerSecond: 1000 });

  beforeEach(() => {
    mockedHttpRequest.mockReset();
  });

  it('executes single-step chain and returns WebChainResult', async () => {
    mockedHttpRequest.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      body: '{"message":"hello"}',
      blocked: false,
    });

    const runner = new WebChainRunner(limiter);
    const result = await runner.run({
      name: 'simple-chain',
      steps: [{ name: 'fetch', url: 'http://api.test/data' }],
    });

    expect(result.chainName).toBe('simple-chain');
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].stepName).toBe('fetch');
    expect(result.steps[0].statusCode).toBe(200);
    expect(result.passed).toBe(true);
  });

  it('executes 2-step chain with variable extraction', async () => {
    // Step 1: login returns token
    mockedHttpRequest.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      body: '{"access_token":"abc123"}',
      blocked: false,
    });

    // Step 2: profile fetch
    mockedHttpRequest.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      body: '{"email":"test@example.com"}',
      blocked: false,
    });

    const runner = new WebChainRunner(limiter);
    const result = await runner.run({
      name: 'auth-chain',
      steps: [
        {
          name: 'login',
          url: 'http://api.test/auth',
          method: 'POST',
          body: '{"user":"admin"}',
          extract: { token: '$.body.access_token' },
        },
        {
          name: 'profile',
          url: 'http://api.test/profile',
          headers: { Authorization: 'Bearer {{token}}' },
        },
      ],
    });

    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].extractedVars.token).toBe('abc123');
    // Verify the second request used the extracted token
    expect(mockedHttpRequest).toHaveBeenCalledTimes(2);
    const secondCall = mockedHttpRequest.mock.calls[1][0];
    expect(secondCall.headers?.Authorization).toBe('Bearer abc123');
  });

  it('evaluates assertions per step and aggregates pass/fail counts', async () => {
    mockedHttpRequest.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      body: '{"name":"test"}',
      blocked: false,
    });

    const runner = new WebChainRunner(limiter);
    const result = await runner.run({
      name: 'assert-chain',
      steps: [{
        name: 'check',
        url: 'http://api.test/data',
        assert: [
          { type: 'status', expected: 200 },
          { type: 'header', name: 'content-type', contains: 'json' },
          { type: 'status', expected: 404 }, // This should fail
        ],
      }],
    });

    expect(result.totalAssertions).toBe(3);
    expect(result.passedAssertions).toBe(2);
    expect(result.failedAssertions).toBe(1);
    expect(result.passed).toBe(false); // at least one assertion failed
    expect(result.steps[0].assertions).toHaveLength(3);
    expect(result.steps[0].assertions[0].passed).toBe(true);
    expect(result.steps[0].assertions[2].passed).toBe(false);
  });

  it('stops on step failure (blocked response)', async () => {
    mockedHttpRequest.mockResolvedValueOnce({
      status: 0,
      statusText: '',
      headers: {},
      body: '',
      blocked: true,
      blockReason: 'SSRF blocked',
    });

    const runner = new WebChainRunner(limiter);
    const result = await runner.run({
      name: 'blocked-chain',
      steps: [
        { name: 'blocked-step', url: 'http://192.168.1.1/admin' },
        { name: 'never-reached', url: 'http://api.test/data' },
      ],
    });

    // Should only have one step result (stopped after blocked)
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].error).toBe('SSRF blocked');
    expect(result.passed).toBe(false);
  });

  it('wraps response as {body: parsed, headers, status} for JSONPath', async () => {
    mockedHttpRequest.mockResolvedValue({
      status: 201,
      statusText: 'Created',
      headers: { 'content-type': 'application/json' },
      body: '{"token":"secret"}',
      blocked: false,
    });

    const runner = new WebChainRunner(limiter);
    const result = await runner.run({
      name: 'wrap-test',
      steps: [{
        name: 'extract',
        url: 'http://api.test/auth',
        extract: { tok: '$.body.token' },
      }],
    });

    expect(result.steps[0].extractedVars.tok).toBe('secret');
  });

  it('calls rateLimiter.acquire() before every step request', async () => {
    mockedHttpRequest.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'text/plain' },
      body: 'ok',
      blocked: false,
    });

    const acquireSpy = vi.spyOn(limiter, 'acquire');
    const runner = new WebChainRunner(limiter);
    await runner.run({
      name: 'rate-test',
      steps: [
        { name: 's1', url: 'http://api.test/1' },
        { name: 's2', url: 'http://api.test/2' },
      ],
    });

    expect(acquireSpy).toHaveBeenCalledTimes(2);
    acquireSpy.mockRestore();
  });

  it('interpolate replaces {{variable}} with extracted values', async () => {
    mockedHttpRequest.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      body: '{"id":"42"}',
      blocked: false,
    });
    mockedHttpRequest.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'text/plain' },
      body: 'ok',
      blocked: false,
    });

    const runner = new WebChainRunner(limiter);
    await runner.run({
      name: 'interp-test',
      steps: [
        { name: 's1', url: 'http://api.test/auth', extract: { userId: '$.body.id' } },
        { name: 's2', url: 'http://api.test/users/{{userId}}' },
      ],
    });

    const secondCall = mockedHttpRequest.mock.calls[1][0];
    expect(secondCall.url).toBe('http://api.test/users/42');
  });

  it('leaves unknown {{placeholders}} untouched', async () => {
    mockedHttpRequest.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'text/plain' },
      body: 'ok',
      blocked: false,
    });

    const runner = new WebChainRunner(limiter);
    await runner.run({
      name: 'unknown-var',
      steps: [
        { name: 's1', url: 'http://api.test/{{unknown}}' },
      ],
    });

    const firstCall = mockedHttpRequest.mock.calls[0][0];
    expect(firstCall.url).toBe('http://api.test/{{unknown}}');
  });
});

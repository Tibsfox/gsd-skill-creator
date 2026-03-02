import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAcquire = vi.fn().mockResolvedValue(undefined);
const MockWebRateLimiter = vi.fn().mockImplementation(function (this: Record<string, unknown>) {
  this.acquire = mockAcquire;
});

const mockScrape = vi.fn().mockResolvedValue({
  url: 'http://example.com',
  success: true,
  statusCode: 200,
  data: { result: 'Scraped Content' },
});
const MockWebScraper = vi.fn().mockImplementation(function (this: Record<string, unknown>) {
  this.scrape = mockScrape;
});

const mockRun = vi.fn().mockResolvedValue({
  chainName: 'test-chain',
  steps: [{
    stepName: 'step1',
    url: 'http://api.test',
    statusCode: 200,
    assertions: [
      { rule: { type: 'status', expected: 200 }, passed: true, actual: '200', expected: '200' },
    ],
    extractedVars: {},
    passed: true,
  }],
  passed: true,
  totalAssertions: 1,
  passedAssertions: 1,
  failedAssertions: 0,
});
const MockWebChainRunner = vi.fn().mockImplementation(function (this: Record<string, unknown>) {
  this.run = mockRun;
});

vi.mock('../../web-automation/rate-limiter.js', () => ({
  WebRateLimiter: MockWebRateLimiter,
}));

vi.mock('../../web-automation/scraper.js', () => ({
  WebScraper: MockWebScraper,
}));

vi.mock('../../web-automation/chain.js', () => ({
  loadChainConfig: vi.fn().mockReturnValue({
    name: 'test-chain',
    steps: [{ name: 'step1', url: 'http://api.test' }],
  }),
  WebChainRunner: MockWebChainRunner,
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    readFileSync: vi.fn().mockReturnValue('name: test-chain\nsteps:\n  - name: step1\n    url: http://api.test'),
  };
});

import { webCommand } from './web.js';

describe('webCommand', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    MockWebRateLimiter.mockClear();
  });

  it('shows help and returns 0 with no args', async () => {
    const code = await webCommand([]);
    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('Usage');
  });

  it('shows help and returns 0 with --help', async () => {
    const code = await webCommand(['--help']);
    expect(code).toBe(0);
  });

  it('scrape subcommand calls WebScraper and prints data', async () => {
    const code = await webCommand(['scrape', 'http://example.com', '--select=h1']);
    expect(code).toBe(0);
    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('Scraped Content');
  });

  it('scrape without URL returns error code 1', async () => {
    const code = await webCommand(['scrape']);
    expect(code).toBe(1);
  });

  it('chain subcommand runs chain and prints results', async () => {
    const code = await webCommand(['chain', 'test.yaml']);
    expect(code).toBe(0);
    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('test-chain');
    expect(output).toContain('step1');
  });

  it('api-test subcommand prints assertion table', async () => {
    const code = await webCommand(['api-test', 'test.yaml']);
    expect(code).toBe(0);
    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('API Test');
    expect(output).toContain('1/1 assertions passed');
  });

  it('unknown subcommand returns error code 1', async () => {
    const code = await webCommand(['unknown']);
    expect(code).toBe(1);
  });

  it('--rate flag sets custom requestsPerSecond', async () => {
    await webCommand(['scrape', 'http://example.com', '--rate=10']);
    expect(MockWebRateLimiter).toHaveBeenCalledWith({ requestsPerSecond: 10 });
  });

  it('scrape alias s works', async () => {
    const code = await webCommand(['s', 'http://example.com', '--select=h1']);
    expect(code).toBe(0);
  });

  it('chain alias c works', async () => {
    const code = await webCommand(['c', 'test.yaml']);
    expect(code).toBe(0);
  });

  it('api-test alias t works', async () => {
    const code = await webCommand(['t', 'test.yaml']);
    expect(code).toBe(0);
  });
});

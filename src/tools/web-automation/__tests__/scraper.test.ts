import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../curl/client.js', () => ({
  httpGet: vi.fn(),
  httpRequest: vi.fn(),
}));

import { httpGet } from '../../curl/client.js';
import { WebScraper } from '../scraper.js';
import { WebRateLimiter } from '../rate-limiter.js';

const mockedHttpGet = vi.mocked(httpGet);

describe('WebScraper', () => {
  const limiter = new WebRateLimiter({ requestsPerSecond: 1000 });

  beforeEach(() => {
    mockedHttpGet.mockReset();
  });

  it('extracts text from single CSS selector', async () => {
    mockedHttpGet.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      body: '<html><body><h1>Title</h1></body></html>',
      blocked: false,
    });

    const scraper = new WebScraper(limiter);
    const result = await scraper.scrape({
      url: 'http://example.com',
      selectors: { title: { css: 'h1' } },
    });

    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('Title');
    expect(result.statusCode).toBe(200);
  });

  it('extracts text from multiple CSS selectors', async () => {
    mockedHttpGet.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      body: '<h1>Title</h1><p>Content</p>',
      blocked: false,
    });

    const scraper = new WebScraper(limiter);
    const result = await scraper.scrape({
      url: 'http://example.com',
      selectors: {
        title: { css: 'h1' },
        body: { css: 'p' },
      },
    });

    expect(result.data?.title).toBe('Title');
    expect(result.data?.body).toBe('Content');
  });

  it('extracts attribute value', async () => {
    mockedHttpGet.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      body: '<a href="https://example.com">Link</a>',
      blocked: false,
    });

    const scraper = new WebScraper(limiter);
    const result = await scraper.scrape({
      url: 'http://example.com',
      selectors: { link: { css: 'a', attribute: 'href' } },
    });

    expect(result.data?.link).toBe('https://example.com');
  });

  it('extracts multiple elements as array', async () => {
    mockedHttpGet.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      body: '<ul><li>One</li><li>Two</li><li>Three</li></ul>',
      blocked: false,
    });

    const scraper = new WebScraper(limiter);
    const result = await scraper.scrape({
      url: 'http://example.com',
      selectors: { items: { css: 'li', multiple: true } },
    });

    expect(result.data?.items).toEqual(['One', 'Two', 'Three']);
  });

  it('returns success=false when response is SSRF-blocked', async () => {
    mockedHttpGet.mockResolvedValue({
      status: 0,
      statusText: '',
      headers: {},
      body: '',
      blocked: true,
      blockReason: 'URL blocked: private IP range',
    });

    const scraper = new WebScraper(limiter);
    const result = await scraper.scrape({
      url: 'http://192.168.1.1',
      selectors: { title: { css: 'h1' } },
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('URL blocked: private IP range');
  });

  it('calls rateLimiter.acquire() before every HTTP request', async () => {
    mockedHttpGet.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      body: '<h1>Test</h1>',
      blocked: false,
    });

    const acquireSpy = vi.spyOn(limiter, 'acquire');
    const scraper = new WebScraper(limiter);
    await scraper.scrape({
      url: 'http://example.com',
      selectors: { title: { css: 'h1' } },
    });

    expect(acquireSpy).toHaveBeenCalledOnce();
    acquireSpy.mockRestore();
  });
});

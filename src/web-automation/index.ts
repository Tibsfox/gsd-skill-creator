/**
 * Web automation module barrel exports.
 *
 * Scraping, chaining, assertions, and rate limiting
 * for API testing workflows. All types use Web domain
 * prefix per project convention.
 */

/* ---- Types ---- */
export type {
  WebRateLimitConfig,
  WebSelectorRule,
  WebScraperConfig,
  WebScrapeResult,
  WebResponseFormat,
  WebParsedResponse,
  WebChainConfig,
  WebChainStep,
  WebAssertionType,
  WebAssertionRule,
  WebAssertionResult,
  WebStepResult,
  WebChainResult,
} from './types.js';

/* ---- Rate Limiting ---- */
export { WebRateLimiter } from './rate-limiter.js';

/* ---- Scraping ---- */
export { WebScraper } from './scraper.js';

/* ---- Response Parsing ---- */
export { parseResponse, detectFormat } from './response.js';

/* ---- Chain Runner ---- */
export { WebChainRunner, loadChainConfig } from './chain.js';

/* ---- Assertion Engine ---- */
export { evaluateAssertion, evaluateAssertions } from './assertion.js';

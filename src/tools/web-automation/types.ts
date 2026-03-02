/**
 * Web automation module type definitions.
 *
 * Web-prefixed interfaces for scraping, chaining,
 * assertions, rate limiting, and response parsing.
 */

import type { CurlRequest } from '../curl/types.js';

/* ---- Rate Limiting ---- */

export interface WebRateLimitConfig {
  /** Maximum requests per second */
  requestsPerSecond: number;
  /** Maximum burst capacity (defaults to requestsPerSecond if omitted) */
  burstCapacity?: number;
}

/* ---- Response Parsing ---- */

export type WebResponseFormat = 'json' | 'html' | 'xml' | 'text';

export interface WebParsedResponse {
  format: WebResponseFormat;
  raw: string;
  parsed: unknown;
  statusCode: number;
  headers: Record<string, string>;
}

/* ---- Scraping ---- */

export interface WebSelectorRule {
  /** CSS selector string */
  css: string;
  /** Extract an attribute value instead of text content */
  attribute?: string;
  /** Extract all matching elements as array instead of first */
  multiple?: boolean;
}

export interface WebScraperConfig {
  url: string;
  selectors: Record<string, WebSelectorRule>;
  requestOptions?: Partial<CurlRequest>;
}

export interface WebScrapeResult {
  url: string;
  success: boolean;
  statusCode?: number;
  data?: Record<string, string | string[]>;
  error?: string;
}

/* ---- Assertions ---- */

export type WebAssertionType = 'status' | 'jsonpath' | 'header' | 'body-regex';

export interface WebAssertionRule {
  type: WebAssertionType;
  /** Expected value (status code or string match) */
  expected?: number | string;
  /** JSONPath expression for jsonpath assertions */
  path?: string;
  /** Regex pattern for body-regex assertions or jsonpath pattern match */
  pattern?: string;
  /** Header name for header assertions */
  name?: string;
  /** Substring that header value must contain */
  contains?: string;
}

export interface WebAssertionResult {
  rule: WebAssertionRule;
  passed: boolean;
  actual: string;
  expected: string;
}

/* ---- Chain Runner ---- */

export interface WebChainStep {
  name: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  /** JSONPath extraction rules: varName -> JSONPath expression */
  extract?: Record<string, string>;
  /** Assertions to evaluate after this step */
  assert?: WebAssertionRule[];
}

export interface WebChainConfig {
  name: string;
  steps: WebChainStep[];
}

export interface WebStepResult {
  stepName: string;
  url: string;
  statusCode: number;
  assertions: WebAssertionResult[];
  extractedVars: Record<string, string>;
  passed: boolean;
  error?: string;
}

export interface WebChainResult {
  chainName: string;
  steps: WebStepResult[];
  passed: boolean;
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
}

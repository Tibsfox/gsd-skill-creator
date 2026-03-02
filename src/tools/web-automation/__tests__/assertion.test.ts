import { describe, it, expect } from 'vitest';
import { evaluateAssertion, evaluateAssertions } from '../assertion.js';
import type { WebAssertionRule } from '../types.js';

const makeResponse = (overrides: Partial<{
  status: number;
  headers: Record<string, string>;
  body: string;
  parsed: unknown;
}> = {}) => ({
  status: overrides.status ?? 200,
  headers: overrides.headers ?? { 'content-type': 'application/json' },
  body: overrides.body ?? '{"name":"test"}',
  parsed: overrides.parsed ?? { name: 'test' },
});

describe('evaluateAssertion', () => {
  describe('status assertions', () => {
    it('passes when status matches expected', () => {
      const rule: WebAssertionRule = { type: 'status', expected: 200 };
      const result = evaluateAssertion(rule, makeResponse());
      expect(result.passed).toBe(true);
      expect(result.actual).toBe('200');
      expect(result.expected).toBe('200');
    });

    it('fails when status differs', () => {
      const rule: WebAssertionRule = { type: 'status', expected: 201 };
      const result = evaluateAssertion(rule, makeResponse());
      expect(result.passed).toBe(false);
      expect(result.actual).toBe('200');
      expect(result.expected).toBe('201');
    });
  });

  describe('jsonpath assertions', () => {
    it('extracts value and matches expected string', () => {
      const rule: WebAssertionRule = { type: 'jsonpath', path: '$.name', expected: 'test' };
      const result = evaluateAssertion(rule, makeResponse());
      expect(result.passed).toBe(true);
      expect(result.actual).toBe('test');
    });

    it('matches regex pattern against extracted value', () => {
      const rule: WebAssertionRule = { type: 'jsonpath', path: '$.name', pattern: '^te.t$' };
      const result = evaluateAssertion(rule, makeResponse());
      expect(result.passed).toBe(true);
    });

    it('fails when pattern does not match', () => {
      const rule: WebAssertionRule = { type: 'jsonpath', path: '$.name', pattern: '^foo$' };
      const result = evaluateAssertion(rule, makeResponse());
      expect(result.passed).toBe(false);
    });
  });

  describe('header assertions', () => {
    it('passes when header contains expected string', () => {
      const rule: WebAssertionRule = { type: 'header', name: 'content-type', contains: 'json' };
      const result = evaluateAssertion(rule, makeResponse());
      expect(result.passed).toBe(true);
    });

    it('is case-insensitive on header name', () => {
      const rule: WebAssertionRule = { type: 'header', name: 'Content-Type', contains: 'json' };
      const result = evaluateAssertion(rule, makeResponse());
      expect(result.passed).toBe(true);
    });

    it('fails when header does not contain expected', () => {
      const rule: WebAssertionRule = { type: 'header', name: 'content-type', contains: 'xml' };
      const result = evaluateAssertion(rule, makeResponse());
      expect(result.passed).toBe(false);
    });
  });

  describe('body-regex assertions', () => {
    it('matches pattern against raw body', () => {
      const rule: WebAssertionRule = { type: 'body-regex', pattern: '"name"\\s*:\\s*"test"' };
      const result = evaluateAssertion(rule, makeResponse());
      expect(result.passed).toBe(true);
      expect(result.actual).toBe('matched');
    });

    it('fails when pattern not found', () => {
      const rule: WebAssertionRule = { type: 'body-regex', pattern: 'nonexistent' };
      const result = evaluateAssertion(rule, makeResponse());
      expect(result.passed).toBe(false);
      expect(result.actual).toBe('no match');
    });
  });

  describe('unknown assertion type', () => {
    it('returns passed=false for unknown type', () => {
      const rule = { type: 'unknown-type' } as unknown as WebAssertionRule;
      const result = evaluateAssertion(rule, makeResponse());
      expect(result.passed).toBe(false);
    });
  });
});

describe('evaluateAssertions', () => {
  it('returns array of WebAssertionResult for multiple rules', () => {
    const rules: WebAssertionRule[] = [
      { type: 'status', expected: 200 },
      { type: 'header', name: 'content-type', contains: 'json' },
      { type: 'body-regex', pattern: 'test' },
    ];
    const results = evaluateAssertions(rules, makeResponse());
    expect(results).toHaveLength(3);
    expect(results.every(r => r.passed)).toBe(true);
    expect(results[0].rule.type).toBe('status');
    expect(results[1].rule.type).toBe('header');
    expect(results[2].rule.type).toBe('body-regex');
  });
});

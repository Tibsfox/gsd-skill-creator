/**
 * Assertion engine for web automation API testing.
 *
 * Evaluates status codes, JSONPath matches, header presence,
 * and body regex with structured pass/fail results for CI output.
 */

import { JSONPath } from 'jsonpath-plus';
import type { WebAssertionRule, WebAssertionResult } from './types.js';

export interface AssertionResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  parsed?: unknown;
}

/**
 * Evaluate a single assertion rule against a response.
 */
export function evaluateAssertion(
  rule: WebAssertionRule,
  response: AssertionResponse,
): WebAssertionResult {
  switch (rule.type) {
    case 'status': {
      const passed = response.status === Number(rule.expected);
      return {
        rule,
        passed,
        actual: String(response.status),
        expected: String(rule.expected),
      };
    }

    case 'jsonpath': {
      const results = JSONPath({ path: rule.path!, json: response.parsed ?? {} });
      const actual = results[0];
      const actualStr = actual != null ? String(actual) : '';
      const passed = rule.pattern
        ? new RegExp(rule.pattern).test(actualStr)
        : actualStr === String(rule.expected);
      return {
        rule,
        passed,
        actual: actualStr,
        expected: rule.expected != null ? String(rule.expected) : (rule.pattern ?? ''),
      };
    }

    case 'header': {
      const headerValue = response.headers[rule.name!.toLowerCase()] ?? '';
      const passed = rule.contains
        ? headerValue.includes(rule.contains)
        : headerValue === String(rule.expected);
      return {
        rule,
        passed,
        actual: headerValue,
        expected: rule.contains ?? String(rule.expected ?? ''),
      };
    }

    case 'body-regex': {
      const passed = new RegExp(rule.pattern!).test(response.body);
      return {
        rule,
        passed,
        actual: passed ? 'matched' : 'no match',
        expected: rule.pattern!,
      };
    }

    default:
      return {
        rule,
        passed: false,
        actual: 'unknown',
        expected: 'unknown assertion type',
      };
  }
}

/**
 * Evaluate multiple assertion rules against a response.
 */
export function evaluateAssertions(
  rules: WebAssertionRule[],
  response: AssertionResponse,
): WebAssertionResult[] {
  return rules.map(rule => evaluateAssertion(rule, response));
}

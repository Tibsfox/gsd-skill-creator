/**
 * YAML chain runner with variable extraction.
 *
 * Orchestrates multi-step API workflows with {{variable}}
 * interpolation between steps. Uses JSONPath for extraction.
 */

import yaml from 'js-yaml';
import { JSONPath } from 'jsonpath-plus';
import { httpRequest } from '../curl/client.js';
import type { CurlMethod } from '../curl/types.js';
import type { WebRateLimiter } from './rate-limiter.js';
import type {
  WebChainConfig,
  WebChainResult,
  WebStepResult,
} from './types.js';
import { evaluateAssertions } from './assertion.js';
import { parseResponse } from './response.js';

/**
 * Replace {{variable}} placeholders with extracted values.
 * Leaves unmatched placeholders untouched.
 */
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    key in vars ? vars[key] : match,
  );
}

/**
 * Extract variables from a wrapped response using JSONPath expressions.
 * The response is wrapped as {body, headers, status} so $.body.token works.
 */
function extractVariables(
  extractRules: Record<string, string>,
  wrappedResponse: unknown,
): Record<string, string> {
  const extracted: Record<string, string> = {};
  for (const [varName, jsonPath] of Object.entries(extractRules)) {
    const results = JSONPath({ path: jsonPath, json: wrappedResponse as object });
    extracted[varName] = results[0] != null ? String(results[0]) : '';
  }
  return extracted;
}

/**
 * Parse a YAML string into a WebChainConfig.
 * Validates that name and steps are present.
 */
export function loadChainConfig(yamlContent: string): WebChainConfig {
  const raw = yaml.load(yamlContent) as WebChainConfig;
  if (!raw || !raw.name) {
    throw new Error('Invalid chain config: requires name field');
  }
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) {
    throw new Error('Invalid chain config: requires at least one step');
  }
  return raw;
}

export class WebChainRunner {
  constructor(private readonly rateLimiter: WebRateLimiter) {}

  async run(config: WebChainConfig): Promise<WebChainResult> {
    const vars: Record<string, string> = {};
    const stepResults: WebStepResult[] = [];
    let totalAssertions = 0;
    let passedAssertions = 0;

    for (const step of config.steps) {
      await this.rateLimiter.acquire();

      // Interpolate variables into URL, headers, body
      const url = interpolate(step.url, vars);
      const headers: Record<string, string> = {};
      if (step.headers) {
        for (const [k, v] of Object.entries(step.headers)) {
          headers[k] = interpolate(v, vars);
        }
      }
      const body = step.body ? interpolate(step.body, vars) : undefined;

      const response = await httpRequest({
        url,
        method: (step.method ?? 'GET') as CurlMethod,
        headers,
        body,
      });

      // Check for blocked response (SSRF)
      if (response.blocked) {
        stepResults.push({
          stepName: step.name,
          url,
          statusCode: 0,
          assertions: [],
          extractedVars: {},
          passed: false,
          error: response.blockReason,
        });
        break; // stop-on-failure
      }

      // Parse response
      const parsed = parseResponse(response);

      // Wrap response for JSONPath extraction: $.body.token, $.status, $.headers.x
      const wrappedResponse = {
        body: parsed.parsed,
        headers: response.headers,
        status: response.status,
      };

      // Extract variables for subsequent steps
      const extractedVars = step.extract
        ? extractVariables(step.extract, wrappedResponse)
        : {};
      Object.assign(vars, extractedVars);

      // Evaluate assertions
      const assertions = step.assert
        ? evaluateAssertions(step.assert, {
            status: response.status,
            headers: response.headers,
            body: response.body,
            parsed: parsed.parsed,
          })
        : [];

      const stepPassed = assertions.every(a => a.passed);
      totalAssertions += assertions.length;
      passedAssertions += assertions.filter(a => a.passed).length;

      stepResults.push({
        stepName: step.name,
        url,
        statusCode: response.status,
        assertions,
        extractedVars,
        passed: stepPassed,
      });
    }

    return {
      chainName: config.name,
      steps: stepResults,
      passed: stepResults.every(s => s.passed),
      totalAssertions,
      passedAssertions,
      failedAssertions: totalAssertions - passedAssertions,
    };
  }
}

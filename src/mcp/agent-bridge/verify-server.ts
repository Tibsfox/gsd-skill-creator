/**
 * VERIFY Agent MCP Server.
 *
 * Exposes the VERIFY agent's validation capabilities as an MCP server with:
 * - 4 tools: verify:run-tests, verify:check-types, verify:audit, verify:coverage
 * - 2 resources: verify://results/latest, verify://capabilities
 *
 * Tool handlers are stub implementations returning structured placeholder
 * results. Real agent logic is wired in integration phases.
 *
 * @module mcp/agent-bridge/verify-server
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createAgentServer } from './agent-server-adapter.js';
import type { AgentServerConfig, AgentToolDef, AgentResourceDef } from './types.js';

// ============================================================================
// VERIFY Tool Definitions
// ============================================================================

const verifyRunTests: AgentToolDef = {
  name: 'verify:run-tests',
  description: 'Run test suite and return structured results including pass/fail counts and failure details',
  inputSchema: {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'Test file pattern (glob)' },
      suite: { type: 'string', description: 'Named test suite to run' },
    },
  },
  handler: async (params) => {
    const pattern = params.pattern ? String(params.pattern) : '**/*.test.ts';
    const suite = params.suite ? String(params.suite) : 'all';
    const results = {
      suite,
      pattern,
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      failures: [],
      duration: 0,
      timestamp: new Date().toISOString(),
    };
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(results) }],
    };
  },
};

const verifyCheckTypes: AgentToolDef = {
  name: 'verify:check-types',
  description: 'Run TypeScript type checker and return diagnostic results',
  inputSchema: {
    type: 'object',
    properties: {
      strict: { type: 'boolean', description: 'Enable strict mode (default: true)' },
    },
  },
  handler: async (params) => {
    const strict = params.strict !== false;
    const diagnostics = {
      strict,
      errors: 0,
      warnings: 0,
      diagnostics: [],
      timestamp: new Date().toISOString(),
    };
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(diagnostics) }],
    };
  },
};

const verifyAudit: AgentToolDef = {
  name: 'verify:audit',
  description: 'Run security and quality audit returning findings categorized by severity',
  inputSchema: {
    type: 'object',
    properties: {
      scope: {
        type: 'string',
        enum: ['security', 'quality', 'all'],
        description: 'Audit scope (default: all)',
      },
    },
  },
  handler: async (params) => {
    const scope = params.scope ? String(params.scope) : 'all';
    const report = {
      scope,
      findings: [],
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      timestamp: new Date().toISOString(),
    };
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(report) }],
    };
  },
};

const verifyCoverage: AgentToolDef = {
  name: 'verify:coverage',
  description: 'Compute code coverage and return report with per-file and aggregate metrics',
  inputSchema: {
    type: 'object',
    properties: {
      threshold: { type: 'number', description: 'Minimum coverage percentage threshold' },
    },
  },
  handler: async (params) => {
    const threshold = typeof params.threshold === 'number' ? params.threshold : 80;
    const report = {
      threshold,
      aggregate: { lines: 0, branches: 0, functions: 0, statements: 0 },
      meetsThreshold: false,
      files: [],
      timestamp: new Date().toISOString(),
    };
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(report) }],
    };
  },
};

// ============================================================================
// VERIFY Resource Definitions
// ============================================================================

/** In-memory state for latest verification results. */
let latestResults: Record<string, unknown> = { results: [], lastUpdated: null };

const verifyResultsResource: AgentResourceDef = {
  uri: 'verify://results/latest',
  name: 'Latest Verification Results',
  description: 'Most recent verification results produced by the VERIFY agent',
  mimeType: 'application/json',
  reader: async () => JSON.stringify(latestResults),
};

const verifyCapabilitiesResource: AgentResourceDef = {
  uri: 'verify://capabilities',
  name: 'VERIFY Capabilities',
  description: 'VERIFY agent capability manifest listing available validation operations',
  mimeType: 'application/json',
  reader: async () => JSON.stringify({
    agentId: 'verify',
    agentName: 'VERIFY',
    capabilities: ['test-runner', 'type-checker', 'auditor', 'coverage-reporter'],
    tools: ['verify:run-tests', 'verify:check-types', 'verify:audit', 'verify:coverage'],
    resources: ['verify://results/latest', 'verify://capabilities'],
  }),
};

// ============================================================================
// Factory
// ============================================================================

/** Default VERIFY server configuration. */
export const VERIFY_SERVER_CONFIG: AgentServerConfig = {
  agentId: 'verify',
  agentName: 'VERIFY',
  version: '1.0.0',
  tools: [verifyRunTests, verifyCheckTypes, verifyAudit, verifyCoverage],
  resources: [verifyResultsResource, verifyCapabilitiesResource],
  maxConcurrency: 3,
};

/**
 * Create an MCP server exposing VERIFY agent capabilities.
 *
 * @returns McpServer with 4 tools and 2 resources
 */
export function createVerifyServer(): McpServer {
  return createAgentServer(VERIFY_SERVER_CONFIG);
}

/**
 * Chipset MCP tools for the gateway server.
 *
 * Registers chipset.get, chipset.modify, and chipset.synthesize tools
 * on an MCP server instance. These tools allow external agents to read,
 * modify, and synthesize chipset configurations through the gateway.
 *
 * GATE-20: chipset.get returns current chipset as structured object
 * GATE-21: chipset.modify updates chipset and returns diff
 * GATE-22: chipset.synthesize produces valid chipset from description
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ChipsetConfig, ChipsetConfigSchema } from '../../../../den/chipset.js';
import type { ChipsetStateManager, ChipsetUpdate } from './chipset-state.js';

// ============================================================================
// Tool Registration
// ============================================================================

/**
 * Register all chipset tools on an MCP server instance.
 *
 * @param server - The MCP server to register tools on
 * @param state - The chipset state manager providing get/modify/replace
 */
export function registerChipsetTools(
  server: McpServer,
  state: ChipsetStateManager,
): void {
  registerChipsetGet(server, state);
  registerChipsetModify(server, state);
  registerChipsetSynthesize(server, state);
}

// ============================================================================
// chipset.get
// ============================================================================

/**
 * Register chipset.get tool.
 * Returns the current chipset configuration as a structured JSON object.
 * Read scope -- no parameters required.
 */
function registerChipsetGet(server: McpServer, state: ChipsetStateManager): void {
  server.tool(
    'chipset.get',
    'Return the current chipset configuration as a structured JSON object',
    {},
    async () => {
      const config = state.get();
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(config, null, 2),
        }],
      };
    },
  );
}

// ============================================================================
// chipset.modify
// ============================================================================

/** Input schema for chipset.modify. */
const ChipsetModifyInputSchema = {
  name: z.string().optional().describe('New chipset name'),
  version: z.string().optional().describe('New version string'),
  totalBudget: z.number().min(0).max(1).optional().describe('New total budget (0.0 to 1.0)'),
  positions: z.array(z.object({
    id: z.string().describe('Position agent ID'),
    role: z.string().optional().describe('Role descriptor'),
    context: z.enum(['main', 'fork']).optional().describe('Execution context'),
    tokenBudget: z.number().min(0).max(1).optional().describe('Token budget fraction'),
    lifecycle: z.enum(['persistent', 'task']).optional().describe('Lifecycle mode'),
    activationTrigger: z.string().optional().describe('Activation event'),
  })).optional().describe('Positions to add or update'),
  removePositions: z.array(z.string()).optional().describe('Position IDs to remove'),
  topologyType: z.string().optional().describe('New topology type'),
  topologyFallback: z.string().optional().describe('New topology fallback agent'),
};

/**
 * Register chipset.modify tool.
 * Accepts a partial update, applies it, and returns a unified diff.
 * Write scope required.
 */
function registerChipsetModify(server: McpServer, state: ChipsetStateManager): void {
  server.tool(
    'chipset.modify',
    'Update the chipset configuration and return a diff of changes',
    ChipsetModifyInputSchema,
    async (args) => {
      try {
        const update: ChipsetUpdate = {
          name: args.name,
          version: args.version,
          totalBudget: args.totalBudget,
          positions: args.positions,
          removePositions: args.removePositions,
          topology: (args.topologyType || args.topologyFallback) ? {
            type: args.topologyType,
            fallback: args.topologyFallback,
          } : undefined,
        };

        const result = state.modify(update);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              config: result.config,
              diff: result.diff,
            }, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error modifying chipset: ${err instanceof Error ? err.message : String(err)}`,
          }],
          isError: true,
        };
      }
    },
  );
}

// ============================================================================
// chipset.synthesize
// ============================================================================

/**
 * Register chipset.synthesize tool.
 * Produces a valid ChipsetConfig from a natural language description.
 * Uses keyword matching for topology selection and role extraction.
 * Write scope required.
 */
function registerChipsetSynthesize(server: McpServer, state: ChipsetStateManager): void {
  server.tool(
    'chipset.synthesize',
    'Produce a valid chipset configuration from a natural language description',
    {
      description: z.string().min(1).describe('Natural language description of the desired chipset'),
    },
    async (args) => {
      try {
        const config = synthesizeChipset(args.description);
        state.replace(config);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(config, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error synthesizing chipset: ${err instanceof Error ? err.message : String(err)}`,
          }],
          isError: true,
        };
      }
    },
  );
}

// ============================================================================
// Synthesis Engine (pure, deterministic)
// ============================================================================

/** Topology keyword mapping. */
const TOPOLOGY_KEYWORDS: Record<string, string[]> = {
  squadron: ['squadron', 'team', 'squad', 'group', 'coordinated', 'default'],
  pipeline: ['pipeline', 'sequential', 'chain', 'stages', 'flow'],
  parallel: ['parallel', 'concurrent', 'distributed', 'independent'],
  hierarchical: ['hierarchy', 'hierarchical', 'tree', 'manager', 'leader'],
};

/** Role keyword mapping. */
const ROLE_KEYWORDS: Record<string, string[]> = {
  orchestrator: ['orchestrate', 'coordinate', 'manage', 'direct', 'lead'],
  executor: ['execute', 'build', 'implement', 'code', 'develop', 'run'],
  verifier: ['verify', 'test', 'validate', 'check', 'qa', 'quality'],
  planner: ['plan', 'design', 'architect', 'strategy', 'blueprint'],
  monitor: ['monitor', 'observe', 'watch', 'track', 'metrics'],
  documenter: ['document', 'write', 'chronicle', 'record', 'log'],
  recovery: ['recover', 'sentinel', 'guard', 'protect', 'fallback', 'error'],
  interface: ['relay', 'interface', 'communicate', 'bridge', 'connect'],
  configurator: ['configure', 'setup', 'provision', 'install'],
  infrastructure: ['dispatch', 'infrastructure', 'deploy', 'route'],
};

/**
 * Synthesize a chipset configuration from a natural language description.
 *
 * Pure and deterministic -- no LLM calls, no randomness. Uses keyword
 * matching to select topology and extract relevant roles.
 *
 * @param description - Natural language description
 * @returns Valid ChipsetConfig
 */
export function synthesizeChipset(description: string): ChipsetConfig {
  const lower = description.toLowerCase();
  const words = lower.split(/\s+/);

  // Detect topology
  const topology = detectTopology(words);

  // Detect roles
  const roles = detectRoles(words);

  // Ensure at least coordinator + executor
  if (!roles.includes('orchestrator')) roles.unshift('orchestrator');
  if (!roles.includes('executor')) roles.push('executor');

  // Deduplicate
  const uniqueRoles = [...new Set(roles)];

  // Build positions
  const validIds = [
    'coordinator', 'relay', 'planner', 'configurator',
    'monitor', 'dispatcher', 'verifier', 'chronicler',
    'sentinel', 'executor',
  ];

  const roleToId: Record<string, string> = {
    orchestrator: 'coordinator',
    executor: 'executor',
    verifier: 'verifier',
    planner: 'planner',
    monitor: 'monitor',
    documenter: 'chronicler',
    recovery: 'sentinel',
    interface: 'relay',
    configurator: 'configurator',
    infrastructure: 'dispatcher',
  };

  const budgetPerPosition = Math.min(0.15, 0.6 / uniqueRoles.length);

  const positions = uniqueRoles
    .map((role) => {
      const id = roleToId[role];
      if (!id || !validIds.includes(id)) return null;
      return {
        id: id as ChipsetConfig['positions'][0]['id'],
        role,
        context: (role === 'orchestrator' || role === 'monitor' || role === 'interface' || role === 'infrastructure')
          ? 'main' as const
          : 'fork' as const,
        tokenBudget: Number(budgetPerPosition.toFixed(2)),
        lifecycle: (role === 'orchestrator' || role === 'monitor' || role === 'interface' || role === 'infrastructure')
          ? 'persistent' as const
          : 'task' as const,
        activationTrigger: role === 'orchestrator' ? 'session_start'
          : role === 'verifier' ? 'on_verification'
          : role === 'executor' ? 'on_execution'
          : role === 'recovery' ? 'on_error'
          : role === 'documenter' ? 'on_phase_exit'
          : role === 'monitor' ? 'session_start'
          : role === 'interface' ? 'session_start'
          : role === 'infrastructure' ? 'session_start'
          : 'on_phase_enter',
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Deduplicate positions by id
  const seenIds = new Set<string>();
  const dedupedPositions = positions.filter((p) => {
    if (seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    return true;
  });

  // Build topology agents map
  const agents: Record<string, { role: string; context: 'main' | 'fork' }> = {};
  for (const pos of dedupedPositions) {
    agents[pos.id] = { role: pos.role, context: pos.context };
  }

  // Generate name from description
  const nameWords = lower
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 3);
  const name = nameWords.length > 0 ? nameWords.join('-') : 'custom-chipset';

  const totalBudget = Number(
    dedupedPositions.reduce((sum, p) => sum + p.tokenBudget, 0).toFixed(2),
  );

  return {
    name,
    version: '1.0.0',
    positions: dedupedPositions,
    topology: {
      type: topology,
      agents,
      fallback: 'coordinator',
    },
    totalBudget: Math.min(totalBudget, 1.0),
  };
}

/**
 * Detect the best-matching topology from keywords.
 */
function detectTopology(words: string[]): string {
  let bestMatch = 'squadron';
  let bestScore = 0;

  for (const [topology, keywords] of Object.entries(TOPOLOGY_KEYWORDS)) {
    const score = words.filter((w) => keywords.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = topology;
    }
  }

  return bestMatch;
}

/**
 * Detect roles from keywords in the description.
 */
function detectRoles(words: string[]): string[] {
  const roles: string[] = [];

  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    const matches = words.filter((w) => keywords.some((kw) => w.includes(kw)));
    if (matches.length > 0) {
      roles.push(role);
    }
  }

  return roles;
}

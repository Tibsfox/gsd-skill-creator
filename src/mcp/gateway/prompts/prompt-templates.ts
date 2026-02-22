/**
 * MCP prompt templates for the gateway server.
 *
 * Registers three prompt templates on an MCP server instance:
 * 1. create-project -- Structured prompt for creating a new GSD project
 * 2. diagnose-agent -- Structured prompt for diagnosing agent issues
 * 3. optimize-chipset -- Structured prompt for optimizing chipset configuration
 *
 * Each template accepts arguments and returns pre-structured messages
 * that guide the AI through the workflow.
 *
 * GATE-24: Prompt templates for create-project, diagnose-agent, and
 *          optimize-chipset workflows.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// ============================================================================
// Prompt Registration
// ============================================================================

/**
 * Register all prompt templates on an MCP server instance.
 *
 * @param server - The MCP server to register prompts on
 */
export function registerPromptTemplates(server: McpServer): void {
  registerCreateProjectPrompt(server);
  registerDiagnoseAgentPrompt(server);
  registerOptimizeChipsetPrompt(server);
}

// ============================================================================
// create-project
// ============================================================================

function registerCreateProjectPrompt(server: McpServer): void {
  server.prompt(
    'create-project',
    'Generate a structured prompt for creating a new GSD project',
    {
      name: z.string().describe('Project name'),
      description: z.string().describe('What the project does'),
      domain: z.string().optional().describe('Project domain (e.g., web, cli, library)'),
    },
    (args) => {
      const domainContext = args.domain
        ? `\n\nThe project is in the "${args.domain}" domain. Apply domain-specific conventions and best practices.`
        : '';

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: [
                `Create a new GSD project with the following specification:`,
                ``,
                `**Project Name:** ${args.name}`,
                `**Description:** ${args.description}`,
                domainContext ? `**Domain:** ${args.domain}` : '',
                ``,
                `## Requirements`,
                ``,
                `1. Initialize the GSD planning structure (.planning/ directory)`,
                `2. Create PROJECT.md with vision, constraints, and decisions`,
                `3. Create REQUIREMENTS.md with requirement IDs`,
                `4. Create ROADMAP.md with phases`,
                `5. Create STATE.md for session continuity`,
                `6. Create config.json with workflow preferences`,
                ``,
                `## Project Structure`,
                ``,
                `Follow GSD conventions:`,
                `- .planning/PROJECT.md -- Vision and scope`,
                `- .planning/REQUIREMENTS.md -- Requirement specifications with IDs`,
                `- .planning/ROADMAP.md -- Phase structure with milestones`,
                `- .planning/STATE.md -- Session memory and blockers`,
                `- .planning/config.json -- Workflow configuration`,
                ``,
                `## Constraints`,
                ``,
                `- All requirement IDs must be unique and follow the pattern PREFIX-NN`,
                `- Phases must have clear success criteria`,
                `- Each phase should be completable in 1-3 sessions`,
                domainContext,
              ].filter(Boolean).join('\n'),
            },
          },
        ],
      };
    },
  );
}

// ============================================================================
// diagnose-agent
// ============================================================================

function registerDiagnoseAgentPrompt(server: McpServer): void {
  server.prompt(
    'diagnose-agent',
    'Generate a structured prompt for diagnosing agent issues',
    {
      agentId: z.string().describe('Agent ID to diagnose'),
      symptoms: z.string().describe('Observed issues or symptoms'),
      context: z.string().optional().describe('Additional context about the agent environment'),
    },
    (args) => {
      const contextSection = args.context
        ? `\n\n## Additional Context\n\n${args.context}`
        : '';

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: [
                `Diagnose issues with the following GSD agent:`,
                ``,
                `**Agent ID:** ${args.agentId}`,
                `**Symptoms:** ${args.symptoms}`,
                ``,
                `## Diagnostic Steps`,
                ``,
                `1. **Check Agent Status** -- Use chipset.get to verify the agent's position in the chipset topology`,
                `2. **Review Telemetry** -- Check token usage, task count, and last activity`,
                `3. **Examine Logs** -- Look for error patterns, repeated failures, or stuck states`,
                `4. **Verify Dependencies** -- Check if the agent's dependencies (other agents, resources) are healthy`,
                `5. **Test Connectivity** -- Verify the agent can communicate with its upstream and downstream agents`,
                ``,
                `## Analysis Framework`,
                ``,
                `For each diagnostic step, categorize findings as:`,
                `- **Normal** -- Expected behavior, not contributing to symptoms`,
                `- **Warning** -- Unusual but not necessarily causing the issue`,
                `- **Critical** -- Likely root cause or contributing factor`,
                ``,
                `## Resolution`,
                ``,
                `Based on the diagnosis:`,
                `1. Identify the root cause`,
                `2. Propose a fix (configuration change, restart, code fix)`,
                `3. Verify the fix resolves the symptoms`,
                `4. Document the resolution for future reference`,
                contextSection,
              ].filter(Boolean).join('\n'),
            },
          },
        ],
      };
    },
  );
}

// ============================================================================
// optimize-chipset
// ============================================================================

function registerOptimizeChipsetPrompt(server: McpServer): void {
  server.prompt(
    'optimize-chipset',
    'Generate a structured prompt for optimizing chipset configuration',
    {
      goal: z.string().describe('Optimization goal (e.g., reduce latency, improve throughput)'),
      constraints: z.string().optional().describe('Constraints to respect during optimization'),
      currentConfig: z.string().optional().describe('Current chipset YAML to analyze'),
    },
    (args) => {
      const constraintsSection = args.constraints
        ? `\n\n## Constraints\n\nThe following constraints must be respected:\n${args.constraints}`
        : '';

      const configSection = args.currentConfig
        ? `\n\n## Current Configuration\n\n\`\`\`yaml\n${args.currentConfig}\n\`\`\``
        : '\n\n*No current configuration provided. Use chipset.get to retrieve the current state.*';

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: [
                `Optimize the chipset configuration for the following goal:`,
                ``,
                `**Goal:** ${args.goal}`,
                ``,
                `## Optimization Process`,
                ``,
                `1. **Analyze Current State** -- Review the current chipset topology, positions, and budget allocations`,
                `2. **Identify Bottlenecks** -- Find positions that are over/under-budgeted relative to the goal`,
                `3. **Propose Changes** -- Suggest specific modifications:`,
                `   - Position additions or removals`,
                `   - Token budget rebalancing`,
                `   - Topology restructuring`,
                `   - Context mode changes (main vs fork)`,
                `   - Lifecycle adjustments (persistent vs task)`,
                `4. **Evaluate Trade-offs** -- For each change, describe what improves and what might degrade`,
                `5. **Apply Changes** -- Use chipset.modify to apply the optimized configuration`,
                `6. **Validate** -- Use chipset.get to verify the changes and review the diff`,
                ``,
                `## Budget Rules`,
                ``,
                `- Total budget must not exceed 1.0 (100% of context window)`,
                `- Persistent agents should have smaller budgets (0.03-0.08)`,
                `- Task agents can have larger budgets (0.05-0.20)`,
                `- Coordinator/orchestrator should always exist as fallback`,
                constraintsSection,
                configSection,
              ].filter(Boolean).join('\n'),
            },
          },
        ],
      };
    },
  );
}

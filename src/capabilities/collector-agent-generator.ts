/**
 * CollectorAgentGenerator service.
 *
 * Generates read-only Claude Code agents that gather information
 * (codebase analysis, file scanning, pattern detection) without
 * modifying anything, then return compressed summaries.
 *
 * Implements TOK-05: Collector agents reduce context usage by running
 * as subagents that produce focused output.
 */

import { validateAgentFrontmatter } from '../validation/agent-validation.js';
import type { AgentFrontmatter } from '../types/agent.js';

// ============================================================================
// Constants
// ============================================================================

/** Read-only tools allowed for collector agents. */
export const COLLECTOR_TOOLS = ['Read', 'Glob', 'Grep', 'WebFetch'] as const;

// ============================================================================
// Types
// ============================================================================

export interface CollectorAgentConfig {
  name: string;             // Agent name (kebab-case, e.g., "codebase-scanner")
  description: string;      // When to delegate to this agent
  purpose: string;          // What information this agent gathers
  gatherInstructions: string[];  // Specific gathering steps
  outputFormat: string;     // Expected output structure description
}

export interface CollectorAgentResult {
  name: string;
  filePath: string;         // Relative path: ".claude/agents/{name}.md"
  content: string;          // Full agent markdown with frontmatter
  valid: boolean;           // Whether generated agent passes validation
  validationErrors: string[];
}

// ============================================================================
// CollectorAgentGenerator
// ============================================================================

export class CollectorAgentGenerator {
  constructor(private outputDir: string = '.claude/agents') {}

  /**
   * Generate a read-only collector agent from config.
   *
   * Pure function: returns content string, does NOT write to disk.
   */
  generate(_config: CollectorAgentConfig): CollectorAgentResult {
    throw new Error('Not implemented');
  }
}

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
  generate(config: CollectorAgentConfig): CollectorAgentResult {
    const name = this.sanitizeName(config.name);
    const toolsStr = COLLECTOR_TOOLS.join(', ');

    // Build frontmatter (raw markdown, NOT gray-matter)
    const frontmatter = [
      '---',
      `name: ${name}`,
      `description: "${config.description}"`,
      `tools: ${toolsStr}`,
      '---',
    ].join('\n');

    // Build agent body
    const body = this.buildBody(config);

    const content = `${frontmatter}\n\n${body}\n`;

    // Validate the generated frontmatter
    const fmData: AgentFrontmatter = {
      name,
      description: config.description,
      tools: toolsStr,
    };

    const validation = validateAgentFrontmatter(fmData);
    const validationErrors = validation.valid ? [] : validation.errors;

    return {
      name,
      filePath: `${this.outputDir}/${name}.md`,
      content,
      valid: validation.valid,
      validationErrors,
    };
  }

  /**
   * Build the markdown body with purpose, gathering steps, and output format.
   */
  private buildBody(config: CollectorAgentConfig): string {
    const sections: string[] = [];

    // Purpose paragraph
    sections.push(config.purpose);

    // Gathering steps as numbered list
    sections.push('## Gathering Steps');
    const steps = config.gatherInstructions
      .map((step, i) => `${i + 1}. ${step}`)
      .join('\n');
    sections.push(steps);

    // Output format with compressed output instructions
    sections.push('## Output Format');
    sections.push([
      'Return a structured markdown summary:',
      '- Use headers and bullet points, no prose',
      '- Keep total output under 500 lines',
      '- Include file paths as absolute paths',
      '- Use code blocks for code snippets',
    ].join('\n'));

    // Append the config-specified output format
    sections.push(config.outputFormat);

    return sections.join('\n\n');
  }

  /**
   * Sanitize name to kebab-case.
   *
   * Matches the AgentGenerator.sanitizeName pattern:
   * lowercase, replace non-alphanumeric with hyphens, collapse multiples,
   * trim edges, max 64 chars.
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64);
  }
}

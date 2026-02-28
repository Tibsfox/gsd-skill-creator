/**
 * Agent frontmatter validation module.
 *
 * Provides validation for Claude Code agent format with:
 * - Zod schema for frontmatter structure
 * - Case-insensitive tool name validation
 * - Fuzzy matching for typo suggestions
 * - MCP tool pattern acceptance
 */

import { z } from 'zod';
import natural from 'natural';
import {
  KNOWN_TOOLS,
  MODEL_ALIASES,
  PERMISSION_MODES,
  MCP_TOOL_PATTERN,
  type AgentFrontmatter,
  type AgentValidationResult,
  type ToolValidationResult,
  type ToolsFieldValidationResult,
} from '../types/agent.js';

// ============================================================================
// Agent Name Pattern
// ============================================================================

/**
 * Agent name pattern - lowercase letters, numbers, hyphens only.
 * Same pattern as skill names for consistency.
 */
const AGENT_NAME_PATTERN = /^[a-z0-9-]+$/;

// ============================================================================
// Zod Schema
// ============================================================================

/**
 * Zod schema for validating agent frontmatter.
 *
 * - name: required, lowercase letters/numbers/hyphens
 * - description: required
 * - tools: optional string (comma-separated, NOT array)
 * - disallowedTools: optional string
 * - model: optional enum (sonnet, opus, haiku, inherit)
 * - permissionMode: optional enum
 * - skills: optional array of strings (this IS an array)
 * - color: optional string
 * - Uses passthrough() for forward compatibility
 */
export const AgentFrontmatterSchema = z
  .object({
    name: z
      .string({
        error: (iss) =>
          iss.input === undefined
            ? 'Agent name is required'
            : 'Agent name must be a string',
      })
      .min(1, 'Agent name cannot be empty')
      .regex(AGENT_NAME_PATTERN, 'Agent name must be lowercase letters, numbers, and hyphens only'),

    description: z
      .string({
        error: (iss) =>
          iss.input === undefined
            ? 'Agent description is required'
            : 'Agent description must be a string',
      })
      .min(1, 'Agent description cannot be empty'),

    tools: z.string().optional(),

    disallowedTools: z.string().optional(),

    model: z.enum(MODEL_ALIASES as unknown as [string, ...string[]]).optional(),

    permissionMode: z.enum(PERMISSION_MODES as unknown as [string, ...string[]]).optional(),

    skills: z.array(z.string()).optional(),

    hooks: z.record(z.string(), z.unknown()).optional(),

    color: z.string().optional(),
  })
  .passthrough(); // Allow unknown fields for forward compatibility

// ============================================================================
// Tool Name Validation
// ============================================================================

/**
 * Validate a single tool name.
 *
 * - MCP tools (mcp__*__*) are accepted without validation
 * - Known tools are matched case-insensitively, returns correct casing
 * - Unknown tools trigger fuzzy matching with Levenshtein distance
 *
 * @param input - Tool name to validate
 * @returns Validation result with corrected name or suggestions
 */
export function validateToolName(input: string): ToolValidationResult {
  const trimmed = input.trim();

  // Accept MCP tools without validation
  if (MCP_TOOL_PATTERN.test(trimmed)) {
    return {
      input: trimmed,
      valid: true,
    };
  }

  // Case-insensitive exact match against known tools
  const exactMatch = KNOWN_TOOLS.find(
    (tool) => tool.toLowerCase() === trimmed.toLowerCase()
  );

  if (exactMatch) {
    // Return corrected casing if different from input
    if (exactMatch !== trimmed) {
      return {
        input: trimmed,
        valid: true,
        corrected: exactMatch,
      };
    }
    return {
      input: trimmed,
      valid: true,
    };
  }

  // Fuzzy match for typos using Levenshtein distance
  let bestMatch = '';
  let bestDistance = Infinity;

  for (const tool of KNOWN_TOOLS) {
    const distance = natural.LevenshteinDistance(
      trimmed.toLowerCase(),
      tool.toLowerCase()
    );
    if (distance < bestDistance && distance <= 2) {
      bestDistance = distance;
      bestMatch = tool;
    }
  }

  if (bestMatch) {
    return {
      input: trimmed,
      valid: false,
      suggestion: bestMatch,
      warning: `Unknown tool "${trimmed}". Did you mean "${bestMatch}"?`,
    };
  }

  // No close match found
  return {
    input: trimmed,
    valid: false,
    warning: `Unknown tool "${trimmed}". This may be a custom or future tool.`,
  };
}

// ============================================================================
// Tools String Parsing
// ============================================================================

/**
 * Parse a comma-separated tools string into an array.
 *
 * @param tools - Comma-separated tools string (e.g., "Read, Write, Bash")
 * @returns Array of tool names (trimmed, empty strings filtered)
 */
export function parseToolsString(tools: string): string[] {
  return tools
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

// ============================================================================
// Tools Field Validation
// ============================================================================

/**
 * Validate the entire tools field.
 *
 * Parses the comma-separated string and validates each tool name.
 * Returns errors for invalid tools and warnings for unknown tools.
 *
 * @param tools - Comma-separated tools string
 * @returns Validation result with errors, warnings, and corrected string
 */
export function validateToolsField(tools: string): ToolsFieldValidationResult {
  const toolNames = parseToolsString(tools);
  const errors: string[] = [];
  const warnings: string[] = [];
  const correctedTools: string[] = [];
  let hasCorrections = false;

  for (const toolName of toolNames) {
    const result = validateToolName(toolName);

    if (result.valid) {
      // Use corrected casing if available
      if (result.corrected) {
        correctedTools.push(result.corrected);
        hasCorrections = true;
      } else {
        correctedTools.push(result.input);
      }
    } else {
      // Tool is unknown or invalid
      if (result.warning) {
        warnings.push(result.warning);
      }
      // Still include in output (might be custom tool)
      if (result.suggestion) {
        correctedTools.push(result.suggestion);
        hasCorrections = true;
      } else {
        correctedTools.push(result.input);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    corrected: hasCorrections ? correctedTools.join(', ') : undefined,
  };
}

// ============================================================================
// Full Agent Frontmatter Validation
// ============================================================================

/**
 * Validate complete agent frontmatter.
 *
 * Runs Zod schema validation and tools field validation.
 * Returns combined result with all errors, warnings, and suggestions.
 *
 * @param data - Raw frontmatter data to validate
 * @returns Comprehensive validation result
 */
export function validateAgentFrontmatter(data: unknown): AgentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Run Zod schema validation
  const schemaResult = AgentFrontmatterSchema.safeParse(data);

  if (!schemaResult.success) {
    // Collect schema errors
    for (const issue of schemaResult.error.issues) {
      const path = issue.path.join('.');
      errors.push(path ? `${path}: ${issue.message}` : issue.message);
    }

    return {
      valid: false,
      errors,
      warnings,
      suggestions,
    };
  }

  const frontmatter = schemaResult.data as AgentFrontmatter;

  // Validate tools field if present
  if (frontmatter.tools) {
    const toolsResult = validateToolsField(frontmatter.tools);

    // Tools validation only produces warnings, not blocking errors
    warnings.push(...toolsResult.warnings);

    if (toolsResult.corrected) {
      suggestions.push(`Suggested tools field: "${toolsResult.corrected}"`);
    }
  }

  // Validate disallowedTools field if present
  if (frontmatter.disallowedTools) {
    const disallowedResult = validateToolsField(frontmatter.disallowedTools);
    warnings.push(...disallowedResult.warnings);

    if (disallowedResult.corrected) {
      suggestions.push(`Suggested disallowedTools field: "${disallowedResult.corrected}"`);
    }
  }

  return {
    valid: true,
    errors,
    warnings,
    suggestions,
    data: frontmatter,
  };
}

/**
 * Suggest tool name correction for typos.
 *
 * Uses Levenshtein distance to find the closest known tool name.
 *
 * @param input - Tool name with potential typo
 * @returns Suggested correction or null if no close match
 */
export function suggestToolCorrection(input: string): string | null {
  const trimmed = input.trim();

  // MCP tools don't need correction
  if (MCP_TOOL_PATTERN.test(trimmed)) {
    return null;
  }

  // Check for case-insensitive exact match
  const exactMatch = KNOWN_TOOLS.find(
    (tool) => tool.toLowerCase() === trimmed.toLowerCase()
  );
  if (exactMatch) {
    // Return correction only if casing differs, otherwise null (no correction needed)
    return exactMatch !== trimmed ? exactMatch : null;
  }

  // Fuzzy match
  let bestMatch = '';
  let bestDistance = Infinity;

  for (const tool of KNOWN_TOOLS) {
    const distance = natural.LevenshteinDistance(
      trimmed.toLowerCase(),
      tool.toLowerCase()
    );
    if (distance < bestDistance && distance <= 2) {
      bestDistance = distance;
      bestMatch = tool;
    }
  }

  return bestMatch || null;
}

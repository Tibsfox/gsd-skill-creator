/**
 * Claude Code agent type definitions.
 *
 * Agent frontmatter format follows the official Claude Code specification.
 * See: https://code.claude.com/docs/en/sub-agents
 */

// ============================================================================
// Known Tools
// ============================================================================

/**
 * Known Claude Code tool names for validation and suggestions.
 *
 * Source: Official documentation + community references
 * These are case-sensitive - official tool names use PascalCase.
 */
export const KNOWN_TOOLS = [
  // Core file/shell tools
  'Bash',
  'Read',
  'Write',
  'Edit',
  'Glob',
  'Grep',
  // Web tools
  'WebFetch',
  'WebSearch',
  // Task/agent tools
  'Task',
  'TaskOutput',
  // Notebook tools
  'NotebookEdit',
  'NotebookRead',
  // Other tools
  'TodoWrite',
  'ExitPlanMode',
  'BashOutput',
  'KillShell',
  'LS',
  'MultiEdit',
  'AskUserQuestion',
  'MCPSearch',
  // Team coordination tools
  'TeammateTool',
  'SendMessage',
  'TaskCreate',
  'TaskList',
  'TaskGet',
  'TaskUpdate',
] as const;

/** Type for known tool names */
export type KnownTool = (typeof KNOWN_TOOLS)[number];

// ============================================================================
// Model Aliases
// ============================================================================

/**
 * Valid model aliases for agents.
 *
 * - sonnet: Claude Sonnet (balanced)
 * - opus: Claude Opus (highest capability)
 * - haiku: Claude Haiku (fastest)
 * - inherit: Use parent model (default)
 */
export const MODEL_ALIASES = ['sonnet', 'opus', 'haiku', 'inherit'] as const;

/** Type for model alias */
export type ModelAlias = (typeof MODEL_ALIASES)[number];

// ============================================================================
// Permission Modes
// ============================================================================

/**
 * Valid permission modes for agents.
 *
 * - default: Normal permission handling
 * - acceptEdits: Auto-accept edit operations
 * - dontAsk: Skip confirmations (dangerous)
 * - bypassPermissions: Bypass all permissions (very dangerous)
 * - plan: Plan mode - no execution
 */
export const PERMISSION_MODES = [
  'default',
  'acceptEdits',
  'dontAsk',
  'bypassPermissions',
  'plan',
] as const;

/** Type for permission mode */
export type PermissionMode = (typeof PERMISSION_MODES)[number];

// ============================================================================
// MCP Tool Pattern
// ============================================================================

/**
 * Regex pattern for MCP (Model Context Protocol) tool names.
 *
 * Format: mcp__[server]__[tool] or mcp__[server]__* (wildcard)
 * Example: mcp__context7__query-docs, mcp__context7__*
 */
export const MCP_TOOL_PATTERN = /^mcp__[a-zA-Z0-9_-]+__([a-zA-Z0-9_-]+|\*)$/;

// ============================================================================
// Agent Frontmatter Interface
// ============================================================================

/**
 * Claude Code agent frontmatter interface.
 *
 * Only `name` and `description` are required.
 * The `tools` and `disallowedTools` fields are comma-separated strings, NOT arrays.
 */
export interface AgentFrontmatter {
  /**
   * Unique identifier for the agent.
   * Must be lowercase letters, numbers, and hyphens only.
   * Format: /^[a-z0-9-]+$/
   */
  name: string;

  /**
   * Description of when Claude should delegate to this agent.
   * Used for routing decisions - be specific about trigger conditions.
   */
  description: string;

  /**
   * Comma-separated list of allowed tools.
   * Example: "Read, Write, Bash, Glob, Grep"
   * NOTE: This is a STRING, not an array!
   */
  tools?: string;

  /**
   * Comma-separated list of disallowed tools.
   * These are removed from the inherited tool list.
   * NOTE: This is a STRING, not an array!
   */
  disallowedTools?: string;

  /**
   * Model alias: sonnet, opus, haiku, or inherit.
   * Defaults to 'inherit' (use parent model).
   */
  model?: ModelAlias;

  /**
   * Permission handling mode.
   * Defaults to 'default'.
   */
  permissionMode?: PermissionMode;

  /**
   * Skills to preload into agent context.
   * This IS an array (unlike tools).
   */
  skills?: string[];

  /**
   * Lifecycle hooks scoped to this agent.
   */
  hooks?: Record<string, unknown>;

  /**
   * Background color for UI identification.
   */
  color?: string;

  /**
   * Allow unknown fields for forward compatibility.
   * Claude Code may add new fields in future versions.
   */
  [key: string]: unknown;
}

// ============================================================================
// Validation Result Types
// ============================================================================

/**
 * Result of validating a single tool name.
 */
export interface ToolValidationResult {
  /** The input tool name */
  input: string;

  /** Whether the tool name is valid */
  valid: boolean;

  /** Corrected casing if input was valid but wrong case */
  corrected?: string;

  /** Warning message for unknown tools */
  warning?: string;

  /** Suggestion for typos (fuzzy matched) */
  suggestion?: string;
}

/**
 * Result of validating the tools field.
 */
export interface ToolsFieldValidationResult {
  /** Whether all tools are valid */
  valid: boolean;

  /** Error messages for invalid tools */
  errors: string[];

  /** Warning messages for unknown tools */
  warnings: string[];

  /** Corrected tools string with proper casing */
  corrected?: string;
}

/**
 * Result of validating complete agent frontmatter.
 */
export interface AgentValidationResult {
  /** Whether the frontmatter is valid */
  valid: boolean;

  /** Error messages from validation */
  errors: string[];

  /** Warning messages (non-blocking) */
  warnings: string[];

  /** Suggestions for fixing issues */
  suggestions: string[];

  /** Parsed and validated frontmatter (if valid) */
  data?: AgentFrontmatter;
}

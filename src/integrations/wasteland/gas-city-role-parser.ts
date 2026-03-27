/**
 * Gas City Role Parser — Frontmatter + Markdown Role File Parser
 *
 * Parses `.md` role files with YAML frontmatter per the Gas City
 * Declarative Agent Role Format Specification v1.0.0.
 *
 * Entry points:
 * - parseGasCityRole(content): parse raw file content to GasCityRole
 * - parseGasCityRoleFile(filePath): read file and parse
 * - discoverRoles(basePath): scan directory and parse all role files
 *
 * Returns null for any malformed input (missing frontmatter, invalid YAML,
 * schema failure). Uses JSON_SCHEMA for safe YAML loading.
 *
 * @module gas-city-role-parser
 */

import { z } from 'zod';

// ============================================================================
// Schema
// ============================================================================

/**
 * Zod schema for Gas City role frontmatter.
 * Required: name, description
 * Optional: tools, model, color, skills, permissionMode, disallowedTools, hooks
 * Unknown fields preserved via passthrough.
 */
export const GasCityRoleSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  tools: z.array(z.string()).optional(),
  disallowedTools: z.array(z.string()).optional(),
  model: z.enum(['sonnet', 'opus', 'haiku', 'inherit']).optional(),
  color: z.string().optional(),
  skills: z.array(z.string()).optional(),
  permissionMode: z.enum([
    'default', 'acceptEdits', 'dontAsk',
    'bypassPermissions', 'plan',
  ]).optional(),
  hooks: z.record(z.unknown()).optional(),
}).passthrough();

export type GasCityRoleFrontmatter = z.infer<typeof GasCityRoleSchema>;

/**
 * A fully parsed Gas City role: validated frontmatter + markdown body.
 */
export interface GasCityRole {
  frontmatter: GasCityRoleFrontmatter;
  body: string;
  filePath: string | null;
}

// ============================================================================
// Frontmatter extraction
// ============================================================================

/**
 * Split a frontmatter-delimited file into YAML block and markdown body.
 * Returns null if the file doesn't start with `---`.
 */
export function extractFrontmatter(content: string): { yaml: string; body: string } | null {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith('---')) return null;

  // Find the closing --- (must be on its own line)
  const afterOpener = trimmed.indexOf('\n');
  if (afterOpener === -1) return null;

  const rest = trimmed.slice(afterOpener + 1);
  const closerIndex = rest.indexOf('\n---');
  if (closerIndex === -1) return null;

  const yaml = rest.slice(0, closerIndex);
  const body = rest.slice(closerIndex + 4).replace(/^\n/, '');

  return { yaml, body };
}

// ============================================================================
// Parser
// ============================================================================

/**
 * Parse a Gas City role file from raw content string.
 *
 * @param content - Raw file content (frontmatter + markdown)
 * @param filePath - Optional file path for the parsed role
 * @returns Parsed GasCityRole, or null on any error
 */
export async function parseGasCityRole(
  content: string,
  filePath: string | null = null,
): Promise<GasCityRole | null> {
  if (!content || !content.trim()) return null;

  const extracted = extractFrontmatter(content);
  if (!extracted) return null;

  try {
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const raw = (yaml as any).load(extracted.yaml, { schema: (yaml as any).JSON_SCHEMA });
    if (!raw || typeof raw !== 'object') return null;

    const result = GasCityRoleSchema.safeParse(raw);
    if (!result.success) return null;

    return {
      frontmatter: result.data,
      body: extracted.body,
      filePath,
    };
  } catch {
    return null;
  }
}

/**
 * Read a role file from disk and parse it.
 *
 * @param filePath - Absolute path to a .md role file
 * @returns Parsed GasCityRole, or null if file missing/invalid
 */
export async function parseGasCityRoleFile(filePath: string): Promise<GasCityRole | null> {
  try {
    const { readFile } = await import('node:fs/promises');
    const content = await readFile(filePath, 'utf-8');
    return parseGasCityRole(content, filePath);
  } catch {
    return null;
  }
}

// ============================================================================
// Discovery
// ============================================================================

export interface DiscoveryResult {
  roles: GasCityRole[];
  errors: Array<{ filePath: string; reason: string }>;
}

/**
 * Discover and parse all Gas City role files in a directory.
 *
 * Scans `<basePath>/*.md`, parses each, collects results and errors.
 *
 * @param basePath - Directory to scan (e.g., `.claude/agents/`)
 * @returns Discovery result with parsed roles and parse errors
 */
export async function discoverRoles(basePath: string): Promise<DiscoveryResult> {
  const { readdir } = await import('node:fs/promises');
  const { join } = await import('node:path');

  const roles: GasCityRole[] = [];
  const errors: DiscoveryResult['errors'] = [];

  let entries: string[];
  try {
    entries = await readdir(basePath);
  } catch {
    return { roles, errors };
  }

  const mdFiles = entries.filter(f => f.endsWith('.md'));

  for (const file of mdFiles) {
    const fullPath = join(basePath, file);
    const role = await parseGasCityRoleFile(fullPath);
    if (role) {
      roles.push(role);
    } else {
      errors.push({ filePath: fullPath, reason: 'parse-error' });
    }
  }

  return { roles, errors };
}

// ============================================================================
// Validation
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a parsed Gas City role for spec compliance.
 * Checks required sections, naming conventions, and recommended structure.
 */
export function validateRole(role: GasCityRole): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Name must match filename (if filePath is set)
  if (role.filePath) {
    const { basename } = require('node:path');
    const fileName = basename(role.filePath, '.md');
    if (fileName !== role.frontmatter.name) {
      warnings.push(`Filename "${fileName}" does not match name field "${role.frontmatter.name}"`);
    }
  }

  // Recommended body sections
  if (!role.body.includes('## Voice')) {
    warnings.push('Missing recommended section: Voice');
  }
  if (!role.body.includes('## Responsibilities')) {
    warnings.push('Missing recommended section: Responsibilities');
  }
  if (!role.body.includes('## Protocol')) {
    warnings.push('Missing recommended section: Protocol');
  }

  // Tools should be PascalCase
  if (role.frontmatter.tools) {
    for (const tool of role.frontmatter.tools) {
      if (!tool.startsWith('mcp__') && !/^[A-Z]/.test(tool)) {
        warnings.push(`Tool "${tool}" should be PascalCase`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

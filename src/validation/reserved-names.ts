import { z } from 'zod';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { suggestFixedName } from './skill-validation.js';

// ============================================================================
// Reserved Names Configuration Schema
// ============================================================================

/**
 * Schema for a single category of reserved names.
 */
const ReservedCategorySchema = z.object({
  description: z.string(),
  reason: z.string(),
  names: z.array(z.string()),
});

/**
 * Schema for the categories container.
 */
const CategoriesSchema = z.object({
  'built-in-commands': ReservedCategorySchema,
  'agent-types': ReservedCategorySchema,
  'system-skills': ReservedCategorySchema,
});

/**
 * Schema for the reserved names configuration file.
 * Validates structure and provides type inference.
 */
export const ReservedNamesConfigSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver format (e.g., 1.0.0)'),
  lastSync: z.string().datetime({ message: 'lastSync must be ISO datetime string' }),
  sourceVersion: z.string(),
  categories: CategoriesSchema,
});

/** Type inference for reserved names config */
export type ReservedNamesConfig = z.infer<typeof ReservedNamesConfigSchema>;

/** Type for a single category */
export type ReservedCategory = z.infer<typeof ReservedCategorySchema>;

/** Category key type */
export type CategoryKey = keyof ReservedNamesConfig['categories'];

// ============================================================================
// Result Types
// ============================================================================

/**
 * Entry for a single reserved name with its metadata.
 */
export interface ReservedNameEntry {
  name: string;
  category: CategoryKey;
  description: string;
  reason: string;
}

/**
 * Result of checking if a name is reserved.
 */
export interface ReservedCheckResult {
  reserved: boolean;
  entry?: ReservedNameEntry;
}

/**
 * Categorized list of all reserved names.
 */
export interface CategorizedReservedNames {
  [category: string]: {
    description: string;
    reason: string;
    names: string[];
  };
}

/**
 * Config metadata for sync tracking.
 */
export interface ConfigMetadata {
  version: string;
  lastSync: string;
  sourceVersion: string;
}

// ============================================================================
// ReservedNameValidator Class
// ============================================================================

/**
 * Validator for checking skill names against reserved names.
 *
 * Prevents naming collisions with Claude Code built-in commands,
 * agent types, and system names. Uses case-insensitive matching.
 *
 * @example
 * ```ts
 * const validator = await ReservedNameValidator.load();
 *
 * const result = validator.isReserved('help');
 * if (result.reserved) {
 *   const alternatives = validator.suggestAlternatives('help');
 *   console.log(formatReservedNameError('help', result, alternatives));
 * }
 * ```
 */
export class ReservedNameValidator {
  private normalizedMap: Map<string, ReservedNameEntry>;
  private config: ReservedNamesConfig;

  /**
   * Private constructor - use static load() method.
   */
  private constructor(config: ReservedNamesConfig) {
    this.config = config;
    this.normalizedMap = new Map();

    // Build normalized lookup map for O(1) case-insensitive matching
    for (const [categoryKey, category] of Object.entries(config.categories)) {
      for (const name of category.names) {
        const normalizedName = name.toLowerCase();
        this.normalizedMap.set(normalizedName, {
          name,
          category: categoryKey as CategoryKey,
          description: category.description,
          reason: category.reason,
        });
      }
    }
  }

  /**
   * Load validator from configuration file.
   *
   * @param configPath - Optional path to config file. Defaults to config/reserved-names.json
   * @returns Initialized validator instance
   * @throws Error if config file is missing or invalid
   */
  static async load(configPath?: string): Promise<ReservedNameValidator> {
    const path = configPath ?? ReservedNameValidator.getDefaultConfigPath();

    let content: string;
    try {
      content = await readFile(path, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read reserved names config: ${path}`);
    }

    let rawConfig: unknown;
    try {
      rawConfig = JSON.parse(content);
    } catch {
      throw new Error(`Invalid JSON in reserved names config: ${path}`);
    }

    const result = ReservedNamesConfigSchema.safeParse(rawConfig);
    if (!result.success) {
      const errors = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      throw new Error(`Invalid reserved names config: ${errors}`);
    }

    return new ReservedNameValidator(result.data);
  }

  /**
   * Get default config file path relative to this module.
   */
  private static getDefaultConfigPath(): string {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    return join(__dirname, '..', '..', 'config', 'reserved-names.json');
  }

  /**
   * Check if a name is reserved.
   *
   * Matching is case-insensitive: 'help', 'Help', 'HELP' all match.
   *
   * @param name - The name to check
   * @returns Result with reserved status and entry details if reserved
   */
  isReserved(name: string): ReservedCheckResult {
    const normalizedName = name.toLowerCase();
    const entry = this.normalizedMap.get(normalizedName);

    if (entry) {
      return { reserved: true, entry };
    }

    return { reserved: false };
  }

  /**
   * Suggest valid alternative names for a reserved name.
   *
   * Generates alternatives using prefixes (my-, custom-, project-) and
   * validates each through name validation and reserved name checks.
   *
   * @param name - The reserved name to find alternatives for
   * @param maxCount - Maximum number of alternatives to return (default: 3)
   * @returns Array of valid, non-reserved alternative names
   */
  suggestAlternatives(name: string, maxCount = 3): string[] {
    const prefixes = ['my-', 'custom-', 'project-', 'local-', 'user-'];
    const suffixes = ['-skill', '-helper', '-tool'];
    const alternatives: string[] = [];

    // Normalize the base name first
    const baseName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    if (!baseName) {
      return [];
    }

    // Try prefixes first
    for (const prefix of prefixes) {
      if (alternatives.length >= maxCount) break;

      const candidate = `${prefix}${baseName}`;
      if (this.isValidAlternative(candidate)) {
        alternatives.push(candidate);
      }
    }

    // Try suffixes if we need more
    for (const suffix of suffixes) {
      if (alternatives.length >= maxCount) break;

      const candidate = `${baseName}${suffix}`;
      if (this.isValidAlternative(candidate)) {
        alternatives.push(candidate);
      }
    }

    return alternatives.slice(0, maxCount);
  }

  /**
   * Check if a candidate alternative is valid.
   */
  private isValidAlternative(candidate: string): boolean {
    // Check it's not reserved
    if (this.isReserved(candidate).reserved) {
      return false;
    }

    // Check it passes name validation
    // suggestFixedName returns null if already valid, or fixed version, or null if unfixable
    const fixed = suggestFixedName(candidate);

    // If suggestFixedName returns null, either it's already valid or unfixable
    // We need to check if the candidate itself is valid
    if (fixed === null) {
      // Check if candidate is valid by seeing if it matches the pattern
      const isValid = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(candidate) &&
                      !candidate.includes('--') &&
                      candidate.length >= 1 &&
                      candidate.length <= 64;
      return isValid;
    }

    // If it returned a fixed version, use that as the candidate is invalid
    // But we want to suggest the fixed version if it's different
    return fixed === candidate;
  }

  /**
   * Get all reserved names organized by category.
   *
   * Useful for displaying in help output or documentation.
   *
   * @returns Categorized list of all reserved names
   */
  getAllReservedNames(): CategorizedReservedNames {
    const result: CategorizedReservedNames = {};

    for (const [categoryKey, category] of Object.entries(this.config.categories)) {
      result[categoryKey] = {
        description: category.description,
        reason: category.reason,
        names: [...category.names],
      };
    }

    return result;
  }

  /**
   * Get configuration metadata.
   *
   * @returns Version, lastSync, and sourceVersion from config
   */
  getMetadata(): ConfigMetadata {
    return {
      version: this.config.version,
      lastSync: this.config.lastSync,
      sourceVersion: this.config.sourceVersion,
    };
  }
}

// ============================================================================
// Error Formatting
// ============================================================================

/**
 * Format an educational error message for a reserved name.
 *
 * Produces human-readable messages explaining why a name is reserved
 * and suggesting alternatives.
 *
 * @param inputName - The name the user tried to use
 * @param checkResult - Result from isReserved()
 * @param alternatives - Suggested alternative names
 * @returns Formatted error message
 */
export function formatReservedNameError(
  inputName: string,
  checkResult: ReservedCheckResult,
  alternatives: string[] = []
): string {
  if (!checkResult.reserved || !checkResult.entry) {
    return '';
  }

  const { entry } = checkResult;
  const lines: string[] = [];

  // Main error with reason
  lines.push(`Cannot use "${inputName}" as a skill name: ${entry.reason}.`);
  lines.push('');

  // Category-specific explanation
  switch (entry.category) {
    case 'built-in-commands':
      lines.push(`"${entry.name}" is a built-in Claude Code slash command (//${entry.name}).`);
      lines.push('Using this name would prevent the built-in command from working.');
      break;
    case 'agent-types':
      lines.push(`"${entry.name}" is a built-in Claude Code agent type.`);
      lines.push('Using this name could cause agent routing conflicts.');
      break;
    case 'system-skills':
      lines.push(`"${entry.name}" is reserved for Claude Code system features.`);
      lines.push('Using this name could cause skill loading failures.');
      break;
  }

  // Alternatives
  if (alternatives.length > 0) {
    lines.push('');
    lines.push('Suggested alternatives:');
    for (const alt of alternatives) {
      lines.push(`  - ${alt}`);
    }
  }

  // Documentation link
  lines.push('');
  lines.push('For more information: https://code.claude.com/docs/en/skills#naming');

  return lines.join('\n');
}

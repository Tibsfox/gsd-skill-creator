import matter from 'gray-matter';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import type { BudgetProfile } from '../types/application.js';
import { projectLoading, type LoadingProjection } from './loading-projection.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Severity level for budget check results.
 * Thresholds:
 * - ok: < 60%
 * - info: 60-79%
 * - warning: 80-99%
 * - error: >= 100%
 */
export type BudgetSeverity = 'ok' | 'info' | 'warning' | 'error';

/**
 * Result of checking a single skill's budget usage.
 */
export interface BudgetCheckResult {
  /** Whether the skill is within budget (severity !== 'error') */
  valid: boolean;
  /** Severity level based on usage percentage */
  severity: BudgetSeverity;
  /** Usage as a percentage of budget */
  usagePercent: number;
  /** Character count of the skill */
  charCount: number;
  /** Budget limit in characters */
  budget: number;
  /** Human-readable message about budget status */
  message?: string;
  /** Actionable suggestions for reducing size */
  suggestions?: string[];
}

/**
 * Budget information for a single skill.
 */
export interface SkillBudgetInfo {
  /** Skill name from metadata */
  name: string;
  /** Character count of description field */
  descriptionChars: number;
  /** Character count of body content */
  bodyChars: number;
  /** Total file character count */
  totalChars: number;
  /** Path to skill file */
  path: string;
}

/**
 * Result of checking cumulative budget across all skills.
 */
export interface CumulativeBudgetResult {
  /** Total characters across all skills */
  totalChars: number;
  /** Cumulative budget limit */
  budget: number;
  /** Total usage as percentage of budget */
  usagePercent: number;
  /** Severity level based on cumulative usage */
  severity: BudgetSeverity;
  /** All skills with their budget info, sorted by size descending */
  skills: SkillBudgetInfo[];
  /** Number of skills that would be hidden by Claude Code if over budget */
  hiddenCount: number;
  /** Total characters across all installed skills (same as totalChars) */
  installedTotal: number;
  /** Total characters of skills that would actually load with the given profile */
  loadableTotal: number;
  /** Full loading projection with loaded/deferred skill arrays (only present when profile is provided) */
  projection?: LoadingProjection;
}

// ============================================================================
// BudgetValidator Class
// ============================================================================

/**
 * Validator for checking skill character budgets.
 *
 * Claude Code has a ~15,000 character budget per skill and ~15,500 cumulative
 * budget. This validator provides proactive warnings before skills are silently
 * truncated or hidden.
 *
 * @example
 * ```ts
 * const validator = BudgetValidator.load();
 *
 * // Check a single skill
 * const result = validator.checkSingleSkill(12500);
 * if (result.severity === 'warning') {
 *   console.log(result.message);
 * }
 *
 * // Check cumulative budget
 * const cumulative = await validator.checkCumulative('.claude/skills');
 * console.log(formatBudgetDisplay(cumulative));
 * ```
 */
export class BudgetValidator {
  /** Default single skill budget in characters */
  private static readonly DEFAULT_CHAR_BUDGET = 15000;

  /** Cumulative budget is slightly higher per research */
  private static readonly CUMULATIVE_BUDGET = 15500;

  /** Budget for single skills */
  private charBudget: number;

  /** Cumulative budget across all skills */
  private cumulativeBudget: number;

  /** Per-profile cumulative budget overrides */
  private profileBudgets?: Record<string, number>;

  /**
   * Private constructor - use static load() or loadFromConfig() method.
   */
  private constructor(
    charBudget: number,
    cumulativeBudget?: number,
    profileBudgets?: Record<string, number>
  ) {
    this.charBudget = charBudget;
    this.cumulativeBudget = cumulativeBudget ?? BudgetValidator.CUMULATIVE_BUDGET;
    this.profileBudgets = profileBudgets;
  }

  /**
   * Load validator with configuration from environment.
   *
   * Reads SLASH_COMMAND_TOOL_CHAR_BUDGET env var with 15000 default.
   * Delegates to loadFromConfig() for consistent initialization.
   *
   * @returns Initialized validator instance
   */
  static load(): BudgetValidator {
    return BudgetValidator.loadFromConfig();
  }

  /**
   * Load validator with optional config override.
   *
   * Priority for cumulative budget: config > env var > default.
   * Priority for single-skill budget: env var > default.
   *
   * @param tokenBudgetConfig - Optional config with cumulative and profile budgets
   * @returns Initialized validator instance
   */
  static loadFromConfig(tokenBudgetConfig?: {
    cumulative_char_budget?: number;
    profile_budgets?: Record<string, number>;
  }): BudgetValidator {
    // Single-skill budget: env var fallback
    const envValue = process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET;
    let charBudget = BudgetValidator.DEFAULT_CHAR_BUDGET;
    if (envValue !== undefined) {
      const parsed = parseInt(envValue, 10);
      if (!isNaN(parsed) && parsed > 0) charBudget = parsed;
    }

    // Cumulative budget: config > env var > default
    let cumulativeBudget = BudgetValidator.CUMULATIVE_BUDGET;
    if (tokenBudgetConfig?.cumulative_char_budget !== undefined) {
      cumulativeBudget = tokenBudgetConfig.cumulative_char_budget;
    } else if (envValue !== undefined) {
      const parsed = parseInt(envValue, 10);
      if (!isNaN(parsed) && parsed > 0) cumulativeBudget = parsed;
    }

    return new BudgetValidator(charBudget, cumulativeBudget, tokenBudgetConfig?.profile_budgets);
  }

  /**
   * Get the configured budget value.
   *
   * Useful for per-skill coloring in list displays.
   *
   * @returns Budget in characters
   */
  getBudget(): number {
    return this.charBudget;
  }

  /**
   * Get the cumulative budget value.
   *
   * @returns Cumulative budget in characters
   */
  getCumulativeBudget(): number {
    return this.cumulativeBudget;
  }

  /**
   * Get the cumulative budget for a specific agent profile.
   *
   * Strips 'gsd-' prefix for lookup (config uses short names like "executor").
   * Falls back to cumulative budget when profile not found.
   *
   * @param profileName - Agent profile name (e.g. "gsd-executor")
   * @returns Cumulative budget in characters for the profile
   */
  getCumulativeBudgetForProfile(profileName: string): number {
    const shortName = profileName.replace(/^gsd-/, '');
    if (this.profileBudgets?.[shortName] !== undefined) {
      return this.profileBudgets[shortName];
    }
    return this.cumulativeBudget;
  }

  /**
   * Determine severity level based on usage percentage.
   *
   * Thresholds:
   * - >= 100%: error (over budget)
   * - >= 80%: warning (approaching limit)
   * - >= 60%: info (notable usage)
   * - < 60%: ok (plenty of room)
   *
   * @param usagePercent - Usage as percentage (0-100+)
   * @returns Severity level
   */
  getSeverity(usagePercent: number): BudgetSeverity {
    if (usagePercent >= 100) return 'error';
    if (usagePercent >= 80) return 'warning';
    if (usagePercent >= 60) return 'info';
    return 'ok';
  }

  /**
   * Check a single skill's budget usage.
   *
   * @param charCount - Total character count of the skill
   * @returns Budget check result with severity, message, and suggestions
   */
  checkSingleSkill(charCount: number): BudgetCheckResult {
    const usagePercent = (charCount / this.charBudget) * 100;
    const severity = this.getSeverity(usagePercent);
    const valid = severity !== 'error';

    const result: BudgetCheckResult = {
      valid,
      severity,
      usagePercent,
      charCount,
      budget: this.charBudget,
    };

    // Add message based on severity
    if (severity === 'error') {
      const excess = charCount - this.charBudget;
      result.message = `Exceeds ${this.charBudget.toLocaleString()} character budget by ${excess.toLocaleString()} chars`;
      result.suggestions = [
        'Use --force to override (skill may be truncated by Claude Code)',
        'Reduce description length',
        'Move detailed content to separate reference files',
      ];
    } else if (severity === 'warning') {
      result.message = `Approaching budget limit (${usagePercent.toFixed(0)}% of ${this.charBudget.toLocaleString()} chars)`;
    } else if (severity === 'info') {
      result.message = `Budget usage: ${usagePercent.toFixed(0)}% of ${this.charBudget.toLocaleString()} chars`;
    }

    return result;
  }

  /**
   * Count characters in a skill file.
   *
   * Uses gray-matter to parse the skill and counts:
   * - Description characters (from frontmatter)
   * - Body characters (markdown content)
   * - Total file characters
   *
   * @param skillPath - Path to SKILL.md file
   * @returns Budget info for the skill
   */
  async countSkillChars(skillPath: string): Promise<SkillBudgetInfo> {
    const content = await readFile(skillPath, 'utf-8');
    const { data, content: body } = matter(content);

    const descriptionChars = (data.description || '').length;
    const bodyChars = body.trim().length;
    const totalChars = content.length;

    return {
      name: data.name || '',
      descriptionChars,
      bodyChars,
      totalChars,
      path: skillPath,
    };
  }

  /**
   * Check cumulative budget across all skills in a directory.
   *
   * Scans for all SKILL.md files and calculates total budget usage.
   * Counts all skills by default (conservative approach for disabled skills).
   *
   * When a BudgetProfile is provided, computes a loading projection to
   * distinguish installed inventory from what would actually load.
   *
   * @param skillsDir - Path to skills directory
   * @param profile - Optional agent budget profile for loading projection
   * @returns Cumulative budget result with per-skill breakdown
   */
  async checkCumulative(skillsDir: string, profile?: BudgetProfile): Promise<CumulativeBudgetResult> {
    const skills: SkillBudgetInfo[] = [];
    const budget = BudgetValidator.CUMULATIVE_BUDGET;

    try {
      const entries = await readdir(skillsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) {
          continue;
        }

        const skillPath = join(skillsDir, entry.name, 'SKILL.md');
        try {
          await stat(skillPath);
          const info = await this.countSkillChars(skillPath);
          skills.push(info);
        } catch {
          // No SKILL.md in this directory, skip
        }
      }
    } catch {
      // Skills directory doesn't exist, return empty result
    }

    // Sort by size descending
    skills.sort((a, b) => b.totalChars - a.totalChars);

    const totalChars = skills.reduce((sum, s) => sum + s.totalChars, 0);
    const usagePercent = (totalChars / budget) * 100;
    const severity = this.getSeverity(usagePercent);

    // Calculate hidden count if over budget
    let hiddenCount = 0;
    if (totalChars > budget) {
      let running = 0;
      for (const skill of skills) {
        running += skill.totalChars;
        if (running > budget) {
          hiddenCount++;
        }
      }
    }

    // Compute loading projection when profile is provided
    const installedTotal = totalChars;
    let loadableTotal: number;
    let projection: LoadingProjection | undefined;

    if (profile) {
      const proj = projectLoading(skills, profile, { singleSkillLimit: this.charBudget });
      loadableTotal = proj.loadedTotal;
      projection = proj;
    } else {
      loadableTotal = totalChars;
      projection = undefined;
    }

    return {
      totalChars,
      budget,
      usagePercent,
      severity,
      skills,
      hiddenCount,
      installedTotal,
      loadableTotal,
      projection,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format a visual ASCII progress bar.
 *
 * @param current - Current value
 * @param max - Maximum value (100%)
 * @param width - Width of bar in characters (default: 20)
 * @returns ASCII progress bar like "[################....]"
 */
export function formatProgressBar(current: number, max: number, width = 20): string {
  const percent = Math.min(Math.max(current / max, 0), 1);
  const filled = Math.round(width * percent);
  const empty = width - filled;
  return `[${'#'.repeat(filled)}${'.'.repeat(empty)}]`;
}

/**
 * Format a complete budget display with progress bar and per-skill breakdown.
 *
 * @param result - Cumulative budget result
 * @returns Multi-line formatted display string
 */
export function formatBudgetDisplay(result: CumulativeBudgetResult): string {
  const lines: string[] = [];
  const { totalChars, budget, skills, hiddenCount } = result;
  const installedTotal = result.installedTotal ?? totalChars;
  const loadableTotal = result.loadableTotal ?? totalChars;
  const hasDualView = installedTotal !== loadableTotal;

  if (hasDualView) {
    // Dual-view: show installed inventory and loadable subset separately
    const loadedCount = result.projection?.loaded.length ?? 0;
    const totalCount = skills.length;
    const loadablePercent = (loadableTotal / budget) * 100;
    const bar = formatProgressBar(loadableTotal, budget);

    lines.push(`Installed: ${installedTotal.toLocaleString()} chars across ${totalCount} skills`);
    lines.push(`Loadable:  ${loadableTotal.toLocaleString()} chars (${loadedCount} of ${totalCount} skills fit)`);
    lines.push(`Budget: ${bar} ${loadablePercent.toFixed(0)}% (${loadableTotal.toLocaleString()} / ${budget.toLocaleString()} chars)`);
  } else {
    // Single-view: backward-compatible format
    const bar = formatProgressBar(totalChars, budget);
    const usagePercent = result.usagePercent;
    lines.push(
      `Budget: ${bar} ${usagePercent.toFixed(0)}% (${totalChars.toLocaleString()} / ${budget.toLocaleString()} chars)`
    );
  }
  lines.push('');

  // Per-skill breakdown (already sorted by size descending)
  if (skills.length > 0) {
    for (const skill of skills) {
      const pct = ((skill.totalChars / budget) * 100).toFixed(1);
      lines.push(`  ${skill.name}: ${skill.totalChars.toLocaleString()} chars (${pct}%)`);
    }
  } else {
    lines.push('  No skills found');
  }

  // Warning if skills would be hidden
  if (hiddenCount > 0) {
    lines.push('');
    lines.push(`Warning: ${hiddenCount} skill(s) would be hidden by Claude Code`);
  }

  return lines.join('\n');
}

/**
 * Generate actionable suggestions for reducing skill size.
 *
 * Provides context-aware suggestions based on what parts of the skill are large.
 *
 * @param skill - Skill budget info
 * @param budget - Budget limit to compare against
 * @returns Array of suggestion strings
 */
export function generateSuggestions(skill: SkillBudgetInfo, budget: number): string[] {
  const suggestions: string[] = [];

  if (skill.totalChars <= budget * 0.6) {
    // Under 60%, no suggestions needed
    return suggestions;
  }

  const excess = Math.max(0, skill.totalChars - budget);

  // Check description length
  if (skill.descriptionChars > 200) {
    const reduceBy = Math.min(excess, skill.descriptionChars - 130);
    if (reduceBy > 0) {
      suggestions.push(`Shorten description by ~${reduceBy} chars (currently ${skill.descriptionChars} chars)`);
    }
  }

  // Check body length
  if (skill.bodyChars > 10000) {
    suggestions.push('Move detailed content to separate reference files (@file references)');
    suggestions.push('Consider splitting into multiple focused skills');
  } else if (skill.bodyChars > 5000 && excess > 0) {
    suggestions.push('Consider moving examples or verbose sections to reference files');
  }

  // Generic reduction target
  if (excess > 0 && suggestions.length === 0) {
    suggestions.push(`Reduce total content by ${excess.toLocaleString()} chars to fit within budget`);
  }

  return suggestions;
}

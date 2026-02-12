import * as p from '@clack/prompts';
import pc from 'picocolors';
import { stat as fsStat } from 'fs/promises';
import { join, dirname } from 'path';
import { SkillStore } from '../../storage/skill-store.js';
import { validateSkillNameStrict, classifyFields } from '../../validation/skill-validation.js';
import { validateSkillDirectory, validateDirectoryNameMatch } from '../../validation/directory-validation.js';
import { SkillMetadataSchema } from '../../validation/skill-validation.js';
import type { FieldClassification } from '../../validation/skill-validation.js';
import { getExtension, isLegacyFormat } from '../../types/extensions.js';
import { ReferenceLinker, DisclosureBudget } from '../../disclosure/index.js';
import type { DisclosureBudgetResult } from '../../disclosure/index.js';

// ============================================================================
// Validation Result Types
// ============================================================================

/**
 * Result of validating a single skill.
 */
export interface ValidationResult {
  /** Skill name */
  name: string;
  /** Whether the skill is valid */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings (non-fatal) */
  warnings: string[];
  /** Whether the skill uses legacy or current format */
  format: 'current' | 'legacy';
  /** Field classification: standard vs extension vs unknown (informational) */
  fieldInfo?: FieldClassification;
  /** Disclosure budget result (if skill has references/scripts) */
  disclosureBudget?: DisclosureBudgetResult;
}

// ============================================================================
// Skill Validation
// ============================================================================

/**
 * Validate a single skill by name.
 *
 * Runs comprehensive validation:
 * 1. Name validation (official Claude Code spec)
 * 2. Directory structure validation
 * 3. Metadata schema validation
 * 4. Directory/name match validation
 *
 * @param store - SkillStore instance
 * @param skillName - Name of the skill to validate
 * @param format - Format indicator from listWithFormat
 * @param skillPath - Path to the skill file
 * @returns Validation result with errors and warnings
 */
export async function validateSingleSkill(
  store: SkillStore,
  skillName: string,
  format: 'current' | 'legacy',
  skillPath: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let fieldInfo: FieldClassification | undefined;

  // Add deprecation warning for legacy format
  if (format === 'legacy') {
    warnings.push('Legacy flat-file format detected. Consider migrating with `skill-creator migrate`.');
  }

  // 1. Name validation
  const nameValidation = validateSkillNameStrict(skillName);
  if (!nameValidation.valid) {
    errors.push(...nameValidation.errors);
  }

  // 2. Directory validation
  const dirValidation = validateSkillDirectory(skillPath);
  if (!dirValidation.valid && !dirValidation.isLegacyFlatFile) {
    // Don't report legacy format as error (it's a warning above)
    errors.push(...dirValidation.errors);
  }

  // 3. Read skill and validate metadata
  try {
    const skill = format === 'current'
      ? await store.read(skillName)
      : await readLegacySkill(skillPath);

    // Validate metadata with Zod schema
    const schemaResult = SkillMetadataSchema.safeParse(skill.metadata);
    if (!schemaResult.success) {
      for (const issue of schemaResult.error.issues) {
        errors.push(`${issue.path.join('.')}: ${issue.message}`);
      }
    }

    // 5. Field classification (standard vs extension vs unknown)
    fieldInfo = classifyFields(skill.metadata as Record<string, unknown>);

    // 4. Directory/name match validation (only for current format)
    if (format === 'current') {
      const metadataName = typeof skill.metadata.name === 'string' ? skill.metadata.name : '';
      const matchResult = validateDirectoryNameMatch(skillPath, metadataName);
      if (!matchResult.valid && matchResult.error) {
        errors.push(matchResult.error);
      }
    }

    // Check for legacy extension fields at root (metadata level, not format level)
    if (isLegacyFormat(skill.metadata as unknown)) {
      warnings.push('Skill uses legacy extension field placement. Re-save to migrate to new format.');
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    errors.push(`Failed to read skill: ${errMsg}`);
  }

  // 6. Disclosure validation (reference cycles, dead links, budget breakdown)
  const skillDir = format === 'current' ? dirname(skillPath) : null;
  let disclosureBudget: DisclosureBudgetResult | undefined;

  if (skillDir) {
    try {
      // Check for references/ or scripts/ subdirectories
      const hasRefs = await dirExists(join(skillDir, 'references'));
      const hasScripts = await dirExists(join(skillDir, 'scripts'));

      if (hasRefs || hasScripts) {
        // Validate references for cycles and dead links
        const linker = new ReferenceLinker();
        const refValidation = await linker.validateSkillReferences(skillDir);
        if (!refValidation.valid) {
          for (const err of refValidation.errors) {
            errors.push(err);
          }
        }
        for (const warn of refValidation.warnings) {
          warnings.push(warn);
        }

        // Calculate disclosure budget breakdown
        const budget = new DisclosureBudget();
        disclosureBudget = await budget.checkDisclosureBudget(skillDir);
      }
    } catch {
      // Disclosure checks are informational; don't fail validation on errors
    }
  }

  return {
    name: skillName,
    valid: errors.length === 0,
    errors,
    warnings,
    format,
    fieldInfo,
    disclosureBudget,
  };
}

/**
 * Check if a directory exists.
 */
async function dirExists(path: string): Promise<boolean> {
  try {
    const s = await fsStat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Read a legacy flat-file skill.
 * Used for validation of legacy skills before migration.
 */
async function readLegacySkill(path: string): Promise<{ metadata: Record<string, unknown>; body: string }> {
  const { readFile } = await import('fs/promises');
  const matter = (await import('gray-matter')).default;

  const content = await readFile(path, 'utf-8');
  const { data, content: body } = matter(content);

  return {
    metadata: data,
    body: body.trim(),
  };
}

// ============================================================================
// CLI Command
// ============================================================================

/**
 * CLI command for skill validation.
 *
 * Usage:
 * - skill-creator validate              - Show usage help
 * - skill-creator validate <skill-name> - Validate a specific skill
 * - skill-creator validate --all        - Validate all skills
 *
 * @param skillName - Optional specific skill name to validate
 * @param options - Command options including optional skillsDir
 * @returns Exit code (0 for success, 1 for validation failure)
 */
export async function validateCommand(
  skillName?: string,
  options?: { all?: boolean; skillsDir?: string }
): Promise<number> {
  const skillsDir = options?.skillsDir ?? '.claude/skills';
  const store = new SkillStore(skillsDir);

  // Case 1: Validate all skills
  if (options?.all) {
    p.intro(pc.bgCyan(pc.black(' Skill Validation ')));

    const skills = await store.listWithFormat();

    if (skills.length === 0) {
      p.log.info(`No skills found in ${skillsDir}/`);
      p.outro('Nothing to validate.');
      return 0;
    }

    p.log.info(`Validating ${skills.length} skill(s)...`);
    p.log.message('');

    const results: ValidationResult[] = [];

    for (const skill of skills) {
      const result = await validateSingleSkill(store, skill.name, skill.format, skill.path);
      results.push(result);
      displayValidationResult(result);
    }

    // Summary
    const validCount = results.filter(r => r.valid).length;
    const invalidCount = results.length - validCount;
    const warningCount = results.filter(r => r.warnings.length > 0).length;

    p.log.message('');
    p.log.message(pc.bold('Validation Summary:'));
    p.log.message(`  ${pc.green('Valid:')} ${validCount}`);
    if (invalidCount > 0) p.log.message(`  ${pc.red('Invalid:')} ${invalidCount}`);
    if (warningCount > 0) p.log.message(`  ${pc.yellow('With warnings:')} ${warningCount}`);

    if (invalidCount > 0) {
      p.outro(pc.red('Validation failed.'));
      return 1;
    }

    p.outro(pc.green('All skills valid.'));
    return 0;
  }

  // Case 2: Validate a specific skill
  if (skillName) {
    // Find the skill in the store
    const skills = await store.listWithFormat();
    const skill = skills.find(s => s.name === skillName);

    if (!skill) {
      p.log.error(`Skill "${skillName}" not found.`);
      p.log.message(`Check that the skill exists in ${skillsDir}/`);
      return 1;
    }

    const result = await validateSingleSkill(store, skill.name, skill.format, skill.path);
    displayValidationResult(result);

    if (!result.valid) {
      return 1;
    }

    return 0;
  }

  // Case 3: No arguments - show help
  showValidateHelp();
  return 0;
}

/**
 * Display a single validation result.
 */
function displayValidationResult(result: ValidationResult): void {
  if (result.valid && result.warnings.length === 0) {
    p.log.success(`${pc.green('\u2713')} ${result.name}`);
    displayFieldInfo(result);
    displayDisclosureBudget(result);
    return;
  }

  if (result.valid && result.warnings.length > 0) {
    p.log.warn(`${pc.yellow('\u26A0')} ${result.name}`);
    for (const warning of result.warnings) {
      p.log.message(`    ${pc.dim(warning)}`);
    }
    displayFieldInfo(result);
    displayDisclosureBudget(result);
    return;
  }

  // Invalid
  p.log.error(`${pc.red('\u2717')} ${result.name}`);
  for (const error of result.errors) {
    p.log.message(`    ${pc.red(error)}`);
  }
  for (const warning of result.warnings) {
    p.log.message(`    ${pc.dim(warning)}`);
  }
  displayFieldInfo(result);
  displayDisclosureBudget(result);
}

/**
 * Display field classification info (standard vs extension vs unknown).
 * Shown as dim informational lines after the main result.
 */
function displayFieldInfo(result: ValidationResult): void {
  if (!result.fieldInfo) return;

  const { extensions, unknown } = result.fieldInfo;

  if (extensions.length > 0) {
    p.log.message(`    ${pc.dim(`Claude Code extensions: ${extensions.join(', ')}`)}`);
  }

  if (unknown.length > 0) {
    p.log.message(`    ${pc.dim(`Unknown fields: ${unknown.join(', ')}. These are ignored by spec-compliant tools.`)}`);
  }
}

/**
 * Display disclosure budget breakdown (SKILL.md vs references vs scripts).
 * Shown as dim informational lines, same styling as field classification.
 */
function displayDisclosureBudget(result: ValidationResult): void {
  if (!result.disclosureBudget) return;

  const { message, skillMdSeverity } = result.disclosureBudget;

  // Color the severity indicator
  let severityDisplay: string;
  switch (skillMdSeverity) {
    case 'error':
      severityDisplay = pc.red(`[${skillMdSeverity}]`);
      break;
    case 'warning':
      severityDisplay = pc.yellow(`[${skillMdSeverity}]`);
      break;
    default:
      severityDisplay = pc.dim(`[${skillMdSeverity}]`);
  }

  p.log.message(`    ${pc.dim(`Budget: ${message}`)} ${severityDisplay}`);
}

/**
 * Show help for validate command.
 */
function showValidateHelp(): void {
  console.log(`
skill-creator validate - Validate skill structure and metadata

Usage:
  skill-creator validate <skill-name>   Validate a specific skill
  skill-creator validate --all          Validate all skills

Validation Checks:
  - Skill name follows official Claude Code specification
  - Directory structure is correct (subdirectory format)
  - Metadata schema is valid
  - Directory name matches frontmatter name

Exit Codes:
  0   All validations passed
  1   One or more validations failed

Examples:
  skill-creator validate my-skill       # Validate a specific skill
  skill-creator validate --all          # Validate all skills
`);
}

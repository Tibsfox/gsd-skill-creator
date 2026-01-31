import * as p from '@clack/prompts';
import pc from 'picocolors';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { migrateSkillWorkflow, type MigrationResult } from '../../workflows/migrate-skill-workflow.js';
import { isLegacyFlatFile } from '../../validation/directory-validation.js';

// ============================================================================
// Migration Types
// ============================================================================

export interface LegacySkillInfo {
  name: string;
  path: string;
}

export interface MigrateScanResult {
  found: LegacySkillInfo[];
  alreadyMigrated: string[];
}

// ============================================================================
// Scanning for Legacy Files
// ============================================================================

/**
 * Scan the skills directory for legacy flat-file skills.
 *
 * @param skillsDir - Path to the skills directory (default: .claude/skills)
 * @returns List of legacy skills and already-migrated skills
 */
export async function scanForLegacySkills(
  skillsDir: string = '.claude/skills'
): Promise<MigrateScanResult> {
  const legacySkills: LegacySkillInfo[] = [];
  const alreadyMigrated: string[] = [];

  try {
    const entries = await readdir(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(skillsDir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        // Check if it's a properly structured subdirectory
        const skillPath = join(fullPath, 'SKILL.md');
        try {
          await stat(skillPath);
          alreadyMigrated.push(entry.name);
        } catch {
          // Directory without SKILL.md - not a valid skill
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Check if it's a legacy flat file
        if (isLegacyFlatFile(fullPath)) {
          const name = entry.name.replace(/\.md$/, '');
          legacySkills.push({ name, path: fullPath });
        }
      }
    }
  } catch (error) {
    // Skills directory doesn't exist
  }

  return {
    found: legacySkills,
    alreadyMigrated,
  };
}

// ============================================================================
// CLI Command
// ============================================================================

/**
 * CLI command for skill migration.
 *
 * Usage:
 * - skill-creator migrate              - Scan and migrate all legacy skills
 * - skill-creator migrate <skill-name> - Migrate a specific skill
 *
 * @param skillName - Optional specific skill name to migrate
 * @param options - Optional configuration including skillsDir
 */
export async function migrateCommand(
  skillName?: string,
  options?: { skillsDir?: string }
): Promise<void> {
  const skillsDir = options?.skillsDir ?? '.claude/skills';
  // Case 1: Specific skill provided
  if (skillName) {
    const legacyPath = join(skillsDir, `${skillName}.md`);

    // Check if the file exists
    try {
      await stat(legacyPath);
    } catch {
      // Check if already migrated
      const subdirPath = join(skillsDir, skillName, 'SKILL.md');
      try {
        await stat(subdirPath);
        p.log.info(`Skill "${skillName}" already uses the correct subdirectory format.`);
        p.log.message(`Location: ${pc.cyan(subdirPath)}`);
        return;
      } catch {
        p.log.error(`Skill "${skillName}" not found.`);
        p.log.message('Check that the skill exists in .claude/skills/');
        return;
      }
    }

    // Migrate the specific skill
    const result = await migrateSkillWorkflow(legacyPath);
    reportMigrationResult(result);
    return;
  }

  // Case 2: Scan for all legacy skills
  p.intro(pc.bgCyan(pc.black(' Skill Migration ')));

  const scanResult = await scanForLegacySkills(skillsDir);

  // Report current state
  if (scanResult.alreadyMigrated.length > 0) {
    p.log.info(
      `${scanResult.alreadyMigrated.length} skill(s) already use correct format: ` +
      pc.dim(scanResult.alreadyMigrated.slice(0, 5).join(', ') +
        (scanResult.alreadyMigrated.length > 5 ? ', ...' : ''))
    );
  }

  if (scanResult.found.length === 0) {
    p.log.success('All skills already use the correct subdirectory format.');
    p.outro('No migration needed.');
    return;
  }

  p.log.warn(`Found ${scanResult.found.length} legacy skill(s) to migrate:`);
  for (const skill of scanResult.found) {
    p.log.message(`  - ${pc.yellow(skill.name)} (${pc.dim(skill.path)})`);
  }
  p.log.message('');

  // Migrate each skill one at a time
  const results: MigrationResult[] = [];

  for (const skill of scanResult.found) {
    p.log.message(pc.bold(`\nMigrating: ${skill.name}`));
    const result = await migrateSkillWorkflow(skill.path);
    results.push(result);

    // Check for cancellation
    if (!result.migrated && result.reason === 'cancelled') {
      p.cancel('Migration cancelled');
      return;
    }
  }

  // Summary
  const migrated = results.filter(r => r.migrated).length;
  const declined = results.filter(r => !r.migrated && r.reason === 'declined').length;
  const errors = results.filter(r => !r.migrated && r.reason === 'error').length;

  p.log.message('');
  p.log.message(pc.bold('Migration Summary:'));
  if (migrated > 0) p.log.message(`  ${pc.green('Migrated:')} ${migrated}`);
  if (declined > 0) p.log.message(`  ${pc.yellow('Declined:')} ${declined}`);
  if (errors > 0) p.log.message(`  ${pc.red('Errors:')} ${errors}`);

  if (declined > 0) {
    p.log.message('');
    p.log.message(
      pc.dim('Declined skills will show deprecation warnings. ') +
      pc.dim('Run this command again to migrate them later.')
    );
  }

  p.outro('Migration complete.');
}

/**
 * Report a single migration result.
 */
function reportMigrationResult(result: MigrationResult): void {
  if (result.migrated) {
    p.log.success(`Successfully migrated "${result.skillName}" to ${pc.cyan(result.newPath)}`);
  } else if (result.reason === 'declined') {
    p.log.warn(`Migration declined for "${result.skillName}".`);
  } else if (result.reason === 'error') {
    p.log.error(`Migration failed for "${result.skillName}": ${result.error}`);
  }
}

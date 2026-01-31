import * as p from '@clack/prompts';
import pc from 'picocolors';
import { readFile, writeFile, mkdir, unlink, stat } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { isLegacyFlatFile, validateSkillDirectory } from '../validation/directory-validation.js';

// ============================================================================
// Migration Result Types
// ============================================================================

export interface MigrationSuccess {
  migrated: true;
  newPath: string;
  skillName: string;
}

export interface MigrationDeclined {
  migrated: false;
  reason: 'declined';
  skillName: string;
}

export interface MigrationCancelled {
  migrated: false;
  reason: 'cancelled';
  skillName: string;
}

export interface MigrationError {
  migrated: false;
  reason: 'error';
  error: string;
  skillName: string;
}

export type MigrationResult = MigrationSuccess | MigrationDeclined | MigrationCancelled | MigrationError;

// ============================================================================
// Deprecation Warning
// ============================================================================

/**
 * Show deprecation warning for legacy flat-file skills that user declined to migrate.
 */
export function showDeprecationWarning(skillName: string, legacyPath: string): void {
  p.log.warn(
    pc.yellow(`Skill "${skillName}" uses deprecated flat-file format.`) +
    `\n  Current: ${pc.dim(legacyPath)}` +
    `\n  Expected: ${pc.dim(`.claude/skills/${skillName}/SKILL.md`)}` +
    `\n  Run ${pc.cyan(`skill-creator migrate ${skillName}`)} to migrate.`
  );
}

// ============================================================================
// Migration Workflow
// ============================================================================

/**
 * Interactive workflow to migrate a legacy flat-file skill to subdirectory format.
 *
 * Flow:
 * 1. Validate that legacyPath is actually a legacy flat file
 * 2. Read existing skill content
 * 3. Compute new path: replace {name}.md with {name}/SKILL.md
 * 4. Show migration preview
 * 5. Prompt for confirmation
 * 6. If confirmed: create directory, copy file, verify, delete original
 * 7. If declined: show deprecation warning
 *
 * @param legacyPath - Path to the legacy flat-file skill (e.g., .claude/skills/my-skill.md)
 * @returns Migration result indicating success, decline, or error
 */
export async function migrateSkillWorkflow(legacyPath: string): Promise<MigrationResult> {
  // Extract skill name from path
  const filename = basename(legacyPath);
  const skillName = filename.replace(/\.md$/, '');

  // Step 1: Validate this is actually a legacy flat file
  if (!isLegacyFlatFile(legacyPath)) {
    const validation = validateSkillDirectory(legacyPath);

    if (validation.valid) {
      return {
        migrated: false,
        reason: 'error',
        error: 'This skill already uses the correct subdirectory format.',
        skillName,
      };
    }

    return {
      migrated: false,
      reason: 'error',
      error: `Not a valid legacy flat-file skill: ${validation.errors.join(', ')}`,
      skillName,
    };
  }

  // Step 2: Read existing skill content
  let content: string;
  try {
    content = await readFile(legacyPath, 'utf-8');
  } catch (error) {
    return {
      migrated: false,
      reason: 'error',
      error: `Failed to read skill file: ${error instanceof Error ? error.message : String(error)}`,
      skillName,
    };
  }

  // Step 3: Compute new path
  const parentDir = dirname(legacyPath);
  const newDir = join(parentDir, skillName);
  const newPath = join(newDir, 'SKILL.md');

  // Step 4: Show migration preview
  p.log.message(pc.bold('\n--- Migration Preview ---'));
  p.log.message(`Skill: ${pc.cyan(skillName)}`);
  p.log.message(`From:  ${pc.dim(legacyPath)}`);
  p.log.message(`To:    ${pc.green(newPath)}`);
  p.log.message(pc.bold('-------------------------\n'));

  // Step 5: Prompt for confirmation
  const confirm = await p.confirm({
    message: `Migrate skill "${skillName}" to subdirectory format?`,
    initialValue: true,
  });

  // Handle cancellation
  if (p.isCancel(confirm)) {
    p.cancel('Migration cancelled');
    return {
      migrated: false,
      reason: 'cancelled',
      skillName,
    };
  }

  // Step 6: Handle declined
  if (!confirm) {
    showDeprecationWarning(skillName, legacyPath);
    return {
      migrated: false,
      reason: 'declined',
      skillName,
    };
  }

  // Step 7: Perform migration with copy-then-delete safety
  try {
    // 7a: Create target directory
    await mkdir(newDir, { recursive: true });

    // 7b: Write skill to new location
    await writeFile(newPath, content, 'utf-8');

    // 7c: Verify new file exists and matches content
    const verifyContent = await readFile(newPath, 'utf-8');
    if (verifyContent !== content) {
      // Content mismatch - abort migration, leave original intact
      return {
        migrated: false,
        reason: 'error',
        error: 'Verification failed: written content does not match original',
        skillName,
      };
    }

    // 7d: Verify file stats exist
    await stat(newPath);

    // 7e: Delete original file
    await unlink(legacyPath);

    p.log.success(`Migrated "${skillName}" to ${pc.cyan(newPath)}`);

    return {
      migrated: true,
      newPath,
      skillName,
    };
  } catch (error) {
    // On any error during write, original should still be intact
    return {
      migrated: false,
      reason: 'error',
      error: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
      skillName,
    };
  }
}

/**
 * Pack content validator.
 *
 * Validates a knowledge pack directory by checking file existence
 * and running schema validation on each file present. Produces a
 * structured PackValidationReport with per-file status, overall
 * pass/fail, and error details.
 *
 * Required file: .skillmeta (pack metadata YAML).
 * Optional files: *-vision.md, *-modules.yaml, *-activities.json,
 *   *-assessment.md, *-resources.md.
 *
 * @module content-validator
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ModulesFileSchema } from './types.js';
import { parseSkillmeta } from './skillmeta-parser.js';
import { parseVisionDocument } from './vision-parser.js';
import { loadActivities } from './activity-loader.js';
import { parseAssessment } from './assessment-loader.js';
import { parseResources } from './resource-loader.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Validation status for a single file within a pack directory.
 *
 * - `exists: false` means the file was not found. `valid` is null.
 * - `exists: true, valid: true` means the file was found and passed validation.
 * - `exists: true, valid: false` means the file was found but failed validation.
 */
export interface FileValidationStatus {
  file: string;
  exists: boolean;
  valid: boolean | null;
  errors: string[];
}

/**
 * Overall validation report for a pack directory.
 *
 * `valid` is true only when .skillmeta exists and is valid, and
 * every present optional file also passes its schema validation.
 */
export interface PackValidationReport {
  packId: string | null;
  directory: string;
  valid: boolean;
  fileStatuses: FileValidationStatus[];
  errors: string[];
}

// ============================================================================
// Helpers
// ============================================================================

/** Find the first filename in a list matching a regex pattern. */
function findFileByPattern(files: string[], pattern: RegExp): string | undefined {
  return files.find((f) => pattern.test(f));
}

/** Create a not-found FileValidationStatus. */
function notFound(file: string): FileValidationStatus {
  return { file, exists: false, valid: null, errors: [] };
}

// ============================================================================
// validatePackContent
// ============================================================================

/**
 * Validate a knowledge pack directory.
 *
 * Checks that:
 * 1. The directory exists and is readable.
 * 2. .skillmeta exists (required) and passes KnowledgePackSchema validation.
 * 3. Each optional file, if present, passes its respective parser/schema.
 *
 * @param directory - Absolute path to the pack directory
 * @returns PackValidationReport with per-file statuses and overall result
 */
export async function validatePackContent(directory: string): Promise<PackValidationReport> {
  const report: PackValidationReport = {
    packId: null,
    directory,
    valid: true,
    fileStatuses: [],
    errors: [],
  };

  // Step 1: Read directory
  let files: string[];
  try {
    files = (await readdir(directory)) as string[];
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    report.valid = false;
    report.errors.push(`Failed to read directory: ${message}`);
    return report;
  }

  // Step 2: .skillmeta (required)
  const skillmetaFile = files.find((f) => f === '.skillmeta');

  if (!skillmetaFile) {
    report.valid = false;
    report.errors.push('Required file .skillmeta not found');
    report.fileStatuses.push(notFound('.skillmeta'));
    return report;
  }

  // Parse and validate .skillmeta
  try {
    const content = await readFile(join(directory, skillmetaFile), 'utf-8');
    const result = await parseSkillmeta(content);

    if (result.success) {
      report.packId = result.data.pack_id;
      report.fileStatuses.push({
        file: '.skillmeta',
        exists: true,
        valid: true,
        errors: [],
      });
    } else {
      report.valid = false;
      report.fileStatuses.push({
        file: '.skillmeta',
        exists: true,
        valid: false,
        errors: result.errors,
      });
      report.errors.push(...result.errors);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    report.valid = false;
    report.fileStatuses.push({
      file: '.skillmeta',
      exists: true,
      valid: false,
      errors: [`Read error: ${message}`],
    });
    report.errors.push(`Failed to read .skillmeta: ${message}`);
  }

  // Step 3: Optional files

  // --- vision.md ---
  const visionFile = findFileByPattern(files, /-vision\.md$/);
  if (visionFile) {
    try {
      const content = await readFile(join(directory, visionFile), 'utf-8');
      parseVisionDocument(content); // Always succeeds (lenient markdown parser)
      report.fileStatuses.push({
        file: visionFile,
        exists: true,
        valid: true,
        errors: [],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      report.valid = false;
      report.fileStatuses.push({
        file: visionFile,
        exists: true,
        valid: false,
        errors: [`Read error: ${message}`],
      });
    }
  } else {
    report.fileStatuses.push(notFound('vision.md'));
  }

  // --- modules.yaml ---
  const modulesFile = findFileByPattern(files, /-modules\.yaml$/);
  if (modulesFile) {
    try {
      const content = await readFile(join(directory, modulesFile), 'utf-8');
      const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
      const parsed = (yaml as any).load(content);
      const validated = ModulesFileSchema.safeParse(parsed);

      if (validated.success) {
        report.fileStatuses.push({
          file: modulesFile,
          exists: true,
          valid: true,
          errors: [],
        });
      } else {
        const errors = validated.error.issues.map((issue) => {
          const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
          return `${path}: ${issue.message}`;
        });
        report.valid = false;
        report.fileStatuses.push({
          file: modulesFile,
          exists: true,
          valid: false,
          errors,
        });
        report.errors.push(...errors);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      report.valid = false;
      report.fileStatuses.push({
        file: modulesFile,
        exists: true,
        valid: false,
        errors: [`Parse error: ${message}`],
      });
    }
  } else {
    report.fileStatuses.push(notFound('modules.yaml'));
  }

  // --- activities.json ---
  const activitiesFile = findFileByPattern(files, /-activities\.json$/);
  if (activitiesFile) {
    try {
      const content = await readFile(join(directory, activitiesFile), 'utf-8');
      const result = await loadActivities(content);

      if (result.success) {
        report.fileStatuses.push({
          file: activitiesFile,
          exists: true,
          valid: true,
          errors: [],
        });
      } else {
        report.valid = false;
        report.fileStatuses.push({
          file: activitiesFile,
          exists: true,
          valid: false,
          errors: result.errors,
        });
        report.errors.push(...result.errors);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      report.valid = false;
      report.fileStatuses.push({
        file: activitiesFile,
        exists: true,
        valid: false,
        errors: [`Read error: ${message}`],
      });
    }
  } else {
    report.fileStatuses.push(notFound('activities.json'));
  }

  // --- assessment.md ---
  const assessmentFile = findFileByPattern(files, /-assessment\.md$/);
  if (assessmentFile) {
    try {
      const content = await readFile(join(directory, assessmentFile), 'utf-8');
      parseAssessment(content); // Lenient markdown parser
      report.fileStatuses.push({
        file: assessmentFile,
        exists: true,
        valid: true,
        errors: [],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      report.valid = false;
      report.fileStatuses.push({
        file: assessmentFile,
        exists: true,
        valid: false,
        errors: [`Read error: ${message}`],
      });
    }
  } else {
    report.fileStatuses.push(notFound('assessment.md'));
  }

  // --- resources.md ---
  const resourcesFile = findFileByPattern(files, /-resources\.md$/);
  if (resourcesFile) {
    try {
      const content = await readFile(join(directory, resourcesFile), 'utf-8');
      parseResources(content); // Lenient markdown parser
      report.fileStatuses.push({
        file: resourcesFile,
        exists: true,
        valid: true,
        errors: [],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      report.valid = false;
      report.fileStatuses.push({
        file: resourcesFile,
        exists: true,
        valid: false,
        errors: [`Read error: ${message}`],
      });
    }
  } else {
    report.fileStatuses.push(notFound('resources.md'));
  }

  return report;
}

/**
 * Pack directory module loader.
 *
 * Reads an entire pack directory (all content files + .skillmeta) into
 * a single typed LoadedPack object. Gracefully handles missing optional
 * files (only .skillmeta is required). Reports clear errors for missing
 * or invalid .skillmeta.
 *
 * Pure data operations with no side effects beyond filesystem reads.
 *
 * @module module-loader
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ModulesFileSchema } from './types.js';
import type { KnowledgePack, PackActivity, ModulesFile } from './types.js';
import { parseSkillmeta } from './skillmeta-parser.js';
import { parseVisionDocument } from './vision-parser.js';
import type { VisionDocument } from './vision-parser.js';
import { loadActivities } from './activity-loader.js';
import { parseAssessment } from './assessment-loader.js';
import type { AssessmentDocument } from './assessment-loader.js';
import { parseResources } from './resource-loader.js';
import type { ResourceCatalog } from './resource-loader.js';

// ============================================================================
// Types
// ============================================================================

/**
 * A fully loaded knowledge pack with all content files parsed.
 *
 * Fields are null when the corresponding file is not present in
 * the pack directory. Only .skillmeta is required -- all other
 * files are optional.
 */
export interface LoadedPack {
  meta: KnowledgePack | null;
  modules: ModulesFile | null;
  vision: VisionDocument | null;
  activities: PackActivity[] | null;
  assessment: AssessmentDocument | null;
  resources: ResourceCatalog | null;
  directory: string;
  loadErrors: string[];
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Find the first file in a list matching a regex pattern.
 */
function findFileByPattern(files: string[], pattern: RegExp): string | undefined {
  return files.find((f) => pattern.test(f));
}

/**
 * Create an empty LoadedPack result for a given directory.
 */
function emptyResult(directory: string): LoadedPack {
  return {
    meta: null,
    modules: null,
    vision: null,
    activities: null,
    assessment: null,
    resources: null,
    directory,
    loadErrors: [],
  };
}

// ============================================================================
// loadPack
// ============================================================================

/**
 * Load all content files from a pack directory into a typed LoadedPack.
 *
 * Discovery process:
 * 1. readdir to list files
 * 2. Find `.skillmeta` (required) -- parse with parseSkillmeta
 * 3. Find `*-vision.md` -- parse with parseVisionDocument
 * 4. Find `*-modules.yaml` -- parse YAML and validate against ModulesFileSchema
 * 5. Find `*-activities.json` -- parse with loadActivities
 * 6. Find `*-assessment.md` -- parse with parseAssessment
 * 7. Find `*-resources.md` -- parse with parseResources
 *
 * Missing optional files are NOT errors -- the corresponding field stays null.
 * Only a missing or invalid .skillmeta produces errors.
 *
 * @param directory - Absolute path to the pack directory
 * @returns LoadedPack with all available content parsed
 */
export async function loadPack(directory: string): Promise<LoadedPack> {
  const result = emptyResult(directory);

  // Step 1: List directory contents
  let files: string[];
  try {
    files = await readdir(directory) as string[];
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    result.loadErrors.push(`Failed to read directory ${directory}: ${message}`);
    return result;
  }

  // Step 2: Find and parse .skillmeta (required)
  const skillmetaFile = files.find((f) => f === '.skillmeta');
  if (!skillmetaFile) {
    result.loadErrors.push('Missing required .skillmeta file in pack directory');
    return result;
  }

  try {
    const metaContent = await readFile(join(directory, skillmetaFile), 'utf-8');
    const metaResult = await parseSkillmeta(metaContent);

    if (metaResult.success) {
      result.meta = metaResult.data;
    } else {
      result.loadErrors.push(...metaResult.errors);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    result.loadErrors.push(`Failed to read .skillmeta: ${message}`);
  }

  // Step 3: Find and parse *-vision.md (optional)
  const visionFile = findFileByPattern(files, /-vision\.md$/);
  if (visionFile) {
    try {
      const content = await readFile(join(directory, visionFile), 'utf-8');
      result.vision = parseVisionDocument(content);
    } catch {
      // Optional file read failure is not an error
    }
  }

  // Step 4: Find and parse *-modules.yaml (optional)
  const modulesFile = findFileByPattern(files, /-modules\.yaml$/);
  if (modulesFile) {
    try {
      const content = await readFile(join(directory, modulesFile), 'utf-8');
      const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
      const parsed = (yaml as any).load(content);
      const validated = ModulesFileSchema.safeParse(parsed);

      if (validated.success) {
        result.modules = validated.data;
      } else {
        const errors = validated.error.issues.map((issue) => {
          const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
          return `modules.yaml: ${path}: ${issue.message}`;
        });
        result.loadErrors.push(...errors);
      }
    } catch {
      // Optional file read/parse failure
    }
  }

  // Step 5: Find and parse *-activities.json (optional)
  const activitiesFile = findFileByPattern(files, /-activities\.json$/);
  if (activitiesFile) {
    try {
      const content = await readFile(join(directory, activitiesFile), 'utf-8');
      const activitiesResult = await loadActivities(content);

      if (activitiesResult.success) {
        result.activities = activitiesResult.activities;
      } else {
        result.loadErrors.push(...activitiesResult.errors);
      }
    } catch {
      // Optional file read failure
    }
  }

  // Step 6: Find and parse *-assessment.md (optional)
  const assessmentFile = findFileByPattern(files, /-assessment\.md$/);
  if (assessmentFile) {
    try {
      const content = await readFile(join(directory, assessmentFile), 'utf-8');
      result.assessment = parseAssessment(content);
    } catch {
      // Optional file read failure
    }
  }

  // Step 7: Find and parse *-resources.md (optional)
  const resourcesFile = findFileByPattern(files, /-resources\.md$/);
  if (resourcesFile) {
    try {
      const content = await readFile(join(directory, resourcesFile), 'utf-8');
      result.resources = parseResources(content);
    } catch {
      // Optional file read failure
    }
  }

  return result;
}

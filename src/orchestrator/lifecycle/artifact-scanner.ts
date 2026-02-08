/**
 * Phase directory artifact scanner.
 *
 * Scans a phase directory within .planning/phases/ to detect which
 * GSD artifacts exist: PLAN files, SUMMARY files, CONTEXT, RESEARCH,
 * UAT, and VERIFICATION documents.
 *
 * The scanner derives suggestions from artifact existence (LIFE-03)
 * rather than relying on a hardcoded state machine. This means the
 * lifecycle coordinator can determine what happened and what should
 * happen next purely from the filesystem.
 */

import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { PhaseArtifacts } from './types.js';

// ============================================================================
// Filename Patterns
// ============================================================================

/** Matches PLAN files: 39-01-PLAN.md, 37.1-02-PLAN.md */
const PLAN_PATTERN = /^(\d+(?:\.\d+)?-\d+)-PLAN\.md$/;

/** Matches SUMMARY files: 39-01-SUMMARY.md, 37.1-02-SUMMARY.md */
const SUMMARY_PATTERN = /^(\d+(?:\.\d+)?-\d+)-SUMMARY\.md$/;

/** Matches CONTEXT files: 39-CONTEXT.md, any-CONTEXT.md */
const CONTEXT_PATTERN = /CONTEXT\.md$/;

/** Matches RESEARCH files: 39-RESEARCH.md, any-RESEARCH.md */
const RESEARCH_PATTERN = /RESEARCH\.md$/;

/** Matches UAT files: 39-UAT.md, any-UAT.md */
const UAT_PATTERN = /UAT\.md$/;

/** Matches VERIFICATION files: 39-VERIFICATION.md, any-VERIFICATION.md */
const VERIFICATION_PATTERN = /VERIFICATION\.md$/;

/** Extracts phase number and name from directory string (e.g., '39-lifecycle-coordination') */
const PHASE_DIR_PATTERN = /^(\d+(?:\.\d+)?)-(.+)$/;

// ============================================================================
// Helper
// ============================================================================

/**
 * Create an empty PhaseArtifacts object for a given phase directory.
 *
 * Used when the directory does not exist or is empty.
 *
 * @param phaseDirectory - Phase directory name (e.g., '39-lifecycle-coordination')
 * @returns Empty PhaseArtifacts with all flags false and arrays empty
 */
function emptyArtifacts(phaseDirectory: string): PhaseArtifacts {
  const match = PHASE_DIR_PATTERN.exec(phaseDirectory);
  const phaseNumber = match ? match[1] : '';
  const phaseName = match ? match[2] : phaseDirectory;

  return {
    phaseNumber,
    phaseName,
    phaseDirectory,
    hasContext: false,
    hasResearch: false,
    planIds: [],
    summaryIds: [],
    hasUat: false,
    hasVerification: false,
    planCount: 0,
    summaryCount: 0,
    unexecutedPlans: [],
  };
}

// ============================================================================
// scanPhaseArtifacts
// ============================================================================

/**
 * Scan a phase directory for GSD artifacts.
 *
 * Reads all files in `{phasesDir}/{phaseDirectory}` and categorizes them
 * by artifact type. Returns a PhaseArtifacts object describing what exists.
 *
 * If the directory does not exist, returns empty artifacts (does not throw).
 *
 * @param phasesDir - Path to the phases parent directory (e.g., '.planning/phases')
 * @param phaseDirectory - Phase directory name (e.g., '39-lifecycle-coordination')
 * @returns PhaseArtifacts describing the contents of the phase directory
 */
export async function scanPhaseArtifacts(
  phasesDir: string,
  phaseDirectory: string,
): Promise<PhaseArtifacts> {
  const fullPath = join(phasesDir, phaseDirectory);

  let files: string[];
  try {
    files = await readdir(fullPath);
  } catch {
    // Directory does not exist or is not readable
    return emptyArtifacts(phaseDirectory);
  }

  const planIds: string[] = [];
  const summaryIds: string[] = [];
  let hasContext = false;
  let hasResearch = false;
  let hasUat = false;
  let hasVerification = false;

  for (const file of files) {
    // Check PLAN pattern
    const planMatch = PLAN_PATTERN.exec(file);
    if (planMatch) {
      planIds.push(planMatch[1]);
      continue;
    }

    // Check SUMMARY pattern
    const summaryMatch = SUMMARY_PATTERN.exec(file);
    if (summaryMatch) {
      summaryIds.push(summaryMatch[1]);
      continue;
    }

    // Check single-instance artifacts
    if (CONTEXT_PATTERN.test(file)) {
      hasContext = true;
      continue;
    }

    if (RESEARCH_PATTERN.test(file)) {
      hasResearch = true;
      continue;
    }

    if (UAT_PATTERN.test(file)) {
      hasUat = true;
      continue;
    }

    if (VERIFICATION_PATTERN.test(file)) {
      hasVerification = true;
    }
  }

  // Sort IDs for deterministic output
  planIds.sort();
  summaryIds.sort();

  // Compute unexecuted plans (plans without matching summaries)
  const summarySet = new Set(summaryIds);
  const unexecutedPlans = planIds.filter(id => !summarySet.has(id));

  // Extract phase number and name from directory string
  const match = PHASE_DIR_PATTERN.exec(phaseDirectory);
  const phaseNumber = match ? match[1] : '';
  const phaseName = match ? match[2] : phaseDirectory;

  return {
    phaseNumber,
    phaseName,
    phaseDirectory,
    hasContext,
    hasResearch,
    planIds,
    summaryIds,
    hasUat,
    hasVerification,
    planCount: planIds.length,
    summaryCount: summaryIds.length,
    unexecutedPlans,
  };
}

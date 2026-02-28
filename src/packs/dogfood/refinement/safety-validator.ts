/**
 * Validates safety constraints for the dogfood refinement phase.
 * Enforces bounded learning (20% max change), checkpoint integrity,
 * no auto-application, and regression test gate.
 */

import { createHash } from 'crypto';
import type { KnowledgePatch, SkillUpdate } from './types.js';

// --- Exported Types ---

export interface SafetyValidationResult {
  passed: boolean;
  violations: string[];
  checks: {
    boundedLearning: boolean;
    checkpointIntegrity: boolean;
    noAutoApplication: boolean;
    regressionPassing: boolean;
  };
}

export interface TestRunResult {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface CheckpointState {
  data: unknown;
  integrityHash: string;
}

// --- Options ---

export interface ValidateSafetyOptions {
  skillUpdates?: SkillUpdate[];
  patches?: KnowledgePatch[];
  checkpoint?: CheckpointState | null;
  testRunResult?: TestRunResult;
  expectedMinTests?: number;
}

// --- Constants ---

const DEFAULT_MIN_TESTS = 16790;
const MAX_CHANGE_RATIO = 0.20;

/**
 * Validate all safety constraints and return combined result.
 * All checks must pass for the overall result to pass.
 */
export function validateSafety(options: ValidateSafetyOptions): SafetyValidationResult {
  const violations: string[] = [];

  // SAFETY-01: Bounded learning
  const boundedLearningOk = checkBoundedLearning(options.skillUpdates, violations);

  // SAFETY-02: Checkpoint integrity
  const checkpointOk = checkCheckpointIntegrity(options.checkpoint, violations);

  // SAFETY-03: No auto-application
  const noAutoAppOk = checkNoAutoApplication(options.patches, violations);

  // SAFETY-04: Regression test gate
  const regressionOk = checkRegressionGate(options.testRunResult, options.expectedMinTests, violations);

  return {
    passed: boundedLearningOk && checkpointOk && noAutoAppOk && regressionOk,
    violations,
    checks: {
      boundedLearning: boundedLearningOk,
      checkpointIntegrity: checkpointOk,
      noAutoApplication: noAutoAppOk,
      regressionPassing: regressionOk,
    },
  };
}

/**
 * Check bounded learning constraint (SAFETY-01).
 * No skill refinement may change more than 20% of the content.
 */
function checkBoundedLearning(
  skillUpdates: SkillUpdate[] | undefined,
  violations: string[],
): boolean {
  if (!skillUpdates || skillUpdates.length === 0) return true;

  let allOk = true;

  for (const skill of skillUpdates) {
    // Create actions are exempt (new content, nothing to compare)
    if (skill.action === 'create') continue;

    // If no current definition, skip the check
    if (skill.currentDefinition === undefined || skill.currentDefinition === null) continue;

    const changeRatio = computeChangeRatio(skill.currentDefinition, skill.proposedDefinition);

    if (changeRatio > MAX_CHANGE_RATIO) {
      violations.push(
        `Bounded learning violation: skill '${skill.skillName}' changed ${(changeRatio * 100).toFixed(1)}% (max 20%)`,
      );
      allOk = false;
    }
  }

  return allOk;
}

/**
 * Check checkpoint integrity (SAFETY-02).
 * Validate SHA-256 hash of checkpoint data matches stored hash.
 */
function checkCheckpointIntegrity(
  checkpoint: CheckpointState | null | undefined,
  violations: string[],
): boolean {
  if (checkpoint === null || checkpoint === undefined) return true;

  const computedHash = createHash('sha256')
    .update(JSON.stringify(checkpoint.data))
    .digest('hex');

  if (computedHash !== checkpoint.integrityHash) {
    violations.push(
      `Checkpoint integrity violation: expected hash ${checkpoint.integrityHash}, got ${computedHash}`,
    );
    return false;
  }

  return true;
}

/**
 * Check no auto-application constraint (SAFETY-03).
 * Every patch must have requiresReview=true.
 */
function checkNoAutoApplication(
  patches: KnowledgePatch[] | undefined,
  violations: string[],
): boolean {
  if (!patches || patches.length === 0) return true;

  let allOk = true;

  for (const patch of patches) {
    if (patch.requiresReview !== true) {
      violations.push(
        `Auto-application violation: patch '${patch.id}' has requiresReview=${patch.requiresReview}`,
      );
      allOk = false;
    }
  }

  return allOk;
}

/**
 * Check regression test gate (SAFETY-04).
 * All tests must pass with at least the expected minimum test count.
 */
function checkRegressionGate(
  testRunResult: TestRunResult | undefined,
  expectedMinTests: number | undefined,
  violations: string[],
): boolean {
  if (!testRunResult) return true;

  const minTests = expectedMinTests ?? DEFAULT_MIN_TESTS;
  let allOk = true;

  if (testRunResult.total < minTests) {
    violations.push(
      `Test count mismatch: expected at least ${minTests}, got ${testRunResult.total}`,
    );
    allOk = false;
  }

  if (testRunResult.failed > 0) {
    violations.push(
      `Regression detected: ${testRunResult.failed} test(s) failed`,
    );
    allOk = false;
  }

  return allOk;
}

/**
 * Compute the change ratio between two strings.
 * Uses a simple Levenshtein-based approach:
 * ratio = levenshtein(a, b) / max(a.length, b.length)
 */
function computeChangeRatio(current: string, proposed: string): number {
  const maxLen = Math.max(current.length, proposed.length);
  if (maxLen === 0) return 0;

  const distance = levenshtein(current, proposed);
  return distance / maxLen;
}

/**
 * Simple Levenshtein distance implementation.
 * O(n*m) time and O(min(n,m)) space using two-row optimization.
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Ensure a is the shorter string for space optimization
  if (a.length > b.length) {
    [a, b] = [b, a];
  }

  const aLen = a.length;
  const bLen = b.length;

  let prevRow = new Array<number>(aLen + 1);
  let currRow = new Array<number>(aLen + 1);

  // Initialize first row
  for (let i = 0; i <= aLen; i++) {
    prevRow[i] = i;
  }

  for (let j = 1; j <= bLen; j++) {
    currRow[0] = j;

    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[i] = Math.min(
        prevRow[i] + 1,       // deletion
        currRow[i - 1] + 1,   // insertion
        prevRow[i - 1] + cost, // substitution
      );
    }

    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[aLen];
}

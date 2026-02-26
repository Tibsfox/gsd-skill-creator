// === sc:unlearn CLI Command ===
//
// Loads a learning session changeset, validates revert safety, executes the
// revert, regenerates affected skill files, and provides a human-readable
// summary. Completes the reversibility guarantee of the sc:learn pipeline.
//
// 5-stage flow: LOAD -> VALIDATE -> PROCESS RESULT -> REGENERATE -> SUMMARY

import type { MathematicalPrimitive } from '../types/mfe-types.js';
import type {
  ChangesetManager,
  GraphIntegrityValidator,
  IntegrityError,
  RevertResult,
} from '../learn/changeset-manager.js';
import { generateLearnedSkill } from '../learn/generators/skill-generator.js';

// === Exported Types ===

export interface ScUnlearnOptions {
  force?: boolean;                            // Bypass integrity checks (default: false)
  changesetManager: ChangesetManager;         // Injectable (required -- caller provides)
  graphValidator: GraphIntegrityValidator;     // Injectable (required -- caller provides)
  onProgress?: (stage: string, detail: string) => void;
  // Post-revert regeneration
  regenerateSkills?: boolean;                 // Regenerate affected skill files (default: true)
  existingPrimitives?: MathematicalPrimitive[]; // Remaining primitives after revert (for skill regen)
}

export interface ScUnlearnResult {
  success: boolean;
  sessionId: string;
  status: RevertResult['status'];
  operationsReverted: number;
  primitivesRemoved: string[];    // IDs of primitives removed
  primitivesRestored: string[];   // IDs of primitives restored to previous version
  integrityErrors: IntegrityError[];
  skillsRegenerated: string[];    // File names of regenerated skills
  summary: string;                // Human-readable summary
}

// === Helpers ===

function emptyResult(
  sessionId: string,
  status: RevertResult['status'],
  summary: string,
): ScUnlearnResult {
  return {
    success: false,
    sessionId,
    status,
    operationsReverted: 0,
    primitivesRemoved: [],
    primitivesRestored: [],
    integrityErrors: [],
    skillsRegenerated: [],
    summary,
  };
}

function progress(
  onProgress: ScUnlearnOptions['onProgress'],
  stage: string,
  detail: string,
): void {
  if (onProgress) {
    onProgress(stage, detail);
  }
}

// === Main Function ===

export function scUnlearn(
  sessionId: string,
  options: ScUnlearnOptions,
): ScUnlearnResult {
  const {
    changesetManager,
    graphValidator,
    force = false,
    regenerateSkills = true,
    existingPrimitives,
    onProgress,
  } = options;

  // Stage 1: LOAD
  progress(onProgress, 'load', `Loading changeset for session ${sessionId}...`);
  const changeset = changesetManager.getChangeset(sessionId);

  if (!changeset) {
    return emptyResult(sessionId, 'not-found', `No changeset found for session ${sessionId}`);
  }

  // Stage 2: VALIDATE + REVERT
  progress(onProgress, 'validate', 'Checking graph integrity...');
  const revertResult = changesetManager.revert(sessionId, graphValidator, force);

  // Stage 3: PROCESS RESULT
  if (revertResult.status === 'integrity-violation') {
    const orphanedIds = revertResult.integrityErrors
      .map(e => e.primitiveId)
      .join(', ');

    return {
      success: false,
      sessionId,
      status: 'integrity-violation',
      operationsReverted: 0,
      primitivesRemoved: [],
      primitivesRestored: [],
      integrityErrors: revertResult.integrityErrors,
      skillsRegenerated: [],
      summary: `sc:unlearn session ${sessionId}: blocked by integrity violations. Orphaned primitives: ${orphanedIds}`,
    };
  }

  if (revertResult.status === 'already-reverted') {
    return emptyResult(
      sessionId,
      'already-reverted',
      `Session ${sessionId} already reverted`,
    );
  }

  // Status is 'success' or 'forced' -- extract operation details
  const operations = revertResult.operations;
  const primitivesRemoved = operations
    .filter(op => op.type === 'remove')
    .map(op => op.primitiveId);
  const primitivesRestored = operations
    .filter(op => op.type === 'update')
    .map(op => op.primitiveId);

  progress(onProgress, 'revert', `Reverted ${operations.length} operations`);

  // Stage 4: REGENERATE SKILLS
  const skillsRegenerated: string[] = [];

  if (regenerateSkills !== false) {
    progress(onProgress, 'regenerate', 'Regenerating affected skill files...');

    if (existingPrimitives && existingPrimitives.length > 0) {
      // Collect unique domains from reverted primitives
      const affectedDomains = new Set<string>();
      for (const op of operations) {
        if (op.primitive.domain) {
          affectedDomains.add(op.primitive.domain);
        }
      }

      // Regenerate skill for each affected domain
      for (const domain of affectedDomains) {
        const domainPrimitives = existingPrimitives.filter(
          p => p.domain === domain,
        );

        const skillResult = generateLearnedSkill(domain, domainPrimitives, {
          minPrimitives: 30,
        });

        if (skillResult.generated && skillResult.skill) {
          skillsRegenerated.push(skillResult.skill.fileName);
        }
      }
    }
  }

  // Stage 5: SUMMARY
  const removed = primitivesRemoved.length;
  const restored = primitivesRestored.length;
  const skillCount = skillsRegenerated.length;

  let summary = `sc:unlearn session ${sessionId}: reverted ${operations.length} operations (${removed} removed, ${restored} restored). ${skillCount} skills regenerated.`;

  if (revertResult.status === 'forced') {
    summary += ' (forced -- integrity warnings present)';
  }

  if (regenerateSkills !== false && !existingPrimitives) {
    summary += ' Skill regeneration skipped (no existing primitives provided).';
  }

  return {
    success: true,
    sessionId,
    status: revertResult.status,
    operationsReverted: operations.length,
    primitivesRemoved,
    primitivesRestored,
    integrityErrors: revertResult.integrityErrors,
    skillsRegenerated,
    summary,
  };
}

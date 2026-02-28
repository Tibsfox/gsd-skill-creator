// === Merge Engine ===
//
// Executes merge strategies based on semantic classification results. For each
// candidate primitive, the engine either skips (exact duplicate), updates
// (generalization), adds (specialization or genuinely-new), or presents a
// conflict for user decision (overlapping-distinct).
//
// CRITICAL SAFETY INVARIANT: merge() NEVER produces a 'replace' action.
// Only resolveConflict() can produce 'replace', and only after explicit user
// decision. This enforces LEARN-08: "never silently overwrites."

import type { MathematicalPrimitive } from '../../core/types/mfe-types.js';
import type { ComparisonDetail } from './semantic-comparator.js';

// === Exported Types ===

export type MergeAction = 'skip' | 'update' | 'add' | 'replace' | 'conflict';
export type ConflictResolution = 'keep-existing' | 'keep-candidate' | 'keep-both';

export interface ProvenanceEntry {
  sessionId: string;
  timestamp: string;
  candidateId: string;
  existingId: string | null;
  action: string;
  rationale: string;
  userDecision?: ConflictResolution;
  originalFormalStatement?: string;
  newFormalStatement?: string;
}

export interface PrimitiveModification {
  type: 'add' | 'update' | 'remove';
  primitiveId: string;
  primitive: MathematicalPrimitive;
  previousVersion?: MathematicalPrimitive;
}

export interface ConflictPresentation {
  conflictId: string;
  existing: MathematicalPrimitive;
  candidate: MathematicalPrimitive;
  comparison: ComparisonDetail;
}

export interface MergeResult {
  action: MergeAction;
  modifications: PrimitiveModification[];
  provenance: ProvenanceEntry;
  conflict?: ConflictPresentation;
}

export interface MergeEngine {
  merge(
    candidate: MathematicalPrimitive,
    comparison: ComparisonDetail | null,
    existingPrimitive: MathematicalPrimitive | null,
  ): MergeResult;
  resolveConflict(conflictId: string, resolution: ConflictResolution): MergeResult;
  getProvenanceChain(): ProvenanceEntry[];
  getPendingConflicts(): ConflictPresentation[];
}

// === Factory ===

export function createMergeEngine(sessionId: string): MergeEngine {
  const provenanceChain: ProvenanceEntry[] = [];
  const pendingConflicts = new Map<string, {
    existing: MathematicalPrimitive;
    candidate: MathematicalPrimitive;
    comparison: ComparisonDetail;
  }>();
  let conflictCounter = 0;

  function makeProvenance(
    candidateId: string,
    existingId: string | null,
    action: string,
    rationale: string,
    extra: Partial<ProvenanceEntry> = {},
  ): ProvenanceEntry {
    const entry: ProvenanceEntry = {
      sessionId,
      timestamp: new Date().toISOString(),
      candidateId,
      existingId,
      action,
      rationale,
      ...extra,
    };
    provenanceChain.push(entry);
    return entry;
  }

  function merge(
    candidate: MathematicalPrimitive,
    comparison: ComparisonDetail | null,
    existingPrimitive: MathematicalPrimitive | null,
  ): MergeResult {
    // Genuinely-new: no match at all
    if (comparison === null || existingPrimitive === null) {
      const provenance = makeProvenance(
        candidate.id,
        null,
        'add-new',
        'No existing match — adding as genuinely new primitive.',
      );
      return {
        action: 'add',
        modifications: [{
          type: 'add',
          primitiveId: candidate.id,
          primitive: candidate,
        }],
        provenance,
      };
    }

    switch (comparison.classification) {
      case 'exact-duplicate': {
        const provenance = makeProvenance(
          candidate.id,
          existingPrimitive.id,
          'skip',
          `Exact duplicate of ${existingPrimitive.id} (confidence ${comparison.confidence.toFixed(2)}) — skipping.`,
        );
        return {
          action: 'skip',
          modifications: [],
          provenance,
        };
      }

      case 'generalization': {
        // Merge strategy: take candidate's formalStatement, computationalForm,
        // union applicabilityPatterns/keywords, intersection prerequisites.
        // Preserve existing ID, domain, chapter.
        const mergedPatterns = Array.from(new Set([
          ...existingPrimitive.applicabilityPatterns,
          ...candidate.applicabilityPatterns,
        ]));
        const mergedKeywords = Array.from(new Set([
          ...existingPrimitive.keywords,
          ...candidate.keywords,
        ]));
        const existingPrereqSet = new Set(existingPrimitive.prerequisites);
        const mergedPrerequisites = candidate.prerequisites.filter(
          p => existingPrereqSet.has(p),
        );

        const updatedPrimitive: MathematicalPrimitive = {
          ...existingPrimitive,
          formalStatement: candidate.formalStatement,
          computationalForm: candidate.computationalForm,
          applicabilityPatterns: mergedPatterns,
          keywords: mergedKeywords,
          prerequisites: mergedPrerequisites.length > 0 ? mergedPrerequisites : existingPrimitive.prerequisites,
        };

        const provenance = makeProvenance(
          candidate.id,
          existingPrimitive.id,
          'update-generalization',
          `Candidate generalizes ${existingPrimitive.id} — updating with broader scope.`,
          {
            originalFormalStatement: existingPrimitive.formalStatement,
            newFormalStatement: candidate.formalStatement,
          },
        );
        return {
          action: 'update',
          modifications: [{
            type: 'update',
            primitiveId: existingPrimitive.id,
            primitive: updatedPrimitive,
            previousVersion: existingPrimitive,
          }],
          provenance,
        };
      }

      case 'specialization': {
        // Add candidate as new primitive with dependency on existing
        const specializedCandidate: MathematicalPrimitive = {
          ...candidate,
          dependencies: [
            ...candidate.dependencies,
            {
              target: existingPrimitive.id,
              type: 'specializes',
              strength: 1.0,
              description: 'Specialization identified during sc:learn deduplication',
            },
          ],
        };

        const provenance = makeProvenance(
          candidate.id,
          existingPrimitive.id,
          'add-specialization',
          `Candidate is a specialization of ${existingPrimitive.id} — adding with dependency edge.`,
        );
        return {
          action: 'add',
          modifications: [{
            type: 'add',
            primitiveId: candidate.id,
            primitive: specializedCandidate,
          }],
          provenance,
        };
      }

      case 'overlapping-distinct': {
        // NEVER auto-merge. Present conflict for user decision.
        conflictCounter++;
        const conflictId = `conflict-${conflictCounter}`;
        const conflict: ConflictPresentation = {
          conflictId,
          existing: existingPrimitive,
          candidate,
          comparison,
        };
        pendingConflicts.set(conflictId, {
          existing: existingPrimitive,
          candidate,
          comparison,
        });

        const provenance = makeProvenance(
          candidate.id,
          existingPrimitive.id,
          'conflict-presented',
          `Overlapping-distinct with ${existingPrimitive.id} — presenting conflict for user decision.`,
        );
        return {
          action: 'conflict',
          modifications: [],
          provenance,
          conflict,
        };
      }

      case 'genuinely-new': {
        const provenance = makeProvenance(
          candidate.id,
          existingPrimitive.id,
          'add-new',
          `No significant overlap with ${existingPrimitive.id} — adding as genuinely new.`,
        );
        return {
          action: 'add',
          modifications: [{
            type: 'add',
            primitiveId: candidate.id,
            primitive: candidate,
          }],
          provenance,
        };
      }

      default: {
        // Should never reach here with valid SemanticClassification
        const provenance = makeProvenance(
          candidate.id,
          existingPrimitive.id,
          'error',
          `Unknown classification: ${comparison.classification}`,
        );
        return {
          action: 'skip',
          modifications: [],
          provenance,
        };
      }
    }
  }

  function resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
  ): MergeResult {
    const conflict = pendingConflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Unknown conflict ID: ${conflictId}`);
    }

    pendingConflicts.delete(conflictId);

    switch (resolution) {
      case 'keep-existing': {
        const provenance = makeProvenance(
          conflict.candidate.id,
          conflict.existing.id,
          'conflict-resolved',
          `User chose keep-existing — skipping candidate.`,
          { userDecision: 'keep-existing' },
        );
        return {
          action: 'skip',
          modifications: [],
          provenance,
        };
      }

      case 'keep-candidate': {
        const provenance = makeProvenance(
          conflict.candidate.id,
          conflict.existing.id,
          'conflict-resolved',
          `User chose keep-candidate — replacing existing.`,
          { userDecision: 'keep-candidate' },
        );
        return {
          action: 'replace',
          modifications: [
            {
              type: 'remove',
              primitiveId: conflict.existing.id,
              primitive: conflict.existing,
            },
            {
              type: 'add',
              primitiveId: conflict.candidate.id,
              primitive: conflict.candidate,
            },
          ],
          provenance,
        };
      }

      case 'keep-both': {
        const provenance = makeProvenance(
          conflict.candidate.id,
          conflict.existing.id,
          'conflict-resolved',
          `User chose keep-both — adding candidate alongside existing.`,
          { userDecision: 'keep-both' },
        );
        return {
          action: 'add',
          modifications: [{
            type: 'add',
            primitiveId: conflict.candidate.id,
            primitive: conflict.candidate,
          }],
          provenance,
        };
      }
    }
  }

  function getProvenanceChain(): ProvenanceEntry[] {
    return Array.from(provenanceChain);
  }

  function getPendingConflicts(): ConflictPresentation[] {
    return Array.from(pendingConflicts.entries()).map(([conflictId, data]) => ({
      conflictId,
      existing: data.existing,
      candidate: data.candidate,
      comparison: data.comparison,
    }));
  }

  return { merge, resolveConflict, getProvenanceChain, getPendingConflicts };
}

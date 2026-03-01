/**
 * College-specific types for progressive disclosure, exploration,
 * cross-reference resolution, and learning paths.
 *
 * These types are the return values of CollegeLoader, DepartmentExplorer,
 * and CrossReferenceResolver methods. They extend the base types from
 * rosetta-core/types.ts with College-layer semantics.
 *
 * @module college/types
 */

import type { DepartmentWing, RosettaConcept } from '../rosetta-core/types.js';

// ─── Progressive Disclosure Tiers ────────────────────────────────────────────

/** Returned by loadSummary() -- lightweight department overview under 3K tokens */
export interface DepartmentSummary {
  id: string;
  name: string;
  description: string;
  wings: Array<{ id: string; name: string; description: string; conceptCount: number }>;
  entryPoint: string;
  trySessions: Array<{ id: string; name: string; estimatedDuration: string }>;
  tokenCost: number;
}

/** Returned by loadWing() -- full wing content under 12K tokens */
export interface WingContent {
  departmentId: string;
  wing: DepartmentWing;
  concepts: RosettaConcept[];
  tokenCost: number;
}

/** Returned by loadDeep() -- extended reference material */
export interface DeepReference {
  departmentId: string;
  topic: string;
  content: string;
  relatedConcepts: string[];
  tokenCost: number;
}

// ─── Exploration Types ───────────────────────────────────────────────────────

/** Returned by explore() -- concept with pedagogical context */
export interface ExplorationResult {
  path: string;
  concept: RosettaConcept;
  wing: DepartmentWing;
  departmentId: string;
  pedagogicalContext: string;
  relatedPaths: string[];
}

/** Returned by crossReference() */
export interface CrossReferenceResult {
  fromDepartment: string;
  fromConcept: string;
  toDepartment: string;
  matches: Array<{
    conceptId: string;
    conceptName: string;
    relationshipType: string;
    description: string;
  }>;
}

// ─── Learning Path ───────────────────────────────────────────────────────────

/** Learning path for a department */
export interface LearningPath {
  entryPoint: string;
  suggestedOrder: string[][];
  prerequisites: Record<string, string[]>;
}

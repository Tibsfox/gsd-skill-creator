/**
 * VTM foundation data type system.
 *
 * STUB FILE — TDD RED phase. All schemas are placeholders that compile
 * but fail runtime validation. Will be replaced in GREEN phase.
 */

import { z } from 'zod';

// ============================================================================
// ModelAssignment
// ============================================================================

/** Stub — will be replaced with z.enum(['opus', 'sonnet', 'haiku']). */
export const MODEL_ASSIGNMENTS = ['opus', 'sonnet', 'haiku'] as const;

export const ModelAssignmentSchema = z.never();

export type ModelAssignment = z.infer<typeof ModelAssignmentSchema>;

// ============================================================================
// TokenEstimate
// ============================================================================

export const TokenEstimateSchema = z.never();

export type TokenEstimate = z.infer<typeof TokenEstimateSchema>;

// ============================================================================
// TokenBudgetConstraint
// ============================================================================

export const TokenBudgetConstraintSchema = z.never();

export type TokenBudgetConstraint = z.infer<typeof TokenBudgetConstraintSchema>;

export const BUDGET_RANGES = {
  sonnet: { min: 55, max: 65 },
  opus: { min: 25, max: 35 },
  haiku: { min: 5, max: 15 },
} as const;

// ============================================================================
// BudgetAllocation
// ============================================================================

export const BudgetAllocationSchema = z.never();

export type BudgetAllocation = z.infer<typeof BudgetAllocationSchema>;

// ============================================================================
// ChipsetConfig
// ============================================================================

export const ChipsetConfigSchema = z.never();

export type ChipsetConfig = z.infer<typeof ChipsetConfigSchema>;

// ============================================================================
// VisionDocument
// ============================================================================

export const VisionDocumentSchema = z.never();

export type VisionDocument = z.infer<typeof VisionDocumentSchema>;

// ============================================================================
// ResearchReference
// ============================================================================

export const ResearchReferenceSchema = z.never();

export type ResearchReference = z.infer<typeof ResearchReferenceSchema>;

// ============================================================================
// VTM_SCHEMAS convenience object
// ============================================================================

export const VTM_SCHEMAS = {
  ModelAssignment: ModelAssignmentSchema,
  TokenEstimate: TokenEstimateSchema,
  TokenBudgetConstraint: TokenBudgetConstraintSchema,
  VisionDocument: VisionDocumentSchema,
  ResearchReference: ResearchReferenceSchema,
  ChipsetConfig: ChipsetConfigSchema,
} as const;

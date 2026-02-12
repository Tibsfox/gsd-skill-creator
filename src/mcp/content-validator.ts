import type { SkillMetadata } from '../types/skill.js';

/**
 * Result of content safety validation.
 */
export interface ContentSafetyResult {
  /** true if no errors (warnings don't make it unsafe) */
  safe: boolean;
  /** Non-blocking concerns */
  warnings: string[];
  /** Blocking issues */
  errors: string[];
}

/**
 * Options for content safety validation.
 */
export interface ContentSafetyOptions {
  /** true for remote skills, false for local */
  strict: boolean;
}

/**
 * Validate content safety of a skill.
 *
 * Standard tier (local skills): checks metadata validity.
 * Strict tier (remote skills): adds body analysis for shell injection,
 * suspicious allowed-tools, and content size limits.
 *
 * @param body - The skill body content
 * @param metadata - Partial skill metadata
 * @param options - Validation options
 * @returns Content safety result
 */
export function validateContentSafety(
  _body: string,
  _metadata: Partial<SkillMetadata>,
  _options: ContentSafetyOptions,
): ContentSafetyResult {
  throw new Error('Not implemented');
}

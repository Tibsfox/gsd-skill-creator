/**
 * Generation-specific types for the skill composer pipeline.
 * Phase 406 Plan 01 -- types for KnowledgeGraph to SKILL.md transformation.
 */

/** Configuration for skill composition. */
export interface CompositionConfig {
  /** Maximum word count for generated SKILL.md (default 5000). */
  maxWords: number;
  /** Whether to include fenced code examples in output. */
  includeCodeExamples: boolean;
  /** Whether to include the pitfalls section. */
  includePitfalls: boolean;
}

/** A single section of the generated skill document. */
export interface SkillSection {
  /** Section heading text (e.g., "Quick Reference"). */
  heading: string;
  /** Full markdown content for this section. */
  content: string;
  /** Display order (lower = earlier). */
  order: number;
}

/** Result of skill composition from a KnowledgeGraph. */
export interface GeneratedSkill {
  /** Complete SKILL.md content as a markdown string. */
  skillMd: string;
  /** Word count of the generated markdown (excluding code blocks). */
  wordCount: number;
  /** Individual sections comprising the skill document. */
  sections: SkillSection[];
  /** Warnings generated during composition (e.g., word count approaching limit). */
  warnings: string[];
}

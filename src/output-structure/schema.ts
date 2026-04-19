/**
 * ME-5 Output-Structure Declaration — Canonical schema types.
 *
 * Extends skill frontmatter with an `output_structure:` block that declares
 * the expected output shape.  This is the enabling infrastructure consumed by
 * ME-1's tractability classifier: the schema change is separable from the
 * semantic interpretation so future re-interpretations only require ME-5 to be
 * in place, not the classifier to be rewritten.
 *
 * Union is discriminated on `kind`:
 *   - `json-schema`        → structured JSON output; `schema` field holds the
 *                            inline shape description.
 *   - `markdown-template`  → structured markdown with a named template.
 *   - `prose`              → free-form natural language.
 *
 * @module output-structure/schema
 */

// ---------------------------------------------------------------------------
// Discriminated union for the three output-structure kinds
// ---------------------------------------------------------------------------

/** Skill emits a structured JSON response; `schema` describes its shape. */
export interface JsonSchemaOutputStructure {
  kind: 'json-schema';
  /**
   * Inline JSON-schema description or a URI reference.
   * Must be non-empty when present (validator enforces this).
   */
  schema: string;
}

/** Skill emits markdown following a named template. */
export interface MarkdownTemplateOutputStructure {
  kind: 'markdown-template';
  /**
   * The markdown template text or a template identifier.
   * Must be non-empty when present (validator enforces this).
   */
  template: string;
}

/** Skill emits free-form prose; optimization is coin-flip per Zhang 2026. */
export interface ProseOutputStructure {
  kind: 'prose';
}

/**
 * Discriminated union — the `output_structure` frontmatter value.
 *
 * Use `kind` to narrow to the concrete interface before accessing
 * kind-specific fields.
 */
export type OutputStructure =
  | JsonSchemaOutputStructure
  | MarkdownTemplateOutputStructure
  | ProseOutputStructure;

/** The three `kind` values as a const tuple for exhaustiveness checks. */
export const OUTPUT_STRUCTURE_KINDS = ['json-schema', 'markdown-template', 'prose'] as const;
export type OutputStructureKind = (typeof OUTPUT_STRUCTURE_KINDS)[number];

// ---------------------------------------------------------------------------
// Tractability classification (ME-1 prerequisite)
// ---------------------------------------------------------------------------

/**
 * Tractability class derived from the `output_structure` declaration.
 *
 * - `tractable`  → structured output; prompt-content edits have reliable
 *                  statistical effects (Zhang 2026 §4.3 "can but doesn't").
 * - `coin-flip`  → prose output; optimization is statistically indistinguishable
 *                  from a coin flip (Zhang 2026 §4.2).
 * - `unknown`    → no `output_structure` declared; treated conservatively as
 *                  coin-flip by downstream methods (ME-1 CF-ME5-04).
 */
export type TractabilityClass = 'tractable' | 'coin-flip' | 'unknown';

/**
 * Classify a resolved `OutputStructure` into a tractability class.
 *
 * Rules (per Thread E §6 ME-1):
 *   - `json-schema`       → tractable (has a declared schema → exploitable structure)
 *   - `markdown-template` → tractable (has a declared template → exploitable structure)
 *   - `prose`             → coin-flip
 *   - undefined / null    → unknown (default = prose per CF-ME5-04)
 */
export function classifyTractability(
  structure: OutputStructure | undefined | null,
): TractabilityClass {
  if (structure == null) return 'unknown';
  switch (structure.kind) {
    case 'json-schema':
      return 'tractable';
    case 'markdown-template':
      return 'tractable';
    case 'prose':
      return 'coin-flip';
    default: {
      // exhaustiveness guard — TypeScript narrows this to `never` if the union
      // is fully covered; if a new kind is added without updating this switch
      // the runtime guard ensures correct fallback.
      const _exhaustive: never = structure;
      void _exhaustive;
      return 'unknown';
    }
  }
}

/**
 * Human-readable label for each tractability class.
 */
export const TRACTABILITY_LABELS: Record<TractabilityClass, string> = {
  tractable: 'tractable (structured output — optimization has reliable effect)',
  'coin-flip': 'coin-flip (prose output — optimization effect is statistically unreliable)',
  unknown: 'unknown (no output_structure declared — treated as coin-flip conservatively)',
};

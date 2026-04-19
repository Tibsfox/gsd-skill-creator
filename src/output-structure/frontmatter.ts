/**
 * ME-5 Output-Structure Declaration — Frontmatter extension.
 *
 * Mirrors the pattern established by `src/sensoria/frontmatter.ts`:
 *   - Declares the DEFAULT (prose) for skills without an explicit block.
 *   - Exposes `resolveOutputStructure()` that accepts a raw frontmatter value
 *     and returns a typed, validated `ResolvedOutputStructure`.
 *   - Exposes `serializeOutputStructure()` for round-trip write-back.
 *
 * Skills that do not declare `output_structure:` receive the conservative
 * default of `{kind: 'prose'}`, matching CF-ME5-04 (existing skills without
 * the field default to prose on apply).
 *
 * **Feature-flag compatibility (SC-ME5-01):** When the
 * `cartridge.output_structure` feature flag is `false`, call sites should skip
 * invoking this module entirely and treat the frontmatter as if the field were
 * absent.  The parser itself is always safe to import — it is the caller's
 * responsibility to honour the flag.
 *
 * @module output-structure/frontmatter
 */

import type { OutputStructure } from './schema.js';
import { validateOutputStructure } from './validator.js';

// ---------------------------------------------------------------------------
// Conservative default (CF-ME5-04)
// ---------------------------------------------------------------------------

/**
 * Default `output_structure` for skills that omit the field.
 *
 * `prose` is the conservative default: per Zhang 2026 §4.2, prose-output
 * skills are in the coin-flip regime, so downstream methods that consume
 * tractability (ME-1, MA-5, MB-1) err on the side of not-adapting.
 */
export const DEFAULT_OUTPUT_STRUCTURE: Readonly<OutputStructure> = Object.freeze({ kind: 'prose' });

// ---------------------------------------------------------------------------
// Resolution outcome type (mirrors SensoriaSource in sensoria/frontmatter.ts)
// ---------------------------------------------------------------------------

/**
 * Whether the `output_structure` came from explicit frontmatter, from the
 * conservative default, or from a partial/shorthand declaration.
 */
export type OutputStructureSource = 'explicit' | 'default' | 'shorthand';

export interface ResolvedOutputStructure {
  /** The validated, typed output structure. */
  structure: OutputStructure;
  /** How the value was determined. */
  source: OutputStructureSource;
  /** Non-fatal warnings; empty array on clean input. */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

/**
 * Resolve a raw frontmatter `output_structure` value into a validated
 * `OutputStructure`.  Missing or null values use `DEFAULT_OUTPUT_STRUCTURE`.
 * Invalid values produce warnings and fall back to the default (non-fatal
 * for one milestone after ME-5 lands per implementation constraint).
 *
 * @param raw - The raw YAML-parsed value from frontmatter (any type).
 * @returns `ResolvedOutputStructure` with the typed value, source, and any warnings.
 */
export function resolveOutputStructure(raw: unknown): ResolvedOutputStructure {
  // Absent or null → conservative default (CF-ME5-04)
  if (raw == null) {
    return {
      structure: { ...DEFAULT_OUTPUT_STRUCTURE } as OutputStructure,
      source: 'default',
      warnings: [],
    };
  }

  const result = validateOutputStructure(raw);

  if (!result.valid || !result.value) {
    // Fall back to default with validation errors surfaced as warnings
    // (non-fatal during first post-ME5 milestone; see implementation constraint)
    const fallbackWarnings = [
      ...result.warnings,
      ...result.errors.map((e) => `[fallback to prose] ${e}`),
    ];
    return {
      structure: { ...DEFAULT_OUTPUT_STRUCTURE } as OutputStructure,
      source: 'default',
      warnings: fallbackWarnings,
    };
  }

  // Detect shorthand (string input) vs explicit (object input)
  const source: OutputStructureSource =
    typeof raw === 'string' ? 'shorthand' : 'explicit';

  return {
    structure: result.value,
    source,
    warnings: result.warnings,
  };
}

// ---------------------------------------------------------------------------
// Serializer (for migration / write-back)
// ---------------------------------------------------------------------------

/**
 * Serialize an `OutputStructure` back to a plain-object frontmatter shape.
 *
 * When `compact` is true and the structure equals `DEFAULT_OUTPUT_STRUCTURE`,
 * returns `undefined` so callers can omit the field entirely (identical
 * round-trip behaviour to the source).
 */
export function serializeOutputStructure(
  structure: OutputStructure,
  compact: boolean = false,
): Record<string, string> | undefined {
  // In compact mode, omit the field if it equals the default (prose)
  if (compact && structure.kind === 'prose') {
    return undefined;
  }

  switch (structure.kind) {
    case 'prose':
      return { kind: 'prose' };
    case 'json-schema':
      return { kind: 'json-schema', schema: structure.schema };
    case 'markdown-template':
      return { kind: 'markdown-template', template: structure.template };
    default: {
      const _exhaustive: never = structure;
      void _exhaustive;
      return { kind: 'prose' };
    }
  }
}

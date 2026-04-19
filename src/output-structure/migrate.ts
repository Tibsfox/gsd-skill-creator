/**
 * ME-5 Output-Structure Declaration — Migration helper.
 *
 * For skills without an explicit `output_structure:` frontmatter field, this
 * module infers a default classification using keyword heuristics (Thread E
 * §6 ME-5 Phase 2) and can optionally write the field back to disk.
 *
 * Design:
 *   - `inferOutputStructure(body)` — heuristic classifier; returns a typed
 *     `OutputStructure` + confidence score.
 *   - `migrateSkill(content)` — dry-run helper; parses a SKILL.md content
 *     string, classifies if `output_structure` is absent, and returns the
 *     proposed patch without touching the file.
 *   - `applyMigration(content, patch)` — applies a patch, producing the new
 *     SKILL.md content string (idempotent — already-classified skills are
 *     returned unchanged).
 *
 * CF-ME5-01: Dry-run by default — callers must explicitly apply.
 * CF-ME5-04: Conservative default → prose when confidence < 0.8.
 * CF-ME5-05: Idempotent — re-running on already-migrated content is a no-op.
 *
 * Zero external runtime deps — heuristic is plain keyword matching.
 *
 * @module output-structure/migrate
 */

import type { OutputStructure } from './schema.js';

// ---------------------------------------------------------------------------
// Heuristic inference
// ---------------------------------------------------------------------------

/** Signals that suggest structured / template output. */
const STRUCTURED_SIGNALS: ReadonlyArray<{ token: string; weight: number }> = [
  { token: 'json', weight: 0.30 },
  { token: 'yaml', weight: 0.25 },
  { token: 'schema', weight: 0.25 },
  { token: 'template', weight: 0.20 },
  { token: 'structured', weight: 0.20 },
  { token: 'frontmatter', weight: 0.20 },
  { token: '```json', weight: 0.35 },
  { token: '```yaml', weight: 0.30 },
];

/** Signals that suggest prose output. */
const PROSE_SIGNALS: ReadonlyArray<{ token: string; weight: number }> = [
  { token: 'analyze', weight: 0.20 },
  { token: 'analyse', weight: 0.20 },
  { token: 'explain', weight: 0.20 },
  { token: 'review', weight: 0.15 },
  { token: 'comment', weight: 0.15 },
  { token: 'narrate', weight: 0.20 },
  { token: 'discuss', weight: 0.20 },
  { token: 'consider', weight: 0.15 },
  { token: 'describe', weight: 0.15 },
  { token: 'summarize', weight: 0.15 },
  { token: 'summarise', weight: 0.15 },
];

export interface InferenceResult {
  /** The recommended `output_structure` value. */
  structure: OutputStructure;
  /** Confidence in [0, 1]. Values < 0.8 are flagged for human review. */
  confidence: number;
  /** Whether confidence is below the 0.8 threshold. */
  flaggedForReview: boolean;
  /** Contributing positive signals. */
  structuredSignals: string[];
  /** Contributing prose signals. */
  proseSignals: string[];
}

/**
 * Infer an `output_structure` from the text content of a skill body.
 *
 * Returns an `InferenceResult` containing the recommendation and confidence.
 * The heuristic is intentionally simple — its purpose is to take the first
 * pass so humans only review ambiguous cases (per ME-5 proposal Phase 2).
 */
export function inferOutputStructure(body: string): InferenceResult {
  const lower = body.toLowerCase();

  let structuredScore = 0;
  const structuredSignals: string[] = [];
  for (const { token, weight } of STRUCTURED_SIGNALS) {
    if (lower.includes(token)) {
      structuredScore += weight;
      structuredSignals.push(token);
    }
  }

  let proseScore = 0;
  const proseSignals: string[] = [];
  for (const { token, weight } of PROSE_SIGNALS) {
    if (lower.includes(token)) {
      proseScore += weight;
      proseSignals.push(token);
    }
  }

  // Cap scores at 1.0
  structuredScore = Math.min(structuredScore, 1.0);
  proseScore = Math.min(proseScore, 1.0);

  const total = structuredScore + proseScore;
  if (total === 0) {
    // No signals — conservative default (prose) with low confidence
    return {
      structure: { kind: 'prose' },
      confidence: 0.5,
      flaggedForReview: true,
      structuredSignals: [],
      proseSignals: [],
    };
  }

  // Both sides have signals → hybrid region → prose with lower confidence
  const hasBothSides = structuredScore > 0 && proseScore > 0;

  if (structuredScore > proseScore && !hasBothSides) {
    const confidence = Math.min(structuredScore / (structuredScore + 0.2), 1.0);
    return {
      structure: { kind: 'json-schema', schema: '' },
      confidence,
      flaggedForReview: confidence < 0.8,
      structuredSignals,
      proseSignals,
    };
  }

  if (proseScore >= structuredScore || hasBothSides) {
    // If both sides present, confidence is lower
    const raw = proseScore / (proseScore + (hasBothSides ? structuredScore : 0.2));
    const confidence = Math.min(hasBothSides ? raw * 0.7 : raw, 1.0);
    return {
      structure: { kind: 'prose' },
      confidence,
      flaggedForReview: confidence < 0.8,
      structuredSignals,
      proseSignals,
    };
  }

  // Fallback
  return {
    structure: { kind: 'prose' },
    confidence: 0.5,
    flaggedForReview: true,
    structuredSignals,
    proseSignals,
  };
}

// ---------------------------------------------------------------------------
// Frontmatter patch types
// ---------------------------------------------------------------------------

export interface MigrationPatch {
  /** True if `output_structure` was already present — patch is a no-op. */
  alreadyClassified: boolean;
  /** The inferred structure to insert (undefined when alreadyClassified). */
  inferred?: OutputStructure;
  /** The inference result (undefined when alreadyClassified). */
  inference?: InferenceResult;
}

// ---------------------------------------------------------------------------
// Lightweight YAML frontmatter detection helpers
// ---------------------------------------------------------------------------

/** Returns true if the content has a YAML frontmatter block (starts with `---`). */
function hasFrontmatterBlock(content: string): boolean {
  return content.trimStart().startsWith('---');
}

/**
 * Extract the raw YAML lines between the opening and closing `---` delimiters.
 * Returns null if no valid frontmatter is found.
 */
function extractFrontmatterYaml(content: string): { yaml: string; rest: string } | null {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith('---')) return null;

  const afterOpen = trimmed.slice(3);
  // Find the closing ---
  const closeIdx = afterOpen.search(/^\s*---\s*$/m);
  if (closeIdx === -1) return null;

  const yaml = afterOpen.slice(0, closeIdx);
  const rest = afterOpen.slice(closeIdx);
  return { yaml, rest };
}

/**
 * Check whether the YAML block already contains an `output_structure:` key.
 */
function hasOutputStructureKey(yaml: string): boolean {
  return /^\s*output_structure\s*:/m.test(yaml);
}

// ---------------------------------------------------------------------------
// Migrate a single skill content string (dry-run)
// ---------------------------------------------------------------------------

/**
 * Inspect a SKILL.md content string and produce a migration patch.
 *
 * Does NOT modify any file — the caller decides whether to apply.
 * This satisfies CF-ME5-01 (dry-run by default).
 */
export function migrateSkill(content: string): MigrationPatch {
  if (!hasFrontmatterBlock(content)) {
    // No frontmatter — skill body is the whole content; infer from it
    const inference = inferOutputStructure(content);
    return { alreadyClassified: false, inferred: inference.structure, inference };
  }

  const extracted = extractFrontmatterYaml(content);
  if (!extracted) {
    // Malformed frontmatter — infer from full content conservatively
    const inference = inferOutputStructure(content);
    return { alreadyClassified: false, inferred: inference.structure, inference };
  }

  if (hasOutputStructureKey(extracted.yaml)) {
    // Already classified — idempotent no-op (CF-ME5-05)
    return { alreadyClassified: true };
  }

  // Infer from the body (content after frontmatter)
  const bodyText = extracted.rest.replace(/^---\s*\n?/, '');
  const inference = inferOutputStructure(bodyText + '\n' + extracted.yaml);
  return { alreadyClassified: false, inferred: inference.structure, inference };
}

// ---------------------------------------------------------------------------
// Apply a migration patch to a content string
// ---------------------------------------------------------------------------

/**
 * Serialize `structure` into YAML frontmatter lines (without surrounding ---).
 */
function serializeToYamlLines(structure: OutputStructure): string {
  switch (structure.kind) {
    case 'prose':
      return 'output_structure:\n  kind: prose\n';
    case 'json-schema':
      return structure.schema
        ? `output_structure:\n  kind: json-schema\n  schema: "${structure.schema.replace(/"/g, '\\"')}"\n`
        : 'output_structure:\n  kind: json-schema\n';
    case 'markdown-template':
      return structure.template
        ? `output_structure:\n  kind: markdown-template\n  template: "${structure.template.replace(/"/g, '\\"')}"\n`
        : 'output_structure:\n  kind: markdown-template\n';
    default: {
      const _exhaustive: never = structure;
      void _exhaustive;
      return 'output_structure:\n  kind: prose\n';
    }
  }
}

/**
 * Apply a migration patch to a content string.
 *
 * - If `patch.alreadyClassified` is true, returns `content` unchanged (CF-ME5-05).
 * - Otherwise inserts the inferred `output_structure` block into the frontmatter.
 * - If there is no frontmatter block, prepends a minimal one.
 * - Preserves all existing frontmatter fields (additive merge per implementation
 *   constraint).
 *
 * @returns New content string with the `output_structure` field added.
 */
export function applyMigration(content: string, patch: MigrationPatch): string {
  if (patch.alreadyClassified || !patch.inferred) {
    return content;
  }

  const yamlLines = serializeToYamlLines(patch.inferred);

  if (!hasFrontmatterBlock(content)) {
    // Prepend a minimal frontmatter block
    return `---\n${yamlLines}---\n\n${content}`;
  }

  const extracted = extractFrontmatterYaml(content.trimStart());
  if (!extracted) {
    // Malformed block — prepend new frontmatter
    return `---\n${yamlLines}---\n\n${content}`;
  }

  // Insert the new key at the end of the existing YAML block (additive merge)
  const newYaml = extracted.yaml.replace(/\n?$/, '\n') + yamlLines;
  const trimmed = content.trimStart();
  // Reconstruct: opening --- + new yaml + rest (which starts with closing ---)
  return `---\n${newYaml}${extracted.rest}`;
}

// ---------------------------------------------------------------------------
// Batch scan result (used by CLI)
// ---------------------------------------------------------------------------

export interface ScanEntry {
  /** Skill file path relative to scan root. */
  path: string;
  patch: MigrationPatch;
}

export interface ScanReport {
  total: number;
  alreadyClassified: number;
  /** High-confidence (≥ 0.8) auto-classified. */
  autoClassified: number;
  /** Low-confidence (< 0.8) flagged for review. */
  flaggedForReview: number;
  entries: ScanEntry[];
}

/**
 * Build a scan report from a list of `ScanEntry` objects.  The CLI assembles
 * the entries by walking the skill directories; this function aggregates them
 * for display.
 */
export function buildScanReport(entries: ScanEntry[]): ScanReport {
  let alreadyClassified = 0;
  let autoClassified = 0;
  let flaggedForReview = 0;

  for (const entry of entries) {
    if (entry.patch.alreadyClassified) {
      alreadyClassified++;
    } else if (entry.patch.inference?.flaggedForReview) {
      flaggedForReview++;
    } else {
      autoClassified++;
    }
  }

  return {
    total: entries.length,
    alreadyClassified,
    autoClassified,
    flaggedForReview,
    entries,
  };
}

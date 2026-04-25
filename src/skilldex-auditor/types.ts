/**
 * Skilldex Auditor — type definitions.
 *
 * ZFC compliance auditor for SKILL.md spec-conformance scoring per Skilldex
 * (arXiv:2604.16911 / Saha & Hemanth, ACL Findings 2026) + Structural
 * Verification for EDA (arXiv:2604.18834 / Jayasuriya et al.) methodology
 * fusion. Phase 765, CAPCOM hard preservation Gate G10.
 *
 * All types are pure data. No I/O, no CAPCOM interaction, no skill-DAG
 * construction. The auditor is a leaf observer.
 *
 * @module skilldex-auditor/types
 */

/**
 * Severity of a single audit finding.
 *
 * - `pass`: the predicate held; this is a positive observation.
 * - `warn`: an optional or recommended field is missing; non-fatal.
 * - `fail`: a required field, section, or structural invariant is violated.
 */
export type AuditSeverity = 'pass' | 'warn' | 'fail';

/**
 * A single structured audit finding emitted by the conformance scorer.
 *
 * Findings are addressable by `(skillPath, ruleId)` and carry a human-readable
 * message plus optional structural detail. The shape is JSON-serialisable so
 * the session-observatory can ingest the report unchanged.
 */
export interface AuditFinding {
  /** Absolute or workspace-relative path to the SKILL.md being audited. */
  readonly skillPath: string;
  /** Stable rule identifier, e.g. `frontmatter.name.required`. */
  readonly ruleId: string;
  /** Outcome severity. */
  readonly severity: AuditSeverity;
  /** Short human-readable message. */
  readonly message: string;
  /** Optional extra structural detail (lineno, expected, actual). */
  readonly detail?: Record<string, unknown>;
}

/**
 * Aggregate report produced by `auditSkill` / `auditAll`.
 *
 * `disabled === true` means the auditor was invoked with the opt-in flag off;
 * in that mode `findings` is empty and no skill files were read.
 */
export interface AuditReport {
  /** Wall-clock ISO-8601 timestamp at scorer entry. */
  readonly timestamp: string;
  /** Number of skill files inspected (always 0 when `disabled === true`). */
  readonly inspected: number;
  /** All findings across all inspected skills. */
  readonly findings: ReadonlyArray<AuditFinding>;
  /**
   * True iff the opt-in flag was off at the time of invocation. When true the
   * report is byte-identical to the phase-764 tip baseline (no reads, no
   * writes, no findings).
   */
  readonly disabled: boolean;
  /**
   * Aggregate counts by severity. All zero when `disabled === true`.
   */
  readonly summary: {
    readonly pass: number;
    readonly warn: number;
    readonly fail: number;
  };
}

/**
 * A parsed SKILL.md spec view consumed by the conformance scorer.
 *
 * This is a structural projection of a SKILL.md: frontmatter as a flat
 * key→value map plus the list of top-level section headings (lines beginning
 * with `## ` or `# ` after the closing `---`). It is intentionally
 * shallower than a full Markdown AST — the scorer only needs structural
 * presence/absence, not nested content.
 */
export interface SkillSpec {
  /** Path to the SKILL.md. */
  readonly path: string;
  /** True iff a YAML frontmatter block was present and parsed. */
  readonly hasFrontmatter: boolean;
  /** Parsed frontmatter as a flat key → string map (raw, untyped). */
  readonly frontmatter: Readonly<Record<string, string>>;
  /** Headings collected from the body (`#`, `##`, `###` only). */
  readonly headings: ReadonlyArray<string>;
  /** Total byte length of the file. */
  readonly bodyBytes: number;
  /** Parse error string if frontmatter was malformed; undefined on success. */
  readonly parseError?: string;
}

/**
 * Lightweight Skilldex-style read-only registry entry for a single skill.
 */
export interface RegistryEntry {
  readonly name: string;
  readonly skillPath: string;
  readonly description: string;
  readonly version?: string;
}

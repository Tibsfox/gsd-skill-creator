/**
 * SCRIBE error taxonomy.
 *
 * One base class + named subclasses for the failure modes Components 01-09
 * surface. Distinct subclasses make catch-arms readable and let the substrate-
 * conformance tests assert specific failure-mode names.
 *
 * @module scribe/types/errors
 */

/**
 * Base for all SCRIBE-typed errors. Subclass and pass a stable `code` for
 * machine-readable failure mode identification.
 */
export class ScribeError extends Error {
  /** Stable machine-readable code (e.g., 'NAMESPACE_INVARIANT_FAILED'). */
  readonly code: string;
  /** OPTIONAL. Structured details (line/col, invariant name, etc.). */
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ScribeError';
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
    // Restore prototype chain after `super(message)` in transpiled output
    // (TS targets ES2017+; this is the standard idiom for subclassing Error).
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when an SVG carrying SCRIBE metadata violates one of the 5 T1 family
 * invariants (Component 04 namespace-conformance validator).
 */
export class NamespaceConformanceError extends ScribeError {
  /** Which of the 5 invariants failed. */
  readonly invariant:
    | 'generic-identification'
    | 'attribute-bearing'
    | 'hierarchical-nesting'
    | 'document-type-validation'
    | 'roundtrippable-serialisation';

  constructor(
    message: string,
    invariant: NamespaceConformanceError['invariant'],
    details?: Record<string, unknown>,
  ) {
    super(message, 'NAMESPACE_CONFORMANCE_FAILED', details);
    this.name = 'NamespaceConformanceError';
    this.invariant = invariant;
    Object.setPrototypeOf(this, NamespaceConformanceError.prototype);
  }
}

/**
 * Thrown by Component 01 when cartridge composition fails (cycle, missing
 * member, manifest-validation drift).
 */
export class CartridgeCompositionError extends ScribeError {
  readonly reason:
    | 'cycle-detected'
    | 'missing-member'
    | 'manifest-invalid'
    | 'duplicate-name'
    | 'role-mismatch';

  constructor(
    message: string,
    reason: CartridgeCompositionError['reason'],
    details?: Record<string, unknown>,
  ) {
    super(message, 'CARTRIDGE_COMPOSITION_FAILED', details);
    this.name = 'CartridgeCompositionError';
    this.reason = reason;
    Object.setPrototypeOf(this, CartridgeCompositionError.prototype);
  }
}

/**
 * Thrown by Component 01 citation merger on dedup-key conflict (same primary
 * key, different metadata) or by Component 09 substrate-conformance test on
 * schema-version drift.
 */
export class CitationIndexError extends ScribeError {
  readonly reason:
    | 'dedup-conflict'
    | 'schema-version-mismatch'
    | 'missing-primary-key'
    | 'malformed-entry';

  constructor(
    message: string,
    reason: CitationIndexError['reason'],
    details?: Record<string, unknown>,
  ) {
    super(message, 'CITATION_INDEX_FAILED', details);
    this.name = 'CitationIndexError';
    this.reason = reason;
    Object.setPrototypeOf(this, CitationIndexError.prototype);
  }
}

/**
 * Thrown by Component 02 PG runtime when an env-loading or query failure occurs.
 */
export class PgRuntimeError extends ScribeError {
  readonly reason:
    | 'pg-not-configured'
    | 'connection-failed'
    | 'query-failed'
    | 'migration-failed';

  constructor(
    message: string,
    reason: PgRuntimeError['reason'],
    details?: Record<string, unknown>,
  ) {
    super(message, 'PG_RUNTIME_FAILED', details);
    this.name = 'PgRuntimeError';
    this.reason = reason;
    Object.setPrototypeOf(this, PgRuntimeError.prototype);
  }
}

/**
 * Thrown by Component 03 SVGO/a11y validator on a11y violations.
 */
export class SvgValidationError extends ScribeError {
  readonly tier: 'BLOCKER' | 'recommended' | 'scribe-class';

  constructor(
    message: string,
    tier: SvgValidationError['tier'],
    details?: Record<string, unknown>,
  ) {
    super(message, 'SVG_VALIDATION_FAILED', details);
    this.name = 'SvgValidationError';
    this.tier = tier;
    Object.setPrototypeOf(this, SvgValidationError.prototype);
  }
}

/**
 * Thrown by Component 06 Yosys netlist renderer when the subprocess fails
 * (Yosys not installed, Verilog parse error, netlistsvg failure).
 */
export class NetlistRenderError extends ScribeError {
  readonly stage: 'yosys' | 'netlistsvg' | 'post-process';

  constructor(
    message: string,
    stage: NetlistRenderError['stage'],
    details?: Record<string, unknown>,
  ) {
    super(message, 'NETLIST_RENDER_FAILED', details);
    this.name = 'NetlistRenderError';
    this.stage = stage;
    Object.setPrototypeOf(this, NetlistRenderError.prototype);
  }
}

/**
 * Type guard for narrowing unknown errors to ScribeError.
 */
export function isScribeError(err: unknown): err is ScribeError {
  return err instanceof ScribeError;
}

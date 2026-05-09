/**
 * SCRIBE shared SVG validator — public API.
 *
 * Provides a unified SVGO config builder and a11y + round-trip validator
 * consumed by T2 (svg-substrate) and T3 (code-svg-hdl-bridge) cartridges,
 * and by Component 06 (Yosys netlist renderer post-process).
 *
 * Component 06 (Wave 2) should call:
 *   import { validateSvg, createSvgoConfig } from 'src/scribe/svg-validator/index.js';
 *   const config = createSvgoConfig({ preserveRoundTrip: true });
 *   const result = validateSvg(svgString, { roundTrip: true });
 *
 * @module scribe/svg-validator
 */

export {
  // a11y BLOCKER checker
  checkSvgString,
  VALID_ROLES,
  type CheckResult,
  type CheckMessage,
  type MessageSeverity,
} from './a11y-check.js';

export {
  // SVGO config builder
  createSvgoConfig,
  type SvgoConfig,
  type SvgoConfigOptions,
  type SvgoPlugin,
} from './svgo-config.js';

export {
  // Round-trip extension
  validateScribeSvg,
  validateRoundTripPayload,
  type ReportLine,
  type RoundTripValidationOptions,
} from './round-trip-extension.js';

export {
  // Checklist spec (typed const)
  CHECKLIST_ITEMS,
  BLOCKER_ITEMS,
  RECOMMENDED_ITEMS,
  SCRIBE_CLASS_ITEMS,
  type ChecklistItem,
  type ChecklistTier,
} from './checklist-spec.js';

// ---------------------------------------------------------------------------
// Unified validate entry point
// ---------------------------------------------------------------------------

import { checkSvgString } from './a11y-check.js';
import type { CheckResult } from './a11y-check.js';

/** Options for the unified validateSvg() entry point. */
export interface ValidationOptions {
  /**
   * When true, run T3-style round-trip checks (namespace, <scribe:graph>, etc.)
   * in ADDITION to the BLOCKER a11y checks.
   *
   * Note: round-trip checks require DOMParser. Inject via `domParserCtor` in
   * non-browser environments.
   */
  readonly roundTrip?: boolean;

  /**
   * DOMParser-compatible constructor. Required when `roundTrip: true` in Node.js.
   * In browser environments this defaults to globalThis.DOMParser.
   */
  readonly domParserCtor?: { new (): Pick<DOMParser, 'parseFromString'> };
}

/** Result of the unified validateSvg() call. */
export interface ValidationResult {
  /**
   * True only when all BLOCKER-tier a11y checks pass.
   * Round-trip WARN items do NOT affect this field.
   */
  readonly ok: boolean;
  /** The BLOCKER-tier a11y result. */
  readonly a11y: CheckResult;
  /** Round-trip report lines (empty when opts.roundTrip is false/omitted). */
  readonly roundTripReport: ReadonlyArray<string>;
}

/**
 * Run the full SCRIBE SVG validator.
 *
 * @param svg  - Raw SVG string.
 * @param opts - Validation options.
 * @returns ValidationResult with ok, a11y, and roundTripReport.
 */
export async function validateSvg(
  svg: string,
  opts: ValidationOptions = {},
): Promise<ValidationResult> {
  const a11y = checkSvgString(svg);

  let roundTripReport: string[] = [];
  if (opts.roundTrip) {
    const { validateScribeSvg } = await import('./round-trip-extension.js');
    roundTripReport = validateScribeSvg(svg, {
      DOMParserCtor: opts.domParserCtor,
    });
  }

  return {
    ok: a11y.ok,
    a11y,
    roundTripReport,
  };
}

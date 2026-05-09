/**
 * SCRIBE round-trip validator (TypeScript) — T3 cartridge thin wrapper.
 *
 * Canonical source: src/scribe/svg-validator/round-trip-extension.ts
 *   validateScribeSvg(svgText, opts)
 *
 * This file delegates to the shared validator module. The browser-resident
 * version is at ../viewer/viewer.js as validateScribeSvg().
 *
 * Returns a list of report lines, each prefixed with OK / WARN / FAIL.
 * Any FAIL means the SVG cannot round-trip; WARN means the round-trip
 * will degrade to a lower fidelity (structural fallback per Doc 02 §6).
 *
 * Component 03 sync'd-copy approach:
 *   Canonical source: src/scribe/svg-validator/round-trip-extension.ts
 *   This file: thin delegate to the shared module.
 *   Cartridge stand-alone use: copy the shared source and adjust import.
 *
 * Mission: SCRIBE (v1.49.621), Track T3 CODE-SVG-HDL-BRIDGE.
 * License: Apache-2.0.
 */

export type { ReportLine, RoundTripValidationOptions } from '../../../../src/scribe/svg-validator/round-trip-extension.js';
export {
  validateScribeSvg,
  validateRoundTripPayload,
} from '../../../../src/scribe/svg-validator/round-trip-extension.js';

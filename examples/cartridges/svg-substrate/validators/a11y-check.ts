/**
 * SCRIBE SVG accessibility checker — T2 cartridge re-export.
 *
 * Canonical source: src/scribe/svg-validator/a11y-check.ts
 *
 * This file re-exports the shared SCRIBE a11y validator. The cartridge
 * stand-alone interface is preserved: the CLI entry point (runCli) is
 * re-exported so that validate.sh can invoke this via:
 *
 *   npx tsx validators/a11y-check.ts path/to/file.svg
 *
 * Component 03 sync'd-copy approach:
 *   - Canonical source: src/scribe/svg-validator/a11y-check.ts
 *   - This file: thin re-export for cartridge stand-alone CLI compatibility
 *   - Cartridge stand-alone use (copied out of repo): copy the canonical
 *     source module alongside this file and change the import path below.
 *
 * Mission: SCRIBE (v1.49.621), Component 03.
 * License: Apache-2.0.
 */

// Re-export all public API from the shared module.
export {
  checkSvgString,
  VALID_ROLES,
  runCli,
  type CheckResult,
  type CheckMessage,
  type MessageSeverity,
} from '../../../../src/scribe/svg-validator/a11y-check.js';

// Run CLI when invoked directly (preserves validate.sh interface).
// The guard is identical to the canonical source entry point.
import { runCli } from '../../../../src/scribe/svg-validator/a11y-check.js';

if (
  typeof process !== 'undefined' &&
  typeof import.meta !== 'undefined' &&
  import.meta.url === `file://${process.argv[1]}`
) {
  runCli();
}

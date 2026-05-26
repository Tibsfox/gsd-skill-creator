import { isCliEntrypoint } from '../../cli/entrypoint-guard.js';

/**
 * SCRIBE SVG accessibility checker — shared module.
 *
 * Lifted from examples/cartridges/svg-substrate/validators/a11y-check.ts
 * and refactored for reuse across T2 and T3 cartridges.
 *
 * Checks the BLOCKER tier of the a11y checklist (checklist-spec.ts items 1-5):
 *
 *   1. Root <svg> has a role attribute (img | graphics-document | graphics-object
 *      | presentation | none).
 *   2. Root <svg> has aria-labelledby (or aria-label).
 *   3. First child is <title id="..."> with non-empty text.
 *   4. Second child is <desc id="..."> with non-empty text
 *      (acceptable if aria-label is set).
 *   5. No raster <image> elements pointing to PNG/JPEG/GIF/WebP.
 *
 * @module scribe/svg-validator/a11y-check
 *
 * Implementation note: uses a small regex-based structural parser sufficient
 * for the BLOCKER checks. For deeper XML validation, layer xmllint on top.
 * This module is intentionally dependency-free so it works in any JS runtime.
 */

/** Severity of a checklist message. */
export type MessageSeverity = 'OK' | 'FAIL' | 'WARN';

/** A single check result message. */
export interface CheckMessage {
  readonly severity: MessageSeverity;
  /** 1-based item id from the checklist (0 = structural/pre-check). */
  readonly item: number;
  readonly text: string;
}

/** The result of running checkSvgString(). */
export interface CheckResult {
  /** True only if NO BLOCKER-tier failures were found. */
  readonly ok: boolean;
  /** Human-readable messages (one per check). */
  readonly messages: string[];
  /** Structured messages (for programmatic use). */
  readonly structured: ReadonlyArray<CheckMessage>;
}

/** Valid role attribute values per the SCRIBE a11y checklist §item 1. */
export const VALID_ROLES = new Set<string>([
  'img',
  'graphics-document',
  'graphics-object',
  'presentation',
  'none',
]);

/** Raster extension pattern per checklist §item 5. */
const RASTER_EXT = /\.(png|jpe?g|gif|webp|bmp|tiff)(\?|$)/i;

/**
 * Validate an SVG source string against the BLOCKER tier of the SCRIBE a11y
 * checklist (items 1-5).
 *
 * @param src - Raw SVG text (including any XML declaration / DOCTYPE).
 * @returns CheckResult with ok, messages[], and structured[].
 */
export function checkSvgString(src: string): CheckResult {
  const messages: string[] = [];
  const structured: CheckMessage[] = [];
  let ok = true;

  function push(severity: MessageSeverity, item: number, text: string): void {
    messages.push(text);
    structured.push({ severity, item, text });
    if (severity === 'FAIL') ok = false;
  }

  // Strip XML declaration and DOCTYPE.
  const body = src
    .replace(/^<\?xml[^>]*\?>\s*/i, '')
    .replace(/<!DOCTYPE[^>]*>\s*/i, '');

  // Find the root <svg> open tag.
  const svgOpen = body.match(/<svg\b([^>]*)>/i);
  if (!svgOpen) {
    push('FAIL', 0, 'FAIL: no <svg> root element found');
    return { ok: false, messages, structured };
  }

  const svgAttrs = svgOpen[1];

  // -----------------------------------------------------------------------
  // Check 1: role attribute.
  // -----------------------------------------------------------------------
  const roleMatch = svgAttrs.match(/\brole\s*=\s*["']([^"']+)["']/i);
  if (!roleMatch) {
    push('FAIL', 1, 'FAIL (item 1): root <svg> has no role attribute');
  } else if (!VALID_ROLES.has(roleMatch[1])) {
    push(
      'FAIL',
      1,
      `FAIL (item 1): root <svg> role="${roleMatch[1]}" is not a recognised SCRIBE role`,
    );
  } else {
    push('OK', 1, `OK (item 1): role="${roleMatch[1]}"`);
  }

  // -----------------------------------------------------------------------
  // Check 2: aria-labelledby OR aria-label.
  // -----------------------------------------------------------------------
  const labelledBy = svgAttrs.match(/\baria-labelledby\s*=\s*["']([^"']+)["']/i);
  const ariaLabel = svgAttrs.match(/\baria-label\s*=\s*["']([^"']+)["']/i);
  if (!labelledBy && !ariaLabel) {
    push(
      'FAIL',
      2,
      'FAIL (item 2): root <svg> has neither aria-labelledby nor aria-label',
    );
  } else {
    push(
      'OK',
      2,
      `OK (item 2): ${labelledBy ? 'aria-labelledby' : 'aria-label'} present`,
    );
  }

  // -----------------------------------------------------------------------
  // Check 3 & 4: first child <title>, second child <desc>.
  // -----------------------------------------------------------------------
  const afterRoot = body.slice(svgOpen.index! + svgOpen[0].length);
  const firstElement = afterRoot.match(/^\s*<(\w+)\b([^>]*)>([^<]*)<\/\1>/i);

  if (!firstElement || firstElement[1].toLowerCase() !== 'title') {
    push('FAIL', 3, 'FAIL (item 3): first child is not <title>');
  } else if (firstElement[3].trim().length === 0) {
    push('FAIL', 3, 'FAIL (item 3): <title> is empty');
  } else {
    push(
      'OK',
      3,
      `OK (item 3): <title>${firstElement[3].trim().slice(0, 60)}…</title>`,
    );
  }

  if (firstElement) {
    const afterTitle = afterRoot.slice(
      firstElement.index! + firstElement[0].length,
    );
    const secondElement = afterTitle.match(/^\s*<(\w+)\b([^>]*)>([^<]*)<\/\1>/i);

    if (!secondElement || secondElement[1].toLowerCase() !== 'desc') {
      // If aria-label is set, WARN; otherwise FAIL.
      if (ariaLabel) {
        push(
          'WARN',
          4,
          'WARN (item 4): second child is not <desc> (acceptable — aria-label is set)',
        );
      } else {
        push(
          'FAIL',
          4,
          'FAIL (item 4): second child is not <desc> (and no aria-label fallback)',
        );
      }
    } else if (secondElement[3].trim().length === 0) {
      push('FAIL', 4, 'FAIL (item 4): <desc> is empty');
    } else {
      push(
        'OK',
        4,
        `OK (item 4): <desc>${secondElement[3].trim().slice(0, 60)}…</desc>`,
      );
    }
  }

  // -----------------------------------------------------------------------
  // Check 5: no raster <image>.
  // -----------------------------------------------------------------------
  const imageRegex = /<image\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi;
  let rasterFound = false;
  let m: RegExpExecArray | null;
  while ((m = imageRegex.exec(body)) !== null) {
    if (RASTER_EXT.test(m[1])) {
      push(
        'FAIL',
        5,
        `FAIL (item 5): raster <image href="${m[1]}"> found — SCRIBE requires pure vector`,
      );
      rasterFound = true;
    }
  }
  if (!rasterFound) {
    push('OK', 5, 'OK (item 5): no raster <image> fallback');
  }

  return { ok, messages, structured };
}

/**
 * CLI entry point — run when this module is invoked directly via tsx.
 *
 * Usage: tsx a11y-check.ts path/to/file.svg
 * Exits 0 on pass; 1 on any BLOCKER check failure; 2 on usage error.
 *
 * Backward-compatible with T2 cartridge validate.sh invocation.
 */
export function runCli(): void {
  // Lazy import Node.js built-ins so this module can be imported in non-Node
  // environments without side effects.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { readFileSync } = require('node:fs') as typeof import('node:fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { argv, exit } = require('node:process') as typeof import('node:process');

  const file = argv[2];
  if (!file) {
    process.stderr.write('Usage: tsx a11y-check.ts <svg-file>\n');
    exit(2);
  }
  const src = readFileSync(file, 'utf8');
  const result = checkSvgString(src);
  for (const msg of result.messages) {
    process.stdout.write(`    ${msg}\n`);
  }
  exit(result.ok ? 0 : 1);
}

// Run CLI only when invoked directly (not when imported as a module).
if (isCliEntrypoint(import.meta.url)) {
  runCli();
}

/**
 * SCRIBE Yosys netlist renderer — SVG post-processor.
 *
 * Takes the raw SVG string emitted by netlistsvg (which has no a11y metadata,
 * no SCRIBE namespace, and no structural provenance) and enriches it with:
 *
 *   1. SCRIBE namespace declaration on `<svg>` root
 *      (`xmlns:scribe="https://tibsfox.com/Research/SCRIBE/ns#"`)
 *   2. `<title id="scribe-title">` and `<desc id="scribe-desc">` immediately
 *      after the opening `<svg>` tag
 *   3. `role="graphics-document"` and `aria-labelledby="scribe-title scribe-desc"`
 *      on the `<svg>` root
 *   4. A `<metadata>` block containing a `<scribe:graph>` element with
 *      structural lineage: kind=netlist, language=verilog, source SHA
 *   5. SVGO normalisation using `createSvgoConfig({ preserveRoundTrip: true })`
 *      (dynamic import of svgo — gracefully skipped if svgo is not installed)
 *   6. a11y validation via `validateSvg()` — throws `NetlistRenderError` on
 *      BLOCKER-tier failure
 *
 * This is the load-bearing part of C06 — the subprocess drivers only run
 * Yosys + netlistsvg; this module ensures the output is SCRIBE-conformant.
 *
 * @module scribe/netlist-renderer/post-process
 */

import { createHash } from 'node:crypto';

import {
  NAMESPACE_URI,
  NAMESPACE_PREFIX,
  NAMESPACE_VERSION,
  namespaceDeclaration,
} from '../types/metadata-namespace.js';
import { NetlistRenderError } from '../types/errors.js';
import { validateSvg } from '../svg-validator/index.js';
import { createSvgoConfig } from '../svg-validator/svgo-config.js';

/** Options for postProcessNetlistSvg(). */
export interface PostProcessOptions {
  /** Module name for title / metadata. */
  readonly moduleName?: string;
  /** Human-readable description line. Generated if omitted. */
  readonly description?: string;
  /** SHA digest of the original Verilog source (hex string). */
  readonly sourceSha?: string;
  /** Source path label (e.g. 'add.v'). */
  readonly sourcePath?: string;
  /**
   * DOMParser constructor. Required for round-trip validation in Node.js.
   * If omitted, round-trip checks are skipped (a11y BLOCKER checks still run).
   */
  readonly domParserCtor?: { new(): Pick<DOMParser, 'parseFromString'> };
}

/**
 * Post-process a raw netlistsvg SVG string to inject SCRIBE namespace
 * metadata and accessibility attributes.
 *
 * @param rawSvg - SVG string from netlistsvg (may or may not have namespace).
 * @param opts   - Post-process options.
 * @returns SCRIBE-conformant SVG string.
 * @throws {NetlistRenderError} with stage='post-process' on validation failure.
 */
export async function postProcessNetlistSvg(
  rawSvg: string,
  opts: PostProcessOptions = {},
): Promise<string> {
  const {
    moduleName = 'module',
    sourceSha,
    sourcePath,
    domParserCtor,
  } = opts;

  const description =
    opts.description ??
    `Yosys-elaborated netlist for module ${moduleName}`;

  // Step 1 + 2 + 3: Inject namespace, title, desc, role, aria-labelledby.
  let svg = injectA11yAndNamespace(rawSvg, moduleName, description);

  // Step 4: Inject <metadata> block with <scribe:graph>.
  svg = injectScribeMetadata(svg, moduleName, sourceSha, sourcePath);

  // Step 5: SVGO normalisation (dynamic — skip gracefully if not installed).
  svg = await applySvgoIfAvailable(svg);

  // Step 6: Validate via validateSvg().
  const result = await validateSvg(svg, {
    roundTrip: domParserCtor !== undefined,
    ...(domParserCtor !== undefined ? { domParserCtor } : {}),
  });

  if (!result.ok) {
    const blockers = result.a11y.structured
      .filter(m => m.severity === 'FAIL')
      .map(m => m.text)
      .join('; ');
    throw new NetlistRenderError(
      `Post-processed SVG failed a11y BLOCKER checks: ${blockers}`,
      'post-process',
      { a11yMessages: result.a11y.messages },
    );
  }

  // Round-trip WARN lines do not fail the result (per spec).
  return svg;
}

// ---------------------------------------------------------------------------
// Compute SHA-256 digest of a string (first 40 hex chars).
// ---------------------------------------------------------------------------

/**
 * Compute a SHA-256 hex digest of a UTF-8 string.
 * Returns the first 40 characters (enough to be collision-resistant for provenance).
 */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex').slice(0, 40);
}

// ---------------------------------------------------------------------------
// Step 1 + 2 + 3: namespace + a11y injection
// ---------------------------------------------------------------------------

/**
 * Inject the SCRIBE namespace declaration, `<title>`, `<desc>`, `role`, and
 * `aria-labelledby` into a raw netlistsvg SVG string.
 *
 * Strategy:
 *   - If `xmlns:scribe=...` is already present, leave it (idempotent).
 *   - Add `role="graphics-document"` and `aria-labelledby` to the `<svg>` root.
 *   - Insert `<title id="scribe-title">` and `<desc id="scribe-desc">` as
 *     the first two children of `<svg>`.
 *
 * @internal
 */
export function injectA11yAndNamespace(
  rawSvg: string,
  moduleName: string,
  description: string,
): string {
  // Locate the <svg ...> open tag (handles single-line and multi-line).
  const svgTagMatch = rawSvg.match(/<svg(\s[^>]*)?>|<svg>/i);
  if (!svgTagMatch || svgTagMatch.index === undefined) {
    throw new NetlistRenderError(
      'Cannot post-process: no <svg> root element found in netlistsvg output',
      'post-process',
      { input: rawSvg.slice(0, 200) },
    );
  }

  const svgTagStart = svgTagMatch.index;
  const svgTagEnd = svgTagStart + svgTagMatch[0].length;
  const existingAttrs = svgTagMatch[1] ?? '';

  // Build namespace declaration attr if not already present.
  const [nsAttrName, nsAttrValue] = namespaceDeclaration();
  const nsAttr = existingAttrs.includes(nsAttrName)
    ? ''
    : ` ${nsAttrName}="${nsAttrValue}"`;

  // Add role if not already present.
  const hasRole = /\brole\s*=/i.test(existingAttrs);
  const roleAttr = hasRole ? '' : ' role="graphics-document"';

  // Add aria-labelledby if not already present.
  const hasAriaLabelledBy = /\baria-labelledby\s*=/i.test(existingAttrs);
  const ariaAttr = hasAriaLabelledBy
    ? ''
    : ' aria-labelledby="scribe-title scribe-desc"';

  // Reconstruct <svg> open tag with injected attributes.
  const newSvgTag = `<svg${existingAttrs}${nsAttr}${roleAttr}${ariaAttr}>`;

  // Build title + desc elements (XML-escape content).
  const titleText = xmlEsc(`${moduleName} netlist`);
  const descText = xmlEsc(description);
  const titleDesc =
    `  <title id="scribe-title">${titleText}</title>\n` +
    `  <desc id="scribe-desc">${descText}</desc>\n`;

  // Insert title+desc right after the <svg> opening tag.
  // We need to check if <title> already exists to be idempotent.
  const afterSvgTag = rawSvg.slice(svgTagEnd);
  const hasTitleAlready = afterSvgTag.trimStart().startsWith('<title');

  const before = rawSvg.slice(0, svgTagStart);
  const after = rawSvg.slice(svgTagEnd);

  if (hasTitleAlready) {
    // Already has title — just patch the <svg> tag attributes.
    return before + newSvgTag + after;
  }

  return before + newSvgTag + '\n' + titleDesc + after;
}

// ---------------------------------------------------------------------------
// Step 4: <metadata> with <scribe:graph> injection
// ---------------------------------------------------------------------------

/**
 * Inject a `<metadata><scribe:graph>...</scribe:graph></metadata>` block into
 * the SVG, right after any existing `<title>` and `<desc>` elements but
 * before the first drawing element.
 *
 * If a `<metadata>` block already exists, skip injection (idempotent).
 *
 * @internal
 */
export function injectScribeMetadata(
  svg: string,
  moduleName: string,
  sourceSha?: string,
  sourcePath?: string,
): string {
  // Idempotent: skip if <metadata> already present.
  if (/<metadata[\s>]/i.test(svg)) {
    return svg;
  }

  const prefix = NAMESPACE_PREFIX;
  const version = NAMESPACE_VERSION;
  const sha = sourceSha ?? sha256Hex(moduleName);
  const path = sourcePath ?? `${moduleName}.v`;

  const metadataBlock =
    `  <metadata>\n` +
    `    <${prefix}:graph version="${version}" kind="netlist" language="verilog">\n` +
    `      <${prefix}:source path="${xmlEsc(path)}" sha="${xmlEsc(sha)}" generator="scribe-netlist-renderer/1.0"/>\n` +
    `    </${prefix}:graph>\n` +
    `  </metadata>\n`;

  // Insert after <desc> if present; otherwise after <title>; otherwise right
  // after the <svg> opening tag.
  const descMatch = svg.match(/<\/desc\s*>/i);
  const titleMatch = svg.match(/<\/title\s*>/i);

  let insertAfterIndex: number;
  if (descMatch && descMatch.index !== undefined) {
    insertAfterIndex = descMatch.index + descMatch[0].length;
  } else if (titleMatch && titleMatch.index !== undefined) {
    insertAfterIndex = titleMatch.index + titleMatch[0].length;
  } else {
    // After <svg ...>
    const svgTagMatch = svg.match(/<svg[^>]*>/i);
    if (!svgTagMatch || svgTagMatch.index === undefined) {
      return svg; // Can't find insertion point; leave unchanged.
    }
    insertAfterIndex = svgTagMatch.index + svgTagMatch[0].length;
  }

  return (
    svg.slice(0, insertAfterIndex) +
    '\n' +
    metadataBlock +
    svg.slice(insertAfterIndex)
  );
}

// ---------------------------------------------------------------------------
// Step 5: SVGO normalisation (optional peer dep)
// ---------------------------------------------------------------------------

/**
 * Apply SVGO with `createSvgoConfig({ preserveRoundTrip: true })` if SVGO is
 * available. Silently skips if `svgo` is not installed in this environment.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SvgoModule = { optimize: (s: string, c: unknown) => { data: string } };

async function applySvgoIfAvailable(svg: string): Promise<string> {
  try {
    // Dynamic import — gracefully fails if svgo is not installed.
    // We use Function constructor to avoid TS static import resolution of 'svgo'
    // (which is a peer dep not in package.json; only available in cartridge envs).
    const dynamicImport = new Function('specifier', 'return import(specifier)') as
      (s: string) => Promise<SvgoModule>;
    const svgoModule = await dynamicImport('svgo');
    const { optimize } = svgoModule;
    if (typeof optimize !== 'function') return svg;

    const config = createSvgoConfig({ preserveRoundTrip: true });
    const result = optimize(svg, config);
    return result.data;
  } catch {
    // SVGO not installed or failed — return svg as-is.
    return svg;
  }
}

// ---------------------------------------------------------------------------
// XML escaping helper
// ---------------------------------------------------------------------------

/** Escape text for safe use inside XML attribute values and element content. */
function xmlEsc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

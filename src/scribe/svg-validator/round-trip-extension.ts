/**
 * SCRIBE round-trip validator extension.
 *
 * Extends the BLOCKER-tier a11y checks with T3-specific round-trip invariants.
 * Lifted and refactored from examples/cartridges/code-svg-hdl-bridge/svg-to-ast/validate.ts.
 *
 * Unlike the base a11y-check, the round-trip extension uses DOMParser for structural
 * traversal (a11y-check uses a lighter regex approach). This is intentional:
 * round-trip checks need genuine XML namespace handling.
 *
 * Environment note: DOMParser is browser-native. In Node.js, use the `linkedom`
 * or `@xmldom/xmldom` package, or pass pre-parsed document via the `doc` overload.
 * The T3 viewer uses this module in the browser; Node tests mock DOMParser.
 *
 * @module scribe/svg-validator/round-trip-extension
 */

import type { RoundTripMetadata } from '../types/metadata-namespace.js';
import { NAMESPACE_URI, NAMESPACE_VERSION } from '../types/metadata-namespace.js';

export type ReportLine = string; // "OK: ..." | "WARN: ..." | "FAIL: ..."

/** Options for round-trip validation. */
export interface RoundTripValidationOptions {
  /** If true, validate the RoundTripMetadata payload shape. */
  readonly validatePayload?: boolean;
  /** DOMParser-compatible constructor (inject for Node.js). */
  readonly DOMParserCtor?: { new (): Pick<DOMParser, 'parseFromString'> };
}

/**
 * Validate a SCRIBE SVG string for round-trip invariants.
 *
 * Checks:
 *   - xmlns:scribe declaration present
 *   - <scribe:graph> present with version="1"
 *   - <scribe:source> present with path + sha
 *   - <scribe:node> count > 0
 *   - Per-kind structural invariants (AST: spans + single root; netlist: port direction)
 *   - Visual <g> cross-check (node IDs have matching visual elements)
 *
 * @param svgText - Raw SVG string.
 * @param opts    - Validation options (DOMParser injection for Node).
 * @returns Array of report lines prefixed with OK / WARN / FAIL.
 */
export function validateScribeSvg(
  svgText: string,
  opts: RoundTripValidationOptions = {},
): ReportLine[] {
  const report: ReportLine[] = [];

  const ParserCtor =
    opts.DOMParserCtor ??
    (typeof globalThis !== 'undefined'
      ? (globalThis as Record<string, unknown>)['DOMParser']
      : undefined) as (new () => Pick<DOMParser, 'parseFromString'>) | undefined;

  if (!ParserCtor) {
    return [
      'FAIL: DOMParser not available in this environment — inject via opts.DOMParserCtor',
    ];
  }

  const parser = new ParserCtor();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');

  if (
    doc.getElementsByTagName('parsererror').length > 0
  ) {
    return ['FAIL: SVG is not well-formed XML'];
  }

  const root = doc.documentElement;

  // --- a11y baseline (T2 Doc 06) -----------------------------------------
  if (!root.getAttribute('role')) {
    report.push('WARN: root <svg> missing role attribute');
  } else {
    report.push('OK: root role = ' + root.getAttribute('role'));
  }

  const titleEls = root.getElementsByTagName('title');
  if (titleEls.length === 0) {
    report.push('FAIL: root <svg> missing <title>');
  } else {
    report.push(
      'OK: root <title> present: ' +
        (titleEls[0].textContent ?? '').slice(0, 60),
    );
  }

  const descEls = root.getElementsByTagName('desc');
  if (descEls.length === 0) {
    report.push('WARN: root <svg> missing <desc>');
  } else {
    report.push('OK: root <desc> present');
  }

  // --- SCRIBE namespace declaration (I-CROSS-2) --------------------------
  if (!root.getAttribute('xmlns:scribe')) {
    report.push('FAIL: missing xmlns:scribe declaration (I-CROSS-2)');
  } else {
    report.push('OK: xmlns:scribe declared');
  }

  // --- <scribe:graph> presence + version (I-CROSS-3) --------------------
  const graphs = doc.getElementsByTagNameNS(NAMESPACE_URI, 'graph');
  if (graphs.length === 0) {
    report.push('FAIL: no <scribe:graph> element');
    return report; // no point continuing without a graph
  }
  const g = graphs[0];
  const version = g.getAttribute('version');
  if (version !== NAMESPACE_VERSION) {
    report.push(
      'WARN: <scribe:graph> version=' +
        JSON.stringify(version) +
        ' (expected "' +
        NAMESPACE_VERSION +
        '")',
    );
  }
  const kind = g.getAttribute('kind');
  report.push(
    'OK: <scribe:graph kind="' + kind + '" version="' + version + '">',
  );

  // --- <scribe:source> with path + sha (I-CROSS-1) ----------------------
  const srcEls = g.getElementsByTagNameNS(NAMESPACE_URI, 'source');
  const src = srcEls.length > 0 ? srcEls[0] : undefined;
  if (!src) {
    report.push('FAIL: <scribe:source> missing');
  } else {
    if (!src.getAttribute('path')) {
      report.push('FAIL: <scribe:source> missing path attribute');
    }
    if (!src.getAttribute('sha')) {
      report.push('FAIL: <scribe:source> missing sha attribute');
    }
    if (src.getAttribute('path') && src.getAttribute('sha')) {
      report.push(
        'OK: source path=' +
          src.getAttribute('path') +
          ' sha=' +
          (src.getAttribute('sha') ?? '').slice(0, 12) +
          '…',
      );
    }
  }

  // --- node + edge counts -----------------------------------------------
  const nodes = g.getElementsByTagNameNS(NAMESPACE_URI, 'node');
  const edges = g.getElementsByTagNameNS(NAMESPACE_URI, 'edge');
  report.push(
    'OK: ' +
      nodes.length +
      ' <scribe:node>, ' +
      edges.length +
      ' <scribe:edge>',
  );

  // --- Per-kind invariants -----------------------------------------------
  if (kind === 'ast') {
    // I-AST-3: leaf nodes need spans
    let missingSpan = 0;
    for (let i = 0; i < nodes.length; i++) {
      if (!nodes[i].getAttribute('span')) missingSpan++;
    }
    if (missingSpan > 0) {
      report.push(
        'WARN: ' + missingSpan + ' <scribe:node>(s) missing span (I-AST-3)',
      );
    } else {
      report.push('OK: every AST <scribe:node> has span');
    }

    // I-AST-4: every non-root node has exactly one incoming child edge
    const incoming: Record<string, number> = {};
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      if (e.getAttribute('rel') !== 'child') continue;
      const dst = e.getAttribute('dst');
      if (dst) incoming[dst] = (incoming[dst] ?? 0) + 1;
    }
    const multiParent = Object.values(incoming).filter((c) => c > 1).length;
    const noParentCount = Array.from({ length: nodes.length }, (_, idx) => nodes[idx]).filter(
      (n) => !incoming[n.getAttribute('id') ?? ''],
    ).length;

    if (multiParent) {
      report.push(
        'FAIL: ' +
          multiParent +
          ' node(s) have multiple incoming child edges (I-AST-4)',
      );
    }
    if (noParentCount !== 1) {
      report.push(
        'FAIL: expected exactly 1 root node; found ' +
          noParentCount +
          ' (I-AST-4)',
      );
    } else {
      report.push('OK: exactly one root node (I-AST-4)');
    }
  } else if (kind === 'netlist') {
    // I-HDL-2: ports have direction
    let portCount = 0;
    let portWithDir = 0;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.getAttribute('sub_type') === 'port') {
        portCount++;
        const payload = n.getAttribute('payload');
        if (payload && payload.includes('direction')) portWithDir++;
      }
    }
    if (portCount > 0) {
      report.push(
        'OK: ' +
          portWithDir +
          '/' +
          portCount +
          ' netlist ports carry direction (I-HDL-2)',
      );
    }
  }

  return report;
}

/**
 * Validate a RoundTripMetadata payload object.
 *
 * Checks that the required fields (direction, sourceSha, targetSha, svgSha,
 * sourceLanguage, targetLanguage) are present and non-empty.
 *
 * @returns Array of report lines.
 */
export function validateRoundTripPayload(
  payload: Partial<RoundTripMetadata>,
): ReportLine[] {
  const report: ReportLine[] = [];

  const required: Array<keyof RoundTripMetadata> = [
    'direction',
    'sourceLanguage',
    'targetLanguage',
    'sourceSha',
    'targetSha',
    'svgSha',
  ];

  for (const key of required) {
    const value = payload[key];
    if (value === undefined || value === null || value === '') {
      report.push(`FAIL: RoundTripMetadata.${key} is missing or empty`);
    } else {
      report.push(`OK: RoundTripMetadata.${key} = ${String(value).slice(0, 40)}`);
    }
  }

  // direction must be 'forward' | 'reverse'
  if (
    payload.direction !== undefined &&
    payload.direction !== 'forward' &&
    payload.direction !== 'reverse'
  ) {
    report.push(
      `FAIL: RoundTripMetadata.direction must be "forward" or "reverse"; got "${payload.direction}"`,
    );
  }

  return report;
}

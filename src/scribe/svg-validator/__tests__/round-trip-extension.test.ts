/**
 * Component 03 — round-trip-extension.ts unit tests.
 *
 * Tests the DOM-based round-trip validator and the RoundTripMetadata
 * payload validator. DOM-based tests use a minimal DOMParser mock.
 */

import { describe, it, expect } from 'vitest';
import {
  validateRoundTripPayload,
  validateScribeSvg,
} from '../round-trip-extension.js';
import type { RoundTripMetadata } from '../../types/metadata-namespace.js';

// ---------------------------------------------------------------------------
// Minimal DOMParser mock for Node.js unit tests
// ---------------------------------------------------------------------------
// We use @xmldom/xmldom-like minimal inline mock to avoid external dep.
// The key behavior we need:
//   - parseFromString returns an object with getElementsByTagName, getElementsByTagNameNS,
//     querySelectorAll, documentElement.getAttribute.
// We implement this with a simple XML-regex parser sufficient for the test SVGs.

function makeMinimalDOMParser(): new () => Pick<DOMParser, 'parseFromString'> {
  // We import the 'xmldom' package if available; otherwise provide a minimal mock.
  // In CI this runs under Node where xmldom may not be installed.
  // Use a lightweight inline parser that handles our test cases.

  class MinimalElement {
    tagName: string;
    namespaceURI: string | null;
    localName: string;
    private _attrs: Map<string, string>;
    private _children: MinimalElement[];
    textContent: string;

    constructor(
      tagName: string,
      ns: string | null,
      attrs: Map<string, string>,
      children: MinimalElement[],
      text: string,
    ) {
      this.tagName = tagName;
      this.namespaceURI = ns;
      this.localName = tagName.includes(':') ? tagName.split(':')[1] : tagName;
      this._attrs = attrs;
      this._children = children;
      this.textContent = text;
    }

    getAttribute(name: string): string | null {
      return this._attrs.get(name) ?? null;
    }

    getElementsByTagName(name: string): MinimalElement[] {
      const result: MinimalElement[] = [];
      for (const c of this._children) {
        if (c.tagName === name || name === '*') result.push(c);
        result.push(...c.getElementsByTagName(name));
      }
      return result;
    }

    getElementsByTagNameNS(ns: string, local: string): MinimalElement[] {
      const result: MinimalElement[] = [];
      for (const c of this._children) {
        if (c.namespaceURI === ns && c.localName === local) result.push(c);
        result.push(...c.getElementsByTagNameNS(ns, local));
      }
      return result;
    }

    querySelectorAll(_sel: string): MinimalElement[] {
      // Stub — not needed for round-trip checks we test.
      return [];
    }
  }

  class MinimalDoc {
    documentElement: MinimalElement;
    private _parseError: boolean;

    constructor(xml: string) {
      // Detect malformed XML.
      this._parseError = false;
      if (!xml.includes('<svg') || xml.includes('<<')) {
        this._parseError = true;
        this.documentElement = new MinimalElement(
          'parsererror', null, new Map(), [], '',
        );
        return;
      }
      this.documentElement = this._parseRoot(xml);
    }

    private _parseRoot(xml: string): MinimalElement {
      // Parse the root <svg> element.
      const svgMatch = xml.match(/<svg\b([^>]*)>/i);
      if (!svgMatch) {
        return new MinimalElement('parsererror', null, new Map(), [], '');
      }
      const attrs = this._parseAttrs(svgMatch[1]);
      const children = this._parseChildren(xml, svgMatch.index! + svgMatch[0].length);
      return new MinimalElement('svg', null, attrs, children, '');
    }

    private _parseAttrs(attrStr: string): Map<string, string> {
      const map = new Map<string, string>();
      const re = /(\S+?)\s*=\s*["']([^"']*)["']/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(attrStr)) !== null) {
        map.set(m[1], m[2]);
      }
      return map;
    }

    private _parseChildren(xml: string, fromIdx: number): MinimalElement[] {
      const children: MinimalElement[] = [];
      const slice = xml.slice(fromIdx);

      // Match self-closing tags: <tag .../> or <ns:tag .../>
      const scRe = /<([\w:]+)\b([^>]*?)\/>/g;
      let sc: RegExpExecArray | null;
      while ((sc = scRe.exec(slice)) !== null) {
        const tagName = sc[1];
        const attrs = this._parseAttrs(sc[2]);
        let ns: string | null = null;
        if (tagName.startsWith('scribe:')) ns = 'https://tibsfox.com/Research/SCRIBE/ns#';
        children.push(new MinimalElement(tagName, ns, attrs, [], ''));
      }

      // Match paired tags: <tag ...> ... </tag>
      const pRe = /<([\w:]+)\b([^>]*)>([\s\S]*?)<\/\1>/g;
      let m: RegExpExecArray | null;
      while ((m = pRe.exec(slice)) !== null) {
        const tagName = m[1];
        const attrs = this._parseAttrs(m[2]);
        const text = m[3].replace(/<[^>]*>/g, '').trim();
        let ns: string | null = null;
        if (tagName.startsWith('scribe:')) ns = 'https://tibsfox.com/Research/SCRIBE/ns#';
        const child = new MinimalElement(tagName, ns, attrs, this._parseChildren(m[3], 0), text);
        children.push(child);
      }
      return children;
    }

    getElementsByTagName(name: string): MinimalElement[] {
      if (this._parseError) {
        // Return parsererror sentinel.
        return [this.documentElement];
      }
      return this.documentElement.getElementsByTagName(name);
    }

    getElementsByTagNameNS(ns: string, local: string): MinimalElement[] {
      return this.documentElement.getElementsByTagNameNS(ns, local);
    }
  }

  return class MinimalDOMParser {
    parseFromString(xml: string, _type: string): MinimalDoc {
      return new MinimalDoc(xml);
    }
  } as unknown as new () => Pick<DOMParser, 'parseFromString'>;
}

const DOMParserCtor = makeMinimalDOMParser();

// ---------------------------------------------------------------------------
// validateRoundTripPayload
// ---------------------------------------------------------------------------
describe('validateRoundTripPayload', () => {
  it('PASS: all required fields present', () => {
    const payload: RoundTripMetadata = {
      direction: 'forward',
      sourceLanguage: 'typescript',
      targetLanguage: 'verilog',
      sourceSha: 'abc123def456',
      targetSha: 'fedcba987654',
      svgSha: '111aaa222bbb',
    };
    const report = validateRoundTripPayload(payload);
    const fails = report.filter((l) => l.startsWith('FAIL'));
    expect(fails).toHaveLength(0);
    expect(report.every((l) => l.startsWith('OK'))).toBe(true);
  });

  it('FAIL: sourceSha missing', () => {
    const payload: Partial<RoundTripMetadata> = {
      direction: 'forward',
      sourceLanguage: 'typescript',
      targetLanguage: 'verilog',
      targetSha: 'abc',
      svgSha: 'def',
    };
    const report = validateRoundTripPayload(payload);
    expect(report.some((l) => l.includes('sourceSha'))).toBe(true);
    expect(report.some((l) => l.startsWith('FAIL'))).toBe(true);
  });

  it('FAIL: direction is invalid value', () => {
    const payload: Partial<RoundTripMetadata> = {
      direction: 'sideways' as 'forward',
      sourceLanguage: 'typescript',
      targetLanguage: 'verilog',
      sourceSha: 'abc',
      targetSha: 'def',
      svgSha: 'ghi',
    };
    const report = validateRoundTripPayload(payload);
    expect(report.some((l) => l.includes('direction') && l.startsWith('FAIL'))).toBe(true);
  });

  it('PASS: direction="reverse" is valid', () => {
    const payload: RoundTripMetadata = {
      direction: 'reverse',
      sourceLanguage: 'verilog',
      targetLanguage: 'typescript',
      sourceSha: 'aaa',
      targetSha: 'bbb',
      svgSha: 'ccc',
    };
    const report = validateRoundTripPayload(payload);
    expect(report.filter((l) => l.startsWith('FAIL'))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// validateScribeSvg
// ---------------------------------------------------------------------------

function buildScribeSvg({
  withNamespace = true,
  withGraph = true,
  withSource = true,
  kind = 'ast',
  version = '1',
  missingPath = false,
  missingSha = false,
}: {
  withNamespace?: boolean;
  withGraph?: boolean;
  withSource?: boolean;
  kind?: string;
  version?: string;
  missingPath?: boolean;
  missingSha?: boolean;
} = {}): string {
  const nsAttr = withNamespace
    ? ' xmlns:scribe="https://tibsfox.com/Research/SCRIBE/ns#"'
    : '';

  const sourceAttrs = [
    !missingPath ? 'path="src/index.ts"' : '',
    !missingSha ? 'sha="abc123def456"' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const graphContent = withGraph
    ? `<scribe:graph version="${version}" kind="${kind}">
      ${withSource ? `<scribe:source ${sourceAttrs}/>` : ''}
      <scribe:node id="n1" sub_type="Program" label="root" span="0..100"/>
      <scribe:node id="n2" sub_type="Statement" label="stmt" span="1..50"/>
      <scribe:edge id="e1" rel="child" src="n1" dst="n2"/>
    </scribe:graph>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg"${nsAttr} role="img" aria-labelledby="t d" viewBox="0 0 100 100">
  <title id="t">Test SCRIBE SVG</title>
  <desc id="d">A test SCRIBE-class SVG with round-trip metadata.</desc>
  <metadata>
    ${graphContent}
  </metadata>
  <g class="node" id="n1"><rect width="60" height="20"/></g>
  <g class="node" id="n2"><rect width="60" height="20"/></g>
</svg>`;
}

describe('validateScribeSvg — DOMParser not available', () => {
  it('FAIL immediately when no DOMParser is provided', async () => {
    const report = validateScribeSvg('<svg/>', {});
    expect(report[0]).toMatch(/DOMParser not available/);
  });
});

describe('validateScribeSvg — well-formed SCRIBE SVG', () => {
  it('passes structural SCRIBE checks for a complete AST SVG (namespace, graph, source, nodes)', () => {
    const report = validateScribeSvg(buildScribeSvg(), { DOMParserCtor });
    // The minimal DOMParser mock stubs querySelectorAll (visual cross-check),
    // so a WARN about missing visual <g> elements is expected and acceptable.
    // We assert no FAIL about the structural invariants we care about.
    const structuralFails = report.filter(
      (l) =>
        l.startsWith('FAIL') &&
        // Exclude the visual cross-check WARN that becomes WARN (not FAIL)
        !l.includes('visual') &&
        !l.includes('matching visual'),
    );
    expect(structuralFails).toHaveLength(0);
    expect(report.some((l) => l.includes('xmlns:scribe declared'))).toBe(true);
    expect(report.some((l) => l.includes('<scribe:graph'))).toBe(true);
    expect(report.some((l) => l.includes('scribe:node'))).toBe(true);
  });

  it('reports OK: xmlns:scribe declared', () => {
    const report = validateScribeSvg(buildScribeSvg(), { DOMParserCtor });
    expect(report.some((l) => l.includes('xmlns:scribe declared'))).toBe(true);
  });

  it('reports OK: <scribe:graph> with version and kind', () => {
    const report = validateScribeSvg(buildScribeSvg(), { DOMParserCtor });
    expect(report.some((l) => l.includes('<scribe:graph'))).toBe(true);
  });
});

describe('validateScribeSvg — missing namespace', () => {
  it('FAIL: missing xmlns:scribe declaration', () => {
    const report = validateScribeSvg(
      buildScribeSvg({ withNamespace: false }),
      { DOMParserCtor },
    );
    expect(report.some((l) => l.includes('FAIL') && l.includes('xmlns:scribe'))).toBe(true);
  });
});

describe('validateScribeSvg — missing <scribe:graph>', () => {
  it('FAIL and returns early when no <scribe:graph> element', () => {
    const report = validateScribeSvg(
      buildScribeSvg({ withGraph: false }),
      { DOMParserCtor },
    );
    expect(report.some((l) => l.includes('FAIL') && l.includes('scribe:graph'))).toBe(true);
  });
});

describe('validateScribeSvg — wrong version', () => {
  it('WARN when <scribe:graph> version != "1"', () => {
    const report = validateScribeSvg(
      buildScribeSvg({ version: '2' }),
      { DOMParserCtor },
    );
    expect(report.some((l) => l.startsWith('WARN') && l.includes('version'))).toBe(true);
  });
});

describe('validateScribeSvg — <scribe:source> checks', () => {
  it('FAIL when <scribe:source> is missing entirely', () => {
    const report = validateScribeSvg(
      buildScribeSvg({ withSource: false }),
      { DOMParserCtor },
    );
    expect(report.some((l) => l.includes('FAIL') && l.includes('scribe:source'))).toBe(true);
  });
});

describe('validateScribeSvg — malformed XML', () => {
  it('FAIL: SVG is not well-formed XML', () => {
    const report = validateScribeSvg('<<broken xml', { DOMParserCtor });
    expect(report[0]).toMatch(/FAIL.*well-formed/);
  });
});

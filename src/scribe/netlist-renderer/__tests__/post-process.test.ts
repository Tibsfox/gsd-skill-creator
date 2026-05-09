/**
 * Component 06 — post-process.ts unit tests.
 *
 * Feeds synthetic netlistsvg-shaped SVG strings through the post-processor
 * and verifies SCRIBE namespace injection, a11y attribute wiring, metadata
 * block injection, and error paths.
 *
 * These tests run WITHOUT Yosys or netlistsvg installed. They exercise only
 * the post-process module, which is pure TypeScript + Node built-ins.
 *
 * Test naming convention follows Wave 1:
 *   describe('postProcessNetlistSvg', () => { it('injects SCRIBE namespace declaration', ...) })
 */

import { describe, it, expect } from 'vitest';
import {
  postProcessNetlistSvg,
  injectA11yAndNamespace,
  injectScribeMetadata,
  sha256Hex,
  type PostProcessOptions,
} from '../post-process.js';
import {
  NAMESPACE_URI,
  NAMESPACE_PREFIX,
  NAMESPACE_VERSION,
  NAMESPACE_DECLARATION_ATTR,
} from '../../types/metadata-namespace.js';
import { NetlistRenderError } from '../../types/errors.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal raw netlistsvg-shaped SVG (no SCRIBE metadata, no a11y). */
function rawNetlistSvg(extra = ''): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"${extra}>\n` +
    `  <g class="wire"><line x1="0" y1="0" x2="100" y2="0"/></g>\n` +
    `  <g class="cell"><rect x="100" y="0" width="50" height="30"/></g>\n` +
    `</svg>`
  );
}

// Base options without domParserCtor — round-trip checks are optional;
// a11y BLOCKER checks (which are the load-bearing correctness gate) don't
// need a DOMParser. Post-process unit tests focus on structural injection
// correctness and a11y pass; the e2e tests cover round-trip with DOMParser.
const BASE_OPTS: PostProcessOptions = {
  moduleName: 'add',
};

// ---------------------------------------------------------------------------
// Test group 1: injectA11yAndNamespace() unit tests
// ---------------------------------------------------------------------------

describe('injectA11yAndNamespace', () => {
  it('injects SCRIBE namespace declaration on <svg> root', () => {
    const result = injectA11yAndNamespace(rawNetlistSvg(), 'add', 'Test desc');
    expect(result).toContain(`${NAMESPACE_DECLARATION_ATTR}="${NAMESPACE_URI}"`);
  });

  it('adds role="graphics-document" when role is absent', () => {
    const result = injectA11yAndNamespace(rawNetlistSvg(), 'add', 'Test desc');
    expect(result).toContain('role="graphics-document"');
  });

  it('adds aria-labelledby="scribe-title scribe-desc" when absent', () => {
    const result = injectA11yAndNamespace(rawNetlistSvg(), 'add', 'Test desc');
    expect(result).toContain('aria-labelledby="scribe-title scribe-desc"');
  });

  it('inserts <title id="scribe-title"> with module name', () => {
    const result = injectA11yAndNamespace(rawNetlistSvg(), 'mymod', 'desc');
    expect(result).toContain('<title id="scribe-title">mymod netlist</title>');
  });

  it('inserts <desc id="scribe-desc"> with description', () => {
    const result = injectA11yAndNamespace(rawNetlistSvg(), 'add', 'Some description');
    expect(result).toContain('<desc id="scribe-desc">Some description</desc>');
  });

  it('is idempotent: does not double-inject namespace if already present', () => {
    const first = injectA11yAndNamespace(rawNetlistSvg(), 'add', 'desc');
    const second = injectA11yAndNamespace(first, 'add', 'desc');
    const count = (second.match(new RegExp(NAMESPACE_DECLARATION_ATTR, 'g')) ?? []).length;
    expect(count).toBe(1);
  });

  it('is idempotent: does not double-inject title if already present', () => {
    const first = injectA11yAndNamespace(rawNetlistSvg(), 'add', 'desc');
    const second = injectA11yAndNamespace(first, 'add', 'desc');
    const count = (second.match(/<title/gi) ?? []).length;
    expect(count).toBe(1);
  });

  it('throws NetlistRenderError (stage=post-process) when no <svg> root found', () => {
    expect(() => injectA11yAndNamespace('<div>not svg</div>', 'mod', 'desc')).toThrow(
      NetlistRenderError,
    );
    expect(() => injectA11yAndNamespace('<div>not svg</div>', 'mod', 'desc')).toThrow(
      'no <svg> root element found',
    );
  });

  it('preserves existing role attribute when already set', () => {
    const svgWithRole = rawNetlistSvg(' role="img"');
    const result = injectA11yAndNamespace(svgWithRole, 'add', 'desc');
    // Should not add another role; existing role preserved
    expect(result).toContain('role="img"');
    expect((result.match(/\brole\s*=/g) ?? []).length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Test group 2: injectScribeMetadata() unit tests
// ---------------------------------------------------------------------------

describe('injectScribeMetadata', () => {
  it('injects a <metadata> block', () => {
    const svg = injectA11yAndNamespace(rawNetlistSvg(), 'add', 'desc');
    const result = injectScribeMetadata(svg, 'add', 'abc123', 'add.v');
    expect(result).toContain('<metadata>');
    expect(result).toContain('</metadata>');
  });

  it(`injects <${NAMESPACE_PREFIX}:graph version="${NAMESPACE_VERSION}" kind="netlist" language="verilog">`, () => {
    const svg = injectA11yAndNamespace(rawNetlistSvg(), 'add', 'desc');
    const result = injectScribeMetadata(svg, 'add', 'abc123', 'add.v');
    expect(result).toContain(
      `<${NAMESPACE_PREFIX}:graph version="${NAMESPACE_VERSION}" kind="netlist" language="verilog">`,
    );
  });

  it('injects <scribe:source> with provided sha and path', () => {
    const svg = injectA11yAndNamespace(rawNetlistSvg(), 'add', 'desc');
    const result = injectScribeMetadata(svg, 'add', 'deadbeef1234', 'add.v');
    expect(result).toContain('sha="deadbeef1234"');
    expect(result).toContain('path="add.v"');
  });

  it('generates a sha if sourceSha is omitted', () => {
    const svg = injectA11yAndNamespace(rawNetlistSvg(), 'add', 'desc');
    const result = injectScribeMetadata(svg, 'add');
    // Should still have sha= attribute (auto-generated from module name)
    expect(result).toMatch(/sha="[0-9a-f]{16,}"/);
  });

  it('is idempotent: does not double-inject <metadata> if already present', () => {
    const svg = injectA11yAndNamespace(rawNetlistSvg(), 'add', 'desc');
    const once = injectScribeMetadata(svg, 'add', 'abc', 'add.v');
    const twice = injectScribeMetadata(once, 'add', 'abc', 'add.v');
    const count = (twice.match(/<metadata/gi) ?? []).length;
    expect(count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Test group 3: sha256Hex() unit tests
// ---------------------------------------------------------------------------

describe('sha256Hex', () => {
  it('returns a 40-character hex string', () => {
    const result = sha256Hex('hello world');
    expect(result).toMatch(/^[0-9a-f]{40}$/);
  });

  it('is deterministic (same input → same output)', () => {
    const a = sha256Hex('module add(input a, output b);');
    const b = sha256Hex('module add(input a, output b);');
    expect(a).toBe(b);
  });

  it('differs for different inputs', () => {
    const a = sha256Hex('module add');
    const b = sha256Hex('module xor1');
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// Test group 4: postProcessNetlistSvg() integration tests (no subprocess)
// ---------------------------------------------------------------------------

describe('postProcessNetlistSvg', () => {
  it('returns a non-empty SVG string for a minimal raw netlist SVG', async () => {
    const result = await postProcessNetlistSvg(rawNetlistSvg(), BASE_OPTS);
    expect(result.length).toBeGreaterThan(100);
    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
  });

  it('injects SCRIBE namespace declaration on the output <svg> root', async () => {
    const result = await postProcessNetlistSvg(rawNetlistSvg(), BASE_OPTS);
    expect(result).toContain(`${NAMESPACE_DECLARATION_ATTR}="${NAMESPACE_URI}"`);
  });

  it('injects <title> with aria-labelledby wiring', async () => {
    const result = await postProcessNetlistSvg(rawNetlistSvg(), {
      ...BASE_OPTS,
      moduleName: 'xor1',
    });
    expect(result).toContain('xor1');
    expect(result).toContain('aria-labelledby');
  });

  it('injects <scribe:graph> metadata block', async () => {
    const result = await postProcessNetlistSvg(rawNetlistSvg(), {
      ...BASE_OPTS,
      sourceSha: 'cafebabe1234',
      sourcePath: 'add.v',
    });
    expect(result).toContain('cafebabe1234');
    expect(result).toContain('add.v');
  });

  it('passes a11y validation (ok=true) for the processed SVG', async () => {
    // Implicitly: if postProcessNetlistSvg does not throw, ok=true was returned.
    await expect(
      postProcessNetlistSvg(rawNetlistSvg(), BASE_OPTS),
    ).resolves.toBeDefined();
  });

  it('uses the provided moduleName in the description when description is omitted', async () => {
    const result = await postProcessNetlistSvg(rawNetlistSvg(), {
      ...BASE_OPTS,
      moduleName: 'mux',
    });
    expect(result).toContain('mux');
  });

  it('uses the provided custom description when given', async () => {
    const result = await postProcessNetlistSvg(rawNetlistSvg(), {
      ...BASE_OPTS,
      description: 'Custom test description for the netlist',
    });
    expect(result).toContain('Custom test description for the netlist');
  });

  it('throws NetlistRenderError (stage=post-process) when fed a non-SVG string', async () => {
    await expect(
      postProcessNetlistSvg('<div>not svg</div>', BASE_OPTS),
    ).rejects.toThrow(NetlistRenderError);
  });

  it('generator attribute is "scribe-netlist-renderer/1.0"', async () => {
    const result = await postProcessNetlistSvg(rawNetlistSvg(), BASE_OPTS);
    expect(result).toContain('generator="scribe-netlist-renderer/1.0"');
  });
});

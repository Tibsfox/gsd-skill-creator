/**
 * Component 06 — e2e.test.ts
 *
 * Full end-to-end tests: Verilog → Yosys → netlistsvg → post-process → validate.
 *
 * GATED on YOSYS_TEST=1. Tests are SKIPPED unless that env var is set.
 * In this environment, Yosys is not installed; these tests will show as
 * "skipped" in the test output with the reason documented below.
 *
 * To run in a Yosys-equipped environment:
 *   YOSYS_TEST=1 npx vitest run src/scribe/netlist-renderer
 *
 * Prerequisites (operator must install):
 *   - yosys: https://yosyshq.net/yosys/  (apt: `sudo apt install yosys`)
 *   - netlistsvg: `npm install -g netlistsvg`
 *
 * Each test verifies:
 *   1. renderNetlist() produces non-empty SVG
 *   2. Component 04 namespace-conformance validator exits 0
 *   3. Component 03 validateSvg() returns ok=true
 */

import { describe, it, expect } from 'vitest';
import { renderNetlist, isAvailable } from '../index.js';
import { validateSvg } from '../../svg-validator/index.js';
import { validateNamespaceConformance } from '../../namespace-conformance/index.js';
import { NAMESPACE_URI } from '../../types/index.js';

// ---------------------------------------------------------------------------
// Gate
// ---------------------------------------------------------------------------

const YOSYS_TEST = process.env['YOSYS_TEST'] === '1';
const itOrSkip = YOSYS_TEST ? it : it.skip;

// ---------------------------------------------------------------------------
// Verilog sources (from viewer.js emitVerilog patterns)
// ---------------------------------------------------------------------------

/** 32-bit unsigned adder */
const ADD_VERILOG = `
module add(
  input  [31:0] a,
  input  [31:0] b,
  output [31:0] out
);
  assign out = a + b;
endmodule
`.trim();

/** 1-bit XOR gate */
const XOR1_VERILOG = `
module xor1(
  input  a,
  input  b,
  output out
);
  assign out = a ^ b;
endmodule
`.trim();

/** 2:1 multiplexer */
const MUX_VERILOG = `
module mux(
  input  sel,
  input  a,
  input  b,
  output out
);
  assign out = sel ? a : b;
endmodule
`.trim();

// ---------------------------------------------------------------------------
// DOMParser for round-trip checks (loaded lazily via dynamic import to avoid
// @types/jsdom TS compile-time dependency — jsdom is a runtime-only dep here).
// ---------------------------------------------------------------------------

type DomParserCtor = { new(): Pick<DOMParser, 'parseFromString'> };

async function getDomParser(): Promise<DomParserCtor> {
  // jsdom is a runtime-only dep (no @types/jsdom in root package.json); a
  // variable specifier keeps TS from demanding type declarations while
  // letting vitest's module runner service the dynamic import. A bare
  // `new Function('return import(...)')` has no import callback inside the
  // vitest VM and throws "A dynamic import callback was not specified".
  const specifier = 'jsdom';
  const { JSDOM } = (await import(/* @vite-ignore */ specifier)) as {
    JSDOM: new (html: string) => { window: { DOMParser: DomParserCtor } };
  };
  return new JSDOM('').window.DOMParser;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Run the Component 04 namespace conformance check on an SVG string. */
function checkNamespaceConformance(svgString: string, label: string): boolean {
  const report = validateNamespaceConformance(NAMESPACE_URI, [svgString], [label]);
  return report.conformant;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderNetlist — e2e (YOSYS_TEST=1 required)', () => {
  it('isAvailable() reports yosys=true and netlistsvg=true when tools are installed', async () => {
    if (!YOSYS_TEST) return;
    const probe = await isAvailable();
    expect(probe.yosys).toBe(true);
    expect(probe.netlistsvg).toBe(true);
  });

  itOrSkip(
    'add module: produces non-empty SVG (YOSYS_TEST gate: skip reason = Yosys not installed)',
    async () => {
      const DomParser = await getDomParser();
      const svg = await renderNetlist(ADD_VERILOG, {
        module: 'add',
        domParserCtor: DomParser,
      });
      expect(svg).toBeTruthy();
      expect(svg.length).toBeGreaterThan(100);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    },
  );

  itOrSkip(
    'add module: Component 04 namespace conformance passes (YOSYS_TEST gate)',
    async () => {
      const DomParser = await getDomParser();
      const svg = await renderNetlist(ADD_VERILOG, {
        module: 'add',
        domParserCtor: DomParser,
      });
      const conformant = checkNamespaceConformance(svg, 'add-netlist.svg');
      expect(conformant).toBe(true);
    },
  );

  itOrSkip(
    'add module: Component 03 validateSvg returns ok=true (YOSYS_TEST gate)',
    async () => {
      const DomParser = await getDomParser();
      const svg = await renderNetlist(ADD_VERILOG, {
        module: 'add',
        domParserCtor: DomParser,
      });
      const result = await validateSvg(svg, {
        roundTrip: true,
        domParserCtor: DomParser,
      });
      expect(result.ok).toBe(true);
    },
  );

  itOrSkip(
    'xor1 module: produces non-empty SVG (YOSYS_TEST gate)',
    async () => {
      const DomParser = await getDomParser();
      const svg = await renderNetlist(XOR1_VERILOG, {
        module: 'xor1',
        domParserCtor: DomParser,
      });
      expect(svg).toBeTruthy();
      expect(svg.length).toBeGreaterThan(100);
      expect(svg).toContain('<svg');
    },
  );

  itOrSkip(
    'xor1 module: Component 04 namespace conformance passes (YOSYS_TEST gate)',
    async () => {
      const DomParser = await getDomParser();
      const svg = await renderNetlist(XOR1_VERILOG, {
        module: 'xor1',
        domParserCtor: DomParser,
      });
      const conformant = checkNamespaceConformance(svg, 'xor1-netlist.svg');
      expect(conformant).toBe(true);
    },
  );

  itOrSkip(
    'xor1 module: Component 03 validateSvg returns ok=true (YOSYS_TEST gate)',
    async () => {
      const DomParser = await getDomParser();
      const svg = await renderNetlist(XOR1_VERILOG, {
        module: 'xor1',
        domParserCtor: DomParser,
      });
      const result = await validateSvg(svg, {
        roundTrip: true,
        domParserCtor: DomParser,
      });
      expect(result.ok).toBe(true);
    },
  );

  itOrSkip(
    'mux module: produces non-empty SVG (YOSYS_TEST gate)',
    async () => {
      const DomParser = await getDomParser();
      const svg = await renderNetlist(MUX_VERILOG, {
        module: 'mux',
        domParserCtor: DomParser,
      });
      expect(svg).toBeTruthy();
      expect(svg.length).toBeGreaterThan(100);
      expect(svg).toContain('<svg');
    },
  );

  itOrSkip(
    'mux module: Component 04 namespace conformance passes (YOSYS_TEST gate)',
    async () => {
      const DomParser = await getDomParser();
      const svg = await renderNetlist(MUX_VERILOG, {
        module: 'mux',
        domParserCtor: DomParser,
      });
      const conformant = checkNamespaceConformance(svg, 'mux-netlist.svg');
      expect(conformant).toBe(true);
    },
  );

  itOrSkip(
    'mux module: Component 03 validateSvg returns ok=true (YOSYS_TEST gate)',
    async () => {
      const DomParser = await getDomParser();
      const svg = await renderNetlist(MUX_VERILOG, {
        module: 'mux',
        domParserCtor: DomParser,
      });
      const result = await validateSvg(svg, {
        roundTrip: true,
        domParserCtor: DomParser,
      });
      expect(result.ok).toBe(true);
    },
  );
});

describe('renderNetlist — availability fallback (no YOSYS_TEST required)', () => {
  it('isAvailable() returns a result with yosys and netlistsvg boolean fields', async () => {
    const probe = await isAvailable();
    expect(typeof probe.yosys).toBe('boolean');
    expect(typeof probe.netlistsvg).toBe('boolean');
  });

  it('renderNetlist() throws NetlistRenderError when Yosys is not installed', async () => {
    if (YOSYS_TEST) {
      // Skip this check when Yosys IS installed.
      return;
    }
    const { NetlistRenderError } = await import('../../types/errors.js');
    await expect(
      renderNetlist('module add(input a, output b); assign b = a; endmodule'),
    ).rejects.toThrow(NetlistRenderError);
  });
});

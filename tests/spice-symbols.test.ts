/**
 * tests/spice-symbols.test.ts
 *
 * Validates the SVG component-symbol library at
 *   www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/spice-symbols/
 *
 * Rules under test:
 *   - All 24 expected SVGs exist on disk
 *   - Each SVG parses as valid XML and has the SVG root element
 *   - Each SVG has a `viewBox` attribute matching its canonical width/height
 *   - Each SVG has at least one element with a `data-pin` attribute
 *   - The SYMBOLS manifest covers every ComponentKind that should have a glyph
 *     (NET_LABEL, AMMETER, VOLTMETER are programmatic and excluded)
 *   - Total bundle size of all distinct SVG assets is <= 30 KB
 *
 * Mission: v1.49.581 Phase B.1 wave-1 (high-fidelity SPICE renderer).
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

import {
  SYMBOLS,
  PROGRAMMATIC_KINDS,
  SYMBOL_ASSETS,
  getSymbol,
} from '../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/spice-symbols/index';
import type { ComponentKind } from '../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SYMBOLS_DIR = resolve(
  __dirname,
  '../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/spice-symbols',
);

// ─────────────────────────────────────────────────────────────────────────────
// Expected on-disk asset list (24 SVGs)
// ─────────────────────────────────────────────────────────────────────────────
const EXPECTED_SVGS: ReadonlyArray<{ file: string; width: number; height: number }> = [
  { file: 'resistor.svg',                width: 64, height: 16 },
  { file: 'resistor-eu.svg',             width: 64, height: 16 },
  { file: 'capacitor.svg',               width: 32, height: 24 },
  { file: 'capacitor-electrolytic.svg',  width: 32, height: 24 },
  { file: 'inductor.svg',                width: 64, height: 16 },
  { file: 'diode.svg',                   width: 32, height: 16 },
  { file: 'diode-zener.svg',             width: 32, height: 16 },
  { file: 'diode-led.svg',               width: 32, height: 24 },
  { file: 'voltage-source.svg',          width: 32, height: 32 },
  { file: 'voltage-source-ac.svg',       width: 32, height: 32 },
  { file: 'current-source.svg',          width: 32, height: 32 },
  { file: 'ground.svg',                  width: 24, height: 16 },
  { file: 'ground-chassis.svg',          width: 24, height: 16 },
  { file: 'opamp.svg',                   width: 64, height: 64 },
  { file: 'bjt-npn.svg',                 width: 48, height: 48 },
  { file: 'bjt-pnp.svg',                 width: 48, height: 48 },
  { file: 'mosfet-n.svg',                width: 48, height: 48 },
  { file: 'mosfet-p.svg',                width: 48, height: 48 },
  { file: 'jfet-n.svg',                  width: 48, height: 48 },
  { file: 'jfet-p.svg',                  width: 48, height: 48 },
  { file: 'switch.svg',                  width: 64, height: 24 },
  { file: 'transformer.svg',             width: 64, height: 64 },
  { file: 'crystal.svg',                 width: 48, height: 24 },
  { file: 'subckt-block.svg',            width: 80, height: 80 },
];

// All ComponentKind values; kept in lockstep with types.ts.
const ALL_COMPONENT_KINDS: ReadonlyArray<ComponentKind> = [
  'R', 'C', 'C_POL', 'L', 'D', 'D_ZENER', 'D_LED',
  'V', 'V_AC', 'V_PULSE', 'V_SIN', 'I',
  'E', 'F', 'G', 'H', 'B',
  'GND', 'GND_CHASSIS',
  'OPAMP',
  'BJT_NPN', 'BJT_PNP',
  'MOSFET_N', 'MOSFET_P',
  'JFET_N', 'JFET_P',
  'SWITCH', 'TRANSFORMER', 'CRYSTAL',
  'AMMETER', 'VOLTMETER', 'NET_LABEL', 'SUBCKT',
];

// Cache: parsed SVG documents per file.
const svgDocs = new Map<string, Document>();

beforeAll(() => {
  for (const { file } of EXPECTED_SVGS) {
    const path = resolve(SYMBOLS_DIR, file);
    const xml = readFileSync(path, 'utf8');
    const dom = new JSDOM(xml, { contentType: 'image/svg+xml' });
    svgDocs.set(file, dom.window.document);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Existence + parsing
// ─────────────────────────────────────────────────────────────────────────────
describe('spice-symbols: file presence and SVG validity', () => {
  it('has all 24 expected SVG files on disk', () => {
    for (const { file } of EXPECTED_SVGS) {
      const path = resolve(SYMBOLS_DIR, file);
      expect(existsSync(path), `missing SVG: ${file}`).toBe(true);
    }
    expect(EXPECTED_SVGS.length).toBe(24);
  });

  it('every SVG parses and has an <svg> root', () => {
    for (const { file } of EXPECTED_SVGS) {
      const doc = svgDocs.get(file)!;
      const root = doc.documentElement;
      expect(root, `${file}: no root element`).toBeTruthy();
      expect(root.nodeName.toLowerCase(), `${file}: root is not <svg>`).toBe('svg');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// viewBox + canonical size
// ─────────────────────────────────────────────────────────────────────────────
describe('spice-symbols: viewBox conformance', () => {
  it('every SVG has a viewBox matching its canonical width/height', () => {
    for (const { file, width, height } of EXPECTED_SVGS) {
      const doc = svgDocs.get(file)!;
      const root = doc.documentElement;
      const viewBox = root.getAttribute('viewBox');
      expect(viewBox, `${file}: missing viewBox`).toBeTruthy();
      expect(viewBox, `${file}: unexpected viewBox`).toBe(`0 0 ${width} ${height}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pin anchors
// ─────────────────────────────────────────────────────────────────────────────
describe('spice-symbols: pin attachment markers', () => {
  it('every SVG declares at least one data-pin marker', () => {
    for (const { file } of EXPECTED_SVGS) {
      const doc = svgDocs.get(file)!;
      const pinned = doc.querySelectorAll('[data-pin]');
      expect(
        pinned.length,
        `${file}: expected at least one element with [data-pin]`,
      ).toBeGreaterThanOrEqual(1);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Manifest coverage
// ─────────────────────────────────────────────────────────────────────────────
describe('spice-symbols: manifest coverage', () => {
  it('SYMBOLS covers every renderable ComponentKind', () => {
    const programmatic = new Set<string>(PROGRAMMATIC_KINDS);
    const renderable = ALL_COMPONENT_KINDS.filter((k) => !programmatic.has(k));
    for (const kind of renderable) {
      expect(
        (SYMBOLS as Record<string, unknown>)[kind],
        `SYMBOLS missing entry for ${kind}`,
      ).toBeTruthy();
    }
  });

  it('SYMBOLS does not declare entries for programmatic kinds', () => {
    for (const kind of PROGRAMMATIC_KINDS) {
      expect(
        (SYMBOLS as Record<string, unknown>)[kind],
        `SYMBOLS should not have an entry for programmatic kind ${kind}`,
      ).toBeUndefined();
    }
  });

  it('every SYMBOLS entry points at an SVG file that exists', () => {
    for (const [kind, meta] of Object.entries(SYMBOLS)) {
      const file = meta.url.replace(/^\.\//, '');
      const path = resolve(SYMBOLS_DIR, file);
      expect(existsSync(path), `${kind} → ${meta.url}: SVG missing`).toBe(true);
    }
  });

  it('getSymbol() returns metadata for a renderable kind and throws for programmatic', () => {
    expect(getSymbol('R').width).toBe(64);
    expect(getSymbol('OPAMP').pins.out).toEqual({ x: 64, y: 32 });
    expect(() => getSymbol('NET_LABEL')).toThrow(/programmatically/i);
  });

  it('SYMBOL_ASSETS is a subset of on-disk SVGs (alternates like resistor-eu may be unmapped)', () => {
    const onDisk = new Set(EXPECTED_SVGS.map((e) => `./${e.file}`));
    for (const url of SYMBOL_ASSETS) {
      expect(onDisk.has(url), `SYMBOL_ASSETS references missing file ${url}`).toBe(true);
    }
    // Sanity: SYMBOL_ASSETS must reference at least the 23 default-bound assets.
    expect(SYMBOL_ASSETS.length).toBeGreaterThanOrEqual(23);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bundle size budget
// ─────────────────────────────────────────────────────────────────────────────
describe('spice-symbols: bundle size budget', () => {
  it('total SVG bundle size is <= 30 KB', () => {
    const BUDGET_BYTES = 30 * 1024;
    let total = 0;
    for (const { file } of EXPECTED_SVGS) {
      total += statSync(resolve(SYMBOLS_DIR, file)).size;
    }
    expect(
      total,
      `bundle is ${total} bytes; budget is ${BUDGET_BYTES}`,
    ).toBeLessThanOrEqual(BUDGET_BYTES);
  });
});

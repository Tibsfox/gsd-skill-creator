/**
 * Conformance report tests — full report shape + sample-doc round-trip.
 *
 * Integration tests that run `validateNamespaceConformance` against:
 * 1. The 3 ast-to-svg cartridge examples (add/xor1/mux).
 * 2. A deliberately non-conformant document.
 * 3. The report shape contract.
 *
 * These tests run as part of the existing vitest suite — no new config needed.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateNamespaceConformance,
  type ConformanceReport,
} from '../index.js';
import { NAMESPACE_URI } from '../../types/index.js';
import { NamespaceConformanceError } from '../../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Resolve a path relative to the repo root.
 * __dirname is: <repo>/src/scribe/namespace-conformance/__tests__
 * Repo root is 4 levels up.
 */
function repoPath(...parts: string[]): string {
  return resolve(__dirname, '../../../..', ...parts);
}

// ---------------------------------------------------------------------------
// Helper: load sample SVG files from the ast-to-svg examples directory.
// ---------------------------------------------------------------------------

function loadSampleSvg(filename: string): string {
  return readFileSync(
    repoPath(
      'examples/cartridges/code-svg-hdl-bridge/ast-to-svg/examples',
      filename,
    ),
    'utf8',
  );
}

// ---------------------------------------------------------------------------
// Test 1: Report shape contract
// ---------------------------------------------------------------------------

describe('ConformanceReport shape', () => {
  it('returns a well-shaped report with all required fields', () => {
    const minimal = `<svg xmlns="http://www.w3.org/2000/svg"
         xmlns:scribe="${NAMESPACE_URI}">
      <metadata>
        <scribe:graph version="1" kind="ast" language="typescript">
          <scribe:nodes>
            <scribe:node id="n1" sub_type="FunctionDeclaration" label="test" span="0..10"/>
          </scribe:nodes>
          <scribe:edges></scribe:edges>
        </scribe:graph>
      </metadata>
    </svg>`;

    const report = validateNamespaceConformance(NAMESPACE_URI, [minimal], ['minimal.svg']);

    // Shape assertions
    expect(report).toHaveProperty('namespaceUri', NAMESPACE_URI);
    expect(report).toHaveProperty('conformant');
    expect(report).toHaveProperty('documents');
    expect(report).toHaveProperty('errors');
    expect(report).toHaveProperty('totalDocuments', 1);
    expect(report).toHaveProperty('passingDocuments');

    // Per-document shape
    expect(report.documents).toHaveLength(1);
    const doc = report.documents[0];
    expect(doc).toHaveProperty('docIndex', 0);
    expect(doc).toHaveProperty('label', 'minimal.svg');
    expect(doc).toHaveProperty('conformant');
    expect(doc).toHaveProperty('findings');
    expect(doc.findings).toHaveLength(5); // one per invariant

    // Each finding has the required shape
    for (const finding of doc.findings) {
      expect(finding).toHaveProperty('invariant');
      expect(finding).toHaveProperty('status');
      expect(['PASS', 'WARN', 'FAIL']).toContain(finding.status);
      expect(finding).toHaveProperty('evidence');
      expect(typeof finding.evidence).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Test 2: All 3 sample SVGs from ast-to-svg cartridge pass all 5 invariants
// ---------------------------------------------------------------------------

describe('Sample SVGs from ast-to-svg cartridge', () => {
  const samples = ['add.svg', 'xor1.svg', 'mux.svg'] as const;

  it('all 3 sample SVGs (add, xor1, mux) validate as conformant', () => {
    const docs = samples.map(f => loadSampleSvg(f));
    const labels = [...samples];

    const report: ConformanceReport = validateNamespaceConformance(
      NAMESPACE_URI,
      docs,
      labels,
    );

    expect(report.totalDocuments).toBe(3);
    expect(report.conformant).toBe(true);
    expect(report.passingDocuments).toBe(3);
    expect(report.errors).toHaveLength(0);

    for (const docResult of report.documents) {
      expect(docResult.conformant).toBe(true);
      const failFindings = docResult.findings.filter(f => f.status === 'FAIL');
      expect(failFindings).toHaveLength(0);
    }
  });

  it.each(samples)('sample %s passes each of the 5 invariants individually', (filename) => {
    const svgSource = loadSampleSvg(filename);
    const report = validateNamespaceConformance(NAMESPACE_URI, [svgSource], [filename]);

    expect(report.conformant).toBe(true);
    expect(report.documents[0].findings).toHaveLength(5);

    const invariantNames = report.documents[0].findings.map(f => f.invariant);
    expect(invariantNames).toContain('generic-identification');
    expect(invariantNames).toContain('attribute-bearing');
    expect(invariantNames).toContain('hierarchical-nesting');
    expect(invariantNames).toContain('document-type-validation');
    expect(invariantNames).toContain('roundtrippable-serialisation');
  });
});

// ---------------------------------------------------------------------------
// Test 3: Non-conformant document produces structured errors
// ---------------------------------------------------------------------------

describe('Non-conformant document', () => {
  it('returns conformant=false and NamespaceConformanceError instances for FAIL findings', () => {
    const nonConformantSvg = `<svg xmlns="http://www.w3.org/2000/svg"
         xmlns:scribe="${NAMESPACE_URI}">
      <metadata>
        <!-- Missing version and kind on scribe:graph — multiple violations -->
        <scribe:graph>
          <scribe:nodes>
            <scribe:node id="n1"/>
          </scribe:nodes>
        </scribe:graph>
      </metadata>
    </svg>`;

    const report = validateNamespaceConformance(
      NAMESPACE_URI,
      [nonConformantSvg],
      ['non-conformant.svg'],
    );

    expect(report.conformant).toBe(false);
    expect(report.errors.length).toBeGreaterThan(0);

    // All errors should be NamespaceConformanceError instances
    for (const err of report.errors) {
      expect(err).toBeInstanceOf(NamespaceConformanceError);
      expect(err.invariant).toBeDefined();
      expect(err.code).toBe('NAMESPACE_CONFORMANCE_FAILED');
    }
  });

  it('wrong namespace URI produces a conformant=false report without crashing', () => {
    const report = validateNamespaceConformance(
      'https://example.com/wrong-namespace#',
      ['<svg/>'],
    );

    expect(report.conformant).toBe(false);
    expect(report.errors.length).toBeGreaterThan(0);
    expect(report.errors[0]).toBeInstanceOf(NamespaceConformanceError);
    expect(report.errors[0].invariant).toBe('document-type-validation');
  });
});

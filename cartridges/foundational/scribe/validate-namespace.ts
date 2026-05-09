#!/usr/bin/env node
/**
 * SCRIBE Namespace XML Conformance Validator — CLI entry point.
 *
 * Usage:
 *   npx tsx cartridges/foundational/scribe/validate-namespace.ts [SVG_FILE...]
 *   node cartridges/foundational/scribe/validate-namespace.ts [SVG_FILE...]
 *
 * With no arguments: validates the SCRIBE namespace URI itself against the
 * 3 built-in ast-to-svg example SVG documents (add/xor1/mux).
 *
 * With SVG file arguments: validates each named file.
 *
 * Exit codes:
 *   0 — all documents conform to all 5 T1 invariants
 *   1 — one or more violations found (JSON error report written to stderr)
 *
 * @module cartridges/foundational/scribe/validate-namespace
 */

import { readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// NOTE: tsconfig.json rootDir is src/; this cartridge file lives outside src/
// so it uses a relative import (NodeNext module resolution supports this at
// runtime via tsx/ts-node). The import resolves to the compiled src/ module.
import {
  validateNamespaceConformance,
  type ConformanceReport,
} from '../../../src/scribe/namespace-conformance/index.js';
import { NAMESPACE_URI } from '../../../src/scribe/types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Resolve a path relative to the repo root. */
function repoRoot(...parts: string[]): string {
  return resolve(__dirname, '../../..', ...parts);
}

/** Default sample docs (ast-to-svg cartridge examples). */
const DEFAULT_SAMPLE_PATHS = [
  repoRoot('examples/cartridges/code-svg-hdl-bridge/ast-to-svg/examples/add.svg'),
  repoRoot('examples/cartridges/code-svg-hdl-bridge/ast-to-svg/examples/xor1.svg'),
  repoRoot('examples/cartridges/code-svg-hdl-bridge/ast-to-svg/examples/mux.svg'),
];

function loadFile(filePath: string): { content: string; label: string } {
  const content = readFileSync(filePath, 'utf8');
  return { content, label: basename(filePath) };
}

function main(): void {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const filePaths = args.length > 0 ? args.map(a => resolve(a)) : DEFAULT_SAMPLE_PATHS;

  const loaded = filePaths.map(loadFile);
  const docs = loaded.map(f => f.content);
  const labels = loaded.map(f => f.label);

  const report: ConformanceReport = validateNamespaceConformance(
    NAMESPACE_URI,
    docs,
    labels,
  );

  if (report.conformant) {
    process.stdout.write(
      JSON.stringify(
        {
          status: 'CONFORMANT',
          namespaceUri: report.namespaceUri,
          totalDocuments: report.totalDocuments,
          passingDocuments: report.passingDocuments,
          message: `All ${report.totalDocuments} document(s) conform to all 5 T1 XML family invariants.`,
        },
        null,
        2,
      ) + '\n',
    );
    process.exit(0);
  } else {
    const errorReport = {
      status: 'NON_CONFORMANT',
      namespaceUri: report.namespaceUri,
      totalDocuments: report.totalDocuments,
      passingDocuments: report.passingDocuments,
      failingDocuments: report.totalDocuments - report.passingDocuments,
      violations: report.errors.map(err => ({
        invariant: err.invariant,
        code: err.code,
        message: err.message,
        details: err.details,
      })),
      documents: report.documents.map(doc => ({
        docIndex: doc.docIndex,
        label: doc.label,
        conformant: doc.conformant,
        findings: doc.findings,
      })),
    };
    process.stderr.write(JSON.stringify(errorReport, null, 2) + '\n');
    process.exit(1);
  }
}

main();

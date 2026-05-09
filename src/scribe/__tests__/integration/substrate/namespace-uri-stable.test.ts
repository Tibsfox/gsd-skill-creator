/**
 * SCRIBE Build-Out v1.49.621 — Component 09 substrate-conformance test.
 *
 * The SCRIBE metadata namespace URI is FROZEN at
 *   https://tibsfox.com/Research/SCRIBE/ns#
 * across every consumer in the repo (PG schemas, foundational chipset
 * manifest, validate-namespace.ts, the metadata-namespace.ts const).
 *
 * If anyone changes the URI silently, this test fires the alarm.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { NAMESPACE_URI } from '../../../types/metadata-namespace.js';

const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..', '..');
const EXPECTED_URI = 'https://tibsfox.com/Research/SCRIBE/ns#';

describe('substrate-conformance: SCRIBE namespace URI stability', () => {
  it('NAMESPACE_URI const matches the frozen value', () => {
    expect(NAMESPACE_URI).toBe(EXPECTED_URI);
  });

  it('foundational chipset manifest declares the same scribe_namespace', () => {
    const manifestPath = resolve(
      REPO_ROOT,
      'cartridges/foundational/scribe/manifest.json',
    );
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      scribe_namespace: string;
    };
    expect(manifest.scribe_namespace).toBe(EXPECTED_URI);
    expect(manifest.scribe_namespace).toBe(NAMESPACE_URI);
  });

  it('validate-namespace.ts script imports NAMESPACE_URI symbolically (no hardcoded literal)', () => {
    const scriptPath = resolve(
      REPO_ROOT,
      'cartridges/foundational/scribe/validate-namespace.ts',
    );
    const source = readFileSync(scriptPath, 'utf8');
    // Must import NAMESPACE_URI symbolically.
    expect(source).toMatch(/import\b[^;]*\bNAMESPACE_URI\b/);
    // Must NOT contain the literal URI as a hardcoded string anywhere
    // OTHER than possibly in a comment. We check for the literal in a
    // single-line code form: 'https://tibsfox.com/Research/SCRIBE/ns#'.
    // (Comments are fine; raw string literals with the URI are not.)
    const codeOnly = source
      .split('\n')
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
      .join('\n');
    expect(codeOnly).not.toContain(`'${EXPECTED_URI}'`);
    expect(codeOnly).not.toContain(`"${EXPECTED_URI}"`);
  });

  it('metadata-namespace.ts pins the URI in exactly one runtime const declaration', () => {
    const sourcePath = resolve(
      REPO_ROOT,
      'src/scribe/types/metadata-namespace.ts',
    );
    const source = readFileSync(sourcePath, 'utf8');
    // Exactly one runtime `as const` declaration of the URI literal.
    // (Docstring examples like `xmlns:scribe="..."` may also appear; we
    // narrow to the runtime declaration form rather than counting raw
    // string occurrences.)
    const declarationRe = /export\s+const\s+NAMESPACE_URI\s*=\s*['"]([^'"]+)['"]/g;
    const matches = [...source.matchAll(declarationRe)];
    expect(matches.length).toBe(1);
    expect(matches[0][1]).toBe(EXPECTED_URI);
  });
});

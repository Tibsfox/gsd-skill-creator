/**
 * C2 — Substrate-Probe Discipline v2 Invariant (v1.49.639)
 *
 * Asserts that:
 *   1. docs/SUBSTRATE-PROBE-DISCIPLINE.md gained the §2.4 adjacency-check
 *      sub-section at v1.49.639 C2 (CF-4 close).
 *   2. docs/test-discipline/audit-method-corrections.md exists with the
 *      central inventory of known-multi-form concepts (≥4 sections).
 *
 * Background: v1.49.638 W1C flake audit produced 6 grep hits; 2 of 6
 * (33%) were false positives because the audit grep didn't catch the
 * alternate syntactic form already in use. CF-4 routed audit-method
 * correction to v1.49.639 C2: codify the adjacency-check requirement
 * + create the central inventory.
 */

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = process.cwd();
const DISCIPLINE_DOC = resolve(REPO_ROOT, 'docs/SUBSTRATE-PROBE-DISCIPLINE.md');
const INVENTORY_DOC = resolve(REPO_ROOT, 'docs/test-discipline/audit-method-corrections.md');

describe('C2 — substrate-probe-discipline v2 invariant', () => {
  it.runIf(existsSync(DISCIPLINE_DOC))(
    'discipline doc has adjacency-check sub-section (§2.4)',
    () => {
      const content = readFileSync(DISCIPLINE_DOC, 'utf-8');
      expect(content, '§2.4 heading present').toMatch(
        /### 2\.4 Grep adjacency check requirement/,
      );
      expect(content, 'mentions 33% false-positive rate observation').toMatch(
        /33%/,
      );
      expect(content, 'references audit-method-corrections.md companion').toMatch(
        /audit-method-corrections\.md/,
      );
      expect(content, 'lists multi-form concept examples').toMatch(
        /hookTimeout/,
      );
      expect(content, 'lists ORDER-BY example').toMatch(
        /ORDER BY/,
      );
    },
  );

  it.runIf(existsSync(INVENTORY_DOC))(
    'audit-method-corrections.md exists with ≥4 catalogued concepts',
    () => {
      const content = readFileSync(INVENTORY_DOC, 'utf-8');
      // Match section headers like "### 2.1 hookTimeout", "### 2.2 ORDER-BY ..."
      const sectionHeaders = content.match(/^### 2\.\d+ /gm) || [];
      expect(
        sectionHeaders.length,
        `expected ≥4 catalogued concepts; found ${sectionHeaders.length}`,
      ).toBeGreaterThanOrEqual(4);
    },
  );

  it.runIf(existsSync(INVENTORY_DOC))(
    'audit-method-corrections.md catalogues the 4 v1.49.639 C2 baseline concepts',
    () => {
      const content = readFileSync(INVENTORY_DOC, 'utf-8');
      expect(content, 'hookTimeout concept catalogued').toMatch(/hookTimeout/);
      expect(content, 'ORDER-BY tiebreaker concept catalogued').toMatch(/ORDER-BY tiebreaker/);
      expect(content, 'perf-assertion threshold concept catalogued').toMatch(/perf-assertion threshold/);
      expect(content, 'skip-guard env-var concept catalogued').toMatch(/skip-guard env-var/);
    },
  );

  it.runIf(existsSync(INVENTORY_DOC))(
    'audit-method-corrections.md cites source incident (v1.49.638 W1C 33% rate)',
    () => {
      const content = readFileSync(INVENTORY_DOC, 'utf-8');
      expect(content, 'cites source incident').toMatch(/v1\.49\.638 W1C/);
      expect(content, 'cites 33% false-positive rate').toMatch(/33%/);
    },
  );
});
